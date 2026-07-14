import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { BotModule } from './bot.module';

async function bootstrap() {
  const logger = new Logger('Bot');
  const app = await NestFactory.createApplicationContext(BotModule, {
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
        logger.log('Bot stopped gracefully');
      } catch (err) {
        logger.error(`Error during bot shutdown: ${err}`);
      }
      process.exit(0);
    });
  }

  logger.log('🤖 Telegram bot started (long-polling)');
  logger.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
