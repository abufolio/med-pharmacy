import { ReportsService } from './reports.service';
import { ReportsQueryDto } from './dto/reports.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class ReportsController {
    private readonly reports;
    constructor(reports: ReportsService);
    getDailyStats(user: AuthenticatedUser, query: ReportsQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    getPharmacySummary(user: AuthenticatedUser, query: ReportsQueryDto): Promise<{
        success: boolean;
        message: string;
        data?: undefined;
    } | {
        success: boolean;
        data: {
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
        };
        message?: undefined;
    }>;
    getAdminOverview(query: ReportsQueryDto): Promise<{
        success: boolean;
        data: {
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
        };
    }>;
    getTopPharmacies(limit?: string, from?: string, to?: string): Promise<{
        success: boolean;
        data: any;
    }>;
    getTransactionReport(user: AuthenticatedUser, query: ReportsQueryDto): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
}
