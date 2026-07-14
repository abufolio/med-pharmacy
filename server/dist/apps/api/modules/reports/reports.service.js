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
var ReportsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
let ReportsService = ReportsService_1 = class ReportsService {
    prisma;
    logger = new common_1.Logger(ReportsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getDailyStats(pharmacyId, from, to, page = 1, limit = 31) {
        const where = { pharmacyId };
        if (from || to) {
            where.date = {};
            if (from)
                where.date.gte = new Date(from);
            if (to)
                where.date.lte = new Date(to);
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.dailyStatistic.findMany({
                where,
                skip,
                take: limit,
                orderBy: { date: 'desc' },
            }),
            this.prisma.client.dailyStatistic.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async getPharmacySummary(pharmacyId, from, to) {
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to)
            dateFilter.lte = new Date(to);
        const where = { pharmacyId };
        if (from || to)
            where.date = dateFilter;
        const aggregation = await this.prisma.client.dailyStatistic.aggregate({
            where,
            _sum: {
                totalTransactions: true,
                totalAmount: true,
                totalCashback: true,
                totalCustomers: true,
            },
            _avg: {
                totalAmount: true,
            },
        });
        const days = await this.prisma.client.dailyStatistic.count({ where });
        return {
            pharmacyId,
            period: { from: from || 'all', to: to || 'all' },
            days,
            totalTransactions: aggregation._sum.totalTransactions || 0,
            totalAmount: aggregation._sum.totalAmount || 0,
            totalCashback: aggregation._sum.totalCashback || 0,
            totalCustomers: aggregation._sum.totalCustomers || 0,
            avgTransactionAmount: aggregation._avg.totalAmount || 0,
        };
    }
    async getAdminOverview(from, to) {
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to)
            dateFilter.lte = new Date(to);
        const where = {};
        if (from || to)
            where.date = dateFilter;
        const aggregation = await this.prisma.client.dailyStatistic.aggregate({
            where,
            _sum: {
                totalTransactions: true,
                totalAmount: true,
                totalCashback: true,
                totalCustomers: true,
            },
        });
        const [pharmacies, activeUsers, pendingWithdraws] = await Promise.all([
            this.prisma.client.pharmacy.count({ where: { deletedAt: null } }),
            this.prisma.client.user.count({ where: { status: { not: 'BLOCKED' }, deletedAt: null } }),
            this.prisma.client.withdrawRequest.count({ where: { status: 'PENDING' } }),
        ]);
        return {
            period: { from: from || 'all', to: to || 'all' },
            totalTransactions: aggregation._sum.totalTransactions || 0,
            totalAmount: aggregation._sum.totalAmount || 0,
            totalCashback: aggregation._sum.totalCashback || 0,
            totalCustomers: aggregation._sum.totalCustomers || 0,
            activePharmacies: pharmacies,
            activeUsers,
            pendingWithdraws,
        };
    }
    async getTopPharmacies(limit = 10, from, to) {
        const dateFilter = {};
        if (from)
            dateFilter.gte = new Date(from);
        if (to)
            dateFilter.lte = new Date(to);
        const where = {};
        if (from || to)
            where.date = dateFilter;
        const stats = await this.prisma.client.dailyStatistic.groupBy({
            by: ['pharmacyId'],
            where,
            _sum: {
                totalTransactions: true,
                totalAmount: true,
                totalCashback: true,
            },
            orderBy: { _sum: { totalAmount: 'desc' } },
            take: limit,
        });
        const pharmacyIds = stats.map((s) => s.pharmacyId);
        const pharmacies = await this.prisma.client.pharmacy.findMany({
            where: { id: { in: pharmacyIds } },
            select: { id: true, name: true },
        });
        const pharmacyMap = new Map(pharmacies.map((p) => [p.id, p.name]));
        return stats.map((s) => ({
            pharmacyId: s.pharmacyId,
            pharmacyName: pharmacyMap.get(s.pharmacyId) || 'Unknown',
            totalTransactions: s._sum.totalTransactions || 0,
            totalAmount: s._sum.totalAmount || 0,
            totalCashback: s._sum.totalCashback || 0,
        }));
    }
    async getTransactionReport(pharmacyId, from, to, page = 1, limit = 100) {
        const where = {};
        if (pharmacyId)
            where.pharmacyId = pharmacyId;
        if (from || to) {
            where.createdAt = {};
            if (from)
                where.createdAt.gte = new Date(from);
            if (to)
                where.createdAt.lte = new Date(to);
        }
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.transaction.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    pharmacy: { select: { id: true, name: true } },
                    cashbacks: { select: { id: true, amount: true, status: true } },
                },
            }),
            this.prisma.client.transaction.count({ where }),
        ]);
        return { data, total, page, limit };
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = ReportsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map