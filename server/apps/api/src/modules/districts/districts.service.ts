import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';
import { CreateDistrictDto, UpdateDistrictDto } from './dto/districts.dto';
import { AuditHelper } from '../audit/audit.helper';

@Injectable()
export class DistrictsService {
  private readonly logger = new Logger(DistrictsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(dto: CreateDistrictDto) {
    // Verify region exists
    const region = await this.prisma.client.region.findFirst({
      where: { id: dto.regionId, deletedAt: null },
    });
    if (!region) throw new NotFoundException('Region not found');

    const district = await this.prisma.client.district.create({
      data: { name: dto.name, regionId: dto.regionId },
      include: { region: { select: { id: true, name: true } } },
    });

    this.audit.log('DISTRICT_CREATED', 'district', district.id, undefined, { name: dto.name, regionId: dto.regionId });

    return district;
  }

  async findAll(regionId?: string, page = 1, limit = 100) {
    const where: any = { deletedAt: null };
    if (regionId) where.regionId = regionId;

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.district.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: { region: { select: { id: true, name: true } } },
      }),
      this.prisma.client.district.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findById(id: string) {
    const district = await this.prisma.client.district.findFirst({
      where: { id, deletedAt: null },
      include: { region: { select: { id: true, name: true } } },
    });
    if (!district) throw new NotFoundException('District not found');
    return district;
  }

  async update(id: string, dto: UpdateDistrictDto) {
    const district = await this.prisma.client.district.findFirst({
      where: { id, deletedAt: null },
    });
    if (!district) throw new NotFoundException('District not found');

    if (dto.regionId) {
      const region = await this.prisma.client.region.findFirst({
        where: { id: dto.regionId, deletedAt: null },
      });
      if (!region) throw new NotFoundException('Region not found');
    }

    const updated = await this.prisma.client.district.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.regionId !== undefined && { regionId: dto.regionId }),
      },
      include: { region: { select: { id: true, name: true } } },
    });

    this.audit.log('DISTRICT_UPDATED', 'district', id, { name: district.name }, { ...dto });

    return updated;
  }

  async remove(id: string) {
    const district = await this.prisma.client.district.findFirst({
      where: { id, deletedAt: null },
    });
    if (!district) throw new NotFoundException('District not found');

    // Soft delete — set deletedAt timestamp
    await this.prisma.client.district.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.audit.log('DISTRICT_DELETED', 'district', id);

    return { message: 'District deleted' };
  }
}
