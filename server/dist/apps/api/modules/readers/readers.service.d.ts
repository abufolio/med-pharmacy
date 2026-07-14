import { PrismaService } from '@server/database';
import { CreateReaderDto, PingReaderDto } from './dto/create-reader.dto';
export declare class ReadersService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    create(dto: CreateReaderDto, pharmacyId: string): Promise<any>;
    findAll(pharmacyId?: string, page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    ping(dto: PingReaderDto): Promise<any>;
    updateStatus(serialNumber: string, status: 'ONLINE' | 'OFFLINE' | 'FAULTY'): Promise<any>;
}
