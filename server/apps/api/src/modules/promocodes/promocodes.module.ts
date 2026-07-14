import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { PromocodesController } from './promocodes.controller';
import { PromocodesService } from './promocodes.service';
import { AuditHelper } from '../audit/audit.helper';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [PromocodesController],
  providers: [PromocodesService, AuditHelper],
  exports: [PromocodesService],
})
export class PromocodesModule {}
