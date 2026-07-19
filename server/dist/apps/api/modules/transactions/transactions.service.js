"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TransactionsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransactionsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let TransactionsService = TransactionsService_1 = class TransactionsService {
    prisma;
    audit;
    logger = new common_1.Logger(TransactionsService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto) {
        const { userId, pharmacyId, employeeId, amount } = dto;
        const [user, pharmacy] = await Promise.all([
            this.prisma.client.user.findUnique({ where: { id: userId } }),
            this.prisma.client.pharmacy.findUnique({ where: { id: pharmacyId } }),
        ]);
        if (!user)
            throw new common_1.NotFoundException('User not found');
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        if (pharmacy.status !== 'ACTIVE')
            throw new common_1.BadRequestException('Pharmacy is not active');
        if (user.status === 'BLOCKED')
            throw new common_1.BadRequestException('User is blocked');
        const rule = await this.prisma.client.cashbackRule.findFirst({
            where: {
                pharmacyId,
                isActive: true,
                deletedAt: null,
                AND: [
                    {
                        OR: [
                            { validFrom: null },
                            { validFrom: { lte: new Date() } },
                        ],
                    },
                    {
                        OR: [
                            { validTo: null },
                            { validTo: { gte: new Date() } },
                        ],
                    },
                ],
            },
            orderBy: { createdAt: 'desc' },
        });
        const cashbackAmount = rule ? this.calculateCashback(amount, rule) : 0;
        const result = await this.prisma.client.$transaction(async (tx) => {
            const transaction = await tx.transaction.create({
                data: {
                    userId,
                    pharmacyId,
                    employeeId: employeeId || undefined,
                    amount,
                    status: 'COMPLETED',
                },
            });
            const cashback = cashbackAmount > 0
                ? await tx.cashback.create({
                    data: {
                        transactionId: transaction.id,
                        userId,
                        amount: cashbackAmount,
                    },
                })
                : null;
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
            if (cashbackAmount > 0) {
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'CREDIT',
                        amount: cashbackAmount,
                        referenceType: 'cashback',
                        referenceId: cashback.id,
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
        this.audit.log('TRANSACTION_CREATED', 'transaction', result.transaction.id, undefined, { userId, pharmacyId, amount, cashbackAmount, cashbackRule: rule?.type });
        if (cashbackAmount > 0) {
            this.audit.log('CASHBACK_ACCRUED', 'cashback', result.cashback?.id, undefined, { userId, pharmacyId, amount: cashbackAmount, transactionId: result.transaction.id });
        }
        return result;
    }
    calculateCashback(amount, rule) {
        if (amount < Number(rule.minPurchase))
            return 0;
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
    async findAll(pharmacyId, page = 1, limit = 50) {
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
    async findById(id) {
        const transaction = await this.prisma.client.transaction.findUnique({
            where: { id },
            include: {
                user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                pharmacy: { select: { id: true, name: true } },
                cashbacks: true,
            },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        return transaction;
    }
    async reverseTransaction(id) {
        const transaction = await this.prisma.client.transaction.findUnique({
            where: { id },
            include: { cashbacks: true },
        });
        if (!transaction)
            throw new common_1.NotFoundException('Transaction not found');
        if (transaction.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Only completed transactions can be reversed');
        }
        const result = await this.prisma.client.$transaction(async (tx) => {
            await tx.transaction.update({
                where: { id },
                data: { status: 'REVERSED' },
            });
            for (const cb of transaction.cashbacks) {
                if (cb.status === 'ACTIVE') {
                    await tx.cashback.update({
                        where: { id: cb.id },
                        data: { status: 'ROLLED_BACK' },
                    });
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
};
exports.TransactionsService = TransactionsService;
exports.TransactionsService = TransactionsService = TransactionsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], TransactionsService);
//# sourceMappingURL=transactions.service.js.map