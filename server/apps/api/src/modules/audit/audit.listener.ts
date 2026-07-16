import { Injectable, Logger, OnModuleInit, Optional } from '@nestjs/common';
import { EventBus, Events, AppEvent } from '@server/events';
import { AuditService, AuditEntry } from './audit.service';

@Injectable()
export class AuditListener implements OnModuleInit {
  private readonly logger = new Logger(AuditListener.name);

  constructor(
    @Optional() private readonly eventBus?: EventBus,
    private readonly audit?: AuditService,
  ) {}

  onModuleInit() {
    if (!this.eventBus) {
      this.logger.warn('⚠️ EventBus not available — audit listener disabled');
      return;
    }

    // Subscribe to ALL audit events
    this.eventBus.on$<AuditEntry>(Events.AUDIT_ACTION).subscribe({
      next: (event) => this.handleAuditEvent(event),
      error: (err) => this.logger.error(`Audit event error: ${err}`),
    });

    this.logger.log('🎧 Audit listener active');
  }

  private async handleAuditEvent(event: AppEvent<AuditEntry>) {
    if (!this.audit) return;

    const { payload, metadata } = event;

    await this.audit.log({
      ...payload,
      actorType: payload.actorType || metadata.actorType || 'system',
      actorId: payload.actorId || metadata.actorId,
    });
  }
}
