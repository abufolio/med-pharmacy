import { PrismaService } from '@server/database';
export declare class ReportsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getDailyStats(pharmacyId: string, from?: string, to?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    getPharmacySummary(pharmacyId: string, from?: string, to?: string): Promise<{
        pharmacyId: string;
        period: {
            from: string;
            to: string;
        };
        days: any;
        totalTransactions: any;
        totalAmount: any;
        totalCashback: any;
        totalCustomers: any;
        avgTransactionAmount: any;
    }>;
    getAdminOverview(from?: string, to?: string): Promise<{
        period: {
            from: string;
            to: string;
        };
        totalTransactions: any;
        totalAmount: any;
        totalCashback: any;
        totalCustomers: any;
        activePharmacies: any;
        activeUsers: any;
        pendingWithdraws: any;
    }>;
    getTopPharmacies(limit?: number, from?: string, to?: string): Promise<any>;
    getTransactionReport(pharmacyId?: string, from?: string, to?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
