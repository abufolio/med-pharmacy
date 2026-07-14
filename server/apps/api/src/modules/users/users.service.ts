import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.client.user.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('User with this phone already exists');
    }

    const data: any = {
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      language: dto.language || 'uz',
    };

    if (dto.telegramId) {
      data.telegramId = BigInt(dto.telegramId);
    }

    const user = await this.prisma.client.user.create({
      data,
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        telegramId: true, language: true, status: true, createdAt: true,
      },
    });

    this.audit.log('USER_CREATED', 'user', user.id, undefined, { phone: dto.phone });

    return user;
  }

  async findAll(search?: string, page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.client.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true, firstName: true, lastName: true, phone: true,
          telegramId: true, language: true, status: true, createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.user.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { id },
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        telegramId: true, language: true, status: true, createdAt: true, updatedAt: true,
        wallet: { select: { balance: true } },
        transactions: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          select: { id: true, amount: true, status: true, createdAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByPhone(phone: string) {
    const user = await this.prisma.client.user.findUnique({
      where: { phone },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');

    const data: any = { ...dto };
    if (dto.phone) {
      const existing = await this.prisma.client.user.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Phone already in use');
      }
    }

    const updated = await this.prisma.client.user.update({
      where: { id },
      data,
      select: {
        id: true, firstName: true, lastName: true, phone: true,
        telegramId: true, language: true, status: true, updatedAt: true,
      },
    });

    this.audit.log('USER_UPDATED', 'user', id, { ...user }, { ...dto });

    return updated;
  }

  async block(id: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status === 'BLOCKED') throw new ConflictException('User already blocked');

    const updated = await this.prisma.client.user.update({
      where: { id },
      data: { status: 'BLOCKED' },
      select: {
        id: true, firstName: true, lastName: true, phone: true, status: true,
      },
    });

    this.audit.log('USER_BLOCKED', 'user', id);

    return updated;
  }

  async unblock(id: string) {
    const user = await this.prisma.client.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    if (user.status !== 'BLOCKED') throw new ConflictException('User is not blocked');

    const updated = await this.prisma.client.user.update({
      where: { id },
      data: { status: 'ACTIVE' },
    });

    this.audit.log('USER_UNBLOCKED', 'user', id);

    return updated;
  }
}
