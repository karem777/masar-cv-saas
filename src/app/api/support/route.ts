import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb, getUserByToken } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("masar_token")?.value ||
    req.headers.get("x-session-token") ||
    "";
  const guestId = req.nextUrl.searchParams.get("guestId") || "";
  const user = getUserByToken(token);

  const db = readDb();
  const threadId = user ? user.id : guestId;

  if (!threadId) {
    return NextResponse.json({ messages: [] });
  }

  const messages = db.supportMessages
    .filter((m) => m.threadUserId === threadId)
    .sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));

  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("masar_token")?.value ||
      req.headers.get("x-session-token") ||
      "";
    const user = getUserByToken(token);

    const body = await req.json();
    const {
      text = "",
      guestId = "",
      guestContact = "",
      guestName = ""
    } = body as {
      text?: string;
      guestId?: string;
      guestContact?: string;
      guestName?: string;
    };

    if (!text.trim()) {
      return NextResponse.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    const threadUserId = user ? user.id : guestId || "guest_default";
    const userIdentifier = user
      ? user.identifier
      : guestContact.trim() || "زائر بدون حساب";
    const userName = user ? user.name : guestName.trim() || "زائر";

    const db = readDb();
    const msg = {
      id: "msg_" + crypto.randomBytes(6).toString("hex"),
      threadUserId,
      userIdentifier,
      userName,
      sender: "user" as const,
      text: text.trim(),
      createdAt: new Date().toISOString(),
      isReadByAdmin: false
    };

    db.supportMessages.push(msg);
    writeDb(db);

    return NextResponse.json({ ok: true, message: msg });
  } catch (err) {
    console.error("Support POST error:", err);
    return NextResponse.json({ error: "خطأ في إرسال الرسالة" }, { status: 500 });
  }
}
