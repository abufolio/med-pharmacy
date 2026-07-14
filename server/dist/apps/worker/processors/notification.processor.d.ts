import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@server/database';
import { NotificationJob } from '@server/queue';
export declare class NotificationProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<NotificationJob>): Promise<void>;
}
