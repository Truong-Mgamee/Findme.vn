/**
 * i18next bridge over the shared catalogs in packages/i18n (ICU messages via i18next-icu).
 * Also exposes a pseudo-locale (dev settings) that expands text ~35% and brackets strings so
 * truncation/hard-coded copy is visible during QA (docs/05 §4).
 */
import i18next from 'i18next';
import ICU from 'i18next-icu';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { I18nManager } from 'react-native';
import type { Locale } from '@findme/engine-core';
import { ENABLED_LOCALES, flattenKeys, getCatalog, LOCALE_CONFIGS, resolveLocale } from '@findme/i18n';

export const PSEUDO = 'en-XA';

const ACCENTS: Record<string, string> = { a: 'á', b: 'ƀ', c: 'ç', d: 'ď', e: 'ë', g: 'ĝ', h: 'ĥ', i: 'ï', j: 'ĵ', k: 'ķ', l: 'ľ', n: 'ñ', o: 'ø', r: 'ř', s: 'š', t: 'ŧ', u: 'ü', w: 'ŵ', y: 'ÿ', z: 'ž', A: 'Å', C: 'Ç', E: 'É', I: 'Ï', N: 'Ñ', O: 'Ø', S: 'Š', U: 'Ü', Y: 'Ý', Z: 'Ž' };

/** Expand + accent, but leave ICU `{…}` arguments intact. */
export function pseudoLocalize(msg: string): string {
  let out = '';
  let depth = 0;
  for (const ch of msg) {
    if (ch === '{') depth++;
    if (depth === 0) out += ACCENTS[ch] ?? ch;
    else out += ch;
    if (ch === '}') depth = Math.max(0, depth - 1);
  }
  const pad = '~'.repeat(Math.ceil(msg.replace(/\{[^}]*\}/g, '').length * 0.35));
  return `[${out}${pad}]`;
}

function buildPseudoCatalog(): Record<string, unknown> {
  const en = getCatalog('en') ?? {};
  const out: Record<string, unknown> = {};
  for (const key of flattenKeys(en)) {
    const parts = key.split('.');
    let cur: Record<string, unknown> = out;
    let src: unknown = en;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i]!;
      src = (src as Record<string, unknown>)[p];
      if (i === parts.length - 1) cur[p] = typeof src === 'string' ? pseudoLocalize(src) : src;
      else cur = (cur[p] ??= {}) as Record<string, unknown>;
    }
  }
  return out;
}

export function deviceLocale(): Locale {
  const tag = getLocales()[0]?.languageTag;
  const l = resolveLocale(tag, 'en');
  return ENABLED_LOCALES.includes(l) ? l : 'en';
}

export function deviceCountry(): string | undefined {
  return getLocales()[0]?.regionCode ?? undefined;
}

export function deviceTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

let initialized = false;

export async function initI18n(locale: Locale | typeof PSEUDO): Promise<typeof i18next> {
  if (!initialized) {
    const resources: Record<string, { translation: Record<string, unknown> }> = {};
    for (const l of Object.keys(LOCALE_CONFIGS) as Locale[]) {
      const c = getCatalog(l);
      if (c) resources[l] = { translation: c };
    }
    resources[PSEUDO] = { translation: buildPseudoCatalog() };
    await i18next
      .use(ICU)
      .use(initReactI18next)
      .init({
        resources,
        lng: locale,
        fallbackLng: 'en',
        interpolation: { escapeValue: false },
        returnNull: false,
        keySeparator: '.',
        nsSeparator: false,
        compatibilityJSON: 'v4',
      });
    initialized = true;
  } else if (i18next.language !== locale) {
    await i18next.changeLanguage(locale);
  }
  const cfg = LOCALE_CONFIGS[locale as Locale];
  const rtl = cfg?.direction === 'rtl';
  if (I18nManager.isRTL !== rtl) I18nManager.allowRTL(rtl);
  return i18next;
}

export async function changeLocale(locale: Locale | typeof PSEUDO): Promise<void> {
  await initI18n(locale);
}

/** BCP-47 tag for Intl formatting of the active UI locale. */
export function intlTag(locale: string): string {
  return LOCALE_CONFIGS[locale as Locale]?.intlTag ?? (locale === PSEUDO ? 'en-US' : locale);
}

export { i18next };
