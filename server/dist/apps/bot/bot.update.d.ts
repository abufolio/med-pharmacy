import { ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { PrismaService } from '@server/database';
import { QueueService } from '@server/queue';
export declare class BotUpdate {
    private readonly botService;
    private readonly prisma;
    private readonly queue;
    private readonly config;
    private readonly logger;
    private readonly adminIds;
    constructor(botService: BotService, prisma: PrismaService, queue: QueueService, config: ConfigService);
    private registerCommands;
    private handleBalance;
    private handleCashbacks;
    private handleCard;
    private handleNotifications;
    private handleStats;
    private handleBroadcast;
    private findUserIdByTelegramId;
    private isAdmin;
}
