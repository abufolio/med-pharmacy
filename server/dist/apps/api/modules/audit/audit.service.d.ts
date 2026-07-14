import { PrismaService } from '@server/database';
export interface AuditEntry {
    actorType: string;
    actorId?: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValue?: Record<string, unknown>;
    newValue?: Record<string, unknown>;
    ipAddress?: string;
}
export declare class AuditService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    log(entry: AuditEntry): Promise<void>;
}
