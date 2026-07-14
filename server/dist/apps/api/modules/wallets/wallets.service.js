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
var WalletsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let WalletsService = WalletsService_1 = class WalletsService {
    prisma;
    audit;
    logger = new common_1.Logger(WalletsService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async getBalance(userId) {
        const wallet = await this.prisma.client.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            return { balance: 0, userId };
        }
        return {
            id: wallet.id,
            userId: wallet.userId,
            balance: wallet.balance,
            createdAt: wallet.createdAt,
            updatedAt: wallet.updatedAt,
        };
    }
    async getTransactionHistory(userId, page = 1, limit = 50) {
        const wallet = await this.prisma.client.wallet.findUnique({
            where: { userId },
        });
        if (!wallet) {
            return { data: [], total: 0, page, limit };
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.walletTransaction.findMany({
                where: { walletId: wallet.id },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.walletTransaction.count({
                where: { walletId: wallet.id },
            }),
        ]);
        return { data, total, page, limit };
    }
    async requestWithdraw(userId, dto) {
        const wallet = await this.prisma.client.wallet.findUnique({
            where: { userId },
        });
        if (!wallet)
            throw new common_1.BadRequestException('Wallet is empty');
        if (Number(wallet.balance) < dto.amount) {
            throw new common_1.BadRequestException('Insufficient balance');
        }
        const request = await this.prisma.client.withdrawRequest.create({
            data: {
                userId,
                amount: dto.amount,
            },
        });
        this.audit.log('WITHDRAW_REQUESTED', 'withdraw_request', request.id, undefined, {
            userId,
            amount: dto.amount,
        });
        return request;
    }
    async getWithdrawRequests(userId, page = 1, limit = 50) {
        const where = userId ? { userId } : {};
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.withdrawRequest.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                },
            }),
            this.prisma.client.withdrawRequest.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async reviewWithdraw(id, reviewerId, dto) {
        const request = await this.prisma.client.withdrawRequest.findUnique({
            where: { id },
        });
        if (!request)
            throw new common_1.NotFoundException('Withdraw request not found');
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('Withdraw request already reviewed');
        }
        if (dto.status === 'APPROVED' || dto.status === 'PAID') {
            await this.prisma.client.$transaction(async (tx) => {
                const wallet = await tx.wallet.findUnique({
                    where: { userId: request.userId },
                });
                if (!wallet || Number(wallet.balance) < Number(request.amount)) {
                    throw new common_1.BadRequestException('Insufficient balance to process withdraw');
                }
                await tx.wallet.update({
                    where: { id: wallet.id },
                    data: { balance: { decrement: request.amount } },
                });
                await tx.walletTransaction.create({
                    data: {
                        walletId: wallet.id,
                        type: 'DEBIT',
                        amount: request.amount,
                        referenceType: 'withdraw',
                        referenceId: request.id,
                        description: `Withdraw: ${dto.status}`,
                    },
                });
                await tx.withdrawRequest.update({
                    where: { id },
                    data: {
                        status: dto.status,
                        reviewedBy: reviewerId,
                        reviewedAt: new Date(),
                    },
                });
            });
        }
        else {
            await this.prisma.client.withdrawRequest.update({
                where: { id },
                data: {
                    status: dto.status,
                    reviewedBy: reviewerId,
                    reviewedAt: new Date(),
                },
            });
        }
        this.audit.log(`WITHDRAW_${dto.status}`, 'withdraw_request', id, undefined, {
            reviewerId,
            amount: Number(request.amount),
        });
        return { message: `Withdraw request ${dto.status.toLowerCase()}` };
    }
};
exports.WalletsService = WalletsService;
exports.WalletsService = WalletsService = WalletsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], WalletsService);
//# sourceMappingURL=wallets.service.js.map