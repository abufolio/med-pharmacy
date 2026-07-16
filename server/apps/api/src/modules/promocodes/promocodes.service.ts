import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreatePromoCodeDto, UpdatePromoCodeDto, RedeemPromoCodeDto } from './dto/promocodes.dto';

@Injectable()
export class PromocodesService {
  private readonly logger = new Logger(PromocodesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Promo Code Management
  // ──────────────────────────────────────────────

  async create(dto: CreatePromoCodeDto) {
    const existing = await this.prisma.client.promoCode.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Promo code already exists');
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

  async findById(id: string) {
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
    if (!promoCode) throw new NotFoundException('Promo code not found');
    return promoCode;
  }

  async findByCode(code: string) {
    const promoCode = await this.prisma.client.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });
    if (!promoCode) throw new NotFoundException('Promo code not found');
    return promoCode;
  }

  async update(id: string, dto: UpdatePromoCodeDto) {
    const promoCode = await this.prisma.client.promoCode.findUnique({ where: { id } });
    if (!promoCode) throw new NotFoundException('Promo code not found');

    const data: any = {};
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.value !== undefined) data.value = dto.value;
    if (dto.usageLimit !== undefined) data.usageLimit = dto.usageLimit;
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom);
    if (dto.validTo) data.validTo = new Date(dto.validTo);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.client.promoCode.update({
      where: { id },
      data,
    });

    this.audit.log('PROMO_CODE_UPDATED', 'promo_code', id, { ...promoCode }, { ...dto });

    return updated;
  }

  async remove(id: string) {
    const promoCode = await this.prisma.client.promoCode.findUnique({ where: { id } });
    if (!promoCode) throw new NotFoundException('Promo code not found');

    await this.prisma.client.promoCode.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    this.audit.log('PROMO_CODE_DELETED', 'promo_code', id);

    return { message: 'Promo code deleted' };
  }

  // ──────────────────────────────────────────────
  // Redemption
  // ──────────────────────────────────────────────

  async redeem(userId: string, dto: RedeemPromoCodeDto) {
    const promoCode = await this.prisma.client.promoCode.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!promoCode) throw new NotFoundException('Promo code not found');

    // Validate active
    if (!promoCode.isActive) {
      throw new BadRequestException('Promo code is inactive');
    }

    // Validate time window
    const now = new Date();
    if (promoCode.validFrom && now < promoCode.validFrom) {
      throw new BadRequestException('Promo code is not yet valid');
    }
    if (promoCode.validTo && now > promoCode.validTo) {
      throw new BadRequestException('Promo code has expired');
    }

    // Atomic: validate usage limit + duplicate + create + increment
    const result = await this.prisma.client.$transaction(async (tx: any) => {
      // Re-read promo code inside transaction to get latest usedCount
      const fresh = await tx.promoCode.findUnique({ where: { id: promoCode.id } });
      if (!fresh) throw new NotFoundException('Promo code not found');

      if (fresh.usageLimit > 0 && fresh.usedCount >= fresh.usageLimit) {
        throw new BadRequestException('Promo code usage limit reached');
      }

      // Check duplicate redemption inside transaction
      const existing = await tx.promoRedemption.findUnique({
        where: {
          promoCodeId_userId: {
            promoCodeId: promoCode.id,
            userId,
          },
        },
      });
      if (existing) {
        throw new ConflictException('Promo code already redeemed by this user');
      }

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

    // Calculate discount (outside transaction — pure calc)
    let discount = 0;
    if (promoCode.type === 'PERCENT') {
      discount = (dto.purchaseAmount * Number(promoCode.value)) / 100;
    } else {
      discount = Number(promoCode.value);
    }

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

  async getUserRedemptions(userId: string, page = 1, limit = 50) {
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
}
