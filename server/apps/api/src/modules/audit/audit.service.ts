import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';

export interface AuditEntry {
  actorType: string;   // employee | user | system | pharmacy
  actorId?: string;
  action: string;      // LOGIN | CARD_ASSIGN | CASHBACK_CALC | ...
  entity: string;      // user | card | transaction | cashback_rule | ...
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Write an audit log entry asynchronously.
   * Never throws — audit failure must never break the main flow.
   */
  async log(entry: AuditEntry): Promise<void> {
    try {
      await this.prisma.client.auditLog.create({
        data: {
          actorType: entry.actorType,
          actorId: entry.actorId,
          action: entry.action,
          entity: entry.entity,
          entityId: entry.entityId,
          oldValue: entry.oldValue ? JSON.parse(JSON.stringify(entry.oldValue)) : undefined,
          newValue: entry.newValue ? JSON.parse(JSON.stringify(entry.newValue)) : undefined,
          ipAddress: entry.ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to write audit log: ${error instanceof Error ? error.message : error}`,
      );
    }
  }
}
