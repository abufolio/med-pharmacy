import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateCardDto } from './dto/create-card.dto';
import { AssignCardDto, UnassignCardDto } from './dto/assign-card.dto';
import { ScanCardDto, ScanResponse } from './dto/scan-card.dto';

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  // ──────────────────────────────────────────────
  // Card CRUD
  // ──────────────────────────────────────────────

  async create(dto: CreateCardDto) {
    const existing = await this.prisma.client.card.findUnique({
      where: { uid: dto.uid },
    });
    if (existing) {
      throw new ConflictException('Card with this UID already exists');
    }

    const card = await this.prisma.client.card.create({
      data: { uid: dto.uid },
    });

    this.audit.log('CARD_CREATED', 'card', card.id, undefined, { uid: dto.uid });
    return card;
  }

  async findAll(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.client.card.findMany({
        skip,
        take: limit,
        include: {
          assignments: {
            where: { status: 'ACTIVE' },
            select: {
              user: { select: { id: true, firstName: true, lastName: true, phone: true } },
            },
          },
        },
        orderBy: { issuedAt: 'desc' },
      }),
      this.prisma.client.card.count(),
    ]);
    return { data, total, page, limit };
  }

  async findByUid(uid: string) {
    const card = await this.prisma.client.card.findUnique({
      where: { uid },
      include: {
        assignments: {
          where: { status: 'ACTIVE' },
          include: {
            user: { select: { id: true, firstName: true, lastName: true, phone: true } },
          },
        },
      },
    });
    if (!card) throw new NotFoundException('Card not found');
    return card;
  }

  async updateStatus(uid: string, status: 'BLOCKED' | 'ACTIVE') {
    const card = await this.prisma.client.card.findUnique({ where: { uid } });
    if (!card) throw new NotFoundException('Card not found');

    const updated = await this.prisma.client.card.update({
      where: { uid },
      data: { status },
    });

    this.audit.log(`CARD_${status}`, 'card', card.id, { status: card.status }, { status });
    return updated;
  }

  // ──────────────────────────────────────────────
  // Assignment
  // ──────────────────────────────────────────────

  async assignCard(dto: AssignCardDto) {
    const card = await this.prisma.client.card.findUnique({
      where: { uid: dto.cardUid },
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.status === 'BLOCKED') throw new BadRequestException('Card is blocked');
    if (card.status === 'REPLACED') throw new BadRequestException('Card is replaced');

    const user = await this.prisma.client.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'BLOCKED') throw new BadRequestException('User is blocked');

    // Check if card already has active assignment
    const activeAssignment = await this.prisma.client.cardAssignment.findFirst({
      where: { cardId: card.id, status: 'ACTIVE' },
    });
    if (activeAssignment) {
      throw new ConflictException('Card already has an active assignment');
    }

    // Atomic transaction
    const result = await this.prisma.client.$transaction(async (tx: any) => {
      const assignment = await tx.cardAssignment.create({
        data: { cardId: card.id, userId: user.id },
      });

      await tx.card.update({
        where: { id: card.id },
        data: { status: 'ACTIVE' },
      });

      if (user.status === 'PENDING_CARD') {
        await tx.user.update({
          where: { id: user.id },
          data: { status: 'ACTIVE' },
        });
      }

      return assignment;
    });

    this.audit.log('CARD_ASSIGNED', 'card', card.id, undefined, {
      userId: user.id, cardUid: dto.cardUid,
    });

    return result;
  }

  async unassignCard(dto: UnassignCardDto) {
    const card = await this.prisma.client.card.findUnique({
      where: { uid: dto.cardUid },
    });
    if (!card) throw new NotFoundException('Card not found');

    const activeAssignment = await this.prisma.client.cardAssignment.findFirst({
      where: { cardId: card.id, status: 'ACTIVE' },
    });
    if (!activeAssignment) {
      throw new BadRequestException('Card has no active assignment');
    }

    await this.prisma.client.$transaction(async (tx: any) => {
      await tx.cardAssignment.update({
        where: { id: activeAssignment.id },
        data: { status: 'UNASSIGNED', unassignedAt: new Date() },
      });
      await tx.card.update({
        where: { id: card.id },
        data: { status: 'UNASSIGNED' },
      });
    });

    this.audit.log('CARD_UNASSIGNED', 'card', card.id, undefined, {
      userId: activeAssignment.userId,
    });

    return { message: 'Card unassigned successfully' };
  }

  // ──────────────────────────────────────────────
  // NFC Scan — Idempotent
  // ──────────────────────────────────────────────

  async scan(dto: ScanCardDto): Promise<ScanResponse> {
    // 1. Idempotency check (5-second window)
    if (dto.idempotencyKey) {
      const cached = await this.prisma.client.idempotencyKey.findUnique({
        where: { key: dto.idempotencyKey },
      });
      if (cached && cached.expiresAt > new Date()) {
        return cached.response as unknown as ScanResponse;
      }
    }

    // 2. Find card
    const card = await this.prisma.client.card.findUnique({
      where: { uid: dto.cardUid },
    });
    if (!card) throw new NotFoundException('Card not found');
    if (card.status !== 'ACTIVE') throw new BadRequestException('Card is not active');

    // 3. Find active assignment → user
    const assignment = await this.prisma.client.cardAssignment.findFirst({
      where: { cardId: card.id, status: 'ACTIVE' },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
    });
    if (!assignment) {
      throw new BadRequestException('Card is not assigned to any user');
    }

    // 4. Build scan response
    const response: ScanResponse = {
      success: true,
      user: {
        id: assignment.user.id,
        firstName: assignment.user.firstName,
        lastName: assignment.user.lastName,
        phone: assignment.user.phone,
        balance: 0,
      },
      card: {
        uid: card.uid,
        status: card.status,
      },
    };

    // 5. Cache idempotency (5 seconds TTL)
    if (dto.idempotencyKey) {
      await this.prisma.client.idempotencyKey
        .create({
          data: {
            key: dto.idempotencyKey,
            response: response as any,
            expiresAt: new Date(Date.now() + 5000),
          },
        })
        .catch(() => this.logger.warn('Idempotency cache write failed'));
    }

    this.audit.log('NFC_SCAN', 'card', card.id, undefined, {
      pharmacyId: dto.pharmacyId,
      userId: assignment.user.id,
    });

    return response;
  }
}
