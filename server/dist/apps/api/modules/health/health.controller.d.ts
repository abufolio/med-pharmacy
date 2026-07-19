import { PrismaService } from '@server/database';
import { CacheService } from '@server/cache';
export declare class HealthController {
    private readonly prisma;
    private readonly cache;
    constructor(prisma: PrismaService, cache: CacheService);
    live(): {
        status: string;
        timestamp: string;
    };
    ready(): Promise<{
        status: string;
        checks: Record<string, string>;
        timestamp: string;
    }>;
    check(): Promise<{
        status: string;
        checks: Record<string, string>;
        timestamp: string;
    }>;
}
