import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { CashbacksController } from './cashbacks.controller';
import { CashbacksService } from './cashbacks.service';
import { AuditHelper } from '../audit/audit.helper';
import { EventBusModule } from '@server/events';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [CashbacksController],
  providers: [CashbacksService, AuditHelper],
  exports: [CashbacksService],
})
export class CashbacksModule {}
