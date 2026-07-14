import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { ReferralsController } from './referrals.controller';
import { ReferralsService } from './referrals.service';
import { AuditHelper } from '../audit/audit.helper';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [ReferralsController],
  providers: [ReferralsService, AuditHelper],
  exports: [ReferralsService],
})
export class ReferralsModule {}
