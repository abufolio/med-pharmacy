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
var ReferralsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralsService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let ReferralsService = ReferralsService_1 = class ReferralsService {
    prisma;
    audit;
    logger = new common_1.Logger(ReferralsService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(referrerId, dto) {
        if (referrerId === dto.referredId) {
            throw new common_1.ConflictException('Cannot refer yourself');
        }
        const referred = await this.prisma.client.user.findUnique({
            where: { id: dto.referredId },
        });
        if (!referred)
            throw new common_1.NotFoundException('Referred user not found');
        const existing = await this.prisma.client.referral.findUnique({
            where: { referredId: dto.referredId },
        });
        if (existing)
            throw new common_1.ConflictException('User already referred');
        const referral = await this.prisma.client.referral.create({
            data: {
                referrerId,
                referredId: dto.referredId,
            },
            include: {
                referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
                referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
        });
        this.audit.log('REFERRAL_CREATED', 'referral', referral.id, undefined, {
            referrerId,
            referredId: dto.referredId,
        });
        return referral;
    }
    async findByReferrer(referrerId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = { referrerId };
        const [data, total] = await Promise.all([
            this.prisma.client.referral.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    referred: { select: { id: true, firstName: true, lastName: true, phone: true, status: true } },
                },
            }),
            this.prisma.client.referral.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async findByReferred(referredId) {
        const referral = await this.prisma.client.referral.findUnique({
            where: { referredId },
            include: {
                referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
        });
        if (!referral)
            throw new common_1.NotFoundException('Referral not found');
        return referral;
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.referral.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
                },
            }),
            this.prisma.client.referral.count(),
        ]);
        return { data, total, page, limit };
    }
    async update(id, dto) {
        const referral = await this.prisma.client.referral.findUnique({ where: { id } });
        if (!referral)
            throw new common_1.NotFoundException('Referral not found');
        const data = {};
        if (dto.status)
            data.status = dto.status;
        if (dto.bonusAmount !== undefined)
            data.bonusAmount = dto.bonusAmount;
        const updated = await this.prisma.client.referral.update({
            where: { id },
            data,
            include: {
                referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
                referred: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
        });
        this.audit.log('REFERRAL_UPDATED', 'referral', id, { ...referral }, { ...dto });
        return updated;
    }
    async getReferralStats(referrerId) {
        const [total, completed, pending] = await Promise.all([
            this.prisma.client.referral.count({ where: { referrerId } }),
            this.prisma.client.referral.count({ where: { referrerId, status: 'COMPLETED' } }),
            this.prisma.client.referral.count({ where: { referrerId, status: 'PENDING' } }),
        ]);
        const totalBonus = await this.prisma.client.referral.aggregate({
            where: { referrerId, status: 'COMPLETED' },
            _sum: { bonusAmount: true },
        });
        return {
            total,
            completed,
            pending,
            totalBonus: totalBonus._sum.bonusAmount || 0,
        };
    }
};
exports.ReferralsService = ReferralsService;
exports.ReferralsService = ReferralsService = ReferralsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], ReferralsService);
//# sourceMappingURL=referrals.service.js.map