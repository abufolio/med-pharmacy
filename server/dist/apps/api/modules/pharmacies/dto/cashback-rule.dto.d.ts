export declare class CreateCashbackRuleDto {
    type: 'PERCENT' | 'FIXED' | 'CAMPAIGN';
    value: number;
    minPurchase?: number;
    maxCashback?: number;
    isActive?: boolean;
    validFrom?: string;
    validTo?: string;
}
export declare class UpdateCashbackRuleDto {
    type?: 'PERCENT' | 'FIXED' | 'CAMPAIGN';
    value?: number;
    minPurchase?: number;
    maxCashback?: number;
    isActive?: boolean;
    validFrom?: string;
    validTo?: string;
}
