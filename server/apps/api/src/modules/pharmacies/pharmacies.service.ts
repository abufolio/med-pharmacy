import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import {
  CreatePharmacyDto, UpdatePharmacyDto,
  UpdatePharmacyStatusDto, ChangePharmacyPasswordDto,
} from './dto/create-pharmacy.dto';
import {
  CreateRegionDto, CreateDistrictDto,
  UpdateRegionDto, UpdateDistrictDto,
} from './dto/region.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';

@Injectable()
export class PharmaciesService {
  private readonly logger = new Logger(PharmaciesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Regions
  // ──────────────────────────────────────────────

  async createRegion(dto: CreateRegionDto) {
    return this.prisma.client.region.create({ data: dto });
  }

  async getRegions() {
    return this.prisma.client.region.findMany({
      include: { districts: { where: { deletedAt: null } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateRegion(id: string, dto: UpdateRegionDto) {
    const region = await this.prisma.client.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('Region not found');
    return this.prisma.client.region.update({ where: { id }, data: dto });
  }

  async deleteRegion(id: string) {
    const region = await this.prisma.client.region.findUnique({
      where: { id }, include: { districts: true },
    });
    if (!region) throw new NotFoundException('Region not found');
    if (region.districts.length > 0) {
      throw new ConflictException('Cannot delete region with existing districts');
    }
    await this.prisma.client.region.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'Region deleted' };
  }

  // ──────────────────────────────────────────────
  // Districts
  // ──────────────────────────────────────────────

  async createDistrict(dto: CreateDistrictDto) {
    const region = await this.prisma.client.region.findUnique({
      where: { id: dto.regionId },
    });
    if (!region) throw new NotFoundException('Region not found');
    return this.prisma.client.district.create({ data: dto });
  }

  async getDistricts(regionId?: string) {
    const where = regionId ? { regionId } : {};
    return this.prisma.client.district.findMany({
      where,
      include: { region: { select: { name: true } } },
      orderBy: { name: 'asc' },
    });
  }

  async updateDistrict(id: string, dto: UpdateDistrictDto) {
    const district = await this.prisma.client.district.findUnique({ where: { id } });
    if (!district) throw new NotFoundException('District not found');
    return this.prisma.client.district.update({ where: { id }, data: dto });
  }

  async deleteDistrict(id: string) {
    const district = await this.prisma.client.district.findUnique({
      where: { id }, include: { pharmacies: true },
    });
    if (!district) throw new NotFoundException('District not found');
    if (district.pharmacies.length > 0) {
      throw new ConflictException('Cannot delete district with registered pharmacies');
    }
    await this.prisma.client.district.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { message: 'District deleted' };
  }

  // ──────────────────────────────────────────────
  // Pharmacies
  // ──────────────────────────────────────────────

  async create(dto: CreatePharmacyDto) {
    const existing = await this.prisma.client.pharmacy.findUnique({
      where: { login: dto.login },
    });
    if (existing) throw new ConflictException('Login already taken');

    const district = await this.prisma.client.district.findUnique({
      where: { id: dto.districtId },
    });
    if (!district) throw new NotFoundException('District not found');

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

  async findAll(status?: string, page = 1, limit = 50) {
    const where: any = {};
    if (status) where.status = status;

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

  async findById(id: string) {
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
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');
    return pharmacy;
  }

  async update(id: string, dto: UpdatePharmacyDto) {
    const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');

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

  async updateStatus(id: string, dto: UpdatePharmacyStatusDto) {
    const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');

    const updated = await this.prisma.client.pharmacy.update({
      where: { id },
      data: { status: dto.status },
    });

    this.audit.log('PHARMACY_STATUS_CHANGED', 'pharmacy', id,
      { status: pharmacy.status }, { status: dto.status },
    );
    return updated;
  }

  async changePassword(id: string, dto: ChangePharmacyPasswordDto) {
    const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id } });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.client.pharmacy.update({
      where: { id },
      data: { passwordHash },
    });

    this.audit.log('PHARMACY_PASSWORD_CHANGED', 'pharmacy', id);
    return { message: 'Password updated' };
  }

  // ──────────────────────────────────────────────
  // Cashback Rules
  // ──────────────────────────────────────────────

  async createCashbackRule(pharmacyId: string, dto: CreateCashbackRuleDto) {
    const pharmacy = await this.prisma.client.pharmacy.findUnique({ where: { id: pharmacyId } });
    if (!pharmacy) throw new NotFoundException('Pharmacy not found');

    const data: any = {
      pharmacyId,
      type: dto.type,
      value: dto.value,
      minPurchase: dto.minPurchase || 0,
      maxCashback: dto.maxCashback,
      isActive: dto.isActive ?? true,
    };

    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);

    const rule = await this.prisma.client.cashbackRule.create({ data });

    this.audit.log('CASHBACK_RULE_CREATED', 'cashback_rule', rule.id, undefined, {
      pharmacyId, type: dto.type, value: dto.value,
    });
    return rule;
  }

  async getCashbackRules(pharmacyId: string) {
    return this.prisma.client.cashbackRule.findMany({
      where: { pharmacyId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateCashbackRule(ruleId: string, dto: UpdateCashbackRuleDto) {
    const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Cashback rule not found');

    const data: any = { ...dto };
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);
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

  async deleteCashbackRule(ruleId: string) {
    const rule = await this.prisma.client.cashbackRule.findUnique({ where: { id: ruleId } });
    if (!rule) throw new NotFoundException('Cashback rule not found');

    await this.prisma.client.cashbackRule.update({
      where: { id: ruleId },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.audit.log('CASHBACK_RULE_DELETED', 'cashback_rule', ruleId);
    return { message: 'Cashback rule deleted' };
  }
}
