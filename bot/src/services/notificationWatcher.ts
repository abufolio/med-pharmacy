/**
 * Notification Watcher Service
 *
 * Periodically polls for new cashbacks and unread notifications,
 * pushes them to users via Telegram in real-time.
 */

import { Bot } from "grammy";
import { BotContext } from "../types";
import { prisma } from "../db/prisma";
import { t } from "../utils/i18n";

// ── Types ────────────────────────────────────────────
interface PendingNotification {
  userId: string;
  telegramId: number;
  type: string;
  message: string;
  referenceId?: string;
}

// ── State ────────────────────────────────────────────
let watcherTimer: ReturnType<typeof setInterval> | null = null;
let lastCheckedAt: Date = new Date(0); // Start from epoch on first run
const notifiedCashbackIds = new Set<string>();
const POLL_INTERVAL_MS = 10_000; // 10 seconds
const BATCH_DELAY_MS = 500;

// ── Start / Stop ─────────────────────────────────────
export function startNotificationWatcher(bot: Bot<BotContext>) {
  if (watcherTimer) return; // Already running

  // Initialize lastCheckedAt to the most recent cashback or now
  initLastChecked().then(() => {
    console.log("  🔔 Notification watcher started (poll every 10s)");
    watcherTimer = setInterval(() => poll(bot), POLL_INTERVAL_MS);
  });
}

export function stopNotificationWatcher() {
  if (watcherTimer) {
    clearInterval(watcherTimer);
    watcherTimer = null;
    console.log("  🔔 Notification watcher stopped");
  }
}

async function initLastChecked() {
  // Start from the latest cashback so we don't re-notify old ones
  const latest = await prisma.cashback.findFirst({
    orderBy: { createdAt: "desc" },
    select: { id: true, createdAt: true },
  });
  if (latest) {
    lastCheckedAt = latest.createdAt;
    notifiedCashbackIds.add(latest.id);
    // Also seed the set with recent cashbacks to avoid re-notifying
    const recent = await prisma.cashback.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: { id: true },
    });
    for (const c of recent) {
      notifiedCashbackIds.add(c.id);
    }
  } else {
    lastCheckedAt = new Date();
  }
}

// ── Poll Cycle ───────────────────────────────────────
async function poll(bot: Bot<BotContext>) {
  try {
    const now = new Date();
    const notifications: PendingNotification[] = [];

    // 1. Check for new cashbacks
    await collectNewCashbacks(notifications, now);
    // 2. Check for unread system notifications
    await collectUnreadNotifications(notifications);

    if (notifications.length === 0) {
      lastCheckedAt = now;
      return;
    }

    // Send notifications in batches
    await sendNotifications(bot, notifications);
    lastCheckedAt = now;
  } catch (err) {
    console.error("[NotificationWatcher] Poll error:", err);
  }
}

// ── Collect new cashbacks ────────────────────────────
async function collectNewCashbacks(
  acc: PendingNotification[],
  now: Date,
) {
  const cashbacks = await prisma.cashback.findMany({
    where: {
      createdAt: { gte: lastCheckedAt },
    },
    include: {
      user: {
        select: { telegramId: true, language: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  for (const cb of cashbacks) {
    if (notifiedCashbackIds.has(cb.id)) continue;
    notifiedCashbackIds.add(cb.id);

    const telegramId = cb.user.telegramId;
    if (!telegramId) continue;

    const lang = (cb.user.language as "uz" | "ru" | "en") || "uz";
    const amount = Number(cb.amount).toLocaleString();

    acc.push({
      userId: cb.userId,
      telegramId: Number(telegramId),
      type: "cashback",
      message:
        `🎁 <b>${t(lang, "notif_cashback_title")}</b>\n\n` +
        t(lang, "notif_cashback_body", { amount }),
      referenceId: cb.id,
    });
  }
}

// ── Collect unread system notifications ──────────────
async function collectUnreadNotifications(
  acc: PendingNotification[],
) {
  const records = await prisma.notification.findMany({
    where: { isRead: false },
    include: {
      user: {
        select: { telegramId: true, language: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  const ids: string[] = [];
  for (const n of records) {
    const telegramId = n.user.telegramId;
    if (!telegramId) continue;

    const lang = (n.user.language as "uz" | "ru" | "en") || "uz";
    const typeEmoji = getNotifEmoji(n.type);

    acc.push({
      userId: n.userId,
      telegramId: Number(telegramId),
      type: n.type,
      message: `${typeEmoji} <b>${n.message}</b>`,
    });
    ids.push(n.id);
  }

  // Mark as read
  if (ids.length > 0) {
    await prisma.notification.updateMany({
      where: { id: { in: ids } },
      data: { isRead: true },
    });
  }
}

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

// ── Send ─────────────────────────────────────────────
async function sendNotifications(
  bot: Bot<BotContext>,
  notifications: PendingNotification[],
) {
  let sent = 0;
  let failed = 0;

  // Group by telegramId to batch per user
  const groups = new Map<number, string[]>();
  for (const n of notifications) {
    const list = groups.get(n.telegramId) || [];
    list.push(n.message);
    groups.set(n.telegramId, list);
  }

  for (const [telegramId, messages] of groups) {
    try {
      // If multiple notifications, send as separate messages
      for (const msg of messages) {
        await bot.api.sendMessage(telegramId, msg, {
          parse_mode: "HTML",
          link_preview_options: { is_disabled: true },
        });
        await new Promise((r) => setTimeout(r, 100)); // Tiny gap between messages
      }
      sent += messages.length;
    } catch {
      failed++;
    }
  }

  if (sent > 0 || failed > 0) {
    console.log(`[NotificationWatcher] Sent: ${sent}, Failed: ${failed}`);
  }
}
