/**
 * Payment webhooks → entitlements / credits. Idempotent by provider event id (webhook_events).
 *  - RevenueCat: `Authorization: Bearer <REVENUECAT_WEBHOOK_SECRET>` (checked when the secret is set)
 *  - Stripe:     `Stripe-Signature: t=…,v1=…` HMAC-SHA256 over `${t}.${rawBody}` (checked when set)
 * Products: entitlement/price metadata `product` ∈ {plus, pro}; credit packs are `credits_<n>`.
 */
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import type { FastifyRequest } from 'fastify';
import { createHmac } from 'node:crypto';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { users, webhookEvents } from '../db/schema.js';
import { timingSafeEqualStr } from '../lib/crypto.js';
import { unauthorized } from '../lib/errors.js';
import { grantCredits, upsertEntitlement } from '../services/entitlements.js';

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: string;
  }
}

const Ack = z.object({ received: z.literal(true), duplicate: z.boolean(), applied: z.array(z.string()) });

const CREDIT_PACK = /credits?[_-]?(\d+)/i;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function productOf(raw: string | undefined, entitlementIds?: string[]): string | null {
  const e = entitlementIds?.[0]?.toLowerCase();
  if (e === 'plus' || e === 'pro') return e;
  const r = raw?.toLowerCase() ?? '';
  if (r.includes('pro')) return 'pro';
  if (r.includes('plus')) return 'plus';
  return null;
}

