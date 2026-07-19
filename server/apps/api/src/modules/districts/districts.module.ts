import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { DistrictsController } from './districts.controller';
import { DistrictsService } from './districts.service';
import { AuditHelper } from '../audit/audit.helper';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [DistrictsController],
  providers: [DistrictsService, AuditHelper],
  exports: [DistrictsService],
})
export class DistrictsModule {}
