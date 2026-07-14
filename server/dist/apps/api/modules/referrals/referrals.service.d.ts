import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateReferralDto, UpdateReferralDto } from './dto/referrals.dto';
export declare class ReferralsService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(referrerId: string, dto: CreateReferralDto): Promise<any>;
    findByReferrer(referrerId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByReferred(referredId: string): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    update(id: string, dto: UpdateReferralDto): Promise<any>;
    getReferralStats(referrerId: string): Promise<{
        total: any;
        completed: any;
        pending: any;
        totalBonus: any;
    }>;
}
