import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
export declare class UsersController {
    private readonly users;
    constructor(users: UsersService);
    create(dto: CreateUserDto): Promise<any>;
    findAll(search?: string, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByPhone(phone: string): Promise<any>;
    findById(id: string): Promise<any>;
    update(id: string, dto: UpdateUserDto): Promise<any>;
    block(id: string): Promise<any>;
    unblock(id: string): Promise<any>;
}
