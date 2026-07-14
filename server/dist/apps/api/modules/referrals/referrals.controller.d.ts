import { ReferralsService } from './referrals.service';
import { CreateReferralDto, UpdateReferralDto } from './dto/referrals.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class ReferralsController {
    private readonly referrals;
    constructor(referrals: ReferralsService);
    create(dto: CreateReferralDto, user: AuthenticatedUser): Promise<any>;
    findAll(page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    myReferrals(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    myStats(user: AuthenticatedUser): Promise<{
        total: any;
        completed: any;
        pending: any;
        totalBonus: any;
    }>;
    findByReferred(referredId: string): Promise<any>;
    update(id: string, dto: UpdateReferralDto): Promise<any>;
}
