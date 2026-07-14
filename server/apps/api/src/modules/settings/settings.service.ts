import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@server/database';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';
import { AuditHelper } from '../audit/audit.helper';

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditHelper,
  ) {}

  async create(dto: CreateSettingDto) {
    const existing = await this.prisma.client.setting.findUnique({
      where: { key: dto.key },
    });
    if (existing) {
      throw new ConflictException('Setting with this key already exists');
    }

    const setting = await this.prisma.client.setting.create({
      data: {
        key: dto.key,
        value: dto.value,
        scope: dto.scope,
      },
    });

    this.audit.log('SETTING_CREATED', 'setting', setting.id, undefined, { key: dto.key });

    return setting;
  }

  async findAll(scope?: string, page = 1, limit = 50) {
    const where: any = {};
    if (scope) where.scope = scope;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.prisma.client.setting.findMany({
        where,
        skip,
        take: limit,
        orderBy: { key: 'asc' },
      }),
      this.prisma.client.setting.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async findByKey(key: string) {
    const setting = await this.prisma.client.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Setting not found');
    return setting;
  }

  async update(key: string, dto: UpdateSettingDto) {
    const setting = await this.prisma.client.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Setting not found');

    const updated = await this.prisma.client.setting.update({
      where: { key },
      data: {
        value: dto.value,
        ...(dto.scope !== undefined && { scope: dto.scope }),
      },
    });

    this.audit.log('SETTING_UPDATED', 'setting', setting.id, { ...setting }, { ...dto });

    return updated;
  }

  async remove(key: string) {
    const setting = await this.prisma.client.setting.findUnique({ where: { key } });
    if (!setting) throw new NotFoundException('Setting not found');

    await this.prisma.client.setting.delete({ where: { key } });

    this.audit.log('SETTING_DELETED', 'setting', setting.id);

    return { message: 'Setting deleted' };
  }
}
