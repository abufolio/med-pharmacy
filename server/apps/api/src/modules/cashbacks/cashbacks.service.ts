import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { AccrueCashbackDto } from './dto/accrue-cashback.dto';

@Injectable()
export class CashbacksService {
  private readonly logger = new Logger(CashbacksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Cashback Rules
  // ──────────────────────────────────────────────

  async createRule(dto: CreateCashbackRuleDto, pharmacyId: string) {
    const data: any = {
      pharmacyId,
      type: dto.type,
      value: dto.value,
    };

    if (dto.minPurchase !== undefined) data.minPurchase = dto.minPurchase;
    if (dto.maxCashback !== undefined) data.maxCashback = dto.maxCashback;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);

    const rule = await this.prisma.client.cashbackRule.create({ data });

    this.audit.log('CASHBACK_RULE_CREATED', 'cashback_rule', rule.id, undefined, {
      pharmacyId,
      type: dto.type,
      value: dto.value,
    });

    return rule;
  }

  async findAllRules(pharmacyId?: string, page = 1, limit = 50) {
    const where: any = {};
    if (pharmacyId) where.pharmacyId = pharmacyId;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.client.cashbackRule.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          pharmacy: { select: { id: true, name: true } },
        },
      }),
      this.prisma.client.cashbackRule.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findRuleById(id: string) {
    const rule = await this.prisma.client.cashbackRule.findUnique({
      where: { id },
      include: {
        pharmacy: { select: { id: true, name: true } },
      },
    });
    if (!rule) throw new NotFoundException('Cashback rule not found');
    return rule;
  }

  async updateRule(id: string, dto: UpdateCashbackRuleDto) {
    const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Cashback rule not found');

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.minPurchase !== undefined) data.minPurchase = dto.minPurchase;
    if (dto.maxCashback !== undefined) data.maxCashback = dto.maxCashback;
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);

    const updated = await this.prisma.client.cashbackRule.update({
      where: { id },
      data,
    });

    this.audit.log('CASHBACK_RULE_UPDATED', 'cashback_rule', id, { ...rule }, { ...dto });

    return updated;
  }

  async removeRule(id: string) {
    const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id } });
    if (!rule) throw new NotFoundException('Cashback rule not found');

    await this.prisma.client.cashbackRule.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.audit.log('CASHBACK_RULE_DELETED', 'cashback_rule', id);

    return { message: 'Cashback rule deleted' };
  }

  // ──────────────────────────────────────────────
  // User Cashbacks
  // ──────────────────────────────────────────────

  async findUserCashbacks(userId: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { userId };

    const [data, total] = await Promise.all([
      this.prisma.client.cashback.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          transaction: {
            select: { id: true, amount: true, status: true, pharmacyId: true, createdAt: true },
          },
        },
      }),
      this.prisma.client.cashback.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async accrue(dto: AccrueCashbackDto) {
    const transaction = await this.prisma.client.transaction.findUnique({
      where: { id: dto.transactionId },
      include: { user: true },
    });
    if (!transaction) throw new NotFoundException('Transaction not found');

    // Prevent duplicate accrual
    const existing = await this.prisma.client.cashback.findUnique({
      where: { transactionId: dto.transactionId },
    });
    if (existing) throw new BadRequestException('Cashback already accrued for this transaction');

    // Find the most specific active rule for this pharmacy
    const rule = await this.prisma.client.cashbackRule.findFirst({
      where: {
        pharmacyId: transaction.pharmacyId,
        isActive: true,
        OR: [
          { validFrom: null, validTo: null },
          { validFrom: null, validTo: { gte: new Date() } },
          { validFrom: { lte: new Date() }, validTo: null },
          { validFrom: { lte: new Date() }, validTo: { gte: new Date() } },
        ],
        AND: [
          { OR: [{ minPurchase: null }, { minPurchase: { lte: transaction.amount } }] },
        ],
      },
      orderBy: { createdAt: 'desc' },
    });
    if (!rule) throw new BadRequestException('No active cashback rule found for this transaction');

    // Calculate cashback amount
    let cashbackAmount: number;
    if (dto.overrideAmount !== undefined) {
      cashbackAmount = dto.overrideAmount;
    } else if (rule.type === 'PERCENT') {
      cashbackAmount = (Number(transaction.amount) * Number(rule.value)) / 100;
      // Cap by maxCashback if set
      if (rule.maxCashback !== null && cashbackAmount > Number(rule.maxCashback)) {
        cashbackAmount = Number(rule.maxCashback);
      }
    } else {
      // FIXED / CAMPAIGN
      cashbackAmount = Number(rule.value);
    }

    // Atomically create Cashback + credit wallet
    const result = await this.prisma.client.$transaction(async (tx: any) => {
      const cashback = await tx.cashback.create({
        data: {
          transactionId: dto.transactionId,
          userId: transaction.userId,
          amount: cashbackAmount,
        },
      });

      // Upsert wallet: create if not exists, increment balance
      await tx.wallet.upsert({
        where: { userId: transaction.userId },
        create: {
          userId: transaction.userId,
          balance: cashbackAmount,
        },
        update: {
          balance: { increment: cashbackAmount },
        },
      });

      // Record wallet transaction
      await tx.walletTransaction.create({
        data: {
          wallet: { connect: { userId: transaction.userId } },
          type: 'CREDIT',
          amount: cashbackAmount,
          referenceType: 'cashback',
          referenceId: cashback.id,
          description: `Cashback for transaction ${dto.transactionId}`,
        },
      });

      return cashback;
    });

    this.audit.log('CASHBACK_ACCRUED', 'cashback', result.id, undefined, {
      userId: transaction.userId,
      transactionId: dto.transactionId,
      amount: cashbackAmount,
      ruleId: rule.id,
      pharmacyId: transaction.pharmacyId,
    });

    return {
      cashback: result,
      amount: cashbackAmount,
      rule: { type: rule.type, value: rule.value },
      pharmacyId: transaction.pharmacyId,
    };
  }
}
