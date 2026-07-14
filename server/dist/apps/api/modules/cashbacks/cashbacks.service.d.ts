import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
export declare class CashbacksService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    createRule(dto: CreateCashbackRuleDto, pharmacyId: string): Promise<any>;
    findAllRules(pharmacyId?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findRuleById(id: string): Promise<any>;
    updateRule(id: string, dto: UpdateCashbackRuleDto): Promise<any>;
    removeRule(id: string): Promise<{
        message: string;
    }>;
    findUserCashbacks(userId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
