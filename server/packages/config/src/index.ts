/**
 * Centralized configuration for all server apps.
 * Uses process.env — values provided by @nestjs/config.
 */

export const config = () => ({
  // ── App ──
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPort: parseInt(process.env.API_PORT || '4000', 10),

  // ── Database ──
  database: {
    url: process.env.DATABASE_URL || '',
  },

  // ── Redis ──
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
  },

  // ── JWT ──
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'dev-refresh-secret-change-me',
    accessExpiresIn: '15m',
    refreshExpiresIn: '30d',
  },

  // ── Telegram ──
  telegram: {
    botToken: process.env.TELEGRAM_BOT || '',
    webhookSecret: process.env.BOT_WEBHOOK_SECRET || '',
    adminIds: (process.env.TELEGRAM_ADMIN_IDS || '').split(',').filter(Boolean).map(Number),
  },

  // ── CORS ──
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // ── Monitoring ──
  sentryDsn: process.env.SENTRY_DSN || '',
});

export type AppConfig = ReturnType<typeof config>;
