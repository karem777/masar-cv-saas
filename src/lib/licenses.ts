import crypto from "crypto";

const SECRET_SALT = process.env.SAA_LICENSE_SECRET || "masar-saas-secret-2026-key";

// Master test code for the founder only (shown in /admin dashboard)
export const FOUNDER_MASTER_CODE = "MASAR-OWNER-2026";

export function generateLicenseCode(plan: "single" | "pro", customerRef: string): string {
  const prefix = plan === "pro" ? "PRO" : "CV1";
  const cleanRef = customerRef.trim().toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6) || "USER";
  const hmac = crypto
    .createHmac("sha256", SECRET_SALT)
    .update(`${prefix}-${cleanRef}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();
  return `MSR-${prefix}-${cleanRef}-${hmac}`;
}

export function verifyLicenseCode(code: string): { valid: boolean; plan: "free" | "single" | "pro" } {
  if (!code) return { valid: false, plan: "free" };
  const normalized = code.trim().toUpperCase();

  if (normalized === FOUNDER_MASTER_CODE) {
    return { valid: true, plan: "pro" };
  }

  const parts = normalized.split("-");
  if (parts.length !== 4 || parts[0] !== "MSR") {
    return { valid: false, plan: "free" };
  }

  const [, prefix, cleanRef, providedHmac] = parts;
  if (prefix !== "PRO" && prefix !== "CV1") {
    return { valid: false, plan: "free" };
  }

  const expectedHmac = crypto
    .createHmac("sha256", SECRET_SALT)
    .update(`${prefix}-${cleanRef}`)
    .digest("hex")
    .slice(0, 6)
    .toUpperCase();

  if (providedHmac === expectedHmac) {
    return { valid: true, plan: prefix === "PRO" ? "pro" : "single" };
  }

  return { valid: false, plan: "free" };
}
