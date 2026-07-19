import { AuditService } from './audit.service';
export declare class AuditHelper {
    private readonly audit;
    constructor(audit: AuditService);
    log(action: string, entity: string, entityId?: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>, metadata?: {
        actorType?: string;
        actorId?: string;
        ipAddress?: string;
    }): void;
}
