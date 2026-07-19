import { PharmaciesService } from './pharmacies.service';
import { CreatePharmacyDto, UpdatePharmacyDto, UpdatePharmacyStatusDto, ChangePharmacyPasswordDto } from './dto/create-pharmacy.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class PharmaciesController {
    private readonly pharmacies;
    constructor(pharmacies: PharmaciesService);
    create(dto: CreatePharmacyDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(user: AuthenticatedUser, status?: string, page?: string, limit?: string): Promise<{
        success: boolean;
        data: any;
    } | {
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findById(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(id: string, dto: UpdatePharmacyDto): Promise<{
        success: boolean;
        data: any;
    }>;
    updateStatus(id: string, dto: UpdatePharmacyStatusDto): Promise<{
        success: boolean;
        data: any;
    }>;
    changePassword(id: string, dto: ChangePharmacyPasswordDto): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
    createCashbackRule(pharmacyId: string, dto: CreateCashbackRuleDto): Promise<{
        success: boolean;
        data: any;
    }>;
    getCashbackRules(pharmacyId: string): Promise<{
        success: boolean;
        data: any;
    }>;
    updateCashbackRule(ruleId: string, dto: UpdateCashbackRuleDto): Promise<{
        success: boolean;
        data: any;
    }>;
    deleteCashbackRule(ruleId: string): Promise<{
        success: boolean;
        data: {
            message: string;
        };
    }>;
}
