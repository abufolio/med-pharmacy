import { Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { SettingsController } from './settings.controller';
import { SettingsService } from './settings.service';
import { AuditHelper } from '../audit/audit.helper';

@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [SettingsController],
  providers: [SettingsService, AuditHelper],
  exports: [SettingsService],
})
export class SettingsModule {}
