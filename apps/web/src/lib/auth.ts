import 'server-only';
import { cookies } from 'next/headers';

export const TOKEN_COOKIE = 'fm_token';
export const ADMIN_COOKIE = 'fm_admin';
/** Guest JWTs live 180 days (apps/api GUEST_TOKEN_TTL_DAYS). */
export const TOKEN_MAX_AGE = 180 * 24 * 3600;

export async function getToken(): Promise<string | null> {
  const jar = await cookies();
  return jar.get(TOKEN_COOKIE)?.value ?? null;
}

export const cookieOptions = (maxAge: number) => ({
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  path: '/',
  maxAge,
});
