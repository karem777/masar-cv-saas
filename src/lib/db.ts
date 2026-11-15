import fs from "fs";
import path from "path";
import crypto from "crypto";
import {
  SiteSettings,
  DEFAULT_SITE_SETTINGS,
  DEFAULT_VODAFONE_CASH_NUMBER
} from "@/types/cv";

export type { SiteSettings };
export { DEFAULT_SITE_SETTINGS, DEFAULT_VODAFONE_CASH_NUMBER };
export const ADMIN_EMAIL = "karemaboelnsr9@gmail.com";
export const ADMIN_EMAIL_ALT = "karemaboelnsr24@gmail.com";

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
    const mergedSettings: SiteSettings = {
      ...DEFAULT_SITE_SETTINGS,
      ...(parsed.settings || {})
    };
    if (
      !mergedSettings.siteNameAr ||
      mergedSettings.siteNameAr === "مسار AI"
    ) {
      mergedSettings.siteNameAr = "مسارك";
    }
    if (
      !mergedSettings.siteNameEn ||
      mergedSettings.siteNameEn === "Masar AI"
    ) {
      mergedSettings.siteNameEn = "Masarak";
    }
    return {
      users: parsed.users || [],
      payments: parsed.payments || [],
      supportMessages: parsed.supportMessages || [],
      sessions: parsed.sessions || {},
      settings: mergedSettings
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
  const norm = normalizeIdentifier(identifier);
  return norm === ADMIN_EMAIL.toLowerCase() || norm === ADMIN_EMAIL_ALT.toLowerCase();
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
