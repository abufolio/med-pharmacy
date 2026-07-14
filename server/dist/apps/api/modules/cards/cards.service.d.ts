import { PrismaService } from '@server/database';
import { AuditHelper } from '../audit/audit.helper';
import { CreateCardDto } from './dto/create-card.dto';
import { AssignCardDto, UnassignCardDto } from './dto/assign-card.dto';
import { ScanCardDto, ScanResponse } from './dto/scan-card.dto';
export declare class CardsService {
    private readonly prisma;
    private readonly audit;
    private readonly logger;
    constructor(prisma: PrismaService, audit: AuditHelper);
    create(dto: CreateCardDto): Promise<any>;
    findAll(page?: number, limit?: number): Promise<{
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
    findByUid(uid: string): Promise<any>;
    updateStatus(uid: string, status: 'BLOCKED' | 'ACTIVE'): Promise<any>;
    assignCard(dto: AssignCardDto): Promise<any>;
    unassignCard(dto: UnassignCardDto): Promise<{
        message: string;
    }>;
    scan(dto: ScanCardDto): Promise<ScanResponse>;
}
