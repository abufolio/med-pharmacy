import { CashbackType } from '@prisma/client';
export declare class CreateCashbackRuleDto {
    type: CashbackType;
    value: number;
    minPurchase?: number;
    maxCashback?: number;
    isActive?: boolean;
    validFrom?: string;
    validTo?: string;
}
export declare class UpdateCashbackRuleDto {
    type?: CashbackType;
    value?: number;
    minPurchase?: number;
    maxCashback?: number;
    isActive?: boolean;
    validFrom?: string;
    validTo?: string;
}
