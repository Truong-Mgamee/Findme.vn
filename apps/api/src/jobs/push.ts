/**
 * Push jobs: (1) Daily Oracle push at each user's chosen local hour, at most once per local day;
 * (2) trial-ending reminder 24h before a trial expires (Apple/Google compliance + no surprise renewals).
 * Sends through Expo's push API when PUSH_ENABLED; otherwise logs (dry run).
 */
import { and, eq, gte, inArray, lte } from 'drizzle-orm';
import type { FastifyInstance } from 'fastify';
import { dailyContent, entitlements, pushTokens, users } from '../db/schema.js';
import { localDate } from '../lib/locale.js';
import { usersDueForPush } from './daily-oracle.js';

interface ExpoMessage {
  to: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  sound?: 'default';
}

async function sendExpo(app: FastifyInstance, messages: ExpoMessage[]): Promise<{ sent: number; dryRun: boolean }> {
  if (!messages.length) return { sent: 0, dryRun: !app.config.PUSH_ENABLED };
  if (!app.config.PUSH_ENABLED) {
    app.log.info({ count: messages.length, sample: messages[0] }, 'push dry-run');
    return { sent: messages.length, dryRun: true };
  }
  let sent = 0;
  for (let i = 0; i < messages.length; i += 100) {
    const batch = messages.slice(i, i + 100);
    const res = await fetch(app.config.EXPO_PUSH_URL, { method: 'POST', headers: { 'content-type': 'application/json', accept: 'application/json' }, body: JSON.stringify(batch) });
    if (!res.ok) {
      app.log.error({ status: res.status }, 'expo push failed');
      continue;
    }
    const body = (await res.json()) as { data?: Array<{ status: string; details?: { error?: string } }> };
    body.data?.forEach(async (r, idx) => {
      if (r.status === 'ok') sent++;
      else if (r.details?.error === 'DeviceNotRegistered') await app.db.delete(pushTokens).where(eq(pushTokens.token, batch[idx]!.to));
    });
  }
  return { sent, dryRun: false };
}

const TITLES: Record<string, string> = { vi: 'Hôm nay của bạn', en: 'Your day today' };
const TRIAL_TITLE: Record<string, string> = { vi: 'Gói dùng thử sắp hết', en: 'Your trial ends tomorrow' };
const TRIAL_BODY: Record<string, string> = { vi: 'Gói Plus dùng thử của bạn hết hạn trong 24 giờ. Huỷ bất cứ lúc nào trong Cài đặt nếu bạn không muốn gia hạn.', en: 'Your Plus trial ends in 24 hours. Cancel anytime in Settings if you do not want it to renew.' };

/** Daily Oracle push for users whose daily hour is "now" in their zone. Idempotent per local day via KvStore. */
export async function runDailyPushJob(app: FastifyInstance, now = new Date()): Promise<{ candidates: number; sent: number; dryRun: boolean }> {
  const due = (await usersDueForPush(app, now)).filter(Boolean);
  const messages: ExpoMessage[] = [];
  for (const u of due) {
    const [row] = await app.db.select({ pushEnabled: users.pushEnabled, locale: users.locale, pack: users.traditionPack }).from(users).where(eq(users.id, u.id)).limit(1);
    if (!row?.pushEnabled) continue;
    const day = localDate(u.tz, now);
    const key = `push:daily:${u.id}:${day}`;
    if (await app.store.get(key)) continue;
    const tokens = await app.db.select({ token: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, u.id));
    if (!tokens.length) continue;
    const seg = row.pack === 'western' ? 'w:common' : 'ea:common';
    const [content] = await app.db.select().from(dailyContent).where(and(eq(dailyContent.date, day), inArray(dailyContent.locale, [row.locale, 'en']), eq(dailyContent.segmentKey, seg))).limit(1);
    const headline = (content?.payloadJson as { headline?: string } | undefined)?.headline ?? (row.locale === 'vi' ? 'Lịch ngày và lá bài hôm nay đã sẵn sàng' : 'Your almanac and card for today are ready');
    for (const t of tokens) messages.push({ to: t.token, title: TITLES[row.locale] ?? TITLES.en!, body: headline, data: { url: 'findme://today', date: day }, sound: 'default' });
    await app.store.set(key, '1', 36 * 3600);
  }
  const r = await sendExpo(app, messages);
  app.metrics.inc('push_daily_total', { dryRun: String(r.dryRun) }, r.sent);
  return { candidates: due.length, ...r };
}

/** Trial reminders: trialing entitlements expiring in the next 24–25h window (run hourly). */
export async function runTrialReminderJob(app: FastifyInstance, now = new Date()): Promise<{ reminded: number; dryRun: boolean }> {
  const from = new Date(now.getTime() + 23 * 3600 * 1000);
  const to = new Date(now.getTime() + 25 * 3600 * 1000);
  const rows = await app.db.select().from(entitlements).where(and(eq(entitlements.trial, true), eq(entitlements.status, 'trialing'), gte(entitlements.expiresAt, from), lte(entitlements.expiresAt, to)));
  const messages: ExpoMessage[] = [];
  for (const e of rows) {
    const key = `push:trial:${e.userId}:${e.product}`;
    if (await app.store.get(key)) continue;
    const [u] = await app.db.select({ locale: users.locale }).from(users).where(eq(users.id, e.userId)).limit(1);
    const tokens = await app.db.select({ token: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, e.userId));
    for (const t of tokens) messages.push({ to: t.token, title: TRIAL_TITLE[u?.locale ?? 'en'] ?? TRIAL_TITLE.en!, body: TRIAL_BODY[u?.locale ?? 'en'] ?? TRIAL_BODY.en!, data: { url: 'findme://settings/subscription' } });
    await app.store.set(key, '1', 7 * 86400);
  }
  const r = await sendExpo(app, messages);
  return { reminded: rows.length, dryRun: r.dryRun };
}
