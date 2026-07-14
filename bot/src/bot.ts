import { Bot, GrammyError, HttpError } from "grammy";
import { BotContext } from "./types";
import { config } from "./config";
import { sessionMiddleware } from "./middlewares/session";
import { t } from "./utils/i18n";
import { userStore } from "./utils/store";

// ── Handler imports ──────────────────────────────────
import {
  showLanguageSelection,
  handleLanguageSelection,
  handleFirstName,
  handleLastName,
  handlePhoneNumber,
  handleAddress,
  handleAddressLocation,
  handlePassword,
  handleConfirmation,
} from "./handlers/register";
import {
  showMainMenu,
  showProfile,
  showBalance,
  showHistory,
  startWithdraw,
  handleWithdrawAmount,
  showPromo,
  handlePromoCode,
  showReferral,
  showSettings,
  showLanguageSettings,
  showSupport,
  handleHistoryPagination,
} from "./handlers/menu";
import {
  startLogin,
  handleLoginPassword,
  startLogout,
  requireAuth,
} from "./handlers/auth";

// ── Create Bot ───────────────────────────────────────
export const bot = new Bot<BotContext>(config.bot.token);

// ── Register Middleware ──────────────────────────────
bot.use(sessionMiddleware);

// ── Error Handler ────────────────────────────────────
bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`[BOT ERROR] Update ${ctx.update.update_id}:`, err.error);

  if (err.error instanceof GrammyError) {
    console.error(`[GrammyError] ${err.error.description}`);
  } else if (err.error instanceof HttpError) {
    console.error(`[HttpError] ${err.error}`);
  }
});

// ── Start Command ────────────────────────────────────
bot.command("start", async (ctx) => {
  if (!ctx.from) return;

  const existingUser = await userStore.findByTelegramId(ctx.from.id);
  if (existingUser) {
    ctx.session.lang = existingUser.language;
    ctx.session.step = "main_menu";

    if (!ctx.session.isLoggedIn) {
      await ctx.reply(t(existingUser.language, "login_required"));
      return;
    }

    await showMainMenu(ctx);
    return;
  }

  // Check for referral deep link: /start ref_<userId>
  const args = ctx.match;
  if (args && args.startsWith("ref_")) {
    // Store referrer ID in session for later use after registration
    ctx.session.tempRegistration = {
      firstName: "",
      lastName: "",
      phone: "",
      address: "",
      addressLat: null,
      addressLng: null,
      password: "",
    };
  }

  await showLanguageSelection(ctx);
});

// ── Login Command ────────────────────────────────────
bot.command("login", async (ctx) => {
  if (!ctx.from) return;
  await startLogin(ctx);
});

// ── Logout Command ───────────────────────────────────
bot.command("logout", async (ctx) => {
  if (!ctx.from) return;
  await startLogout(ctx);
});

// ── Text Handler (routing by session step) ───────────
bot.on("message:text", async (ctx) => {
  if (!ctx.from) return;
  const text = ctx.message.text.trim();
  const lang = ctx.session.lang;
  const step = ctx.session.step;

  // ── Handle "Back" / "Cancel" buttons globally ──
  if (text === t("uz", "back_btn") || text === t("ru", "back_btn") || text === t("en", "back_btn")) {
    if (step === "main_menu") {
      await showMainMenu(ctx);
    } else {
      await showMainMenu(ctx);
    }
    return;
  }

  if (text === t("uz", "cancel_btn") || text === t("ru", "cancel_btn") || text === t("en", "cancel_btn")) {
    await showMainMenu(ctx);
    return;
  }

  // ── Route by current step ──
  switch (step) {
    // ── Registration Flow ──
    case "lang_select":
      await handleLanguageSelection(ctx, text);
      break;

    case "enter_firstname":
      await handleFirstName(ctx, text);
      break;

    case "enter_lastname":
      await handleLastName(ctx, text);
      break;

    case "enter_address":
      await handleAddress(ctx, text);
      break;

    case "enter_password":
      await handlePassword(ctx, text);
      break;

    case "confirm":
      await handleConfirmation(ctx, text);
      break;

    // ── Main Menu Actions ──
    case "main_menu":
      await handleMainMenuAction(ctx, text);
      break;

    // ── Login ──
    case "login_password":
      await handleLoginPassword(ctx, text);
      break;

    // ── Withdraw ──
    case "withdraw_amount":
      await requireAuth(ctx, () => handleWithdrawAmount(ctx, text));
      break;

    // ── Promo ──
    case "promo_enter":
      await requireAuth(ctx, () => handlePromoCode(ctx, text));
      break;

    default:
      await ctx.reply(t(lang, "unknown_command"));
      await showMainMenu(ctx);
      break;
  }
});

