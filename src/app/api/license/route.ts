import { NextRequest, NextResponse } from "next/server";
import { generateLicenseCode, verifyLicenseCode } from "@/lib/licenses";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, code, plan, customerRef, adminPassword } = body;

    if (action === "verify") {
      const result = verifyLicenseCode(code || "");
      return NextResponse.json(result);
    }

    if (action === "generate") {
      const expectedAdminPass = process.env.ADMIN_PASSWORD || "admin123";
      if (adminPassword !== expectedAdminPass) {
        return NextResponse.json({ error: "كلمة مرور الأدمن غير صحيحة" }, { status: 401 });
      }
      const generated = generateLicenseCode(plan === "single" ? "single" : "pro", customerRef || "CUST");
      return NextResponse.json({ code: generated });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
