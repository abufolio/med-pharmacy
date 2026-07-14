// ──────────────────────────────────────────────
// Types for Customer (Mijoz) — matches TechSpec
// ──────────────────────────────────────────────

export type UserStatus = "PENDING_CARD" | "ACTIVE" | "BLOCKED";
export type LanguageCode = "uz" | "ru" | "en";

export interface User {
  id: string;
  telegramId: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;          // Text address (street, house, apt)
  addressLat: number | null; // Latitude from location share
  addressLng: number | null; // Longitude from location share
  passwordHash: string;
  language: LanguageCode;
  status: UserStatus;
  balance: number;
  cardUid: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Session data (per-chat storage)
export interface SessionData {
  step: "idle" | "lang_select" | "enter_firstname" | "enter_lastname" | "enter_phone" | "enter_address" | "enter_password" | "confirm" | "main_menu" | "withdraw_amount" | "promo_enter" | "login_password" | "history_viewing";
  lang: LanguageCode;
  isLoggedIn: boolean;
  historyPage: number;
  tempRegistration: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    addressLat: number | null;
    addressLng: number | null;
    password: string;
  } | null;
}

// Context with session
import { Context, SessionFlavor } from "grammy";

export interface BotContext extends Context {
  session: SessionData;
}

// User store interface — implemented via Prisma/PostgreSQL
