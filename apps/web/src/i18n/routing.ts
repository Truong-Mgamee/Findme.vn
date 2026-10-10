import { defineRouting } from 'next-intl/routing';
import { ENABLED_LOCALES } from '@findme/i18n';

/**
 * Internal route names (left) ↔ public, localized slugs. Enabled locales come from @findme/i18n, so a
 * locale flipped to `enabled: true` there gets `/xx/...` routing here without code changes (slugs fall back
 * to the internal name until an entry is added below).
 */
export const PATHNAMES = {
  '/': '/',
  '/almanac-today': { vi: '/lich-am-hom-nay', en: '/lunar-calendar-today' },
  '/almanac/[month]': { vi: '/lich-am/[month]', en: '/lunar-calendar/[month]' },
  '/good-days/[task]': { vi: '/xem-ngay-tot/[task]', en: '/auspicious-days/[task]' },
  '/zodiac/[chi]': { vi: '/tu-vi-12-con-giap/[chi]', en: '/chinese-zodiac/[chi]' },
  '/tarot-card-of-the-day': { vi: '/la-bai-tarot-hom-nay', en: '/tarot-card-of-the-day' },
  '/tarot/[card]': '/tarot/[card]',
  '/life-path-number/[n]': { vi: '/than-so-hoc/so-chu-dao/[n]', en: '/life-path-number/[n]' },
  '/moon-today': { vi: '/mat-trang-hom-nay', en: '/moon-today' },
  '/app': '/app',
  '/app/welcome': '/app/welcome',
  '/app/onboarding': '/app/onboarding',
  '/app/ziwei': '/app/ziwei',
  '/app/bazi': '/app/bazi',
  '/app/numerology': '/app/numerology',
  '/app/astro': '/app/astro',
  '/app/almanac': '/app/almanac',
  '/app/almanac/pick': '/app/almanac/pick',
  '/app/readings': '/app/readings',
  '/app/readings/new': '/app/readings/new',
  '/app/readings/[id]': '/app/readings/[id]',
  '/app/paywall': '/app/paywall',
  '/app/settings': '/app/settings',
  '/offline': '/offline',
} as const;

export const routing = defineRouting({
  locales: ENABLED_LOCALES,
  defaultLocale: 'vi',
  localePrefix: 'always',
  pathnames: PATHNAMES,
});

export type AppLocale = (typeof routing.locales)[number];
export type Pathname = keyof typeof PATHNAMES;

export function isAppLocale(v: string): v is AppLocale {
  return (routing.locales as readonly string[]).includes(v);
}
