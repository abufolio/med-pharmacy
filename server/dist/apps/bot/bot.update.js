"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BotUpdate_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotUpdate = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bot_service_1 = require("./bot.service");
const database_1 = require("@server/database");
const queue_1 = require("@server/queue");
const bot_constants_1 = require("./bot.constants");
let BotUpdate = BotUpdate_1 = class BotUpdate {
    botService;
    prisma;
    queue;
    config;
    logger = new common_1.Logger(BotUpdate_1.name);
    adminIds;
    constructor(botService, prisma, queue, config) {
        this.botService = botService;
        this.prisma = prisma;
        this.queue = queue;
        this.config = config;
        this.adminIds = this.config.get('telegram.adminIds') || [];
        if (!this.botService.bot)
            return;
        this.registerCommands();
    }
    registerCommands() {
        const bot = this.botService.bot;
        bot.command('start', async (ctx) => {
            const firstName = ctx.from?.first_name || 'Foydalanuvchi';
            await ctx.reply(bot_constants_1.MESSAGES.welcome(firstName), {
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
        bot.on(':text', async (ctx) => {
            const text = ctx.message?.text?.trim();
            if (!text || !/^[\+\d\s\-\(\)]{7,20}$/.test(text))
                return;
            const phone = text.replace(/[\s\-\(\)]/g, '');
            const telegramId = ctx.from.id;
            const user = await this.prisma.client.user.findUnique({
                where: { phone },
            });
            if (!user) {
                return ctx.reply(bot_constants_1.MESSAGES.cardLinkError, { parse_mode: 'HTML' });
            }
            await this.prisma.client.user.update({
                where: { id: user.id },
                data: { telegramId: BigInt(telegramId) },
            });
            this.logger.log(`User ${user.id} linked telegram ID ${telegramId}`);
            return ctx.reply(bot_constants_1.MESSAGES.cardLinked(phone), { parse_mode: 'HTML' });
        });
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
            await ctx.reply(bot_constants_1.MESSAGES.cardPrompt, { parse_mode: 'HTML' });
        });
        bot.callbackQuery('notifications', async (ctx) => {
            await ctx.answerCallbackQuery();
            await this.handleNotifications(ctx);
        });
    }
    async handleBalance(ctx) {
        const userId = await this.findUserIdByTelegramId(ctx.from.id);
        if (!userId) {
            return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
        }
        const wallet = await this.prisma.client.wallet.findUnique({
            where: { userId },
        });
        if (!wallet)
            return ctx.reply(bot_constants_1.MESSAGES.noWallet);
        return ctx.reply(bot_constants_1.MESSAGES.balance(Number(wallet.balance)), {
            parse_mode: 'HTML',
        });
    }
    async handleCashbacks(ctx) {
        const userId = await this.findUserIdByTelegramId(ctx.from.id);
        if (!userId) {
            return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
        }
        const cashbacks = await this.prisma.client.cashback.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        if (cashbacks.length === 0) {
            return ctx.reply(bot_constants_1.MESSAGES.noCashbacks);
        }
        const items = cashbacks.map((c) => ({
            amount: Number(c.amount),
            status: c.status,
            date: c.createdAt.toISOString().split('T')[0],
        }));
        return ctx.reply(bot_constants_1.MESSAGES.cashbackList(items), { parse_mode: 'HTML' });
    }
    async handleCard(ctx) {
        await ctx.reply(bot_constants_1.MESSAGES.cardPrompt, { parse_mode: 'HTML' });
    }
    async handleNotifications(ctx) {
        const userId = await this.findUserIdByTelegramId(ctx.from.id);
        if (!userId) {
            return ctx.reply('💳 Avval kartangizni ulang: /card', { parse_mode: 'HTML' });
        }
        const notifications = await this.prisma.client.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 10,
        });
        if (notifications.length === 0) {
            return ctx.reply(bot_constants_1.MESSAGES.noNotifications);
        }
        const items = notifications.map((n) => ({
            message: n.message,
            date: n.createdAt.toISOString().split('T')[0],
        }));
        await ctx.reply(bot_constants_1.MESSAGES.notifications(items), { parse_mode: 'HTML' });
        const ids = notifications.map((n) => n.id);
        await this.prisma.client.notification.updateMany({
            where: { id: { in: ids }, isRead: false },
            data: { isRead: true },
        });
    }
    async handleStats(ctx) {
        if (!this.isAdmin(ctx.from.id)) {
            return ctx.reply(bot_constants_1.MESSAGES.notAuthorized);
        }
        const [totalUsers, totalTx, cashbackAgg] = await Promise.all([
            this.prisma.client.user.count({ where: { deletedAt: null } }),
            this.prisma.client.transaction.count(),
            this.prisma.client.cashback.aggregate({
                _sum: { amount: true },
            }),
        ]);
        return ctx.reply(bot_constants_1.MESSAGES.stats({
            totalUsers,
            totalTx,
            totalCashback: Number(cashbackAgg._sum.amount || 0),
        }), { parse_mode: 'HTML' });
    }
    async handleBroadcast(ctx) {
        if (!this.isAdmin(ctx.from.id)) {
            return ctx.reply(bot_constants_1.MESSAGES.notAuthorized);
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
                    chatId: user.telegramId.toString(),
                    text,
                });
                sent++;
            }
            catch (err) {
                this.logger.error(`Broadcast error for user ${user.telegramId}:`, err);
            }
        }
        return ctx.reply(bot_constants_1.MESSAGES.broadcastSent(sent), { parse_mode: 'HTML' });
    }
    async findUserIdByTelegramId(telegramId) {
        const user = await this.prisma.client.user.findUnique({
            where: { telegramId: BigInt(telegramId) },
            select: { id: true },
        });
        return user?.id || null;
    }
    isAdmin(telegramId) {
        return this.adminIds.includes(telegramId);
    }
};
exports.BotUpdate = BotUpdate;
exports.BotUpdate = BotUpdate = BotUpdate_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [bot_service_1.BotService,
        database_1.PrismaService,
        queue_1.QueueService,
        config_1.ConfigService])
], BotUpdate);
//# sourceMappingURL=bot.update.js.map