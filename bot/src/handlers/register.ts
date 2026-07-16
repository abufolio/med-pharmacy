import { Keyboard } from "grammy";
import bcryptjs from "bcryptjs";
import { nanoid } from "nanoid";
import { BotContext, LanguageCode, SessionData, User } from "../types";
import { t } from "../utils/i18n";
import { prisma } from "../db/prisma";
import { userStore } from "../utils/store";
import { showMainMenu } from "./menu";
import { firstNameSchema, lastNameSchema, passwordSchema, addressSchema } from "../utils/validation";

/**
 * Registration wizard — multi-step form.
 * Steps tracked via session.step:
 *   lang_select → enter_firstname → enter_lastname → enter_phone → enter_address → enter_password → confirm
 */

// ── Language Selection ──────────────────────────────────
export async function showLanguageSelection(ctx: BotContext) {
  ctx.session.step = "lang_select";
  ctx.session.tempRegistration = null;

  const keyboard = new Keyboard()
    .text(t("uz", "uz")).row()
    .text(t("uz", "ru")).row()
    .text(t("uz", "en"))
    .resized().oneTime();

  await ctx.reply(t("uz", "lang_select"), { reply_markup: keyboard });
}

export async function handleLanguageSelection(ctx: BotContext, text: string) {
  const langMap: Record<string, LanguageCode> = {
    "🇺🇿 O'zbekcha": "uz",
    "🇷🇺 Русский": "ru",
    "🇬🇧 English": "en",
  };

  const lang = langMap[text];
  if (!lang) {
    await ctx.reply(t("uz", "lang_select"));
    return;
  }

  ctx.session.lang = lang;
  ctx.session.step = "enter_firstname";

  await ctx.reply(t(lang, "lang_selected"));
  await ctx.reply(t(lang, "welcome_new"));
  await ctx.reply(t(lang, "enter_firstname"), {
    reply_markup: { remove_keyboard: true },
  });
}

// ── First Name ──────────────────────────────────────────
export async function handleFirstName(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const name = text.trim();

  const result = firstNameSchema.safeParse(name);
  if (!result.success) {
    await ctx.reply(t(lang, "enter_firstname"));
    return;
  }

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }
  ctx.session.tempRegistration.firstName = name;
  ctx.session.step = "enter_lastname";

  await ctx.reply(t(lang, "enter_lastname"));
}

// ── Last Name ───────────────────────────────────────────
export async function handleLastName(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const name = text.trim();

  const result = lastNameSchema.safeParse(name);
  if (!result.success) {
    await ctx.reply(t(lang, "enter_lastname"));
    return;
  }

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }
  ctx.session.tempRegistration.lastName = name;
  ctx.session.step = "enter_phone";

  const keyboard = new Keyboard()
    .requestContact(t(lang, "share_phone_btn"))
    .resized().oneTime();

  await ctx.reply(t(lang, "share_phone"), { reply_markup: keyboard });
}

// ── Phone Number ────────────────────────────────────────
export async function handlePhoneNumber(ctx: BotContext, phone: string) {
  const lang = ctx.session.lang;

  // Clean phone number: remove spaces, dashes, parentheses
  const cleanedPhone = phone.replace(/[\s\-\(\)]/g, "");

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }
  ctx.session.tempRegistration.phone = cleanedPhone;
  ctx.session.step = "enter_address";

  // Show keyboard with location share button + text input option
  const keyboard = new Keyboard()
    .requestLocation(t(lang, "share_location_btn")).row()
    .text(t(lang, "back_btn"))
    .resized().oneTime();

  await ctx.reply(t(lang, "enter_address"), {
    reply_markup: keyboard,
  });
}

// ── Address (text — mahalla nomi) ──────────────────────
export async function handleAddress(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const address = text.trim();

  const result = addressSchema.safeParse(address);
  if (!result.success) {
    await ctx.reply(t(lang, "enter_address"));
    return;
  }

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }

  ctx.session.tempRegistration.address = address;
  ctx.session.step = "enter_password";

  await ctx.reply(t(lang, "enter_password"), {
    reply_markup: { remove_keyboard: true },
  });
}

