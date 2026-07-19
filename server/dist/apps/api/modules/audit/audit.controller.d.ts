import { PrismaService } from '@server/database';
export declare class AuditController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findAll(page?: string, limit?: string): Promise<{
        success: boolean;
        data: any;
        total: any;
        page: number;
        limit: number;
    }>;
}
