export declare class CreateTransactionDto {
    userId: string;
    pharmacyId: string;
    employeeId?: string;
    cardUid?: string;
    amount: number;
    idempotencyKey?: string;
}
export interface TransactionResult {
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
}
