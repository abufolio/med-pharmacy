import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { WorkerModule } from './worker.module';

async function bootstrap() {
  const logger = new Logger('Worker');
  const app = await NestFactory.createApplicationContext(WorkerModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  // ── Graceful Shutdown ──
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal} — starting graceful shutdown...`);
      try {
        await app.close();
        logger.log('Worker closed successfully');
      } catch (err) {
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
