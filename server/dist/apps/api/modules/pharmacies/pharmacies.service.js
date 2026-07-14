"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PharmaciesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PharmaciesService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcryptjs"));
const database_1 = require("@server/database");
const audit_helper_1 = require("../audit/audit.helper");
let PharmaciesService = PharmaciesService_1 = class PharmaciesService {
    prisma;
    audit;
    logger = new common_1.Logger(PharmaciesService_1.name);
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createRegion(dto) {
        return this.prisma.client.region.create({ data: dto });
    }
    async getRegions() {
        return this.prisma.client.region.findMany({
            include: { districts: { where: { deletedAt: null } } },
            orderBy: { name: 'asc' },
        });
    }
    async updateRegion(id, dto) {
        const region = await this.prisma.client.region.findUnique({ where: { id } });
        if (!region)
            throw new common_1.NotFoundException('Region not found');
        return this.prisma.client.region.update({ where: { id }, data: dto });
    }
    async deleteRegion(id) {
        const region = await this.prisma.client.region.findUnique({
            where: { id }, include: { districts: true },
        });
        if (!region)
            throw new common_1.NotFoundException('Region not found');
        if (region.districts.length > 0) {
            throw new common_1.ConflictException('Cannot delete region with existing districts');
        }
        await this.prisma.client.region.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return { message: 'Region deleted' };
    }
    async createDistrict(dto) {
        const region = await this.prisma.client.region.findUnique({
            where: { id: dto.regionId },
        });
        if (!region)
            throw new common_1.NotFoundException('Region not found');
        return this.prisma.client.district.create({ data: dto });
    }
    async getDistricts(regionId) {
        const where = regionId ? { regionId } : {};
        return this.prisma.client.district.findMany({
            where,
            include: { region: { select: { name: true } } },
            orderBy: { name: 'asc' },
        });
    }
    async updateDistrict(id, dto) {
        const district = await this.prisma.client.district.findUnique({ where: { id } });
        if (!district)
            throw new common_1.NotFoundException('District not found');
        return this.prisma.client.district.update({ where: { id }, data: dto });
    }
    async deleteDistrict(id) {
        const district = await this.prisma.client.district.findUnique({
            where: { id }, include: { pharmacies: true },
        });
        if (!district)
            throw new common_1.NotFoundException('District not found');
        if (district.pharmacies.length > 0) {
            throw new common_1.ConflictException('Cannot delete district with registered pharmacies');
        }
        await this.prisma.client.district.update({
            where: { id },
            data: { deletedAt: new Date() },
        });
        return { message: 'District deleted' };
    }
    async create(dto) {
        const existing = await this.prisma.client.pharmacy.findUnique({
            where: { login: dto.login },
        });
        if (existing)
            throw new common_1.ConflictException('Login already taken');
        const district = await this.prisma.client.district.findUnique({
            where: { id: dto.districtId },
        });
        if (!district)
            throw new common_1.NotFoundException('District not found');
        const passwordHash = await bcrypt.hash(dto.password, 12);
        const pharmacy = await this.prisma.client.pharmacy.create({
            data: {
                name: dto.name,
                districtId: dto.districtId,
                address: dto.address,
                phone: dto.phone,
                login: dto.login,
                passwordHash,
            },
            select: {
                id: true, name: true, login: true, phone: true,
                status: true, createdAt: true,
            },
        });
        this.audit.log('PHARMACY_CREATED', 'pharmacy', pharmacy.id);
        return pharmacy;
    }
    async findAll(status, page = 1, limit = 50) {
        const where = {};
        if (status)
            where.status = status;
        const skip = (page - 1) * limit;
        const [data, total] = await Promise.all([
            this.prisma.client.pharmacy.findMany({
                where,
                skip,
                take: limit,
                include: {
                    district: {
                        select: { id: true, name: true, region: { select: { name: true } } },
                    },
                    _count: { select: { employees: true, readers: true, transactions: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            this.prisma.client.pharmacy.count({ where }),
        ]);
        return { data, total, page, limit };
    }
    async findById(id) {
        const pharmacy = await this.prisma.client.pharmacy.findUnique({
            where: { id },
            include: {
                district: {
                    select: { id: true, name: true, region: { select: { id: true, name: true } } },
                },
                employees: {
                    where: { deletedAt: null },
                    select: { id: true, fullName: true, login: true, status: true, role: { select: { name: true } } },
                },
                cashbackRules: {
                    where: { deletedAt: null },
                    orderBy: { createdAt: 'desc' },
                },
                readers: {
                    where: { deletedAt: null },
                    select: { id: true, serialNumber: true, status: true, lastPingAt: true },
                },
                _count: { select: { transactions: true } },
            },
        });
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        return pharmacy;
    }
    async update(id, dto) {
        const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        const updated = await this.prisma.client.pharmacy.update({
            where: { id },
            data: dto,
            select: {
                id: true, name: true, phone: true, address: true,
                status: true, updatedAt: true,
            },
        });
        this.audit.log('PHARMACY_UPDATED', 'pharmacy', id);
        return updated;
    }
    async updateStatus(id, dto) {
        const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        const updated = await this.prisma.client.pharmacy.update({
            where: { id },
            data: { status: dto.status },
        });
        this.audit.log('PHARMACY_STATUS_CHANGED', 'pharmacy', id, { status: pharmacy.status }, { status: dto.status });
        return updated;
    }
    async changePassword(id, dto) {
        const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        const passwordHash = await bcrypt.hash(dto.newPassword, 12);
        await this.prisma.client.pharmacy.update({
            where: { id },
            data: { passwordHash },
        });
        this.audit.log('PHARMACY_PASSWORD_CHANGED', 'pharmacy', id);
        return { message: 'Password updated' };
    }
    async createCashbackRule(pharmacyId, dto) {
        const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id: pharmacyId } });
        if (!pharmacy)
            throw new common_1.NotFoundException('Pharmacy not found');
        const data = {
            pharmacyId,
            type: dto.type,
            value: dto.value,
            minPurchase: dto.minPurchase || 0,
            maxCashback: dto.maxCashback,
            isActive: dto.isActive ?? true,
        };
        if (dto.validFrom)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validTo)
            data.validTo = new Date(dto.validTo);
        const rule = await this.prisma.client.cashbackRule.create({ data });
        this.audit.log('CASHBACK_RULE_CREATED', 'cashback_rule', rule.id, undefined, {
            pharmacyId, type: dto.type, value: dto.value,
        });
        return rule;
    }
    async getCashbackRules(pharmacyId) {
        return this.prisma.client.cashbackRule.findMany({
            where: { pharmacyId, deletedAt: null },
            orderBy: { createdAt: 'desc' },
        });
    }
    async updateCashbackRule(ruleId, dto) {
        const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id: ruleId } });
        if (!rule)
            throw new common_1.NotFoundException('Cashback rule not found');
        const data = { ...dto };
        if (dto.validFrom)
            data.validFrom = new Date(dto.validFrom);
        if (dto.validTo)
            data.validTo = new Date(dto.validTo);
        if (dto.minPurchase === undefined && dto.minPurchase !== undefined) {
            data.minPurchase = 0;
        }
        const updated = await this.prisma.client.cashbackRule.update({
            where: { id: ruleId },
            data,
        });
        this.audit.log('CASHBACK_RULE_UPDATED', 'cashback_rule', ruleId);
        return updated;
    }
    async deleteCashbackRule(ruleId) {
        const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id: ruleId } });
        if (!rule)
            throw new common_1.NotFoundException('Cashback rule not found');
        await this.prisma.client.cashbackRule.update({
            where: { id: ruleId },
            data: { deletedAt: new Date(), isActive: false },
        });
        this.audit.log('CASHBACK_RULE_DELETED', 'cashback_rule', ruleId);
        return { message: 'Cashback rule deleted' };
    }
};
exports.PharmaciesService = PharmaciesService;
exports.PharmaciesService = PharmaciesService = PharmaciesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [database_1.PrismaService,
        audit_helper_1.AuditHelper])
], PharmaciesService);
//# sourceMappingURL=pharmacies.service.js.map