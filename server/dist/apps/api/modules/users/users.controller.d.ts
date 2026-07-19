import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    create(dto: CreateUserDto): Promise<{
        success: boolean;
        data: any;
    }>;
    findAll(search?: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
        success: boolean;
    }>;
    findByPhone(phone: string): Promise<{
        success: boolean;
        data: any;
    }>;
    findById(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    update(id: string, dto: UpdateUserDto): Promise<{
        success: boolean;
        data: any;
    }>;
    block(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
    unblock(id: string): Promise<{
        success: boolean;
        data: any;
    }>;
}
