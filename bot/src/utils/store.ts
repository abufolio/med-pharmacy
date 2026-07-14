/**
 * User store — now backed by Prisma/PostgreSQL.
 * Replaces the old in-memory store.
 */

import { prisma } from "../db/prisma";
import { LanguageCode, SessionData, User, UserStatus } from "../types";

// ── Transaction display data ───────────────────────────
export interface TransactionItem {
  id: string;
  amount: number;
  cashbackAmount: number;
  cashbackStatus: string;
  status: string;
  createdAt: Date;
  pharmacyId: string;
}

export interface PaginatedTransactions {
  items: TransactionItem[];
  total: number;
  page: number;
  totalPages: number;
  perPage: number;
}

// ── Helper: convert Prisma User → bot User ───────────
function toUser(row: any): User {
  return {
    id: row.id,
    telegramId: Number(row.telegramId),
    firstName: row.firstName,
    lastName: row.lastName,
    phone: row.phone,
    address: row.address ?? "",
    addressLat: row.addressLat ? Number(row.addressLat) : null,
    addressLng: row.addressLng ? Number(row.addressLng) : null,
    passwordHash: row.passwordHash ?? "",
    language: row.language as LanguageCode,
    status: row.status as UserStatus,
    balance: 0, // Will be fetched from Wallet when needed
    cardUid: row.cardAssignments?.[0]?.card?.uid ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const userStore = {
  /**
   * Find user by Telegram ID
   */
  async findByTelegramId(telegramId: number): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        wallet: true,
        cardAssignments: {
          where: { status: "ACTIVE" },
          include: { card: true },
          take: 1,
        },
      },
    });
    if (!user) return undefined;

    const result = toUser(user);
    if (user.wallet) {
      result.balance = Number(user.wallet.balance);
    }
    return result;
  },

  /**
   * Find user by phone number
   */
  async findByPhone(phone: string): Promise<User | undefined> {
    const user = await prisma.user.findUnique({
      where: { phone },
      include: {
        wallet: true,
        cardAssignments: {
          where: { status: "ACTIVE" },
          include: { card: true },
          take: 1,
        },
      },
    });
    if (!user) return undefined;

    const result = toUser(user);
    if (user.wallet) {
      result.balance = Number(user.wallet.balance);
    }
    return result;
  },

  /**
   * Create a new user
   */
  async create(user: Omit<User, "createdAt" | "updatedAt">): Promise<User> {
    const created = await prisma.user.create({
      data: {
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        telegramId: user.telegramId,
        language: user.language,
        status: user.status ?? "PENDING_CARD",
        passwordHash: user.passwordHash || null,
        address: user.address || null,
        addressLat: user.addressLat ?? null,
        addressLng: user.addressLng ?? null,
        wallet: {
          create: { balance: 0 },
        },
      },
      include: {
        wallet: true,
      },
    });

    const result = toUser(created);
    if (created.wallet) {
      result.balance = Number(created.wallet.balance);
    }
    return result;
  },

  /**
   * Update user fields
   */
  async update(
    telegramId: number,
    data: Partial<User>,
  ): Promise<User | undefined> {
    const prismaData: any = {};
    if (data.firstName !== undefined) prismaData.firstName = data.firstName;
    if (data.lastName !== undefined) prismaData.lastName = data.lastName;
    if (data.phone !== undefined) prismaData.phone = data.phone;
    if (data.language !== undefined) prismaData.language = data.language;
    if (data.status !== undefined) prismaData.status = data.status;
    if (data.passwordHash !== undefined)
      prismaData.passwordHash = data.passwordHash || null;
    if (data.address !== undefined) prismaData.address = data.address || null;
    if (data.addressLat !== undefined)
      prismaData.addressLat = data.addressLat ?? null;
    if (data.addressLng !== undefined)
      prismaData.addressLng = data.addressLng ?? null;

    const updated = await prisma.user.update({
      where: { telegramId },
      data: prismaData,
      include: {
        wallet: true,
        cardAssignments: {
          where: { status: "ACTIVE" },
          include: { card: true },
          take: 1,
        },
      },
    });

    const result = toUser(updated);
    if (updated.wallet) {
      result.balance = Number(updated.wallet.balance);
    }
    return result;
  },

  /**
   * Get all users
   */
  async getAll(): Promise<User[]> {
    const users = await prisma.user.findMany({
      where: { deletedAt: null },
      include: {
        wallet: true,
        cardAssignments: {
          where: { status: "ACTIVE" },
          include: { card: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return users.map((u) => {
      const result = toUser(u);
      if (u.wallet) result.balance = Number(u.wallet.balance);
      return result;
    });
  },

  /**
   * Get count of active users
   */
  async count(): Promise<number> {
    return prisma.user.count({
      where: { deletedAt: null },
    });
  },

  /**
   * Authenticate user by Telegram ID + password
   */
  async authenticate(
    telegramId: number,
    password: string,
  ): Promise<User | null> {
    const bcrypt = await import("bcryptjs");
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user || !user.passwordHash) return null;

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return null;

    // Return full user data on success
    const result = await this.findByTelegramId(telegramId);
    return result ?? null;
  },

  /**
   * Get paginated transactions for a user
   */
  async getTransactions(
    telegramId: number,
    page: number = 0,
    perPage: number = 5,
  ): Promise<PaginatedTransactions | null> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return null;

    const total = await prisma.transaction.count({
      where: { userId: user.id },
    });

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      include: {
        cashbacks: {
          select: { amount: true, status: true },
          take: 1,
        },
      },
      orderBy: { createdAt: "desc" },
      skip: safePage * perPage,
      take: perPage,
    });

    const items: TransactionItem[] = transactions.map((tx) => ({
      id: tx.id,
      amount: Number(tx.amount),
      cashbackAmount: tx.cashbacks.length > 0 ? Number(tx.cashbacks[0].amount) : 0,
      cashbackStatus: tx.cashbacks.length > 0 ? tx.cashbacks[0].status : "NONE",
      status: tx.status,
      createdAt: tx.createdAt,
      pharmacyId: tx.pharmacyId,
    }));

    return { items, total, page: safePage, totalPages, perPage };
  },
};
