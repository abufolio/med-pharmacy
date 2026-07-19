import { Injectable } from '@nestjs/common';
import { AuditService, AuditEntry } from './audit.service';

/**
 * AuditHelper — convenience service for writing audit logs.
 *
 * Usage in any module:
 *   this.audit.log('CARD_ASSIGN', 'card', cardId, { oldVal }, { newVal });
 */
@Injectable()
export class AuditHelper {
  constructor(private readonly audit: AuditService) {}

  log(
    action: string,
    entity: string,
    entityId?: string,
    oldValue?: Record<string, unknown>,
    newValue?: Record<string, unknown>,
    metadata?: { actorType?: string; actorId?: string; ipAddress?: string },
  ): void {
    const entry: AuditEntry = {
      action,
      entity,
      entityId,
      oldValue,
      newValue,
      actorType: metadata?.actorType || 'system',
      actorId: metadata?.actorId,
      ipAddress: metadata?.ipAddress,
    };
    // Fire-and-forget — never blocks the caller
    this.audit.log(entry).catch(() => {});
  }
}
