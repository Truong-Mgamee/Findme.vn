import type { AppLocale } from '@/i18n/routing';

export const TZ_BY_LOCALE: Record<AppLocale, string> = { vi: 'Asia/Ho_Chi_Minh', en: 'UTC' };

export const pad2 = (n: number): string => String(n).padStart(2, '0');

/** YYYY-MM-DD of `now` in an IANA zone. */
export function localDate(tz: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** YYYY-MM-DD in UTC — the Daily Oracle job seeds the `w:common` tarot card with this date. */
export function utcDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function addDays(date: string, n: number): string {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}

export function parseYmd(date: string): { y: number; m: number; d: number } {
  const [y, m, d] = date.split('-').map(Number) as [number, number, number];
  return { y, m, d };
}

export function isValidYmd(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const { y, m, d } = parseYmd(date);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

export function daysInMonth(y: number, m: number): number {
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
}

/** "2026-10" → {y, m} or null */
export function parseYm(ym: string): { y: number; m: number } | null {
  const match = /^(\d{4})-(\d{2})$/.exec(ym);
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  if (m < 1 || m > 12 || y < 1900 || y > 2100) return null;
  return { y, m };
}

export function shiftMonth(y: number, m: number, by: number): string {
  const d = new Date(Date.UTC(y, m - 1 + by, 1));
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}`;
}

/** UTC instant of local noon in `tz` on `date` (same rule as the API's Daily Oracle). */
export function zonedNoonUtc(date: string, tz: string): Date {
  const guess = new Date(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour12: false, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(guess);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour') % 24, get('minute'));
  return new Date(guess.getTime() - (asUtc - guess.getTime()));
}

export function formatDate(date: string, locale: AppLocale, opts: Intl.DateTimeFormatOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }): string {
  const { y, m, d } = parseYmd(date);
  return new Intl.DateTimeFormat(locale === 'vi' ? 'vi-VN' : 'en-US', { timeZone: 'UTC', ...opts }).format(new Date(Date.UTC(y, m - 1, d)));
}
