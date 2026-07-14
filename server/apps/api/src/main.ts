import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import * as Sentry from '@sentry/nestjs';

// ── BigInt serialization (Prisma BigInt → JSON string) ──
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // ── Sentry init (before NestFactory) ──
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development',
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 0.0,
    });
    logger.log('Sentry initialized');
  }

  // ── NestJS App ──
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error', 'warn', 'log']
        : ['error', 'warn', 'log', 'debug', 'verbose'],
    bufferLogs: process.env.NODE_ENV === 'production',
  });

  // ── Global prefix ──
  app.setGlobalPrefix('api/v1');

  // ── Global validation pipe ──
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ── CORS ──
  app.enableCors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // ── Graceful Shutdown ──
  const signals = ['SIGTERM', 'SIGINT'];
  for (const signal of signals) {
    process.on(signal, async () => {
      logger.log(`Received ${signal} — starting graceful shutdown...`);
      try {
        await app.close();
        logger.log('Application closed successfully');
      } catch (err) {
        logger.error(`Error during shutdown: ${err}`);
      }
      process.exit(0);
    });
  }

  // ── Start ──
  const port = process.env.API_PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Backend API running on http://localhost:${port}/api/v1`);
  logger.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
}

bootstrap();
