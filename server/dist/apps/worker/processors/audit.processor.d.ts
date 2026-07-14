import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@server/database';
import { AuditJob } from '@server/queue';
export declare class AuditProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<AuditJob>): Promise<void>;
}
