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
var TelegramProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TelegramProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const common_1 = require("@nestjs/common");
const grammy_1 = require("grammy");
const queue_1 = require("@server/queue");
let TelegramProcessor = TelegramProcessor_1 = class TelegramProcessor extends bullmq_1.WorkerHost {
    bot;
    logger = new common_1.Logger(TelegramProcessor_1.name);
    constructor() {
        super();
        const token = process.env.TELEGRAM_BOT || '';
        if (!token || token === 'your-bot-token') {
            this.logger.warn('TELEGRAM_BOT not configured — telegram processor disabled');
            this.bot = null;
            return;
        }
        this.bot = new grammy_1.Bot(token);
    }
    async process(job) {
        if (!this.bot)
            return;
        const { chatId, text, parseMode } = job.data;
        this.logger.log(`Sending message to ${chatId}: "${text.slice(0, 50)}..."`);
        try {
            await this.bot.api.sendMessage(chatId, text, {
                parse_mode: parseMode || 'HTML',
            });
        }
        catch (error) {
            if (error instanceof grammy_1.GrammyError && error.error_code === 403) {
                this.logger.warn(`Bot blocked by user ${chatId} — skipping`);
                return;
            }
            if (error instanceof grammy_1.GrammyError && error.error_code === 429) {
                this.logger.warn(`Rate limited for ${chatId} — will retry`);
                throw error;
            }
            if (error instanceof grammy_1.HttpError) {
                this.logger.error(`HTTP error sending to ${chatId}: ${error.message}`);
                throw error;
            }
            this.logger.error(`Failed to send message to ${chatId}:`, error);
            throw error;
        }
    }
};
exports.TelegramProcessor = TelegramProcessor;
exports.TelegramProcessor = TelegramProcessor = TelegramProcessor_1 = __decorate([
    (0, bullmq_1.Processor)(queue_1.Queues.TELEGRAM),
    __metadata("design:paramtypes", [])
], TelegramProcessor);
//# sourceMappingURL=telegram.processor.js.map