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
var CashbackProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbackProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const queue_1 = require("@server/queue");
let CashbackProcessor = CashbackProcessor_1 = class CashbackProcessor extends bullmq_1.WorkerHost {
    prisma;
    logger = new common_1.Logger(CashbackProcessor_1.name);
    constructor(prisma) {
        super();
        this.prisma = prisma;
    }
    async process(job) {
        const { transactionId, userId, pharmacyId, amount } = job.data;
        try {
            const rule = await this.prisma.client.cashbackRule.findFirst({
                where: { pharmacyId, isActive: true, deletedAt: null },
                orderBy: { createdAt: 'desc' },
            });
            if (!rule) {
                this.logger.debug(`No active cashback rule for pharmacy ${pharmacyId}`);
                return;
            }
            let cashbackAmount = 0;
            const value = Number(rule.value);
            const maxCashback = rule.maxCashback ? Number(rule.maxCashback) : null;
            if (amount >= Number(rule.minPurchase)) {
                switch (rule.type) {
                    case 'PERCENT': {
                        const calc = amount * (value / 100);
                        cashbackAmount = maxCashback ? Math.min(calc, maxCashback) : Math.round(calc * 100) / 100;
                        break;
                    }
                    case 'FIXED':
                        cashbackAmount = value;
                        break;
                    case 'CAMPAIGN':
                        cashbackAmount = maxCashback || value;
                        break;
                }
            }
            if (cashbackAmount <= 0)
                return;
            await this.prisma.client.$transaction(async (tx) => {
                const cashback = await tx.cashback.create({
                    data: { transactionId, userId, amount: cashbackAmount },
                });
                const wallet = await tx.wallet.upsert({
                    where: { userId },
                    create: { userId, balance: cashbackAmount },
                    update: { balance: { increment: cashbackAmount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'CREDIT',
                        amount: cashbackAmount,
                        referenceType: 'cashback',
                        referenceId: cashback.id,
                    },
                });
            });
            this.logger.debug(`Cashback ${cashbackAmount} credited to user ${userId} (tx: ${transactionId})`);
        }
        catch (error) {
            this.logger.error(`Cashback processing failed: ${error}`);
            throw error;
        }
    }
};
exports.CashbackProcessor = CashbackProcessor;
exports.CashbackProcessor = CashbackProcessor = CashbackProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_1.Queues.CASHBACK),
    __metadata("design:paramtypes", [database_1.PrismaService])
], CashbackProcessor);
//# sourceMappingURL=cashback.processor.js.map