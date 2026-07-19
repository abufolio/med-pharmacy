import { PromocodesService } from './promocodes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, RedeemPromoCodeDto } from './dto/promocodes.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class PromocodesController {
    private readonly promocodes;
    constructor(promocodes: PromocodesService);
    create(dto: CreatePromoCodeDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findByCode(code: string): Promise<{
        success: boolean;
        data: any;
    }>;
    findById(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(id: string, dto: UpdatePromoCodeDto): Promise<{
        success: boolean;
        data: any;
    }>;
    remove(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    redeem(dto: RedeemPromoCodeDto, user: AuthenticatedUser): Promise<{
        success: boolean;
        data: {
            redemption: any;
            discount: number;
            code: any;
            type: any;
        };
    }>;
    getUserRedemptions(userId: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
}
