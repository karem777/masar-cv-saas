import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import {
  readDb,
  writeDb,
  getUserByToken,
  isOwnerEmail,
  hashPassword,
  normalizeIdentifier,
  SiteSettings
} from "@/lib/db";

function verifyAdmin(req: NextRequest) {
  const token =
    req.cookies.get("masar_token")?.value ||
    req.headers.get("x-session-token") ||
    "";
  const user = getUserByToken(token);
  if (!user || !isOwnerEmail(user.identifier)) {
    return null;
  }
  return user;
}

export async function GET(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: "غير مصرح لك بدخول لوحة التحكم. سجل الدخول بإيميل الأدمن karemaboelnsr9@gmail.com" },
      { status: 403 }
    );
  }

  const db = readDb();
  const payments = [...db.payments].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1
  );
  const users = db.users.map((u) => ({
    id: u.id,
    identifier: u.identifier,
    name: u.name,
    isAdmin: u.isAdmin || isOwnerEmail(u.identifier),
    isBanned: Boolean(u.isBanned),
    plan: u.plan,
    paymentStatus: u.paymentStatus,
    createdAt: u.createdAt
  }));
  const supportMessages = [...db.supportMessages].sort((a, b) =>
    a.createdAt > b.createdAt ? 1 : -1
  );

  return NextResponse.json({
    payments,
    users,
    supportMessages,
    settings: db.settings
  });
}

export async function POST(req: NextRequest) {
  const admin = verifyAdmin(req);
  if (!admin) {
    return NextResponse.json(
      { error: "غير مصرح لك. سجل الدخول بإيميل karemaboelnsr9@gmail.com" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { action } = body;
  const db = readDb();

  if (action === "approve_payment") {
    const { paymentId } = body;
    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    payment.status = "approved";

    const targetUser = db.users.find((u) => u.id === payment.userId);
    if (targetUser) {
      targetUser.plan = payment.plan;
      targetUser.paymentStatus = "approved";
    }
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "reject_payment") {
    const { paymentId } = body;
    const payment = db.payments.find((p) => p.id === paymentId);
    if (!payment) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }
    payment.status = "rejected";

    // Also revoke user's plan back to free if they don't have another approved payment
    const targetUser = db.users.find((u) => u.id === payment.userId);
    if (targetUser && !isOwnerEmail(targetUser.identifier)) {
      const otherApproved = db.payments.some(
        (p) => p.userId === targetUser.id && p.id !== paymentId && p.status === "approved"
      );
      if (!otherApproved) {
        targetUser.plan = "free";
        targetUser.paymentStatus = "rejected";
      }
    }
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "delete_payment") {
    const { paymentId } = body;
    db.payments = db.payments.filter((p) => p.id !== paymentId);
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "set_user_plan") {
    const { userId, plan } = body as { userId: string; plan: "free" | "single" | "pro" };
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    targetUser.plan = plan;
    targetUser.paymentStatus = plan === "free" ? "none" : "approved";
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "toggle_ban_user") {
    const { userId } = body;
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser || isOwnerEmail(targetUser.identifier)) {
      return NextResponse.json({ error: "لا يمكن حظر هذا الحساب" }, { status: 400 });
    }
    targetUser.isBanned = !targetUser.isBanned;
    if (targetUser.isBanned) {
      targetUser.plan = "free";
    }
    writeDb(db);
    return NextResponse.json({ ok: true, isBanned: targetUser.isBanned });
  }

  if (action === "delete_user") {
    const { userId } = body;
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser || isOwnerEmail(targetUser.identifier)) {
      return NextResponse.json({ error: "لا يمكن حذف حساب المالك" }, { status: 400 });
    }
    db.users = db.users.filter((u) => u.id !== userId);
    for (const [tok, uid] of Object.entries(db.sessions)) {
      if (uid === userId) delete db.sessions[tok];
    }
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "reset_user_password") {
    const { userId, newPassword } = body;
    if (!newPassword || newPassword.length < 4) {
      return NextResponse.json({ error: "كلمة المرور قصيرة جداً" }, { status: 400 });
    }
    const targetUser = db.users.find((u) => u.id === userId);
    if (!targetUser) {
      return NextResponse.json({ error: "المستخدم غير موجود" }, { status: 404 });
    }
    targetUser.passwordHash = hashPassword(newPassword);
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  if (action === "create_user_manual") {
    const { identifier = "", name = "", password = "", plan = "pro" } = body;
    const cleanId = normalizeIdentifier(identifier);
    if (!cleanId || !password) {
      return NextResponse.json({ error: "أدخل الإيميل/الرقم وكلمة المرور" }, { status: 400 });
    }
    const existing = db.users.find((u) => normalizeIdentifier(u.identifier) === cleanId);
    if (existing) {
      existing.plan = plan;
      existing.paymentStatus = plan === "free" ? "none" : "approved";
      existing.passwordHash = hashPassword(password);
      if (name.trim()) existing.name = name.trim();
      writeDb(db);
      return NextResponse.json({ ok: true, user: existing });
    }
    const newUser = {
      id: "usr_" + crypto.randomBytes(6).toString("hex"),
      identifier: cleanId,
      name: name.trim() || cleanId.split("@")[0],
      passwordHash: hashPassword(password),
      isAdmin: isOwnerEmail(cleanId),
      isBanned: false,
      plan: (plan === "pro" || plan === "single" ? plan : "free") as "free" | "single" | "pro",
      paymentStatus: (plan === "free" ? "none" : "approved") as "none" | "approved",
      createdAt: new Date().toISOString()
    };
    db.users.push(newUser);
    writeDb(db);
    return NextResponse.json({ ok: true, user: newUser });
  }

  if (action === "update_settings") {
    const { settings } = body as { settings: Partial<SiteSettings> };
    db.settings = {
      ...db.settings,
      ...settings,
      singlePlanPriceEgp: Number(settings.singlePlanPriceEgp ?? db.settings.singlePlanPriceEgp),
      proPlanPriceEgp: Number(settings.proPlanPriceEgp ?? db.settings.proPlanPriceEgp),
      freeVisibleMissingKeywords: Number(
        settings.freeVisibleMissingKeywords ?? db.settings.freeVisibleMissingKeywords
      )
    };
    writeDb(db);
    return NextResponse.json({ ok: true, settings: db.settings });
  }

  if (action === "reply_support") {
    const { threadUserId, userIdentifier, userName, text } = body;
    if (!text?.trim()) {
      return NextResponse.json({ error: "الرد فارغ" }, { status: 400 });
    }
    const replyMsg = {
      id: "msg_" + crypto.randomBytes(6).toString("hex"),
      threadUserId,
      userIdentifier: userIdentifier || "",
      userName: userName || "عميل",
      sender: "admin" as const,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isReadByAdmin: true
    };
    db.supportMessages.forEach((m) => {
      if (m.threadUserId === threadUserId) {
        m.isReadByAdmin = true;
      }
    });
    db.supportMessages.push(replyMsg);
    writeDb(db);
    return NextResponse.json({ ok: true, message: replyMsg });
  }

  if (action === "delete_support_thread") {
    const { threadUserId } = body;
    db.supportMessages = db.supportMessages.filter((m) => m.threadUserId !== threadUserId);
    writeDb(db);
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
