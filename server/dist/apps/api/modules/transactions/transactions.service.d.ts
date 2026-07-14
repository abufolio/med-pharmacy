import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateTransactionDto, TransactionResult } from './dto/create-transaction.dto';
export declare class TransactionsService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreateTransactionDto): Promise<TransactionResult>;
    private calculateCashback;
    findAll(pharmacyId?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    reverseTransaction(id: string): Promise<any>;
}
