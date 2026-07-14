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
var PromocodesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PromocodesService = void 0;
const common_1 = require("@nestjs/common");
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let PromocodesService = PromocodesService_1 = class PromocodesService {
    prisma;
    audit;
    logger = new common_1.Logger(PromocodesService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async create(dto) {
        const existing = await this.prisma.client.promoCode.findUnique({
            where: { code: dto.code },
        });
        if (existing) {
            throw new common_1.ConflictException('Promo code already exists');
        }
        const promoCode = await this.prisma.client.promoCode.create({
            data: {
                code: dto.code.toUpperCase(),
                type: dto.type,
                value: dto.value,
                usageLimit: dto.usageLimit ?? 0,
                ...(dto.validFrom && { validFrom: new Date(dto.validFrom) }),
                ...(dto.validTo && { validTo: new Date(dto.validTo) }),
                ...(dto.isActive !== undefined && { isActive: dto.isActive }),
            },
        });
        this.audit.log('PROMO_CODE_CREATED', 'promo_code', promoCode.id, undefined, {
            code: dto.code,
            type: dto.type,
            value: dto.value,
        });
        return promoCode;
    }
    async findAll(page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.promoCode.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.promoCode.count(),
        ]);
        return { data, total, page, limit };
    }
    async findById(id) {
        const promoCode = await this.prisma.client.promoCode.findUnique({
            where: { id },
            include: {
                redemptions: {
                    take: 20,
                    orderBy: { redeemedAt: 'desc' },
                    include: {
                        user: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    },
                },
            },
        });
        if (!promoCode)
            throw new common_1.NotFoundException('Promo code not found');
        return promoCode;
    }
    async findByCode(code) {
        const promoCode = await this.prisma.client.promoCode.findUnique({
            where: { code: code.toUpperCase() },
        });
        if (!promoCode)
            throw new common_1.NotFoundException('Promo code not found');
        return promoCode;
    }
    async update(id, dto) {
        const promoCode = await this.prisma.client.promoCode.findUnique({ where: { id } });
        if (!promoCode)
            throw new common_1.NotFoundException('Promo code not found');
        const data = {};
        if (dto.type !== undefined)
            data.type = dto.type;
        if (dto.value !== undefined)
            data.value = dto.value;
        if (dto.usageLimit !== undefined)
            data.usageLimit = dto.usageLimit;
        if (dto.validFrom)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validTo)
            data.validTo = new Date(dto.validTo);
        if (dto.isActive !== undefined)
            data.isActive = dto.isActive;
        const updated = await this.prisma.client.promoCode.update({
            where: { id },
            data,
        });
        this.audit.log('PROMO_CODE_UPDATED', 'promo_code', id, { ...promoCode }, { ...dto });
        return updated;
    }
    async remove(id) {
        const promoCode = await this.prisma.client.promoCode.findUnique({ where: { id } });
        if (!promoCode)
            throw new common_1.NotFoundException('Promo code not found');
        await this.prisma.client.promoCode.update({
            where: { id },
            data: { deletedAt: new Date(), isActive: false },
        });
        this.audit.log('PROMO_CODE_DELETED', 'promo_code', id);
        return { message: 'Promo code deleted' };
    }
    async redeem(userId, dto) {
        const promoCode = await this.prisma.client.promoCode.findUnique({
            where: { code: dto.code.toUpperCase() },
        });
        if (!promoCode)
            throw new common_1.NotFoundException('Promo code not found');
        if (!promoCode.isActive) {
            throw new common_1.BadRequestException('Promo code is inactive');
        }
        const now = new Date();
        if (promoCode.validFrom && now < promoCode.validFrom) {
            throw new common_1.BadRequestException('Promo code is not yet valid');
        }
        if (promoCode.validTo && now > promoCode.validTo) {
            throw new common_1.BadRequestException('Promo code has expired');
        }
        if (promoCode.usageLimit > 0 && promoCode.usedCount >= promoCode.usageLimit) {
            throw new common_1.BadRequestException('Promo code usage limit reached');
        }
        const existing = await this.prisma.client.promoRedemption.findUnique({
            where: {
                promoCodeId_userId: {
                    promoCodeId: promoCode.id,
                    userId,
                },
            },
        });
        if (existing) {
            throw new common_1.ConflictException('Promo code already redeemed by this user');
        }
        let discount = 0;
        if (promoCode.type === 'PERCENT') {
            discount = (dto.purchaseAmount * Number(promoCode.value)) / 100;
        }
        else {
            discount = Number(promoCode.value);
        }
        const result = await this.prisma.client.$transaction(async (tx) => {
            const redemption = await tx.promoRedemption.create({
                data: {
                    promoCodeId: promoCode.id,
                    userId,
                },
            });
            await tx.promoCode.update({
                where: { id: promoCode.id },
                data: { usedCount: { increment: 1 } },
            });
            return redemption;
        });
        this.audit.log('PROMO_CODE_REDEEMED', 'promo_redemption', result.id, undefined, {
            userId,
            promoCode: promoCode.code,
            discount,
        });
        return {
            redemption: result,
            discount,
            code: promoCode.code,
            type: promoCode.type,
        };
    }
    async getUserRedemptions(userId, page = 1, limit = 50) {
        const skip = (page - 1) * limit;
        const where = { userId };
        const [data, total] = await Promise.all([
            this.prisma.client.promoRedemption.findMany({
                where,
                skip,
                take: limit,
                orderBy: { redeemedAt: 'desc' },
                include: {
                    promoCode: { select: { code: true, type: true, value: true } },
                },
            }),
            this.prisma.client.promoRedemption.count({ where }),
        ]);
        return { data, total, page, limit };
    }
};
exports.PromocodesService = PromocodesService;
exports.PromocodesService = PromocodesService = PromocodesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], PromocodesService);
//# sourceMappingURL=promocodes.service.js.map