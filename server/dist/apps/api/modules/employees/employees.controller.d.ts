import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class EmployeesController {
    private readonly employees;
    constructor(employees: EmployeesService);
    create(dto: CreateEmployeeDto, user: AuthenticatedUser): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
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
    update(id: string, dto: UpdateEmployeeDto): Promise<{
        success: boolean;
        data: any;
    }>;
    suspend(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    activate(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
