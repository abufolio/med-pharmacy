/**
 * Universal Pharmacy Cashback Platform — Telegram Bot
 *
 * Entry point. Starts bot in long-polling mode for development.
 * For production, switch to webhook mode.
 */

import { bot } from "./bot";
import { config } from "./config";
import { disconnectPrisma } from "./db/prisma";
import { startNotificationWatcher, stopNotificationWatcher } from "./services/notificationWatcher";

async function main() {
  const env = config.app.env;
  const botInfo = await bot.api.getMe();

  console.log("\n═══════════════════════════════════════════");
  console.log("  🤖 Pharmacy Cashback Bot");
  console.log(`  Bot:     @${botInfo.username}`);
  console.log(`  Name:    ${botInfo.first_name}`);
  console.log(`  Mode:    ${env === "production" ? "Webhook 🌐" : "Long Polling 🔄"}`);
  console.log(`  Env:     ${env}`);
  console.log("═══════════════════════════════════════════\n");

  // ── Register commands with Telegram ─────────────
  try {
    await bot.api.setMyCommands([
      { command: "start", description: "Botni ishga tushirish / Запустить бота / Start" },
      { command: "login", description: "🔐 Tizimga kirish / Войти / Login" },
      { command: "logout", description: "🚪 Tizimdan chiqish / Выйти / Logout" },
      { command: "stats", description: "📊 Statistika (admin)" },
      { command: "broadcast", description: "📨 Xabar yuborish (admin)" },
    ]);
    console.log("  ✅ Commands registered");
  } catch (e) {
    console.log("  ⚠️ Could not register commands:", (e as Error).message);
  }

  // ── Start notification watcher ────────────────
  startNotificationWatcher(bot);

  if (env === "production") {
    // Webhook mode for production
    const webhookUrl = `${config.app.domain}/api/bot`;
    await bot.api.setWebhook(webhookUrl, {
      secret_token: config.app.webhookSecret,
    });
    console.log(`  Webhook set to: ${webhookUrl}`);

    // Start webhook server (via grammY's built-in webhook)
    bot.start({
      onStart: () => console.log("  Bot webhook server started\n"),
    });
  } else {
    // Long polling for development
    bot.start({
      onStart: () => console.log("  Bot started (long polling). Waiting for messages...\n"),
      drop_pending_updates: true,
    });
  }
}

main().catch(async (err) => {
  console.error("[FATAL] Bot failed to start:", err);
  await disconnectPrisma();
  process.exit(1);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n👋 Shutting down...");
  stopNotificationWatcher();
  await disconnectPrisma();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n👋 Shutting down...");
  stopNotificationWatcher();
  await disconnectPrisma();
  process.exit(0);
});
