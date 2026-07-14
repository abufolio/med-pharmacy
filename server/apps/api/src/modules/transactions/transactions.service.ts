import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateTransactionDto, TransactionResult } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  private readonly logger = new Logger(TransactionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Transaction Engine — Atomic Cashback Flow
  // ──────────────────────────────────────────────

  /**
   * Creates a purchase transaction, calculates cashback,
   * credits the user's wallet — all in one atomic operation.
   *
   * Flow:
   *   Scan → User found → Rule matched → Cashback calculated
   *   → prisma.$transaction() {
   *       Transaction Create
   *       Cashback Create
   *       Wallet Upsert
   *       WalletTransaction Create
   *     }
   *   → Audit emit
   */
  async create(dto: CreateTransactionDto): Promise<TransactionResult> {
    const { userId, pharmacyId, employeeId, amount } = dto;

    // ── Validate entities ──
    const [user, pharmacy] = await Promise.all([
      this.prisma.client.user.findUnique({ where: { id: userId } }),
      this.prisma.client.pharmacy.findUnique({ where: { id: pharmacyId } }),
    ]);

    if (!user) throw new NotFoundException('User not found');
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    if (pharmacy.status !== 'ACTIVE') throw new BadRequestException('Pharmacy is not active');
    if (user.status === 'BLOCKED') throw new BadRequestException('User is blocked');

    // ── Find best active cashback rule ──
    const rule = await this.prisma.client.cashbackRule.findFirst({
      where: {
        pharmacyId,
        isActive: true,
        deletedAt: null,
        AND: [
          { validFrom: null }, { validFrom: { lte: new Date() } },
        ].filter(Boolean) as any,
        validTo: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    const cashbackAmount = rule ? this.calculateCashback(amount, rule) : 0;

    // ── Atomic Transaction ──
    const result = await this.prisma.client.$transaction(async (tx: any) => {
      // 1. Create transaction
      const transaction = await tx.transaction.create({
        data: {
          userId,
          pharmacyId,
          employeeId: employeeId || undefined,
          amount,
          status: 'COMPLETED',
        },
      });

      // 2. Create cashback record
      const cashback = cashbackAmount > 0
        ? await tx.cashback.create({
            data: {
              transactionId: transaction.id,
              userId,
              amount: cashbackAmount,
            },
          })
        : null;

      // 3. Upsert wallet & create wallet transaction
      const wallet = await tx.wallet.upsert({
        where: { userId },
        create: {
          userId,
          balance: cashbackAmount,
        },
        update: {
          balance: { increment: cashbackAmount },
        },
      });

      // 4. Create wallet transaction log
      if (cashbackAmount > 0) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            type: 'CREDIT',
            amount: cashbackAmount,
            referenceType: 'cashback',
            referenceId: cashback!.id,
            description: `Cashback from ${pharmacy.name}`,
          },
        });
      }

      return {
        transaction: { id: transaction.id, amount: Number(amount), status: 'COMPLETED' },
        cashback: cashback
          ? {
              id: cashback.id,
              amount: Number(cashbackAmount),
              ruleType: rule?.type || 'NONE',
              ruleValue: rule ? Number(rule.value) : 0,
            }
          : null,
        wallet: {
          id: wallet.id,
          balance: Number(wallet.balance) + Number(cashbackAmount),
          previousBalance: Number(wallet.balance),
        },
      };
    });

    // ── Audit (async — never blocks response) ──
    this.audit.log(
      'TRANSACTION_CREATED',
      'transaction',
      result.transaction.id,
      undefined,
      { userId, pharmacyId, amount, cashbackAmount, cashbackRule: rule?.type },
    );

    if (cashbackAmount > 0) {
      this.audit.log(
        'CASHBACK_ACCRUED',
        'cashback',
        result.cashback?.id,
        undefined,
        { userId, pharmacyId, amount: cashbackAmount, transactionId: result.transaction.id },
      );
    }

    return result;
  }

  // ──────────────────────────────────────────────
  // Cashback Calculation
  // ──────────────────────────────────────────────

  private calculateCashback(
    amount: number,
    rule: { type: string; value: number; minPurchase: number; maxCashback: number | null },
  ): number {
    if (amount < Number(rule.minPurchase)) return 0;

    const value = Number(rule.value);
    const maxCashback = rule.maxCashback ? Number(rule.maxCashback) : null;

    switch (rule.type) {
      case 'PERCENT': {
        const cashback = amount * (value / 100);
        return maxCashback ? Math.min(cashback, maxCashback) : Math.round(cashback * 100) / 100;
      }
      case 'FIXED':
        return value;
      case 'CAMPAIGN':
        return maxCashback || value;
      default:
        return 0;
    }
  }

  // ──────────────────────────────────────────────
  // Query Helpers
  // ──────────────────────────────────────────────

  async findAll(pharmacyId?: string, page = 1, limit = 50) {
    const where = pharmacyId ? { pharmacyId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.transaction.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          cashbacks: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.transaction.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async findById(id: string) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
        pharmacy: { select: { id: true, name: true } },
        cashbacks: true,
      },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    return transaction;
  }

  async reverseTransaction(id: string) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id },
      include: { cashbacks: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');
    if (transaction.status !== 'COMPLETED') {
      throw new BadRequestException('Only completed transactions can be reversed');
    }

    const result = await this.prisma.client.$transaction(async (tx: any) => {
      // 1. Mark transaction as reversed
      await tx.transaction.update({
        where: { id },
        data: { status: 'REVERSED' },
      });

      // 2. Roll back any cashback
      for (const cb of transaction.cashbacks) {
        if (cb.status === 'ACTIVE') {
          await tx.cashback.update({
            where: { id: cb.id },
            data: { status: 'ROLLED_BACK' },
          });

          // Debit wallet
          const wallet = await tx.wallet.findUnique({
            where: { userId: transaction.userId },
          });
          if (wallet) {
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { decrement: cb.amount } },
            });

            await tx.walletTransaction.create({
              data: {
                walletId: wallet.id,
                type: 'DEBIT',
                amount: cb.amount,
                referenceType: 'cashback',
                referenceId: cb.id,
                description: `Cashback rolled back (transaction reversed)`,
              },
            });
          }
        }
      }

      return { message: 'Transaction reversed successfully' };
    });

    this.audit.log('TRANSACTION_REVERSED', 'transaction', id, undefined, {
      userId: transaction.userId,
      amount: Number(transaction.amount),
    });

    return result;
  }
}
