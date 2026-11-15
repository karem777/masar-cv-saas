import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  readDb,
  writeDb,
  hashPassword,
  normalizeIdentifier,
  isOwnerEmail,
  getUserByToken,
  UserRecord
} from "@/lib/db";

function sanitizeUser(u: UserRecord) {
  return {
    id: u.id,
    identifier: u.identifier,
    name: u.name,
    isAdmin: u.isAdmin || isOwnerEmail(u.identifier),
    isBanned: Boolean(u.isBanned) && !isOwnerEmail(u.identifier),
    plan: isOwnerEmail(u.identifier) ? "pro" : u.plan,
    paymentStatus: isOwnerEmail(u.identifier) ? "approved" : u.paymentStatus,
    createdAt: u.createdAt
  };
}

function getPublicSettings() {
  const db = readDb();
  const { geminiApiKey, ...publicPart } = db.settings;
  return {
    ...publicPart,
    hasServerGeminiKey: Boolean(geminiApiKey)
  };
}

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("masar_token")?.value ||
    req.headers.get("x-session-token") ||
    "";
  const user = getUserByToken(token);
  const settings = getPublicSettings();

  if (!user) {
    return NextResponse.json({ user: null, settings });
  }
  return NextResponse.json({ user: sanitizeUser(user), token, settings });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, identifier = "", password = "", name = "" } = body;

    if (action === "logout") {
      const token = req.cookies.get("masar_token")?.value || "";
      if (token) {
        const db = readDb();
        delete db.sessions[token];
        writeDb(db);
      }
      const res = NextResponse.json({ ok: true, settings: getPublicSettings() });
      res.cookies.delete("masar_token");
      return res;
    }

    const cleanId = normalizeIdentifier(identifier);
    if (!cleanId) {
      return NextResponse.json(
        { error: "يرجى إدخال البريد الإلكتروني أو رقم الموبايل" },
        { status: 400 }
      );
    }

    if (!password || password.length < 4) {
      return NextResponse.json(
        { error: "يرجى إدخال كلمة مرور (4 أحرف أو أرقام على الأقل)" },
        { status: 400 }
      );
    }

    const db = readDb();
    let user = db.users.find((u) => normalizeIdentifier(u.identifier) === cleanId);
    const owner = isOwnerEmail(cleanId);

    if (action === "register") {
      if (user) {
        return NextResponse.json(
          { error: "هذا الإيميل أو الرقم مسجل بالفعل، يمكنك تسجيل الدخول مباشرة" },
          { status: 400 }
        );
      }

      user = {
        id: "usr_" + crypto.randomBytes(6).toString("hex"),
        identifier: cleanId,
        name: name.trim() || (owner ? "كريم أبو النصر (الأدمن)" : cleanId.split("@")[0]),
        passwordHash: hashPassword(password),
        isAdmin: owner,
        isBanned: false,
        plan: owner ? "pro" : "free",
        paymentStatus: owner ? "approved" : "none",
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    } else {
      if (!user) {
        if (owner) {
          user = {
            id: "usr_owner_admin",
            identifier: cleanId,
            name: name.trim() || "كريم أبو النصر (الأدمن)",
            passwordHash: hashPassword(password),
            isAdmin: true,
            isBanned: false,
            plan: "pro",
            paymentStatus: "approved",
            createdAt: new Date().toISOString()
          };
          db.users.push(user);
        } else {
          return NextResponse.json(
            { error: "الحساب غير موجود. اضغط على (حساب جديد) للتسجيل أولاً." },
            { status: 404 }
          );
        }
      } else {
        if (user.isBanned && !owner) {
          return NextResponse.json(
            { error: "تم إيقاف هذا الحساب من قبل إدارة الموقع. تواصل مع خدمة العملاء." },
            { status: 403 }
          );
        }
        if (user.passwordHash !== hashPassword(password)) {
          return NextResponse.json(
            { error: "كلمة المرور غير صحيحة" },
            { status: 401 }
          );
        }
        if (owner) {
          user.isAdmin = true;
          user.plan = "pro";
          user.paymentStatus = "approved";
          user.isBanned = false;
        }
      }
    }

    const sessionToken = "tok_" + crypto.randomBytes(16).toString("hex");
    db.sessions[sessionToken] = user.id;
    writeDb(db);

    const res = NextResponse.json({
      user: sanitizeUser(user),
      token: sessionToken,
      settings: getPublicSettings()
    });

    res.cookies.set("masar_token", sessionToken, {
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 30
    });

    return res;
  } catch (err) {
    console.error("Auth error:", err);
    return NextResponse.json({ error: "حدث خطأ في السيرفر" }, { status: 500 });
  }
}
