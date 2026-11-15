import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { readDb, writeDb, getUserByToken } from "@/lib/db";

export async function GET(req: NextRequest) {
  const token =
    req.cookies.get("masar_token")?.value ||
    req.headers.get("x-session-token") ||
    "";
  const user = getUserByToken(token);
  if (!user) {
    return NextResponse.json({ payments: [] });
  }
  const db = readDb();
  const userPayments = db.payments
    .filter((p) => p.userId === user.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return NextResponse.json({ payments: userPayments });
}

export async function POST(req: NextRequest) {
  try {
    const token =
      req.cookies.get("masar_token")?.value ||
      req.headers.get("x-session-token") ||
      "";
    const user = getUserByToken(token);

    if (!user) {
      return NextResponse.json(
        { error: "يرجى تسجيل الدخول بالإيميل أو رقم الموبايل أولاً قبل إرسال التحويل" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      plan = "single",
      senderPhone = "",
      walletOwnerName = "",
      screenshotDataUrl = ""
    } = body as {
      plan?: "single" | "pro";
      senderPhone?: string;
      walletOwnerName?: string;
      screenshotDataUrl?: string;
    };

    if (!senderPhone.trim() || senderPhone.trim().length < 9) {
      return NextResponse.json(
        { error: "يرجى كتابة رقم الموبايل الذي قمت بالتحويل منه بشكل صحيح" },
        { status: 400 }
      );
    }

    if (!walletOwnerName.trim()) {
      return NextResponse.json(
        { error: "يرجى كتابة اسم صاحب المحفظة المحول منها" },
        { status: 400 }
      );
    }

    if (!screenshotDataUrl || !screenshotDataUrl.startsWith("data:image/")) {
      return NextResponse.json(
        { error: "يرجى إرفاق صورة (سكرين شوت) لإيصال تحويل فودافون كاش" },
        { status: 400 }
      );
    }

    const db = readDb();
    const amountEgp =
      plan === "pro"
        ? db.settings.proPlanPriceEgp || 149
        : db.settings.singlePlanPriceEgp || 49;

    const newPayment = {
      id: "pay_" + crypto.randomBytes(6).toString("hex"),
      userId: user.id,
      userIdentifier: user.identifier,
      userName: user.name,
      plan: (plan === "pro" ? "pro" : "single") as "single" | "pro",
      amountEgp,
      senderPhone: senderPhone.trim(),
      walletOwnerName: walletOwnerName.trim(),
      screenshotDataUrl,
      status: "pending" as const,
      createdAt: new Date().toISOString()
    };

    db.payments.push(newPayment);

    const dbUser = db.users.find((u) => u.id === user.id);
    if (dbUser && dbUser.paymentStatus !== "approved") {
      dbUser.paymentStatus = "pending";
    }

    writeDb(db);

    return NextResponse.json({
      ok: true,
      payment: newPayment
    });
  } catch (err) {
    console.error("Payment error:", err);
    return NextResponse.json(
      { error: "حدث خطأ أثناء إرسال طلب التحويل، حاول مرة أخرى" },
      { status: 500 }
    );
  }
}
