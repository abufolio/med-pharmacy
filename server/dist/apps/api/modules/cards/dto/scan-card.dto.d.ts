export declare class ScanCardDto {
    cardUid: string;
    pharmacyId: string;
    serialNumber?: string;
    idempotencyKey?: string;
}
export interface ScanResponse {
    success: boolean;
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        phone: string;
        balance: number;
    };
    card: {
        uid: string;
        status: string;
    };
    transaction?: {
        id: string;
        amount: number;
        cashback: number;
        status: string;
    };
}
