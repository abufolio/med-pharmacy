import { Injectable } from '@nestjs/common';
import { EventBus, Events } from '@server/events';

/**
 * AuditHelper — convenience service for emitting audit events.
 *
 * Usage in any module:
 *   this.audit.log('CARD_ASSIGN', 'card', cardId, { oldVal }, { newVal });
 */
@Injectable()
export class AuditHelper {
  constructor(private readonly eventBus: EventBus) {}

  log(
    action: string,
    entity: string,
    entityId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    metadata?: { actorType?: string; actorId?: string; ipAddress?: string },
  ): void {
    this.eventBus.emit(Events.AUDIT_ACTION, {
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      ...metadata,
    });
  }
}
