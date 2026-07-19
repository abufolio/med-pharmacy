import { ReadersService } from './readers.service';
import { CreateReaderDto, PingReaderDto } from './dto/create-reader.dto';
import { AuthenticatedUser } from '../auth/guards/current-user.decorator';
export declare class ReadersController {
    private readonly readers;
    constructor(readers: ReadersService);
    create(dto: CreateReaderDto, user: AuthenticatedUser): Promise<{
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
    ping(dto: PingReaderDto): Promise<any>;
    updateStatus(serialNumber: string, status: 'ONLINE' | 'OFFLINE' | 'FAULTY'): Promise<{
        success: boolean;
        data: any;
    }>;
}
