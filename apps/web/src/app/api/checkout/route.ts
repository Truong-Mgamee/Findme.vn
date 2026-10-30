import { NextResponse, type NextRequest } from 'next/server';
import { apiUrl } from '@/lib/env';
import { TOKEN_COOKIE } from '@/lib/auth';

export const runtime = 'nodejs';

/**
 * POST /api/checkout {product, locale?} → POST /v1/billing/checkout. The API answers 501 until Stripe is configured
 * (P12); without an API URL this handler answers 501 itself so the paywall UI can show the "coming soon" state.
 */
export async function POST(req: NextRequest) {
  const base = apiUrl();
  const body = (await req.json().catch(() => ({}))) as { product?: string; locale?: string };
  if (!body.product) return NextResponse.json({ error: 'bad_request', message: 'product required' }, { status: 400 });
  if (!base) return NextResponse.json({ error: 'not_implemented', message: 'Stripe Checkout is not configured yet (P12).' }, { status: 501 });
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const locale = body.locale ?? 'en';
  const res = await fetch(`${base}/v1/billing/checkout`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify({ product: body.product, successPath: `/${locale}/app/settings?checkout=success`, cancelPath: `/${locale}/app/paywall` }),
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: 'upstream_unreachable' }, { status: 502 });
  const json = await res.json().catch(() => ({}));
  return NextResponse.json(json, { status: res.status });
}
