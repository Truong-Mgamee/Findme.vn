import { NextResponse } from 'next/server';
import { adminToken } from '@/lib/env';
import { ADMIN_COOKIE, cookieOptions } from '@/lib/auth';

export const runtime = 'nodejs';

/** POST form {token} → sets the fm_admin cookie when it equals ADMIN_TOKEN (constant-time compare). */
export async function POST(req: Request) {
  const expected = adminToken();
  const form = await req.formData().catch(() => null);
  const token = String(form?.get('token') ?? '');
  const url = new URL(req.url);
  if (!expected) return NextResponse.redirect(new URL('/admin/login?error=unconfigured', url.origin), 303);
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  const ok = a.length === b.length && (await import('node:crypto')).timingSafeEqual(a, b);
  if (!ok) return NextResponse.redirect(new URL('/admin/login?error=invalid', url.origin), 303);
  const out = NextResponse.redirect(new URL('/admin', url.origin), 303);
  out.cookies.set(ADMIN_COOKIE, token, cookieOptions(12 * 3600));
  return out;
}
