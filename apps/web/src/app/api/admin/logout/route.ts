import { NextResponse } from 'next/server';
import { ADMIN_COOKIE, cookieOptions } from '@/lib/auth';

export async function POST(req: Request) {
  const out = NextResponse.redirect(new URL('/admin/login', new URL(req.url).origin), 303);
  out.cookies.set(ADMIN_COOKIE, '', cookieOptions(0));
  return out;
}
