/**
 * Admin command handlers — /stats, /broadcast
 */

import { Bot, Keyboard } from "grammy";
import { BotContext } from "../types";
import { t } from "../utils/i18n";
import { userStore } from "../utils/store";
import { config } from "../config";
import { showMainMenu } from "./menu";

// ── Auth guard ───────────────────────────────────────
function isAdmin(ctx: BotContext): boolean {
  if (!ctx.from) return false;
  return config.admin.ids.includes(ctx.from.id);
}

function adminGuard(ctx: BotContext): boolean {
  if (isAdmin(ctx)) return true;
  ctx.reply(config.admin.notAuthorized);
  return false;
}

// ── /stats — Bot Statistics ──────────────────────────
export async function showStats(ctx: BotContext) {
  if (!adminGuard(ctx)) return;

  const stats = await userStore.getStats();

  const message =
    `📊 <b>Bot statistikasi</b>\n\n` +
    `👥 <b>Foydalanuvchilar:</b>\n` +
    `   Jami: ${stats.totalUsers}\n` +
    `   ✅ Faol: ${stats.activeUsers}\n` +
    `   ⏳ Karta kutilmoqda: ${stats.pendingCardUsers}\n` +
    `   🔴 Bloklangan: ${stats.blockedUsers}\n\n` +
    `💳 <b>Tranzaksiyalar:</b> ${stats.totalTransactions}\n` +
    `💰 <b>Jami wallet balansi:</b> ${stats.totalWalletBalance.toLocaleString()} so'm\n` +
    `🎁 <b>Jami cashback:</b> ${stats.totalCashbackAmount.toLocaleString()} so'm`;

  await ctx.reply(message, { parse_mode: "HTML" });
}

// ── /broadcast — Send message to all users ──────────
export async function startBroadcast(ctx: BotContext) {
  if (!adminGuard(ctx)) return;

  ctx.session.step = "broadcast_text";
  ctx.session.broadcastMessage = undefined;

  const keyboard = new Keyboard().text(t(ctx.session.lang, "cancel_btn")).resized();

  await ctx.reply(
    "📨 <b>Broadcast</b>\n\n" +
    "Barcha foydalanuvchilarga yuboriladigan xabarni kiriting:\n\n" +
    "<i>Matn, rasm, yoki boshqa formatdagi xabar yuborishingiz mumkin.</i>",
    { parse_mode: "HTML", reply_markup: keyboard },
  );
}

// ── Handle broadcast text input ─────────────────────
export async function handleBroadcastText(ctx: BotContext, text: string) {
  if (!adminGuard(ctx)) return;

  // Store the message
  ctx.session.broadcastMessage = text;
  ctx.session.step = "main_menu";

  await ctx.reply(
    "📨 <b>Xabar yuborilmoqda...</b>\n\n" +
    "Bu bir necha daqiqa olishi mumkin. Iltimos kuting.",
    { parse_mode: "HTML" },
  );

  // Send to all users
  const telegramIds = await userStore.getAllTelegramIds();
  let sent = 0;
  let failed = 0;
  const bot = (await import("../bot")).bot;
  const BATCH_SIZE = 20;
  const DELAY_MS = 1000;

  for (let i = 0; i < telegramIds.length; i += BATCH_SIZE) {
    const batch = telegramIds.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((id) =>
        bot.api.sendMessage(id, text, {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        }).catch(() => { /* silent fail per user */ }),
      ),
    );

    for (const r of results) {
      if (r.status === "fulfilled") sent++;
      else failed++;
    }

    // Delay between batches to avoid rate limiting
    if (i + BATCH_SIZE < telegramIds.length) {
      await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }

  const summary =
    `✅ <b>Broadcast yakunlandi</b>\n\n` +
    `👥 Jami foydalanuvchilar: ${telegramIds.length}\n` +
    `✅ Yuborildi: ${sent}\n` +
    `❌ Xatolik: ${failed}`;

  await ctx.reply(summary, { parse_mode: "HTML" });
  await showMainMenu(ctx);
}

// ── Register admin callback data handlers ───────────
export function registerAdminCallbacks(bot: Bot<BotContext>) {
  bot.callbackQuery("admin_stats", async (ctx) => {
    await ctx.answerCallbackQuery();
    await showStats(ctx);
  });
}
