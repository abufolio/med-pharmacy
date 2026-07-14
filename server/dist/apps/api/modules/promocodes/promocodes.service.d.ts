import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreatePromoCodeDto, UpdatePromoCodeDto, RedeemPromoCodeDto } from './dto/promocodes.dto';
export declare class PromocodesService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreatePromoCodeDto): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    findByCode(code: string): Promise<any>;
    update(id: string, dto: UpdatePromoCodeDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    redeem(userId: string, dto: RedeemPromoCodeDto): Promise<{
        redemption: any;
        discount: number;
        code: any;
        type: any;
    }>;
    getUserRedemptions(userId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
