/**
 * User store — now backed by Prisma/PostgreSQL.
 * Replaces the old in-memory store.
 */

import { prisma } from "../db/prisma";
import { LanguageCode, User, UserStatus } from "../types";
import { z } from "zod";

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

// ── Card display data ──────────────────────────────
export interface CardDetails {
  uid: string;
  status: string;
  issuedAt: Date;
  assignedAt: Date;
  assignmentStatus: string;
}

export interface CardHistoryItem {
  uid: string;
  status: string;
  assignedAt: Date;
  unassignedAt: Date | null;
  assignmentStatus: string;
  isCurrent: boolean;
}

export interface PaginatedCardHistory {
  items: CardHistoryItem[];
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

  /**
   * Get current card details for a user
   */
  async getCardDetails(telegramId: number): Promise<CardDetails | null> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return null;

    const activeAssignment = await prisma.cardAssignment.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      include: { card: true },
      orderBy: { assignedAt: "desc" },
    });

    if (!activeAssignment) return null;

    return {
      uid: activeAssignment.card.uid,
      status: activeAssignment.card.status,
      issuedAt: activeAssignment.card.issuedAt,
      assignedAt: activeAssignment.assignedAt,
      assignmentStatus: activeAssignment.status,
    };
  },

  /**
   * Get paginated card assignment history for a user
   */
  async getCardHistory(
    telegramId: number,
    page: number = 0,
    perPage: number = 5,
  ): Promise<PaginatedCardHistory | null> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { id: true },
    });
    if (!user) return null;

    const total = await prisma.cardAssignment.count({
      where: { userId: user.id },
    });

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const safePage = Math.min(Math.max(0, page), totalPages - 1);

    const assignments = await prisma.cardAssignment.findMany({
      where: { userId: user.id },
      include: { card: true },
      orderBy: { assignedAt: "desc" },
      skip: safePage * perPage,
      take: perPage,
    });

    // Get current active assignment to mark it
    const currentAssignment = await prisma.cardAssignment.findFirst({
      where: { userId: user.id, status: "ACTIVE" },
      select: { id: true },
    });

    const items: CardHistoryItem[] = assignments.map((a) => ({
      uid: a.card.uid,
      status: a.card.status,
      assignedAt: a.assignedAt,
      unassignedAt: a.unassignedAt,
      assignmentStatus: a.status,
      isCurrent: a.id === currentAssignment?.id,
    }));

    return { items, total, page: safePage, totalPages, perPage };
  },

  // ── Admin: Statistics ────────────────────────────

  /**
   * Get bot statistics for admin panel
   */
  async getStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    pendingCardUsers: number;
    blockedUsers: number;
    totalTransactions: number;
    totalCashbackAmount: number;
    totalWalletBalance: number;
  }> {
    const [
      totalUsers,
      activeUsers,
      pendingCardUsers,
      blockedUsers,
      totalTransactions,
      cashbackAgg,
      walletAgg,
    ] = await Promise.all([
      prisma.user.count({ where: { deletedAt: null } }),
      prisma.user.count({ where: { deletedAt: null, status: "ACTIVE" } }),
      prisma.user.count({ where: { deletedAt: null, status: "PENDING_CARD" } }),
      prisma.user.count({ where: { deletedAt: null, status: "BLOCKED" } }),
      prisma.transaction.count(),
      prisma.cashback.aggregate({ _sum: { amount: true } }),
      prisma.wallet.aggregate({ _sum: { balance: true } }),
    ]);

    return {
      totalUsers,
      activeUsers,
      pendingCardUsers,
      blockedUsers,
      totalTransactions,
      totalCashbackAmount: Number(cashbackAgg._sum.amount || 0),
      totalWalletBalance: Number(walletAgg._sum.balance || 0),
    };
  },

  /**
   * Get all telegram IDs for broadcast (users who have telegram linked)
   */
  async getAllTelegramIds(): Promise<number[]> {
    const users = await prisma.user.findMany({
      where: {
        telegramId: { not: null },
        deletedAt: null,
      },
      select: { telegramId: true },
    });
    return users
      .map((u) => (u.telegramId ? Number(u.telegramId) : null))
      .filter((id): id is number => id !== null);
  },

  // ──────────────────────────────────────────────────
  // API Integration — real DB operations (replaces simulated/in-memory)
  // ──────────────────────────────────────────────────

  /**
   * Create a withdraw request (TechSpec FR-051)
   * — checks balance, creates WithdrawRequest record
   * — does NOT debit wallet (admin approves later)
   */
  async createWithdrawRequest(
    telegramId: number,
    amount: number,
  ): Promise<{ success: true; requestId: string } | { success: false; error: string }> {
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: { wallet: true },
    });
    if (!user) return { success: false, error: "User not found" };
    if (!user.wallet) return { success: false, error: "No wallet" };

    const balance = Number(user.wallet.balance);
    if (balance < amount) {
      return { success: false, error: "Insufficient balance" };
    }

    const request = await prisma.withdrawRequest.create({
      data: {
        userId: user.id,
        amount,
      },
    });

    return { success: true, requestId: request.id };
  },

  /**
   * Validate and redeem a promo code (TechSpec FR-053)
   * — checks active, valid window, usage limit, duplicate
   * — creates PromoRedemption record, increments usedCount
   */
  async redeemPromoCode(
    telegramId: number,
    code: string,
  ): Promise<
    { success: true; discount: number; type: string } | { success: false; error: string }
  > {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { success: false, error: "User not found" };

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!promo) return { success: false, error: "PROMO_INVALID" };
    if (!promo.isActive) return { success: false, error: "PROMO_INACTIVE" };

    const now = new Date();
    if (promo.validFrom && now < promo.validFrom) {
      return { success: false, error: "PROMO_NOT_YET" };
    }
    if (promo.validTo && now > promo.validTo) {
      return { success: false, error: "PROMO_EXPIRED" };
    }
    if (promo.usageLimit > 0 && promo.usedCount >= promo.usageLimit) {
      return { success: false, error: "PROMO_LIMIT" };
    }

    // Check duplicate
    const existing = await prisma.promoRedemption.findUnique({
      where: {
        promoCodeId_userId: { promoCodeId: promo.id, userId: user.id },
      },
    });
    if (existing) return { success: false, error: "PROMO_DUPLICATE" };

    // Atomic redemption
    await prisma.$transaction(async (tx: any) => {
      await tx.promoRedemption.create({
        data: { promoCodeId: promo.id, userId: user.id },
      });
      await tx.promoCode.update({
        where: { id: promo.id },
        data: { usedCount: { increment: 1 } },
      });
    });

    const discount =
      promo.type === "PERCENT"
        ? 0 // No purchase context in bot
        : Number(promo.value);

    return { success: true, discount, type: promo.type };
  },

  /**
   * Get real referral stats from DB (TechSpec FR-052)
   */
  async getReferralStats(telegramId: number): Promise<{
    count: number;
    completed: number;
    pending: number;
    bonusAmount: number;
  }> {
    const user = await prisma.user.findUnique({ where: { telegramId } });
    if (!user) return { count: 0, completed: 0, pending: 0, bonusAmount: 0 };

    const [total, completed, pending, bonusAgg] = await Promise.all([
      prisma.referral.count({ where: { referrerId: user.id } }),
      prisma.referral.count({ where: { referrerId: user.id, status: "COMPLETED" } }),
      prisma.referral.count({ where: { referrerId: user.id, status: "PENDING" } }),
      prisma.referral.aggregate({
        where: { referrerId: user.id, status: "COMPLETED" },
        _sum: { bonusAmount: true },
      }),
    ]);

    return {
      count: total,
      completed,
      pending,
      bonusAmount: Number(bonusAgg._sum.bonusAmount || 0),
    };
  },
};
