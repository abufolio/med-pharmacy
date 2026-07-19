import { Injectable, NotFoundException, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';
import { CreateRegionDto, UpdateRegionDto } from './dto/regions.dto';
import { AuditHelper } from '../audit/audit.helper';

@Injectable()
export class RegionsService {
  private readonly logger = new Logger(RegionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(dto: CreateRegionDto) {
    const existing = await this.prisma.client.region.findUnique({
      where: { code: dto.code },
    });
    if (existing) {
      throw new ConflictException('Region with this code already exists');
    }

    const region = await this.prisma.client.region.create({
      data: { name: dto.name, code: dto.code },
    });

    this.audit.log('REGION_CREATED', 'region', region.id, undefined, { name: dto.name });

    return region;
  }

  async findAll(page = 1, limit = 100) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null as Date | null };

    const [data, total] = await Promise.all([
      this.prisma.client.region.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          districts: {
            where: { deletedAt: null },
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.client.region.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const region = await this.prisma.client.region.findFirst({
      where: { id, deletedAt: null },
      include: {
        districts: {
          where: { deletedAt: null },
          select: { id: true, name: true },
        },
      },
    });
    if (!region) throw new NotFoundException('Region not found');
    return region;
  }

  async update(id: string, dto: UpdateRegionDto) {
    const region = await this.prisma.client.region.findFirst({
      where: { id, deletedAt: null },
    });
    if (!region) throw new NotFoundException('Region not found');

    if (dto.code && dto.code !== region.code) {
      const existing = await this.prisma.client.region.findUnique({
        where: { code: dto.code },
      });
      if (existing) {
        throw new ConflictException('Region with this code already exists');
      }
    }

    const updated = await this.prisma.client.region.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.code !== undefined && { code: dto.code }),
      },
    });

    this.audit.log('REGION_UPDATED', 'region', id, { name: region.name }, { ...dto });

    return updated;
  }

  async remove(id: string) {
    const region = await this.prisma.client.region.findFirst({
      where: { id, deletedAt: null },
    });
    if (!region) throw new NotFoundException('Region not found');

    // Soft delete — set deletedAt timestamp
    await this.prisma.client.region.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.audit.log('REGION_DELETED', 'region', id);

    return { message: 'Region deleted' };
  }
}
