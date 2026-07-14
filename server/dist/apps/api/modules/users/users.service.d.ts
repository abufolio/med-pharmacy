import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
export declare class UsersService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreateUserDto): Promise<any>;
    findAll(search?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findById(id: string): Promise<any>;
    findByPhone(phone: string): Promise<any>;
    update(id: string, dto: UpdateUserDto): Promise<any>;
    block(id: string): Promise<any>;
    unblock(id: string): Promise<any>;
}
