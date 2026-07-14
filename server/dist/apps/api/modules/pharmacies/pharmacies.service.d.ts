import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreatePharmacyDto, UpdatePharmacyDto, UpdatePharmacyStatusDto, ChangePharmacyPasswordDto } from './dto/create-pharmacy.dto';
import { CreateRegionDto, CreateDistrictDto, UpdateRegionDto, UpdateDistrictDto } from './dto/region.dto';
import { CreateCashbackRuleDto, UpdateCashbackRuleDto } from './dto/cashback-rule.dto';
export declare class PharmaciesService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
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
    findAll(status?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
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
