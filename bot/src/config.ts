import dotenv from "dotenv";
import path from "path";

// Load .env from bot/ directory (works from any CWD)
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  bot: {
    token: process.env.TELEGRAM_BOT || "",
  },
  app: {
    env: process.env.NODE_ENV || "development",
    port: parseInt(process.env.BOT_PORT || "3001", 10),
    domain: process.env.BOT_DOMAIN || "", // for webhook
    webhookSecret: process.env.BOT_WEBHOOK_SECRET || "pharmacy-bot-secret",
  },
  redis: {
    url: process.env.REDIS_URL || "redis://localhost:6379",
    keyPrefix: "bot-session:",
  },
  admin: {
    ids: parseAdminIds(process.env.ADMIN_IDS),
    notAuthorized: "❌ Bu buyruq faqat adminlar uchun.",
  },
} as const;

function parseAdminIds(raw?: string): number[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(",")
    .map((id) => parseInt(id.trim(), 10))
    .filter((id) => !isNaN(id) && id > 0);
}

// Validate required config
if (!config.bot.token) {
  console.error("[ERROR] TELEGRAM_BOT token is missing in bot/.env file!");
  process.exit(1);
}
