import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { RequestWithdrawDto, ReviewWithdrawDto } from './dto/withdraw.dto';
export declare class WalletsService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    getBalance(userId: string): Promise<{
        balance: number;
        userId: string;
        id?: undefined;
        createdAt?: undefined;
        updatedAt?: undefined;
    } | {
        id: any;
        userId: any;
        balance: any;
        createdAt: any;
        updatedAt: any;
    }>;
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    requestWithdraw(userId: string, dto: RequestWithdrawDto): Promise<any>;
    getWithdrawRequests(userId?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    reviewWithdraw(id: string, reviewerId: string, dto: ReviewWithdrawDto): Promise<{
        message: string;
    }>;
}
