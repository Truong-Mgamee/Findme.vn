import 'server-only';
import { cookies } from 'next/headers';
import { adminToken } from './env';
import { ADMIN_COOKIE } from './auth';

/** True when the fm_admin cookie equals ADMIN_TOKEN. */
export async function isAdmin(): Promise<boolean> {
  const expected = adminToken();
  if (!expected) return false;
  const jar = await cookies();
  const got = jar.get(ADMIN_COOKIE)?.value ?? '';
  if (got.length !== expected.length) return false;
  const { timingSafeEqual } = await import('node:crypto');
  return timingSafeEqual(Buffer.from(got), Buffer.from(expected));
}
