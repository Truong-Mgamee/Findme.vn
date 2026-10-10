import type { CalendarStandard, Locale, TraditionPack } from '@findme/engine-core';

export interface LocaleConfig {
  locale: Locale;
  direction: 'ltr' | 'rtl';
  /** BCP-47 tag for Intl APIs */
  intlTag: string;
  nativeName: string;
  /** Which tradition pack onboarding pre-selects */
  defaultTraditionPack: TraditionPack;
  /** iztro language code */
  iztroLang: 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP' | 'ko-KR' | 'vi-VN';
  /** lunar-typescript I18n code */
  lunarLang: 'chs' | 'en';
  enabled: boolean;
  wave: 1 | 2 | 3;
}

export const LOCALE_CONFIGS: Record<Locale, LocaleConfig> = {
  vi: { locale: 'vi', direction: 'ltr', intlTag: 'vi-VN', nativeName: 'Tiếng Việt', defaultTraditionPack: 'eastAsia', iztroLang: 'vi-VN', lunarLang: 'chs', enabled: true, wave: 1 },
  en: { locale: 'en', direction: 'ltr', intlTag: 'en-US', nativeName: 'English', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: true, wave: 1 },
  es: { locale: 'es', direction: 'ltr', intlTag: 'es-ES', nativeName: 'Español', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 2 },
  'pt-BR': { locale: 'pt-BR', direction: 'ltr', intlTag: 'pt-BR', nativeName: 'Português (Brasil)', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 2 },
  ja: { locale: 'ja', direction: 'ltr', intlTag: 'ja-JP', nativeName: '日本語', defaultTraditionPack: 'both', iztroLang: 'ja-JP', lunarLang: 'chs', enabled: false, wave: 2 },
  ko: { locale: 'ko', direction: 'ltr', intlTag: 'ko-KR', nativeName: '한국어', defaultTraditionPack: 'both', iztroLang: 'ko-KR', lunarLang: 'chs', enabled: false, wave: 2 },
  'zh-TW': { locale: 'zh-TW', direction: 'ltr', intlTag: 'zh-Hant-TW', nativeName: '繁體中文', defaultTraditionPack: 'eastAsia', iztroLang: 'zh-TW', lunarLang: 'chs', enabled: false, wave: 2 },
  'zh-CN': { locale: 'zh-CN', direction: 'ltr', intlTag: 'zh-Hans', nativeName: '简体中文', defaultTraditionPack: 'eastAsia', iztroLang: 'zh-CN', lunarLang: 'chs', enabled: false, wave: 2 },
  hi: { locale: 'hi', direction: 'ltr', intlTag: 'hi-IN', nativeName: 'हिन्दी', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 3 },
  th: { locale: 'th', direction: 'ltr', intlTag: 'th-TH', nativeName: 'ไทย', defaultTraditionPack: 'both', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 3 },
  id: { locale: 'id', direction: 'ltr', intlTag: 'id-ID', nativeName: 'Bahasa Indonesia', defaultTraditionPack: 'both', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 3 },
  fr: { locale: 'fr', direction: 'ltr', intlTag: 'fr-FR', nativeName: 'Français', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 3 },
  de: { locale: 'de', direction: 'ltr', intlTag: 'de-DE', nativeName: 'Deutsch', defaultTraditionPack: 'western', iztroLang: 'en-US', lunarLang: 'en', enabled: false, wave: 3 },
};

export const ENABLED_LOCALES = (Object.keys(LOCALE_CONFIGS) as Locale[]).filter((l) => LOCALE_CONFIGS[l].enabled);

/** Default lunisolar calendar standard by ISO country. */
export function defaultCalendarStandard(country?: string): CalendarStandard {
  switch ((country ?? '').toUpperCase()) {
    case 'VN':
      return 'vn';
    case 'KR':
    case 'KP':
      return 'kr';
    case 'JP':
      return 'jp';
    default:
      return 'cn';
  }
}

/** Default tradition pack by ISO country (falls back to locale default). */
export function defaultTraditionPack(country: string | undefined, locale: Locale): TraditionPack {
  const c = (country ?? '').toUpperCase();
  if (['VN', 'CN', 'TW', 'HK', 'MO', 'SG', 'MY'].includes(c)) return 'eastAsia';
  if (['JP', 'KR', 'TH'].includes(c)) return 'both';
  if (c) return 'western';
  return LOCALE_CONFIGS[locale].defaultTraditionPack;
}

/** Map a device/browser language tag to a supported Locale (enabled first, then any). */
export function resolveLocale(tag: string | undefined, fallback: Locale = 'en'): Locale {
  if (!tag) return fallback;
  const lower = tag.toLowerCase();
  const exact = (Object.keys(LOCALE_CONFIGS) as Locale[]).find((l) => l.toLowerCase() === lower);
  if (exact) return exact;
  const base = lower.split(/[-_]/)[0];
  if (base === 'zh') return lower.includes('hant') || lower.includes('tw') || lower.includes('hk') ? 'zh-TW' : 'zh-CN';
  if (base === 'pt') return 'pt-BR';
  const byBase = (Object.keys(LOCALE_CONFIGS) as Locale[]).find((l) => l.toLowerCase().split('-')[0] === base);
  return byBase ?? fallback;
}
