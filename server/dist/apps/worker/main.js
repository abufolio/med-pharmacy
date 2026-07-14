"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const worker_module_1 = require("./worker.module");
async function bootstrap() {
    const logger = new common_1.Logger('Worker');
    const app = await core_1.NestFactory.createApplicationContext(worker_module_1.WorkerModule, {
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
                logger.log('Worker closed successfully');
            }
            catch (err) {
                logger.error(`Error during shutdown: ${err}`);
            }
            process.exit(0);
        });
    }
    logger.log('🧠 Background worker started');
    logger.log('   Queues: notification, audit, report, telegram, cashback');
    logger.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
}
bootstrap();
//# sourceMappingURL=main.js.map