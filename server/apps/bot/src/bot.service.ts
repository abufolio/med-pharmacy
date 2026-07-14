import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Bot, BotError, GrammyError, HttpError } from 'grammy';

@Injectable()
export class BotService implements OnModuleInit, OnModuleDestroy {
  public readonly bot: Bot;
  private readonly logger = new Logger(BotService.name);

  constructor(private readonly config: ConfigService) {
    const token = config.get<string>('TELEGRAM_BOT')!;
    if (!token || token === 'your-bot-token') {
      this.logger.warn('TELEGRAM_BOT not configured — bot will not start');
      this.bot = null as unknown as Bot;
      return;
    }
    this.bot = new Bot(token);

    // Global error handler
    this.bot.catch((err: BotError) => {
      const ctx = err.ctx;
      this.logger.error(`Bot error for update ${ctx.update.update_id}:`, err.error);
      if (err.error instanceof GrammyError) {
        this.logger.error(`GrammyError: ${err.error.description} (code: ${err.error.error_code})`);
      } else if (err.error instanceof HttpError) {
        this.logger.error(`HttpError: ${err.error.message}`);
      }
    });
  }

  async onModuleInit() {
    if (!this.bot) return;
    try {
      const info = await this.bot.api.getMe();
      await this.bot.api.setMyCommands([
        { command: 'start', description: '🏠 Bosh sahifa' },
        { command: 'balance', description: '💰 Balansni ko\'rish' },
        { command: 'cashbacks', description: '🎁 Keshbek tarixi' },
        { command: 'card', description: '💳 Kartani ulash' },
        { command: 'notifications', description: '🔔 Xabarlar' },
      ]);
      // Start long-polling (non-blocking)
      this.bot.start({
        onStart: () => {
          this.logger.log(`🤖 Bot started as @${info.username}`);
        },
      });
    } catch (error) {
      this.logger.error('Failed to start bot:', error);
    }
  }

  async onModuleDestroy() {
    if (!this.bot) return;
    await this.bot.stop();
    this.logger.log('Bot stopped');
  }
}
