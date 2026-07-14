import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from '@server/database';
import { QueueModule } from '@server/queue';
import { EventBusModule } from '@server/events';
import { CacheModule } from '@server/cache';
import { BotService } from './bot.service';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    DatabaseModule,
    QueueModule,
    EventBusModule,
    CacheModule,
  ],
  providers: [BotService, BotUpdate],
})
export class BotModule {}
