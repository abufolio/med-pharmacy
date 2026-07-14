import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '@server/database';
import { EventBusModule } from '@server/events';
import { AuditService } from './audit.service';
import { AuditListener } from './audit.listener';
import { AuditHelper } from './audit.helper';
import { AuditController } from './audit.controller';

@Global()
@Module({
  imports: [DatabaseModule, EventBusModule],
  controllers: [AuditController],
  providers: [AuditService, AuditListener, AuditHelper],
  exports: [AuditService, AuditHelper],
})
export class AuditModule {}
