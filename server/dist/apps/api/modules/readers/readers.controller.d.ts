import { ReadersService } from './readers.service';
import { CreateReaderDto, PingReaderDto } from './dto/create-reader.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class ReadersController {
    private readonly readers;
    constructor(readers: ReadersService);
    create(dto: CreateReaderDto, user: AuthenticatedUser): Promise<any>;
    findAll(user: AuthenticatedUser, page?: string, limit?: string): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    ping(dto: PingReaderDto): Promise<any>;
    updateStatus(serialNumber: string, status: 'ONLINE' | 'OFFLINE' | 'FAULTY'): Promise<any>;
}
