import uz from "../i18n/uz.json";
import ru from "../i18n/ru.json";
import en from "../i18n/en.json";
import { LanguageCode } from "../types";

type TranslationDict = Record<string, string>;

const translations: Record<LanguageCode, TranslationDict> = { uz, ru, en };

/**
 * Get translated string by key and language.
 * Supports template interpolation: {key} -> value
 */
export function t(lang: LanguageCode, key: string, params?: Record<string, string | number>): string {
  const dict = translations[lang];
  if (!dict) {
    return `[missing translation: ${key}]`;
  }

  let text = dict[key];
  if (!text) {
    // Fallback to Uzbek if key missing in selected language
    text = translations.uz[key];
  }
  if (!text) {
    return `[${key}]`;
  }

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(`{${k}}`, String(v));
    }
  }

  return text;
}
