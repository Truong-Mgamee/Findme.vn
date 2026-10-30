import { NextResponse } from 'next/server';
import { cookieOptions, TOKEN_COOKIE } from '@/lib/auth';

export async function POST() {
  const out = NextResponse.json({ ok: true });
  out.cookies.set(TOKEN_COOKIE, '', cookieOptions(0));
  return out;
}
