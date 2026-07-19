/**
 * Security middlewares — rate limiting, session expiry, auth guard
 * TechSpec: NFR-006/007 (security), 15.4 (rate limit: 20 msg/min)
 */

import { BotContext } from "../types";

const SESSION_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours idle timeout

/**
 * Middleware: check session expiry.
 * If user has been idle > 24h, force logout.
 */
export async function sessionExpiry(
  ctx: BotContext,
  next: () => Promise<void>,
) {
  // Skip for the start command — new users shouldn't hit expiry
  if (ctx.message?.text === "/start") {
    await next();
    return;
  }

  if (ctx.session.isLoggedIn) {
    const idle = Date.now() - ctx.session.lastActivity;
    if (idle > SESSION_EXPIRY_MS) {
      ctx.session.isLoggedIn = false;
      ctx.session.step = "idle";
      // Don't notify on callback queries (inline nav) to avoid spam
      if (!ctx.callbackQuery) {
        await ctx.reply(
          "⏰ Sessiya muddati tugadi. Qayta kirish uchun /login",
          { reply_markup: { remove_keyboard: true } },
        );
      }
    }
  }

  // Update last activity timestamp
  ctx.session.lastActivity = Date.now();

  await next();
}
