import { PrismaService } from '@server/database';
import { CreateSettingDto, UpdateSettingDto } from './dto/settings.dto';
import { AuditHelper } from '../audit/audit.helper';
export declare class SettingsService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreateSettingDto): Promise<any>;
    findAll(scope?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByKey(key: string): Promise<any>;
    update(key: string, dto: UpdateSettingDto): Promise<any>;
    remove(key: string): Promise<{
        message: string;
    }>;
}
