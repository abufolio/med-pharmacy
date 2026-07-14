import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Queues } from './index';
import type {
  NotificationJob,
  AuditJob,
  ReportJob,
  TelegramJob,
  CashbackJob,
} from './index';

@Injectable()
export class QueueService {
  private readonly logger = new Logger(QueueService.name);

  constructor(
    @InjectQueue(Queues.NOTIFICATION) readonly notification: Queue<NotificationJob>,
    @InjectQueue(Queues.AUDIT) readonly audit: Queue<AuditJob>,
    @InjectQueue(Queues.REPORT) readonly report: Queue<ReportJob>,
    @InjectQueue(Queues.TELEGRAM) readonly telegram: Queue<TelegramJob>,
    @InjectQueue(Queues.CASHBACK) readonly cashback: Queue<CashbackJob>,
  ) {}

  async addNotification(data: NotificationJob, delay = 0) {
    return this.notification.add('send', data, { delay });
  }

  async addAudit(data: AuditJob) {
    return this.audit.add('write', data, { attempts: 3 });
  }

  async addReport(data: ReportJob) {
    return this.report.add('generate', data, { delay: 5000 });
  }

  async addTelegram(data: TelegramJob) {
    return this.telegram.add('send', data, { attempts: 3, backoff: { type: 'exponential', delay: 1000 } });
  }

  async addCashback(data: CashbackJob) {
    return this.cashback.add('process', data, { attempts: 3 });
  }
}
