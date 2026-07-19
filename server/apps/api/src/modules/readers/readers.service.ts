import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { CreateReaderDto, PingReaderDto } from './dto/create-reader.dto';

@Injectable()
export class ReadersService {
  private readonly logger = new Logger(ReadersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateReaderDto, pharmacyId: string) {
    const existing = await this.prisma.client.reader.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (existing) {
      throw new ConflictException('Reader with this serial number already exists');
    }

    return this.prisma.client.reader.create({
      data: {
        serialNumber: dto.serialNumber,
        model: dto.model,
        pharmacyId,
      },
    });
  }

  async findAll(pharmacyId?: string, page = 1, limit = 50) {
    const where = pharmacyId ? { pharmacyId } : {};
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.client.reader.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.reader.count({ where }),
    ]);
    return { data, total, page, limit };
  }

  async ping(dto: PingReaderDto) {
    const reader = await this.prisma.client.reader.findUnique({
      where: { serialNumber: dto.serialNumber },
    });
    if (!reader) throw new NotFoundException('Reader not found');

    const updated = await this.prisma.client.reader.update({
      where: { serialNumber: dto.serialNumber },
      data: {
        lastPingAt: new Date(),
        status: 'ONLINE',
      },
    });

    return updated;
  }

  async updateStatus(
    serialNumber: string,
    status: 'ONLINE' | 'OFFLINE' | 'FAULTY',
    userPharmacyId?: string,
    userScope?: string,
  ) {
    const reader = await this.prisma.client.reader.findUnique({
      where: { serialNumber },
    });
    if (!reader) throw new NotFoundException('Reader not found');

    // PHARMACY_ADMIN can only update readers in their own pharmacy
    if (userScope !== 'SUPER_ADMIN' && reader.pharmacyId !== userPharmacyId) {
      throw new NotFoundException('Reader not found');
    }

    return this.prisma.client.reader.update({
      where: { serialNumber },
      data: { status },
    });
  }
}
