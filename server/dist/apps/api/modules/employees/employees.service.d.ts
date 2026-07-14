import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
export declare class EmployeesService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreateEmployeeDto, pharmacyId: string): Promise<any>;
    findAll(pharmacyId: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdateEmployeeDto): Promise<any>;
    toggleStatus(id: string, status: 'ACTIVE' | 'SUSPENDED'): Promise<any>;
}
