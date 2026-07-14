import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateReferralDto, UpdateReferralDto } from './dto/referrals.dto';

@Injectable()
export class ReferralsService {
  private readonly logger = new Logger(ReferralsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(referrerId: string, dto: CreateReferralDto) {
    // Cannot refer yourself
    if (referrerId === dto.referredId) {
      throw new ConflictException('Cannot refer yourself');
    }

    // Check referred user exists
    const referred = await this.prisma.client.user.findUnique({
      where: { id: dto.referredId },
    });
    if (!referred) throw new NotFoundException('Referred user not found');

    // Check no duplicate referral
    const existing = await this.prisma.client.referral.findUnique({
      where: { referredId: dto.referredId },
    });
    if (existing) throw new ConflictException('User already referred');

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

  async findByReferrer(referrerId: string, page = 1, limit = 50) {
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

  async findByReferred(referredId: string) {
    const referral = await this.prisma.client.referral.findUnique({
      where: { referredId },
      include: {
        referrer: { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
    });
    if (!referral) throw new NotFoundException('Referral not found');
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

  async update(id: string, dto: UpdateReferralDto) {
    const referral = await this.prisma.client.referral.findUnique({ where: { id } });
    if (!referral) throw new NotFoundException('Referral not found');

    const data: any = {};
    if (dto.status) data.status = dto.status;
    if (dto.bonusAmount !== undefined) data.bonusAmount = dto.bonusAmount;

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

  async getReferralStats(referrerId: string) {
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
}
