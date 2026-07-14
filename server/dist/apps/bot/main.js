"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const bot_module_1 = require("./bot.module");
async function bootstrap() {
    const logger = new common_1.Logger('Bot');
    const app = await core_1.NestFactory.createApplicationContext(bot_module_1.BotModule, {
        logger: process.env.NODE_ENV === 'production'
            ? ['error', 'warn', 'log']
            : ['error', 'warn', 'log', 'debug', 'verbose'],
    });
    const signals = ['SIGTERM', 'SIGINT'];
    for (const signal of signals) {
        process.on(signal, async () => {
            logger.log(`Received ${signal} — starting graceful shutdown...`);
            try {
                await app.close();
                logger.log('Bot stopped gracefully');
            }
            catch (err) {
                logger.error(`Error during bot shutdown: ${err}`);
            }
            process.exit(0);
        });
    }
    logger.log('🤖 Telegram bot started (long-polling)');
    logger.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map