export declare class CreatePromoCodeDto {
    code: string;
    type: 'PERCENT' | 'FIXED';
    value: number;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
}
export declare class UpdatePromoCodeDto {
    type?: 'PERCENT' | 'FIXED';
    value?: number;
    usageLimit?: number;
    validFrom?: string;
    validTo?: string;
    isActive?: boolean;
}
export declare class RedeemPromoCodeDto {
    code: string;
    purchaseAmount: number;
}