// ── Address (location share — aniq joylashuv) ──────────
export async function handleAddressLocation(
  ctx: BotContext,
  lat: number,
  lng: number,
) {
  const lang = ctx.session.lang;

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }

  // Store coordinates + Google Maps link
  ctx.session.tempRegistration.addressLat = lat;
  ctx.session.tempRegistration.addressLng = lng;
  ctx.session.tempRegistration.address =
    `📍 ${lat}, ${lng} (https://maps.google.com/maps?q=${lat},${lng})`;

  // ✅ Joylashuv olindi — darhol parolga o'tamiz
  // Uy/ko'cha ma'lumotlari yetkazib beruvchi telefonda gaplashadi
  ctx.session.step = "enter_password";

  await ctx.reply(
    t(lang, "location_received", { lat: lat.toFixed(6), lng: lng.toFixed(6) }),
    { reply_markup: { remove_keyboard: true } },
  );

  await ctx.reply(t(lang, "enter_password"));
}

// ── Password ────────────────────────────────────────────
export async function handlePassword(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const password = text.trim();

  const result = passwordSchema.safeParse(password);
  if (!result.success) {
    const firstError = result.error.errors[0]?.message || t(lang, "password_too_short");
    await ctx.reply(firstError);
    return;
  }

  if (!ctx.session.tempRegistration) {
    ctx.session.tempRegistration = { firstName: "", lastName: "", phone: "", address: "", addressLat: null, addressLng: null, password: "" };
  }
  ctx.session.tempRegistration.password = password;
  ctx.session.step = "confirm";

  const reg = ctx.session.tempRegistration;

  const keyboard = new Keyboard()
    .text(t(lang, "confirm_yes")).row()
    .text(t(lang, "confirm_no"))
    .resized().oneTime();

  // If location was shared, show coordinates too
  let addressText = reg.address;
  if (reg.addressLat && reg.addressLng) {
    addressText += `\n📍 Google Maps: https://maps.google.com/maps?q=${reg.addressLat},${reg.addressLng}`;
  }

  await ctx.reply(t(lang, "confirm_title"), { reply_markup: keyboard });
  await ctx.reply(
    t(lang, "confirm_details", {
      firstName: reg.firstName,
      lastName: reg.lastName,
      phone: reg.phone,
      address: addressText,
    }),
    { reply_markup: keyboard }
  );
}

// ── Confirm Registration ────────────────────────────────
export async function handleConfirmation(ctx: BotContext, text: string) {
  const lang = ctx.session.lang;
  const reg = ctx.session.tempRegistration;

  if (!reg) {
    ctx.session.step = "idle";
    await showLanguageSelection(ctx);
    return;
  }

  if (text === t(lang, "confirm_no")) {
    // Restart registration
    ctx.session.step = "idle";
    ctx.session.tempRegistration = null;
    await showLanguageSelection(ctx);
    return;
  }

  if (text !== t(lang, "confirm_yes")) {
    // Unexpected text during confirmation
    await ctx.reply(t(lang, "confirm_title"));
    return;
  }

  // Check for duplicate (by Telegram ID and phone)
  const existingUser = await userStore.findByTelegramId(ctx.from!.id);
  if (existingUser) {
    ctx.session.step = "main_menu";
    await ctx.reply(t(lang, "register_duplicate"));
    await showMainMenu(ctx);
    return;
  }

  const existingPhone = await userStore.findByPhone(reg.phone);
  if (existingPhone) {
    await ctx.reply(t(lang, "register_phone_exists"));
    return;
  }

  // Hash password
  const salt = await bcryptjs.genSalt(12);
  const passwordHash = await bcryptjs.hash(reg.password, salt);

  // Create user
  const newUser: User = {
    id: nanoid(),
    telegramId: ctx.from!.id,
    firstName: reg.firstName,
    lastName: reg.lastName,
    phone: reg.phone,
    address: reg.address,
    addressLat: reg.addressLat,
    addressLng: reg.addressLng,
    passwordHash,
    language: lang,
    status: "PENDING_CARD",
    balance: 0,
    cardUid: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createdUser = await userStore.create(newUser);

  // ── Handle referral deep link ─────────────────────
  // If user came via referral link, create Referral record
  if (reg.referrerUserId) {
    try {
      await prisma.referral.create({
        data: {
          referrerId: reg.referrerUserId,
          referredId: createdUser.id,
          status: "PENDING",
          bonusAmount: 0,
        },
      });
    } catch (err) {
      // Referral creation is non-critical — log but don't block registration
      console.error("[Referral] Failed to create:", err);
    }
  }

  // Clear registration temp data
  ctx.session.tempRegistration = null;
  ctx.session.step = "main_menu";
  ctx.session.isLoggedIn = true;

  await ctx.reply(t(lang, "register_success"), {
    reply_markup: { remove_keyboard: true },
  });

  // Show main menu
  await showMainMenu(ctx);
}
