import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BotService } from './bot.service';
import { PrismaService } from '@server/database';
import { QueueService } from '@server/queue';
import { MESSAGES } from './bot.constants';
import { Context } from 'grammy';

@Injectable()
export class BotUpdate {
  private readonly logger = new Logger(BotUpdate.name);
  private readonly adminIds: number[];

  constructor(
    private readonly botService: BotService,
    private readonly prisma: PrismaService,
    private readonly queue: QueueService,
    private readonly config: ConfigService,
  ) {
    this.adminIds = this.config.get<number[]>('telegram.adminIds') || [];

    if (!this.botService.bot) return;
    this.registerCommands();
  }

  private registerCommands() {
    const bot = this.botService.bot;

    bot.command('start', async (ctx) => {
      const firstName = ctx.from?.first_name || 'Foydalanuvchi';
      await ctx.reply(MESSAGES.welcome(firstName), {
        parse_mode: 'HTML',
        reply_markup: {
          inline_keyboard: [
            [
              { text: '💰 Balans', callback_data: 'balance' },
              { text: '🎁 Keshbeklar', callback_data: 'cashbacks' },
            ],
            [
              { text: '💳 Karta ulash', callback_data: 'card' },
              { text: '🔔 Xabarlar', callback_data: 'notifications' },
            ],
          ],
        },
      });
    });

    bot.command('balance', async (ctx) => this.handleBalance(ctx));
    bot.command('cashbacks', async (ctx) => this.handleCashbacks(ctx));
    bot.command('card', async (ctx) => this.handleCard(ctx));
    bot.command('notifications', async (ctx) => this.handleNotifications(ctx));
    bot.command('stats', async (ctx) => this.handleStats(ctx));
    bot.command('broadcast', async (ctx) => this.handleBroadcast(ctx));

    // Handle phone number input for card linking
    bot.on(':text', async (ctx) => {
      const text = ctx.message?.text?.trim();
      if (!text || !/^[\+\d\s\-\(\)]{7,20}$/.test(text)) return;

      const phone = text.replace(/[\s\-\(\)]/g, '');
      const telegramId = ctx.from!.id;

      const user = await this.prisma.client.user.findUnique({
        where: { phone },
      });
      if (!user) {
        return ctx.reply(MESSAGES.cardLinkError, { parse_mode: 'HTML' });
      }

      await this.prisma.client.user.update({
        where: { id: user.id },
        data: { telegramId: BigInt(telegramId) },
      });

      this.logger.log(`User ${user.id} linked telegram ID ${telegramId}`);
      return ctx.reply(MESSAGES.cardLinked(phone), { parse_mode: 'HTML' });
    });

    // ── Callback queries ──
    bot.callbackQuery('balance', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.handleBalance(ctx);
    });

    bot.callbackQuery('cashbacks', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.handleCashbacks(ctx);
    });

    bot.callbackQuery('card', async (ctx) => {
      await ctx.answerCallbackQuery();
      await ctx.reply(MESSAGES.cardPrompt, { parse_mode: 'HTML' });
    });

    bot.callbackQuery('notifications', async (ctx) => {
      await ctx.answerCallbackQuery();
      await this.handleNotifications(ctx);
    });
  }

  // ── Command Handlers ──

  private async handleBalance(ctx: Context) {
    const userId = await this.findUserIdByTelegramId(ctx.from!.id);
    if (!userId) {
      return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
    }
    const wallet = await this.prisma.client.wallet.findUnique({
      where: { userId },
    });
    if (!wallet) return ctx.reply(MESSAGES.noWallet);
    return ctx.reply(MESSAGES.balance(Number(wallet.balance)), {
      parse_mode: 'HTML',
    });
  }

  private async handleCashbacks(ctx: Context) {
    const userId = await this.findUserIdByTelegramId(ctx.from!.id);
    if (!userId) {
      return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
    }
    const cashbacks = await this.prisma.client.cashback.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    if (cashbacks.length === 0) {
      return ctx.reply(MESSAGES.noCashbacks);
    }

    const items = cashbacks.map((c: { amount: { toString: () => string }; status: string; createdAt: Date }) => ({
      amount: Number(c.amount),
      status: c.status,
      date: c.createdAt.toISOString().split('T')[0],
    }));
    return ctx.reply(MESSAGES.cashbackList(items), { parse_mode: 'HTML' });
  }

  private async handleCard(ctx: Context) {
    await ctx.reply(MESSAGES.cardPrompt, { parse_mode: 'HTML' });
  }

  private async handleNotifications(ctx: Context) {
    const userId = await this.findUserIdByTelegramId(ctx.from!.id);
    if (!userId) {
      return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
    }
    const notifications = await this.prisma.client.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
    if (notifications.length === 0) {
      return ctx.reply(MESSAGES.noNotifications);
    }

    const items = notifications.map((n: { message: string; createdAt: Date }) => ({
      message: n.message,
      date: n.createdAt.toISOString().split('T')[0],
    }));
    await ctx.reply(MESSAGES.notifications(items), { parse_mode: 'HTML' });

    const ids = notifications.map((n: { id: string }) => n.id);
    await this.prisma.client.notification.updateMany({
      where: { id: { in: ids }, isRead: false },
      data: { isRead: true },
    });
  }

  private async handleStats(ctx: Context) {
    if (!this.isAdmin(ctx.from!.id)) {
      return ctx.reply(MESSAGES.notAuthorized);
    }
    const [totalUsers, totalTx, cashbackAgg] = await Promise.all([
      this.prisma.client.user.count({ where: { deletedAt: null } }),
      this.prisma.client.transaction.count(),
      this.prisma.client.cashback.aggregate({
        _sum: { amount: true },
      }),
    ]);
    return ctx.reply(
      MESSAGES.stats({
        totalUsers,
        totalTx,
        totalCashback: Number(cashbackAgg._sum.amount || 0),
      }),
      { parse_mode: 'HTML' },
    );
  }

  private async handleBroadcast(ctx: Context) {
    if (!this.isAdmin(ctx.from!.id)) {
      return ctx.reply(MESSAGES.notAuthorized);
    }
    const text = ctx.match?.toString().trim();
    if (!text) {
      return ctx.reply('📨 Xabar matnini kiriting: /broadcast <matn>', {
        parse_mode: 'HTML',
      });
    }

    const users = await this.prisma.client.user.findMany({
      where: { telegramId: { not: null }, deletedAt: null },
      select: { telegramId: true },
    });

    let sent = 0;
    for (const user of users) {
      try {
        await this.queue.addTelegram({
          chatId: user.telegramId!.toString(),
          text,
        });
        sent++;
      } catch (err) {
        this.logger.error(`Broadcast error for user ${user.telegramId}:`, err);
      }
    }
    return ctx.reply(MESSAGES.broadcastSent(sent), { parse_mode: 'HTML' });
  }

  // ── Helpers ──

  private async findUserIdByTelegramId(telegramId: number): Promise<string | null> {
    const user = await this.prisma.client.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
      select: { id: true },
    });
    return user?.id || null;
  }

  private isAdmin(telegramId: number): boolean {
    return this.adminIds.includes(telegramId);
  }
}
