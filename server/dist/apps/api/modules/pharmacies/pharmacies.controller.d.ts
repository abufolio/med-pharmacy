import { PharmaciesService } from './pharmacies.service';
import { CreatePharmacyDto, UpdatePharmacyDto, UpdatePharmacyStatusDto, ChangePharmacyPasswordDto } from './dto/create-pharmacy.dto';
import { CreateRegionDto, CreateDistrictDto, UpdateRegionDto, UpdateDistrictDto } from './dto/region.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class PharmaciesController {
    private readonly pharmacies;
    constructor(pharmacies: PharmaciesService);
    createRegion(dto: CreateRegionDto): Promise<any>;
    getRegions(): Promise<any>;
    updateRegion(id: string, dto: UpdateRegionDto): Promise<any>;
    deleteRegion(id: string): Promise<{
        message: string;
    }>;
    createDistrict(dto: CreateDistrictDto): Promise<any>;
    getDistricts(regionId?: string): Promise<any>;
    updateDistrict(id: string, dto: UpdateDistrictDto): Promise<any>;
    deleteDistrict(id: string): Promise<{
        message: string;
    }>;
    create(dto: CreatePharmacyDto): Promise<any>;
    findAll(user: AuthenticatedUser, status?: string, page?: string, limit?: string): Promise<any>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdatePharmacyDto): Promise<any>;
    updateStatus(id: string, dto: UpdatePharmacyStatusDto): Promise<any>;
    changePassword(id: string, dto: ChangePharmacyPasswordDto): Promise<{
        message: string;
    }>;
    createCashbackRule(pharmacyId: string, dto: CreateCashbackRuleDto): Promise<any>;
    getCashbackRules(pharmacyId: string): Promise<any>;
    updateCashbackRule(ruleId: string, dto: UpdateCashbackRuleDto): Promise<any>;
    deleteCashbackRule(ruleId: string): Promise<{
        message: string;
    }>;
}
