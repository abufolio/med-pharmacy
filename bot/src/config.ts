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
} as const;

// Validate required config
if (!config.bot.token) {
  console.error("[ERROR] TELEGRAM_BOT token is missing in bot/.env file!");
  process.exit(1);
}
