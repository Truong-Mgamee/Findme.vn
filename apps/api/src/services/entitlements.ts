/**
 * Entitlements, credits and quotas (docs/04 §6 "Quota free").
 *   deep_reading : first reading free (free_first) → subscription → 1 credit → 402
 *   almanac_pick : subscription → 1 credit (payWith:'credit') → 402
 *   ask_ai       : 3/day free (quota store) — wired in P8
 */
import { and, eq, gt, inArray, isNull, or, sql } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { creditsLedger, entitlements, readings } from '../db/schema.js';
import { PaywallError } from '../lib/errors.js';
import { secondsUntilMidnightUtc, type KvStore } from '../lib/store.js';

export type Feature = 'deep_reading' | 'almanac_pick' | 'ask_ai';
export type PaidBy = 'free_first' | 'subscription' | 'credit' | 'none';

/** Products (subscription SKUs) that unlock each feature. */
export const FEATURE_PRODUCTS: Record<Feature, string[]> = {
  deep_reading: ['plus', 'pro'],
  almanac_pick: ['plus', 'pro'],
  ask_ai: ['plus', 'pro'],
};
/** Credit cost per feature when paid with credits. */
export const CREDIT_COST: Record<Feature, number> = { deep_reading: 1, almanac_pick: 1, ask_ai: 1 };
/** Daily free quota (for later: ask_ai). */
export const DAILY_FREE_QUOTA: Partial<Record<Feature, number>> = { ask_ai: 3 };

const ACTIVE_STATUSES = ['active', 'trialing', 'cancelled'];

export async function activeEntitlements(db: Db, userId: string) {
  const now = new Date();
  return db
    .select()
    .from(entitlements)
    .where(and(eq(entitlements.userId, userId), inArray(entitlements.status, ACTIVE_STATUSES), or(isNull(entitlements.expiresAt), gt(entitlements.expiresAt, now))));
}

export async function creditBalance(db: Db, userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: sql<number>`coalesce(sum(${creditsLedger.delta}), 0)` })
    .from(creditsLedger)
    .where(eq(creditsLedger.userId, userId));
  return Number(row?.balance ?? 0);
}

export async function hasSubscriptionFor(db: Db, userId: string, feature: Feature): Promise<boolean> {
  const rows = await activeEntitlements(db, userId);
  return rows.some((r) => FEATURE_PRODUCTS[feature].includes(r.product));
}

export async function freeFirstUsed(db: Db, userId: string): Promise<boolean> {
  const [row] = await db.select({ id: readings.id }).from(readings).where(and(eq(readings.userId, userId), eq(readings.paidBy, 'free_first'))).limit(1);
  return !!row;
}

export interface PaymentDecision {
  paidBy: PaidBy;
  creditCost: number;
}

/**
 * Decide how a feature use is paid for. Does NOT debit; call `debitCredits` inside the
 * same transaction that stores the paid-for row.
 */
export async function resolvePayment(db: Db, userId: string, feature: Feature, opts: { payWith?: 'credit'; allowFreeFirst?: boolean } = {}): Promise<PaymentDecision> {
  if (opts.allowFreeFirst && !(await freeFirstUsed(db, userId))) return { paidBy: 'free_first', creditCost: 0 };
  if (await hasSubscriptionFor(db, userId, feature)) return { paidBy: 'subscription', creditCost: 0 };
  const balance = await creditBalance(db, userId);
  const cost = CREDIT_COST[feature];
  if (opts.payWith === 'credit') {
    if (balance >= cost) return { paidBy: 'credit', creditCost: cost };
    throw new PaywallError('insufficient_credits', { feature, credits: balance, required: cost });
  }
  throw new PaywallError(`${feature}_requires_plus`, { feature, credits: balance, creditCost: cost, products: FEATURE_PRODUCTS[feature] });
}

/** Debit inside a transaction; re-checks the balance under a row lock so two requests cannot overspend. */
export async function debitCredits(tx: Db, userId: string, amount: number, reason: string, refId: string): Promise<number> {
  await tx.execute(sql`select id from users where id = ${userId} for update`);
  const balance = await creditBalance(tx, userId);
  if (balance < amount) throw new PaywallError('insufficient_credits', { credits: balance, required: amount });
  await tx.insert(creditsLedger).values({ userId, delta: -amount, reason, refId });
  return balance - amount;
}

/** Idempotent grant (unique ref_id). Returns false when the ref was already applied. */
export async function grantCredits(db: Db, userId: string, amount: number, reason: string, refId: string): Promise<boolean> {
  const res = await db.insert(creditsLedger).values({ userId, delta: amount, reason, refId }).onConflictDoNothing({ target: creditsLedger.refId }).returning({ id: creditsLedger.id });
  return res.length > 0;
}

export async function upsertEntitlement(db: Db, row: { userId: string; product: string; status: string; source: string; expiresAt: Date | null; trial: boolean; rawJson: Record<string, unknown> }) {
  await db
    .insert(entitlements)
    .values({ ...row, updatedAt: new Date() })
    .onConflictDoUpdate({ target: [entitlements.userId, entitlements.product], set: { status: row.status, source: row.source, expiresAt: row.expiresAt, trial: row.trial, rawJson: row.rawJson, updatedAt: new Date() } });
}

/** Daily quota via the KV store (ask_ai later). Returns remaining after consuming one. */
export async function consumeDailyQuota(store: KvStore, userId: string, feature: Feature, day: string): Promise<{ allowed: boolean; remaining: number }> {
  const limit = DAILY_FREE_QUOTA[feature] ?? 0;
  const n = await store.incr(`quota:${feature}:${userId}:${day}`, secondsUntilMidnightUtc());
  return { allowed: n <= limit, remaining: Math.max(0, limit - n) };
}

export async function entitlementSummary(db: Db, userId: string) {
  const [subs, credits, used] = await Promise.all([activeEntitlements(db, userId), creditBalance(db, userId), freeFirstUsed(db, userId)]);
  const features = (Object.keys(FEATURE_PRODUCTS) as Feature[]).filter((f) => subs.some((s) => FEATURE_PRODUCTS[f].includes(s.product)));
  return {
    subscriptions: subs.map((s) => ({ product: s.product, status: s.status, source: s.source, expiresAt: s.expiresAt?.toISOString() ?? null, trial: s.trial })),
    credits,
    features,
    freeFirstReadingAvailable: !used,
  };
}
