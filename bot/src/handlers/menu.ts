import { InlineKeyboard, Keyboard } from "grammy";
import { BotContext, LanguageCode } from "../types";
import { t } from "../utils/i18n";
import { userStore, PaginatedTransactions } from "../utils/store";

// ── Main Menu ──────────────────────────────────────────
export async function showMainMenu(ctx: BotContext, message?: string) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);

  if (!user) {
    // User not found — show registration
    const { showLanguageSelection } = await import("./register");
    await showLanguageSelection(ctx);
    return;
  }

  ctx.session.step = "main_menu";

  // Show limited menu if not logged in
  if (!ctx.session.isLoggedIn) {
    const loginKeyboard = new Keyboard()
      .text(t(lang, "btn_login")).resized();
    await ctx.reply(t(lang, "login_required"), { reply_markup: loginKeyboard });
    return;
  }

  const keyboard = new Keyboard()
    .text(t(lang, "btn_profile")).text(t(lang, "btn_balance")).row()
    .text(t(lang, "btn_history")).text(t(lang, "btn_withdraw")).row()
    .text(t(lang, "btn_promo")).text(t(lang, "btn_referral")).row()
    .text(t(lang, "btn_settings")).text(t(lang, "btn_support"))
    .resized();

  const text = message || t(lang, "main_menu", { firstName: user.firstName });

  await ctx.reply(text, { reply_markup: keyboard });
}

// ── Profile ────────────────────────────────────────────
export async function showProfile(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  const cardStatusMap = {
    PENDING_CARD: t(lang, "card_status_pending"),
    ACTIVE: t(lang, "card_status_active"),
    BLOCKED: t(lang, "card_status_blocked"),
  };

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  let addressDisplay = user.address;
  // Append Google Maps link if coordinates exist (plain URL — Telegram auto-links it)
  if (user.addressLat && user.addressLng) {
    addressDisplay += `\n🗺️ Google Maps: https://maps.google.com/maps?q=${user.addressLat},${user.addressLng}`;
  }

  await ctx.reply(
    t(lang, "profile_title") +
    "\n\n" +
    t(lang, "profile_details", {
      id: user.id.slice(0, 8) + "...",
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      address: addressDisplay,
      cardStatus: cardStatusMap[user.status],
      balance: user.balance.toLocaleString(),
    }),
    { reply_markup: keyboard }
  );
}

// ── Balance ────────────────────────────────────────────
export async function showBalance(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  await ctx.reply(
    t(lang, "balance_title") + "\n\n" +
    t(lang, "balance_amount", { balance: user.balance.toLocaleString() }),
    { reply_markup: keyboard }
  );
}

// ── Transaction History (Paginated) ────────────────────
export async function showHistory(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  ctx.session.step = "history_viewing";
  ctx.session.historyPage = 0;

  const data = await userStore.getTransactions(ctx.from!.id, 0);
  if (!data || data.items.length === 0) {
    const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();
    await ctx.reply(
      t(lang, "history_title") + "\n\n" + t(lang, "history_empty"),
      { reply_markup: keyboard }
    );
    return;
  }

  const text = buildHistoryText(lang, data);
  const inlineKb = buildHistoryKeyboard(lang, data);

  await ctx.reply(text, { reply_markup: inlineKb });
}

// ── History Pagination Helpers ─────────────────────────
function buildHistoryText(lang: LanguageCode, data: PaginatedTransactions): string {
  const lines: string[] = [t(lang, "history_title"), ""];

  for (const tx of data.items) {
    const dateStr = formatDate(tx.createdAt);
    const amountStr = tx.amount.toLocaleString();
    const cashbackStr = tx.cashbackAmount.toLocaleString();
    const statusEmoji = statusIcon(tx.status);
    const cbStatusEmoji = cashbackIcon(tx.cashbackStatus);

    lines.push(
      `📅 ${dateStr}` +
      `\n💰 ${amountStr} so'm` +
      `\n${cbStatusEmoji} Cashback: +${cashbackStr} so'm` +
      `\n${statusEmoji} ${t(lang, "history_status_" + tx.status.toLowerCase())}`
    );
    lines.push(""); // spacer
  }

  lines.push(t(lang, "history_page_info", {
    page: data.page + 1,
    total: data.totalPages,
    count: data.total,
  }));

  return lines.join("\n");
}

