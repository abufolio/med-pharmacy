export { QueueModule } from './queue.module';
export { QueueService } from './queue.service';

// ── Queue Names ──
export const Queues = {
  NOTIFICATION: 'notification',
  AUDIT: 'audit',
  REPORT: 'report',
  TELEGRAM: 'telegram',
  CASHBACK: 'cashback',
} as const;

// ── Job Payload Types ──
export interface NotificationJob {
  userId: string;
  type: string;
  message: string;
  channel?: 'push' | 'sms' | 'telegram';
}

export interface AuditJob {
  actorType: string;
  actorId?: string;
  action: string;
  entity: string;
  entityId?: string;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  ipAddress?: string;
}

export interface ReportJob {
  pharmacyId: string;
  date: string;
  type: 'daily' | 'weekly' | 'monthly';
}

export interface TelegramJob {
  chatId: string | number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
}

export interface CashbackJob {
  transactionId: string;
  userId: string;
  pharmacyId: string;
  amount: number;
}
