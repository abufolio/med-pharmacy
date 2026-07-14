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
var CashbacksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CashbacksService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let CashbacksService = CashbacksService_1 = class CashbacksService {
    prisma;
    audit;
    logger = new common_1.Logger(CashbacksService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createRule(dto, pharmacyId) {
        const data = {
            pharmacyId,
            type: dto.type,
            value: dto.value,
        };
        if (dto.minPurchase !== undefined)
            data.minPurchase = dto.minPurchase;
        if (dto.maxCashback !== undefined)
            data.maxCashback = dto.maxCashback;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.validFrom)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validTo)
            data.validTo = new Date(dto.validTo);
        const rule = await this.prisma.client.cashbackRule.create({ data });
        this.audit.log('CASHBACK_RULE_CREATED', 'cashback_rule', rule.id, undefined, {
            pharmacyId,
            type: dto.type,
            value: dto.value,
        });
        return rule;
    }
    async findAllRules(pharmacyId, page = 1, limit = 50) {
        const where = {};
        if (pharmacyId)
            where.pharmacyId = pharmacyId;
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
    async findRuleById(id) {
        const rule = await this.prisma.client.cashbackRule.findUnique({
            where: { id },
            include: {
                pharmacy: { select: { id: true, name: true } },
            },
        });
        if (!rule)
            throw new common_1.NotFoundException('Cashback rule not found');
        return rule;
    }
    async updateRule(id, dto) {
        const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Cashback rule not found');
        const data = {};
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.value !== undefined)
            data.value = dto.value;
        if (dto.minPurchase !== undefined)
            data.minPurchase = dto.minPurchase;
        if (dto.maxCashback !== undefined)
            data.maxCashback = dto.maxCashback;
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        if (dto.validFrom)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validTo)
            data.validTo = new Date(dto.validTo);
        const updated = await this.prisma.client.cashbackRule.update({
            where: { id },
            data,
        });
        this.audit.log('CASHBACK_RULE_UPDATED', 'cashback_rule', id, { ...rule }, { ...dto });
        return updated;
    }
    async removeRule(id) {
        const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id } });
        if (!rule)
            throw new common_1.NotFoundException('Cashback rule not found');
        await this.prisma.client.cashbackRule.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        this.audit.log('CASHBACK_RULE_DELETED', 'cashback_rule', id);
        return { message: 'Cashback rule deleted' };
    }
    async findUserCashbacks(userId, page = 1, limit = 50) {
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
};
exports.CashbacksService = CashbacksService;
exports.CashbacksService = CashbacksService = CashbacksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], CashbacksService);
//# sourceMappingURL=cashbacks.service.js.map