// ── Contact Message Handler (phone number sharing) ──
bot.on("message:contact", async (ctx) => {
  if (!ctx.from) return;
  const contact = ctx.message.contact;

  // Verify the shared phone belongs to the user (basic check)
  if (contact.user_id !== ctx.from.id) {
    await ctx.reply("❌ Iltimos, o'z telefon raqamingizni ulashing!");
    return;
  }

  const phone = contact.phone_number;
  await handlePhoneNumber(ctx, phone);
});

// ── Location Message Handler ────────────────────────────
bot.on("message:location", async (ctx) => {
  if (!ctx.from) return;

  // Only handle location in registration flow
  if (ctx.session.step !== "enter_address") return;

  const { latitude, longitude } = ctx.message.location;
  await handleAddressLocation(ctx, latitude, longitude);
});

// ── Callback Query Handler (inline keyboard navigation) ──
bot.on("callback_query:data", async (ctx) => {
  if (!ctx.from) return;
  const data = ctx.callbackQuery.data;

  // ── History pagination: hist_page:0, hist_page:1, ... ──
  if (data.startsWith("hist_page:")) {
    const page = parseInt(data.split(":")[1], 10);
    if (!isNaN(page)) {
      await handleHistoryPagination(ctx, page);
    }
    await ctx.answerCallbackQuery();
    return;
  }

  // ── History → Back to Main Menu ──
  if (data === "hist_back") {
    await ctx.answerCallbackQuery();
    try { await ctx.deleteMessage(); } catch (_) { /* ignore if already deleted */ }
    await showMainMenu(ctx);
    return;
  }

  // ── Current-page label button (no-op) ──
  if (data === "hist_page_cur") {
    await ctx.answerCallbackQuery();
    return;
  }

  await ctx.answerCallbackQuery();
});

// ── Handle main menu button presses ─────────────────
async function handleMainMenuAction(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;

  // All menu actions require auth
  if (!ctx.session.isLoggedIn) {
    await ctx.reply(t(lang, "login_required"));
    return;
  }

  // Create reverse mapping for main menu buttons in all 3 languages
  const menuActions: Record<string, () => Promise<void>> = {
    // Profile (all 3 languages)
    [t("uz", "btn_profile")]: () => showProfile(ctx),
    [t("ru", "btn_profile")]: () => showProfile(ctx),
    [t("en", "btn_profile")]: () => showProfile(ctx),
    // Balance
    [t("uz", "btn_balance")]: () => showBalance(ctx),
    [t("ru", "btn_balance")]: () => showBalance(ctx),
    [t("en", "btn_balance")]: () => showBalance(ctx),
    // History
    [t("uz", "btn_history")]: () => showHistory(ctx),
    [t("ru", "btn_history")]: () => showHistory(ctx),
    [t("en", "btn_history")]: () => showHistory(ctx),
    // Withdraw
    [t("uz", "btn_withdraw")]: () => startWithdraw(ctx),
    [t("ru", "btn_withdraw")]: () => startWithdraw(ctx),
    [t("en", "btn_withdraw")]: () => startWithdraw(ctx),
    // Promo
    [t("uz", "btn_promo")]: () => showPromo(ctx),
    [t("ru", "btn_promo")]: () => showPromo(ctx),
    [t("en", "btn_promo")]: () => showPromo(ctx),
    // Referral
    [t("uz", "btn_referral")]: () => showReferral(ctx),
    [t("ru", "btn_referral")]: () => showReferral(ctx),
    [t("en", "btn_referral")]: () => showReferral(ctx),
    // Settings
    [t("uz", "btn_settings")]: () => showSettings(ctx),
    [t("ru", "btn_settings")]: () => showSettings(ctx),
    [t("en", "btn_settings")]: () => showSettings(ctx),
    // Support
    [t("uz", "btn_support")]: () => showSupport(ctx),
    [t("ru", "btn_support")]: () => showSupport(ctx),
    [t("en", "btn_support")]: () => showSupport(ctx),
    // Settings → Language change
    [t("uz", "settings_language")]: () => showLanguageSettings(ctx),
    [t("ru", "settings_language")]: () => showLanguageSettings(ctx),
    [t("en", "settings_language")]: () => showLanguageSettings(ctx),
    // Login button
    [t("uz", "btn_login")]: () => startLogin(ctx),
    [t("ru", "btn_login")]: () => startLogin(ctx),
    [t("en", "btn_login")]: () => startLogin(ctx),
  };

  const action = menuActions[text];
  if (action) {
    await action();
  } else if (text === t(lang, "back_btn")) {
    // Re-show main menu if already there
    await showMainMenu(ctx);
  } else {
    await ctx.reply(t(lang, "unknown_command"));
  }
}
