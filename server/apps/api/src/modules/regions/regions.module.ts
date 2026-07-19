import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { RegionsController } from './regions.controller';
import { RegionsService } from './regions.service';
import { AuditHelper } from '../audit/audit.helper';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [RegionsController],
  providers: [RegionsService, AuditHelper],
  exports: [RegionsService],
})
export class RegionsModule {}
