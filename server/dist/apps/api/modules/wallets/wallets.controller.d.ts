import { WalletsService } from './wallets.service';
import { RequestWithdrawDto, ReviewWithdrawDto } from './dto/withdraw.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class WalletsController {
    private readonly wallets;
    constructor(wallets: WalletsService);
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
    getTransactions(userId: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    requestWithdraw(userId: string, dto: RequestWithdrawDto): Promise<any>;
    getWithdrawRequests(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    reviewWithdraw(id: string, user: AuthenticatedUser, dto: ReviewWithdrawDto): Promise<{
        message: string;
    }>;
}
