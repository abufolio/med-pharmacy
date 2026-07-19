/**
 * Authentication handlers — /login, /logout, and login flow
 */

import { Keyboard } from "grammy";
import { BotContext } from "../types";
import { t } from "../utils/i18n";
import { userStore } from "../utils/store";
import { showMainMenu } from "./menu";

// ── Login Command ─────────────────────────────────
export async function startLogin(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);

  if (!user) {
    await ctx.reply(t(lang, "register_first"));
    return;
  }

  if (ctx.session.isLoggedIn) {
    await ctx.reply(t(lang, "already_logged_in"));
    await showMainMenu(ctx);
    return;
  }

  ctx.session.step = "login_password";
  await ctx.reply(t(lang, "login_title") + "\n\n" + t(lang, "login_prompt"), {
    reply_markup: new Keyboard().text(t(lang, "cancel_btn")).resized().oneTime(),
  });
}

// ── Handle password entry during login ────────────
export async function handleLoginPassword(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const telegramId = ctx.from!.id;

  const user = await userStore.authenticate(telegramId, text);
  if (user) {
    ctx.session.isLoggedIn = true;
    ctx.session.step = "main_menu";
    ctx.session.lang = user.language;

    await ctx.reply(t(lang, "login_success"), {
      reply_markup: { remove_keyboard: true },
    });
    await showMainMenu(ctx);
  } else {
    await ctx.reply(t(lang, "login_failed"));
  }
}

// ── Logout Command ────────────────────────────────
export async function startLogout(ctx: BotContext) {
  const lang = ctx.session.lang;

  if (!ctx.session.isLoggedIn) {
    await ctx.reply(t(lang, "login_required"));
    return;
  }

  ctx.session.isLoggedIn = false;
  ctx.session.step = "idle";

  await ctx.reply(t(lang, "logout_success"), {
    reply_markup: { remove_keyboard: true },
  });
}

// ── Auth Guard — check if user is logged in ───────
export async function requireAuth(
  ctx: BotContext,
  action: () => Promise<void>,
): Promise<void> {
  const lang = ctx.session.lang;

  if (!ctx.session.isLoggedIn) {
    await ctx.reply(t(lang, "login_required"));
    return;
  }

  await action();
}