function buildHistoryKeyboard(lang: LanguageCode, data: PaginatedTransactions): InlineKeyboard {
  const kb = new InlineKeyboard();

  if (data.totalPages > 1) {
    if (data.page > 0) {
      kb.text("⬅️ " + t(lang, "history_prev_btn"), `hist_page:${data.page - 1}`);
    }
    kb.text(`${data.page + 1}/${data.totalPages}`, "hist_page_cur");
    if (data.page < data.totalPages - 1) {
      kb.text(t(lang, "history_next_btn") + " ➡️", `hist_page:${data.page + 1}`);
    }
  }

  kb.row().text("⬅️ " + t(lang, "back_btn"), "hist_back");
  return kb;
}

function formatDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}

function statusIcon(status: string): string {
  switch (status) {
    case "COMPLETED": return "✅";
    case "PENDING": return "⏳";
    case "REVERSED": return "↩️";
    case "FAILED": return "❌";
    case "FLAGGED": return "⚠️";
    default: return "❓";
  }
}

function cashbackIcon(status: string): string {
  switch (status) {
    case "ACTIVE": return "🎁";
    case "ROLLED_BACK": return "↩️";
    case "EXPIRED": return "⌛";
    case "FROZEN": return "🧊";
    case "NONE": return "➖";
    default: return "❓";
  }
}

export async function handleHistoryPagination(ctx: BotContext, page: number) {
  const lang = ctx.session.lang;
  ctx.session.historyPage = page;

  const data = await userStore.getTransactions(ctx.from!.id, page);
  if (!data || data.items.length === 0) {
    await ctx.editMessageText(
      t(lang, "history_title") + "\n\n" + t(lang, "history_empty"),
      { reply_markup: new InlineKeyboard().text("⬅️ " + t(lang, "back_btn"), "hist_back") }
    );
    return;
  }

  const text = buildHistoryText(lang, data);
  const inlineKb = buildHistoryKeyboard(lang, data);

  await ctx.editMessageText(text, { reply_markup: inlineKb });
}

// ── Withdraw ───────────────────────────────────────────
export async function startWithdraw(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  if (user.balance <= 0) {
    await ctx.reply(t(lang, "withdraw_insufficient"));
    return;
  }

  ctx.session.step = "withdraw_amount";

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  await ctx.reply(
    t(lang, "withdraw_amount_prompt", { balance: user.balance.toLocaleString() }),
    { reply_markup: keyboard }
  );
}

export async function handleWithdrawAmount(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  const amount = parseInt(text.replace(/[^\d]/g, ""), 10);
  if (isNaN(amount) || amount <= 0) {
    await ctx.reply(t(lang, "withdraw_amount_prompt", { balance: user.balance.toLocaleString() }));
    return;
  }

  if (amount > user.balance) {
    await ctx.reply(t(lang, "withdraw_insufficient"));
    return;
  }

  // Record the withdraw request (in-memory for now)
  // In production, backend API POST /withdraw-requests
  user.balance -= amount;

  ctx.session.step = "main_menu";

  await ctx.reply(
    t(lang, "withdraw_success", { amount: amount.toLocaleString() }),
    { reply_markup: { remove_keyboard: true } }
  );

  await showMainMenu(ctx);
}

// ── Promo Code ─────────────────────────────────────────
export async function showPromo(ctx: BotContext) {
  const lang = ctx.session.lang;
  ctx.session.step = "promo_enter";

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  await ctx.reply(t(lang, "promo_title") + "\n\n" + t(lang, "promo_enter"), {
    reply_markup: keyboard,
  });
}

export async function handlePromoCode(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;

  // Will be connected to backend API later
  // For now, simulate invalid
  ctx.session.step = "main_menu";

  await ctx.reply(t(lang, "promo_invalid"));
  await showMainMenu(ctx);
}

// ── Referral ───────────────────────────────────────────
export async function showReferral(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  await ctx.reply(
    t(lang, "referral_title") + "\n\n" +
    t(lang, "referral_link", { userId: user.id }) + "\n\n" +
    t(lang, "referral_stats", { count: 0, bonus: "0" }),
    { reply_markup: keyboard }
  );
}

// ── Settings ───────────────────────────────────────────
export async function showSettings(ctx: BotContext) {
  const lang = ctx.session.lang;

  const keyboard = new Keyboard()
    .text(t(lang, "settings_language")).row()
    .text(t(lang, "back_btn"))
    .resized();

  await ctx.reply(t(lang, "settings_title"), { reply_markup: keyboard });
}

export async function showLanguageSettings(ctx: BotContext) {
  const { showLanguageSelection } = await import("./register");
  await showLanguageSelection(ctx);
}

// ── Support ────────────────────────────────────────────
export async function showSupport(ctx: BotContext) {
  const lang = ctx.session.lang;

  const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();

  await ctx.reply(t(lang, "support_title") + "\n\n" + t(lang, "support_text"), {
    reply_markup: keyboard,
  });
}
