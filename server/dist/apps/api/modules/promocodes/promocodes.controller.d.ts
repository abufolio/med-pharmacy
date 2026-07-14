import { PromocodesService } from './promocodes.service';
import { CreatePromoCodeDto, UpdatePromoCodeDto, RedeemPromoCodeDto } from './dto/promocodes.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class PromocodesController {
    private readonly promocodes;
    constructor(promocodes: PromocodesService);
    create(dto: CreatePromoCodeDto): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByCode(code: string): Promise<any>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdatePromoCodeDto): Promise<any>;
    remove(id: string): Promise<{
        message: string;
    }>;
    redeem(dto: RedeemPromoCodeDto, user: AuthenticatedUser): Promise<{
        redemption: any;
        discount: number;
        code: any;
        type: any;
    }>;
    getUserRedemptions(userId: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
