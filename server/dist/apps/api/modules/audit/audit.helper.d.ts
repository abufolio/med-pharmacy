import { EventBus } from '@server/events';
export declare class AuditHelper {
    private readonly eventBus;
    constructor(eventBus: EventBus);
    log(action: string, entity: string, entityId?: string, oldValue?: Record<string, unknown>, newValue?: Record<string, unknown>, metadata?: {
        actorType?: string;
        actorId?: string;
        ipAddress?: string;
    }): void;
}
