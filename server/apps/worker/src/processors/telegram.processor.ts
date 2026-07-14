import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Logger } from '@nestjs/common';
import { Bot, GrammyError, HttpError } from 'grammy';
import { Queues, TelegramJob } from '@server/queue';

@Processor(Queues.TELEGRAM)
export class TelegramProcessor extends WorkerHost {
  private readonly bot: Bot;
  private readonly logger = new Logger(TelegramProcessor.name);

  constructor() {
    super();
    const token = process.env.TELEGRAM_BOT || '';
    if (!token || token === 'your-bot-token') {
      this.logger.warn('TELEGRAM_BOT not configured — telegram processor disabled');
      this.bot = null as unknown as Bot;
      return;
    }
    this.bot = new Bot(token);
  }

  async process(job: Job<TelegramJob>): Promise<void> {
    if (!this.bot) return;

    const { chatId, text, parseMode } = job.data;
    this.logger.log(`Sending message to ${chatId}: "${text.slice(0, 50)}..."`);

    try {
      await this.bot.api.sendMessage(chatId, text, {
        parse_mode: parseMode || 'HTML',
      });
    } catch (error: any) {
      // User blocked the bot — don't retry
      if (error instanceof GrammyError && error.error_code === 403) {
        this.logger.warn(`Bot blocked by user ${chatId} — skipping`);
        return;
      }
      // Rate limiting — retry with backoff
      if (error instanceof GrammyError && error.error_code === 429) {
        this.logger.warn(`Rate limited for ${chatId} — will retry`);
        throw error; // BullMQ retry with backoff
      }
      // Network error — retry
      if (error instanceof HttpError) {
        this.logger.error(`HTTP error sending to ${chatId}: ${error.message}`);
        throw error; // BullMQ retry
      }
      // Other errors — log and skip
      this.logger.error(`Failed to send message to ${chatId}:`, error);
      throw error;
    }
  }
}
