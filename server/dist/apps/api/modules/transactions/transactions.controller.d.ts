import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class TransactionsController {
    private readonly transactions;
    constructor(transactions: TransactionsService);
    create(dto: CreateTransactionDto, user: AuthenticatedUser): Promise<{
        transaction: {
            id: string;
            amount: number;
            status: string;
        };
        cashback: {
            id: string;
            amount: number;
            ruleType: string;
            ruleValue: number;
        } | null;
        wallet: {
            id: string;
            balance: number;
            previousBalance: number;
        };
        success: boolean;
    }>;
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findById(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    reverse(id: string): Promise<any>;
}