export const webhookRoutes: FastifyPluginAsyncZod = async (app) => {
  // keep the raw body for signature verification (scoped to this plugin)
  app.addContentTypeParser('application/json', { parseAs: 'string' }, (req: FastifyRequest, body: string, done) => {
    req.rawBody = body;
    try {
      done(null, body.length ? JSON.parse(body) : {});
    } catch (e) {
      done(e as Error, undefined);
    }
  });

  const recordEvent = async (id: string, source: string, type: string, userId: string | null, raw: Record<string, unknown>) => {
    const res = await app.db.insert(webhookEvents).values({ id, source, type, userId, rawJson: raw }).onConflictDoNothing().returning({ id: webhookEvents.id });
    return res.length > 0;
  };
  const userExists = async (id: string | undefined | null) => {
    if (!id || !UUID.test(id)) return null;
    const [u] = await app.db.select({ id: users.id }).from(users).where(eq(users.id, id)).limit(1);
    return u?.id ?? null;
  };

  // ---------------------------------------------------------------- RevenueCat
  app.post(
    '/webhooks/revenuecat',
    { schema: { tags: ['webhooks'], summary: 'RevenueCat webhook (subscriptions + credit packs)', body: z.object({ event: z.record(z.unknown()) }).passthrough(), response: { 200: Ack } } },
    async (req) => {
      const secret = app.config.REVENUECAT_WEBHOOK_SECRET;
      if (secret) {
        const auth = req.headers.authorization ?? '';
        if (!timingSafeEqualStr(auth, `Bearer ${secret}`)) throw unauthorized('bad webhook secret');
      }
      const ev = req.body.event as Record<string, unknown>;
      const id = String(ev.id ?? ev.transaction_id ?? '');
      const type = String(ev.type ?? 'UNKNOWN');
      if (!id) return { received: true as const, duplicate: false, applied: [] };
      const userId = await userExists(String(ev.app_user_id ?? ev.original_app_user_id ?? ''));
      const fresh = await recordEvent(`rc:${id}`, 'revenuecat', type, userId, req.body as Record<string, unknown>);
      if (!fresh) return { received: true as const, duplicate: true, applied: [] };
      const applied: string[] = [];
      if (!userId || type === 'TEST') return { received: true as const, duplicate: false, applied };

      const productId = typeof ev.product_id === 'string' ? ev.product_id : undefined;
      const credits = productId?.match(CREDIT_PACK);
      if (credits && (type === 'NON_RENEWING_PURCHASE' || type === 'INITIAL_PURCHASE')) {
        const n = Number(credits[1]);
        if (await grantCredits(app.db, userId, n, 'purchase', `rc:${id}`)) applied.push(`credits:+${n}`);
      } else {
        const product = productOf(productId, Array.isArray(ev.entitlement_ids) ? (ev.entitlement_ids as string[]) : undefined);
        if (product) {
          const expiresAt = typeof ev.expiration_at_ms === 'number' ? new Date(ev.expiration_at_ms) : null;
          const status =
            type === 'EXPIRATION' ? 'expired' : type === 'CANCELLATION' ? 'cancelled' : ev.period_type === 'TRIAL' ? 'trialing' : ['INITIAL_PURCHASE', 'RENEWAL', 'UNCANCELLATION', 'PRODUCT_CHANGE', 'SUBSCRIPTION_EXTENDED', 'BILLING_ISSUE', 'TRANSFER'].includes(type) ? 'active' : 'active';
          await upsertEntitlement(app.db, { userId, product, status, source: 'revenuecat', expiresAt, trial: ev.period_type === 'TRIAL', rawJson: ev });
          applied.push(`entitlement:${product}:${status}`);
        }
      }
      app.metrics.inc('webhook_total', { source: 'revenuecat', type });
      return { received: true as const, duplicate: false, applied };
    },
  );

  // ---------------------------------------------------------------- Stripe
  app.post(
    '/webhooks/stripe',
    { schema: { tags: ['webhooks'], summary: 'Stripe webhook (checkout.session.completed → credits/one-off; customer.subscription.* → entitlements)', body: z.object({ id: z.string(), type: z.string(), data: z.object({ object: z.record(z.unknown()) }) }).passthrough(), response: { 200: Ack } } },
    async (req) => {
      const secret = app.config.STRIPE_WEBHOOK_SECRET;
      if (secret) {
        const sig = String(req.headers['stripe-signature'] ?? '');
        const parts = Object.fromEntries(sig.split(',').map((kv) => kv.split('=') as [string, string]));
        const t = parts.t;
        const v1 = sig.split(',').filter((kv) => kv.startsWith('v1=')).map((kv) => kv.slice(3));
        if (!t || !v1.length || Math.abs(Date.now() / 1000 - Number(t)) > 300) throw unauthorized('bad stripe signature');
        const expected = createHmac('sha256', secret).update(`${t}.${req.rawBody ?? ''}`).digest('hex');
        if (!v1.some((v) => timingSafeEqualStr(v, expected))) throw unauthorized('bad stripe signature');
      }
      const { id, type } = req.body;
      const obj = req.body.data.object as Record<string, unknown>;
      const meta = (obj.metadata ?? {}) as Record<string, string>;
      const userId = await userExists(meta.user_id ?? (typeof obj.client_reference_id === 'string' ? obj.client_reference_id : undefined));
      const fresh = await recordEvent(`stripe:${id}`, 'stripe', type, userId, req.body as Record<string, unknown>);
      if (!fresh) return { received: true as const, duplicate: true, applied: [] };
      const applied: string[] = [];
      if (!userId) return { received: true as const, duplicate: false, applied };

      if (type === 'checkout.session.completed') {
        const n = Number(meta.credits ?? '0') || Number(String(meta.product ?? '').match(CREDIT_PACK)?.[1] ?? 0);
        if (n > 0) {
          if (await grantCredits(app.db, userId, n, 'purchase', `stripe:${id}`)) applied.push(`credits:+${n}`);
        } else if (obj.mode === 'payment') {
          const product = productOf(meta.product);
          if (product) {
            const expiresAt = meta.expires_at ? new Date(meta.expires_at) : null;
            await upsertEntitlement(app.db, { userId, product, status: 'active', source: 'stripe', expiresAt, trial: false, rawJson: obj });
            applied.push(`entitlement:${product}:active`);
          }
        }
      } else if (type.startsWith('customer.subscription.')) {
        const items = (obj.items as { data?: Array<{ price?: { metadata?: Record<string, string>; id?: string } }> } | undefined)?.data ?? [];
        const product = productOf(meta.product ?? items[0]?.price?.metadata?.product ?? items[0]?.price?.id);
        if (product) {
          const sStatus = String(obj.status ?? 'active');
          const status = type.endsWith('.deleted') || sStatus === 'canceled' ? 'expired' : sStatus === 'trialing' ? 'trialing' : obj.cancel_at_period_end ? 'cancelled' : ['active', 'past_due'].includes(sStatus) ? 'active' : 'expired';
          const expiresAt = typeof obj.current_period_end === 'number' ? new Date(obj.current_period_end * 1000) : null;
          await upsertEntitlement(app.db, { userId, product, status, source: 'stripe', expiresAt, trial: sStatus === 'trialing', rawJson: obj });
          applied.push(`entitlement:${product}:${status}`);
        }
      }
      app.metrics.inc('webhook_total', { source: 'stripe', type });
      return { received: true as const, duplicate: false, applied };
    },
  );
};
