import { ReferralsService } from './referrals.service';
import { CreateReferralDto, UpdateReferralDto } from './dto/referrals.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class ReferralsController {
    private readonly referrals;
    constructor(referrals: ReferralsService);
    create(dto: CreateReferralDto, user: AuthenticatedUser): Promise<{
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
    myReferrals(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    myStats(user: AuthenticatedUser): Promise<{
        success: boolean;
        data: {
            total: any;
            completed: any;
            pending: any;
            totalBonus: any;
        };
    }>;
    findByReferred(referredId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(id: string, dto: UpdateReferralDto): Promise<{
        success: boolean;
        data: any;
    }>;
}
