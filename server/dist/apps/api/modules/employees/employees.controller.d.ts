import { EmployeesService } from './employees.service';
import { CreateEmployeeDto, UpdateEmployeeDto } from './dto/employee.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class EmployeesController {
    private readonly employees;
    constructor(employees: EmployeesService);
    create(dto: CreateEmployeeDto, user: AuthenticatedUser): Promise<any>;
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdateEmployeeDto): Promise<any>;
    suspend(id: string): Promise<any>;
    activate(id: string): Promise<any>;
}
