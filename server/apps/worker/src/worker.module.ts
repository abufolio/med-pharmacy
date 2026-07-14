import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { CacheModule } from '@server/cache';
import { QueueModule } from '@server/queue';

// Processors
import { AuditProcessor } from './processors/audit.processor';
import { NotificationProcessor } from './processors/notification.processor';
import { CashbackProcessor } from './processors/cashback.processor';
import { TelegramProcessor } from './processors/telegram.processor';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    EventBusModule,
    CacheModule,
    QueueModule,
  ],
  providers: [
    AuditProcessor,
    NotificationProcessor,
    CashbackProcessor,
    TelegramProcessor,
  ],
})
export class WorkerModule {}
