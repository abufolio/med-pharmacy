import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { TelegramJob } from '@server/queue';
export declare class TelegramProcessor extends WorkerHost {
    private readonly bot;
    private readonly logger;
    constructor();
    process(job: Job<TelegramJob>): Promise<void>;
}
