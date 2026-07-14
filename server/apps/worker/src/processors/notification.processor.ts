import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { PrismaService } from '@server/database';
import { Queues, NotificationJob } from '@server/queue';

@Processor(Queues.NOTIFICATION)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async process(job: Job<NotificationJob>): Promise<void> {
    const { userId, type, message } = job.data;

    try {
      await this.prisma.client.notification.create({
        data: { userId, type, message },
      });
      this.logger.debug(`Notification created for user ${userId}: ${type}`);
    } catch (error) {
      this.logger.error(`Notification creation failed: ${error}`);
      throw error;
    }
  }
}
