import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { PrismaService } from '@server/database';
import { CashbackJob } from '@server/queue';
export declare class CashbackProcessor extends WorkerHost {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    process(job: Job<CashbackJob>): Promise<void>;
}
