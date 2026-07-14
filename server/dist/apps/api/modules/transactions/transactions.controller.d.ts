import { TransactionsService } from './transactions.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class TransactionsController {
    private readonly transactions;
    constructor(transactions: TransactionsService);
    create(dto: CreateTransactionDto, user: AuthenticatedUser): Promise<import("./dto/create-transaction.dto").TransactionResult>;
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    reverse(id: string): Promise<any>;
}
