/**
 * Web billing (P12): Stripe Checkout + Customer Portal through Stripe's REST API (no SDK).
 * Mobile purchases go through RevenueCat; both land in `entitlements` via webhooks.
 */
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { AppError, badRequest, notImplemented } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { ErrorSchema } from './schemas.js';

export const PRODUCTS = ['plus_weekly', 'plus_monthly', 'plus_yearly', 'credits_1', 'credits_5', 'credits_15'] as const;
export type ProductKey = (typeof PRODUCTS)[number];

function priceMap(raw?: string): Partial<Record<ProductKey, string>> {
  if (!raw) return {};
  try {
    return JSON.parse(raw) as Partial<Record<ProductKey, string>>;
  } catch {
    return {};
  }
}

async function stripe(secret: string, path: string, form: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.stripe.com/v1/${path}`, {
    method: 'POST',
    headers: { authorization: `Bearer ${secret}`, 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams(form).toString(),
  });
  const body = (await res.json()) as Record<string, unknown>;
  if (!res.ok) throw new AppError(502, 'stripe_error', String((body.error as { message?: string } | undefined)?.message ?? 'stripe request failed'));
  return body;
}

export const billingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  const sec = [{ bearerAuth: [] }];
  app.get('/billing/products', { schema: { tags: ['billing'], summary: 'Products available for web checkout (configured Stripe prices)', security: sec, response: { 200: z.object({ products: z.array(z.object({ key: z.string(), kind: z.enum(['subscription', 'credits']), credits: z.number().int().nullable() })) }) } } }, async () => {
    const prices = priceMap(app.config.STRIPE_PRICES);
    return {
      products: PRODUCTS.filter((k) => prices[k]).map((key) => ({ key, kind: key.startsWith('credits') ? ('credits' as const) : ('subscription' as const), credits: key.startsWith('credits') ? Number(key.split('_')[1]) : null })),
    };
  });

  app.post(
    '/billing/checkout',
    {
      schema: {
        tags: ['billing'],
        summary: 'Create a Stripe Checkout session for a subscription or credit pack (501 when Stripe is not configured)',
        security: sec,
        body: z.object({ product: z.enum(PRODUCTS), successPath: z.string().default('/app/billing/success'), cancelPath: z.string().default('/app/paywall') }),
        response: { 200: z.object({ url: z.string(), sessionId: z.string() }), 400: ErrorSchema, 501: ErrorSchema, 502: ErrorSchema },
      },
    },
    async (req) => {
      const secret = app.config.STRIPE_SECRET_KEY;
      if (!secret) throw notImplemented('stripe checkout');
      const prices = priceMap(app.config.STRIPE_PRICES);
      const price = prices[req.body.product];
      if (!price) throw badRequest('unknown_product', `no Stripe price configured for ${req.body.product}`);
      const user = currentUser(req);
      const isSub = !req.body.product.startsWith('credits');
      const meta: Record<string, string> = { 'metadata[userId]': user.id, 'metadata[product]': isSub ? 'plus' : req.body.product };
      if (!isSub) meta['metadata[credits]'] = String(Number(req.body.product.split('_')[1]));
      const base = app.config.WEB_BASE_URL.replace(/\/$/, '');
      const form: Record<string, string> = {
        mode: isSub ? 'subscription' : 'payment',
        'line_items[0][price]': price,
        'line_items[0][quantity]': '1',
        success_url: `${base}${req.body.successPath}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${base}${req.body.cancelPath}`,
        client_reference_id: user.id,
        ...meta,
        ...(isSub ? { 'subscription_data[metadata][userId]': user.id, 'subscription_data[metadata][product]': 'plus', 'subscription_data[trial_period_days]': req.body.product === 'plus_weekly' ? '7' : '0' } : { 'payment_intent_data[metadata][userId]': user.id, 'payment_intent_data[metadata][credits]': String(Number(req.body.product.split('_')[1])) }),
      };
      const session = await stripe(secret, 'checkout/sessions', form);
      app.metrics.inc('checkout_sessions_total', { product: req.body.product });
      return { url: String(session.url), sessionId: String(session.id) };
    },
  );

  app.post('/billing/portal', { schema: { tags: ['billing'], summary: 'Stripe Customer Portal link (manage/cancel). 501 when not configured', security: sec, body: z.object({ customerId: z.string(), returnPath: z.string().default('/app/settings') }), response: { 200: z.object({ url: z.string() }), 501: ErrorSchema, 502: ErrorSchema } } }, async (req) => {
    const secret = app.config.STRIPE_SECRET_KEY;
    if (!secret) throw notImplemented('stripe portal');
    const s = await stripe(secret, 'billing_portal/sessions', { customer: req.body.customerId, return_url: `${app.config.WEB_BASE_URL.replace(/\/$/, '')}${req.body.returnPath}` });
    return { url: String(s.url) };
  });
};
