export declare class RequestWithdrawDto {
    amount: number;
    description?: string;
}
export declare class ReviewWithdrawDto {
    status: 'APPROVED' | 'REJECTED' | 'PAID';
    reason?: string;
}
