import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { EventBus, Events, AppEvent } from '@server/events';
import { AuditService, AuditEntry } from './audit.service';

@Injectable()
export class AuditListener implements OnModuleInit {
  private readonly logger = new Logger(AuditListener.name);

  constructor(
    private readonly eventBus: EventBus,
    private readonly audit: AuditService,
  ) {}

  onModuleInit() {
    // Subscribe to ALL audit events
    this.eventBus.on$<AuditEntry>(Events.AUDIT_ACTION).subscribe({
      next: (event) => this.handleAuditEvent(event),
    });

    this.logger.log('🎧 Audit listener active');
  }

  private async handleAuditEvent(event: AppEvent<AuditEntry>) {
    const { payload, metadata } = event;

    await this.audit.log({
      ...payload,
      actorType: payload.actorType || metadata.actorType || 'system',
      actorId: payload.actorId || metadata.actorId,
    });
  }
}
