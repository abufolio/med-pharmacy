/**
 * Input validation schemas — Zod
 * TechSpec: FR-053 (promo), FR-051 (withdraw), FR-020 (registration)
 */

import { z } from "zod";

// ── Registration ─────────────────────────────────────
export const firstNameSchema = z
  .string()
  .trim()
  .min(2, "Ism kamida 2 belgi")
  .max(80, "Ism 80 belgidan oshmasligi kerak")
  .regex(/^[a-zA-ZÀ-ÿЀ-ӿ\s'-]+$/, "Faqat harflar");

export const lastNameSchema = z
  .string()
  .trim()
  .min(2, "Familiya kamida 2 belgi")
  .max(80, "Familiya 80 belgidan oshmasligi kerak")
  .regex(/^[a-zA-ZÀ-ÿЀ-ӿ\s'-]+$/, "Faqat harflar");

export const passwordSchema = z
  .string()
  .min(6, "Parol kamida 6 belgi")
  .max(128, "Parol juda uzun");

export const phoneSchema = z
  .string()
  .regex(/^\+?\d{7,15}$/, "Noto'g'ri telefon raqam");

export const addressSchema = z
  .string()
  .trim()
  .min(3, "Manzil kamida 3 belgi")
  .max(300, "Manzil juda uzun");

// ── Withdraw ─────────────────────────────────────────
export const withdrawAmountSchema = z
  .number()
  .int("Butun son bo'lishi kerak")
  .positive("Summa musbat bo'lishi kerak")
  .max(100_000_000, "Bir martalik maksimal: 100 000 000 so'm");

// ── Promo code ───────────────────────────────────────
export const promocodeSchema = z
  .string()
  .trim()
  .min(3, "Promo-kod kamida 3 belgi")
  .max(50, "Promo-kod juda uzun")
  .toUpperCase();
