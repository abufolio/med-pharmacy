import { InlineKeyboard, Keyboard } from "grammy";
import { BotContext, LanguageCode } from "../types";
import { t } from "../utils/i18n";
import { userStore } from "../utils/store";

// ── Card Info Screen ─────────────────────────────────
export async function showCardInfo(ctx: BotContext) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  ctx.session.step = "card_viewing";

  const cardDetails = await userStore.getCardDetails(ctx.from!.id);

  if (!cardDetails) {
    // No card assigned
    const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();
    await ctx.reply(
      t(lang, "card_info_title") + "\n\n" + t(lang, "card_no_card"),
      { reply_markup: keyboard },
    );
    return;
  }

  const statusLabel = getCardStatusLabel(lang, cardDetails.status);
  const extra =
    cardDetails.assignmentStatus === "ACTIVE"
      ? "⭐ " + t(lang, "card_history_current")
      : "";

  const issuedDate = formatCardDate(cardDetails.issuedAt);

  const inlineKb = new InlineKeyboard()
    .text(t(lang, "btn_card_history"), "card_history:0")
    .row()
    .text("⬅️ " + t(lang, "back_btn"), "card_back");

  await ctx.reply(
    t(lang, "card_info_title") +
      "\n\n" +
      t(lang, "card_info_details", {
        uid: cardDetails.uid,
        status: statusLabel,
        issuedAt: issuedDate,
        extra,
      }),
    { reply_markup: inlineKb },
  );
}

// ── Card History Screen ──────────────────────────────
export async function showCardHistory(ctx: BotContext, page: number = 0) {
  const lang = ctx.session.lang;
  const user = await userStore.findByTelegramId(ctx.from!.id);
  if (!user) return;

  ctx.session.step = "card_history_viewing";

  const data = await userStore.getCardHistory(ctx.from!.id, page);
  if (!data || data.items.length === 0) {
    const keyboard = new Keyboard().text(t(lang, "back_btn")).resized();
    await ctx.reply(
      t(lang, "card_history_title") + "\n\n" + t(lang, "card_history_empty"),
      { reply_markup: keyboard },
    );
    return;
  }

  const text = buildCardHistoryText(lang, data);
  const inlineKb = buildCardHistoryKeyboard(lang, data);

  await ctx.reply(text, { reply_markup: inlineKb });
}

// ── Card History Pagination Handler ──────────────────
export async function handleCardHistoryPagination(
  ctx: BotContext,
  page: number,
) {
  const lang = ctx.session.lang;
  ctx.session.step = "card_history_viewing";

  const data = await userStore.getCardHistory(ctx.from!.id, page);
  if (!data || data.items.length === 0) {
    await ctx.editMessageText(
      t(lang, "card_history_title") + "\n\n" + t(lang, "card_history_empty"),
      {
        reply_markup: new InlineKeyboard().text(
          "⬅️ " + t(lang, "back_btn"),
          "card_back",
        ),
      },
    );
    return;
  }

  const text = buildCardHistoryText(lang, data);
  const inlineKb = buildCardHistoryKeyboard(lang, data);

  await ctx.editMessageText(text, { reply_markup: inlineKb });
}

// ── Helpers ──────────────────────────────────────────

function getCardStatusLabel(lang: LanguageCode, status: string): string {
  switch (status) {
    case "ACTIVE":
      return t(lang, "card_status_active");
    case "BLOCKED":
      return t(lang, "card_status_blocked");
    case "UNASSIGNED":
      return t(lang, "card_status_unassigned");
    case "REPLACED":
      return t(lang, "card_status_replaced");
    default:
      return t(lang, "card_status_pending");
  }
}

function buildCardHistoryText(
  lang: LanguageCode,
  data: { items: Array<{
    uid: string;
    status: string;
    assignedAt: Date;
    unassignedAt: Date | null;
    isCurrent: boolean;
  }>; page: number; totalPages: number; total: number },
): string {
  const lines: string[] = [t(lang, "card_history_title"), ""];

  for (const item of data.items) {
    const statusLabel = getCardStatusLabel(lang, item.status);
    const assignedAt = formatCardDate(item.assignedAt);
    const unassignLine = item.isCurrent
      ? t(lang, "card_history_current")
      : item.unassignedAt
        ? t(lang, "card_history_unassigned", {
            date: formatCardDate(item.unassignedAt),
          })
        : t(lang, "card_history_current");

    lines.push(
      t(lang, "card_history_item", {
        uid: item.uid,
        assignedAt,
        status: statusLabel,
        unassignLine,
      }),
    );
    lines.push(""); // spacer
  }

  lines.push(
    t(lang, "card_history_page_info", {
      page: data.page + 1,
      total: data.totalPages,
      count: data.total,
    }),
  );

  return lines.join("\n");
}

function buildCardHistoryKeyboard(
  lang: LanguageCode,
  data: { page: number; totalPages: number },
): InlineKeyboard {
  const kb = new InlineKeyboard();

  if (data.totalPages > 1) {
    if (data.page > 0) {
      kb.text(
        "⬅️ " + t(lang, "card_history_prev_btn"),
        `card_hist_page:${data.page - 1}`,
      );
    }
    kb.text(`${data.page + 1}/${data.totalPages}`, "card_hist_page_cur");
    if (data.page < data.totalPages - 1) {
      kb.text(
        t(lang, "card_history_next_btn") + " ➡️",
        `card_hist_page:${data.page + 1}`,
      );
    }
  }

  kb.row().text("⬅️ " + t(lang, "back_btn"), "card_back");
  return kb;
}

function formatCardDate(date: Date): string {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${day}.${month}.${year} ${hours}:${minutes}`;
}
