/**
 * Notification handlers — history view and settings
 */

import { InlineKeyboard, Keyboard } from "grammy";
import { BotContext, LanguageCode } from "../types";
import { t } from "../utils/i18n";
import { userStore } from "../utils/store";
import { prisma } from "../db/prisma";
import { showMainMenu } from "./menu";

// ── Notification History ─────────────────────────────
export async function showNotificationHistory(ctx: BotContext, page: number = 0) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  ctx.session.step = "notif_viewing";

  const perPage = 5;
  const total = await prisma.notification.count({
    where: { userId: user.id },
  });

  if (total === 0) {
    const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();
    await ctx.reply(
      t(lang, "notif_history_title") + "\n\n" + t(lang, "notif_history_empty"),
      { reply_markup: keyboard },
    );
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: safePage * perPage,
    take: perPage,
  });

  const lines: string[] = [t(lang, "notif_history_title"), ""];

  for (const n of notifications) {
    const emoji = getNotifEmoji(n.type);
    const date = formatNotifDate(n.createdAt);
    lines.push(
      `${emoji} ${n.message}\n` +
      `📅 ${date}` +
      (n.isRead ? "" : " · 🔴"),
    );
    lines.push("");
  }

  lines.push(
    t(lang, "notif_history_page_info", {
      page: safePage + 1,
      total: totalPages,
      count: total,
    }),
  );

  const kb = new InlineKeyboard();
  if (totalPages > 1) {
    if (safePage > 0) {
      kb.text("⬅️ " + t(lang, "notif_history_prev"), `notif_page:${safePage - 1}`);
    }
    kb.text(`${safePage + 1}/${totalPages}`, "notif_page_cur");
    if (safePage < totalPages - 1) {
      kb.text(t(lang, "notif_history_next") + " ➡️", `notif_page:${safePage + 1}`);
    }
  }
  kb.row().text(t(lang, "notif_read_all"), "notif_read_all");
  kb.row().text("⬅️ " + t(lang, "back_btn"), "notif_back");

  await ctx.reply(lines.join("\n"), { reply_markup: kb });
}

// ── Pagination handler ───────────────────────────────
export async function handleNotifPagination(ctx: BotContext, page: number) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  ctx.session.step = "notif_viewing";

  const perPage = 5;
  const total = await prisma.notification.count({
    where: { userId: user.id },
  });

  if (total === 0) {
    await ctx.editMessageText(
      t(lang, "notif_history_title") + "\n\n" + t(lang, "notif_history_empty"),
      { reply_markup: new InlineKeyboard().text("⬅️ " + t(lang, "back_btn"), "notif_back") },
    );
    return;
  }

  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(0, page), totalPages - 1);

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: safePage * perPage,
    take: perPage,
  });

  const lines: string[] = [t(lang, "notif_history_title"), ""];

  for (const n of notifications) {
    const emoji = getNotifEmoji(n.type);
    const date = formatNotifDate(n.createdAt);
    lines.push(
      `${emoji} ${n.message}\n📅 ${date}` +
      (n.isRead ? "" : " · 🔴"),
    );
    lines.push("");
  }

  lines.push(
    t(lang, "notif_history_page_info", {
      page: safePage + 1,
      total: totalPages,
      count: total,
    }),
  );

  const kb = new InlineKeyboard();
  if (totalPages > 1) {
    if (safePage > 0) {
      kb.text("⬅️ " + t(lang, "notif_history_prev"), `notif_page:${safePage - 1}`);
    }
    kb.text(`${safePage + 1}/${totalPages}`, "notif_page_cur");
    if (safePage < totalPages - 1) {
      kb.text(t(lang, "notif_history_next") + " ➡️", `notif_page:${safePage + 1}`);
    }
  }
  kb.row().text(t(lang, "notif_read_all"), "notif_read_all");
  kb.row().text("⬅️ " + t(lang, "back_btn"), "notif_back");

  await ctx.editMessageText(lines.join("\n"), { reply_markup: kb });
}

// ── Helpers ──────────────────────────────────────────
function getNotifEmoji(type: string): string {
  switch (type) {
    case "cashback": return "🎁";
    case "promo": return "🎉";
    case "withdraw": return "💸";
    case "system": return "ℹ️";
    case "card": return "💳";
    default: return "🔔";
  }
}

function formatNotifDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

// ── Mark all notifications as read ─────────────────────
export async function markAllNotifsRead(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  await prisma.notification.updateMany({
    where: { userId: user.id, isRead: false },
    data: { isRead: true },
  });

  await ctx.reply(t(lang, "notif_read_all_done"), {
    reply_markup: { remove_keyboard: true },
  });
}
