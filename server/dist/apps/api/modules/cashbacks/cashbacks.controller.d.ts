import { CashbacksService } from './cashbacks.service';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class CashbacksController {
    private readonly cashbacks;
    constructor(cashbacks: CashbacksService);
    createRule(dto: CreateCashbackRuleDto, user: AuthenticatedUser): Promise<{
        success: boolean;
        data: any;
    }>;
    findAllRules(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findRuleById(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateRule(id: string, dto: UpdateCashbackRuleDto): Promise<{
        success: boolean;
        data: any;
    }>;
    removeRule(id: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    findUserCashbacks(userId: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
}
