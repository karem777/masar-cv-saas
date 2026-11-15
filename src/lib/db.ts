import fs from "fs";
import path from "path";
import crypto from "crypto";

export const ADMIN_EMAIL = "karemaboelnsr9@gmail.com";
export const DEFAULT_VODAFONE_CASH_NUMBER = "01011892362";

export interface SiteSettings {
  siteNameAr: string;
  siteNameEn: string;
  heroTitleAr: string;
  heroHighlightAr: string;
  heroSubtitleAr: string;
  announcementAr: string;
  vodafoneCashNumber: string;
  singlePlanNameAr: string;
  singlePlanPriceEgp: number;
  singlePlanDescAr: string;
  proPlanNameAr: string;
  proPlanPriceEgp: number;
  proPlanDescAr: string;
  freeVisibleMissingKeywords: number;
  freeAllUsersPromo: boolean;
  maintenanceMode: boolean;
  geminiApiKey: string;
  whatsappSupportNumber: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteNameAr: "مسار AI",
  siteNameEn: "Masar AI",
  heroTitleAr: "اكشف سبب رفض الـ CV بتاعك",
  heroHighlightAr: "واحصل على سيرة ذاتية تنفيذية مقبولة 96% فوراً",
  heroSubtitleAr:
    "افحص درجة الـ CV الحالي مجاناً، وشاهد كيف نعيد صياغته وفق معايير جامعة هارفارد وأنظمة الـ ATS العالمية في صفحة A4 احترافية متكاملة.",
  announcementAr:
    "75% من السير الذاتية يتم رفضها آلياً بواسطة برامج الـ ATS قبل أن يراها الـ HR",
  vodafoneCashNumber: DEFAULT_VODAFONE_CASH_NUMBER,
  singlePlanNameAr: "باقة الـ CV الواحد الاحترافية",
  singlePlanPriceEgp: 49,
  singlePlanDescAr:
    "تحميل الـ CV التنفيذي الكامل PDF + كشف جميع الكلمات المفتاحية + خطاب التقديم",
  proPlanNameAr: "باقة الشهر الكامل غير المحدودة (Pro)",
  proPlanPriceEgp: 149,
  proPlanDescAr:
    "تعديلات وتحميل بلا حدود لكل الوظائف + قوالب هارفارد والشركات العالمية + أسئلة الإنترفيو لمدة 30 يوم",
  freeVisibleMissingKeywords: 2,
  freeAllUsersPromo: false,
  maintenanceMode: false,
  geminiApiKey: "",
  whatsappSupportNumber: "01011892362"
};

export interface UserRecord {
  id: string;
  identifier: string; // email or phone number
  name: string;
  passwordHash: string;
  isAdmin: boolean;
  isBanned?: boolean;
  plan: "free" | "single" | "pro";
  paymentStatus: "none" | "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface PaymentRequestRecord {
  id: string;
  userId: string;
  userIdentifier: string;
  userName: string;
  plan: "single" | "pro";
  amountEgp: number;
  senderPhone: string;
  walletOwnerName: string;
  screenshotDataUrl: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface SupportMessageRecord {
  id: string;
  threadUserId: string;
  userIdentifier: string;
  userName: string;
  sender: "user" | "admin";
  text: string;
  createdAt: string;
  isReadByAdmin: boolean;
}

export interface DatabaseSchema {
  users: UserRecord[];
  payments: PaymentRequestRecord[];
  supportMessages: SupportMessageRecord[];
  sessions: Record<string, string>; // token -> userId
  settings: SiteSettings;
}

const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "store.json");

function ensureDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    const initial: DatabaseSchema = {
      users: [],
      payments: [],
      supportMessages: [],
      sessions: {},
      settings: { ...DEFAULT_SITE_SETTINGS }
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw) as Partial<DatabaseSchema>;
    return {
      users: parsed.users || [],
      payments: parsed.payments || [],
      supportMessages: parsed.supportMessages || [],
      sessions: parsed.sessions || {},
      settings: { ...DEFAULT_SITE_SETTINGS, ...(parsed.settings || {}) }
    };
  } catch {
    return {
      users: [],
      payments: [],
      supportMessages: [],
      sessions: {},
      settings: { ...DEFAULT_SITE_SETTINGS }
    };
  }
}

export function readDb(): DatabaseSchema {
  return ensureDb();
}

export function writeDb(data: DatabaseSchema): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
}

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password + "_masar_salt").digest("hex");
}

export function normalizeIdentifier(input: string): string {
  return input.trim().toLowerCase();
}

export function isOwnerEmail(identifier: string): boolean {
  return normalizeIdentifier(identifier) === ADMIN_EMAIL.toLowerCase();
}

export function getUserByToken(token?: string | null): UserRecord | null {
  if (!token) return null;
  const db = readDb();
  const userId = db.sessions[token];
  if (!userId) return null;
  const user = db.users.find((u) => u.id === userId) || null;
  if (user && isOwnerEmail(user.identifier)) {
    user.isAdmin = true;
    user.plan = "pro";
    user.paymentStatus = "approved";
    user.isBanned = false;
  }
  return user;
}
