import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';
import { Queues, AuditJob } from '@server/queue';

@Processor(Queues.AUDIT)
export class AuditProcessor extends WorkerHost {
  private readonly logger = new Logger(AuditProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<AuditJob>): Promise<void> {
    const { actorType, actorId, action, entity, entityId, oldValue, newValue, ipAddress } = job.data;

    try {
      await this.prisma.client.auditLog.create({
        data: {
          actorType: actorType || 'system',
          actorId,
          action,
          entity,
          entityId,
          oldValue: oldValue ?? undefined,
          newValue: newValue ?? undefined,
          ipAddress,
        },
      });
    } catch (error) {
      this.logger.error(`Audit write failed: ${error}`);
      throw error; // BullMQ will retry
    }
  }
}
