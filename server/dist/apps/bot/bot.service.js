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
var BotService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BotService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const grammy_1 = require("grammy");
let BotService = BotService_1 = class BotService {
    config;
    bot;
    logger = new common_1.Logger(BotService_1.name);
    constructor(config) {
        this.config = config;
        const token = config.get('TELEGRAM_BOT');
        if (!token || token === 'your-bot-token') {
            this.logger.warn('TELEGRAM_BOT not configured — bot will not start');
            this.bot = null;
            return;
        }
        this.bot = new grammy_1.Bot(token);
        this.bot.catch((err) => {
            const ctx = err.ctx;
            this.logger.error(`Bot error for update ${ctx.update.update_id}:`, err.error);
            if (err.error instanceof grammy_1.GrammyError) {
                this.logger.error(`GrammyError: ${err.error.description} (code: ${err.error.error_code})`);
            }
            else if (err.error instanceof grammy_1.HttpError) {
                this.logger.error(`HttpError: ${err.error.message}`);
            }
        });
    }
    async onModuleInit() {
        if (!this.bot)
            return;
        try {
            const info = await this.bot.api.getMe();
            await this.bot.api.setMyCommands([
                { command: 'start', description: '🏠 Bosh sahifa' },
                { command: 'balance', description: '💰 Balansni ko\'rish' },
                { command: 'cashbacks', description: '🎁 Keshbek tarixi' },
                { command: 'card', description: '💳 Kartani ulash' },
                { command: 'notifications', description: '🔔 Xabarlar' },
            ]);
            this.bot.start({
                onStart: () => {
                    this.logger.log(`🤖 Bot started as @${info.username}`);
                },
            });
        }
        catch (error) {
            this.logger.error('Failed to start bot:', error);
        }
    }
    async onModuleDestroy() {
        if (!this.bot)
            return;
        await this.bot.stop();
        this.logger.log('Bot stopped');
    }
};
exports.BotService = BotService;
exports.BotService = BotService = BotService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BotService);
//# sourceMappingURL=bot.service.js.map