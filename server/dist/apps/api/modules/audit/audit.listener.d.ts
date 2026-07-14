import { OnModuleInit } from '@nestjs/common';
import { EventBus } from '@server/events';
import { AuditService } from './audit.service';
export declare class AuditListener implements OnModuleInit {
    private readonly eventBus;
    private readonly audit;
    private readonly logger;
    constructor(eventBus: EventBus, audit: AuditService);
    onModuleInit(): void;
    private handleAuditEvent;
}
