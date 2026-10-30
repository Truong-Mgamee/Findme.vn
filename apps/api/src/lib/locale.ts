import type { Locale } from '@findme/engine-core';
import { resolveLocale } from '@findme/i18n';

type Headers = Record<string, string | string[] | undefined>;

const first = (h: string | string[] | undefined) => (Array.isArray(h) ? h[0] : h);

/** `X-Locale` wins; else the first `Accept-Language` tag; null when neither is present. */
export function localeFromHeaders(headers: Headers): Locale | null {
  const x = first(headers['x-locale']);
  if (x) return resolveLocale(x);
  const al = first(headers['accept-language']);
  if (!al) return null;
  const tag = al.split(',')[0]?.split(';')[0]?.trim();
  return tag ? resolveLocale(tag) : null;
}

export function isValidTz(tz: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function tzFromHeaders(headers: Headers): string | null {
  const tz = first(headers['x-tz']);
  return tz && isValidTz(tz) ? tz : null;
}

/** YYYY-MM-DD of `now` in an IANA zone. */
export function localDate(tz: string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
