import { NextResponse } from 'next/server';
import { apiUrl } from '@/lib/env';
import { cookieOptions, TOKEN_COOKIE, TOKEN_MAX_AGE } from '@/lib/auth';

export const runtime = 'nodejs';

/** POST /api/auth/guest {locale?, tz?} → creates a guest on the API and stores the JWT in an httpOnly cookie. */
export async function POST(req: Request) {
  const base = apiUrl();
  if (!base) return NextResponse.json({ error: 'api_not_configured' }, { status: 503 });
  const body = (await req.json().catch(() => ({}))) as { locale?: string; tz?: string; country?: string };
  const res = await fetch(`${base}/v1/auth/guest`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', accept: 'application/json', ...(body.locale ? { 'x-locale': body.locale } : {}), ...(body.tz ? { 'x-tz': body.tz } : {}) },
    body: JSON.stringify({ ...(body.locale ? { locale: body.locale } : {}), ...(body.tz ? { tz: body.tz } : {}), ...(body.country ? { country: body.country } : {}) }),
  }).catch(() => null);
  if (!res) return NextResponse.json({ error: 'network' }, { status: 502 });
  const json = (await res.json().catch(() => null)) as { token?: string; user?: unknown } | null;
  if (!res.ok || !json?.token) return NextResponse.json(json ?? { error: 'guest_failed' }, { status: res.status || 502 });
  const out = NextResponse.json({ user: json.user }, { status: 201 });
  out.cookies.set(TOKEN_COOKIE, json.token, cookieOptions(TOKEN_MAX_AGE));
  return out;
}
