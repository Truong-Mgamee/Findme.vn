import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface GuestClaims extends JWTPayload {
  sub: string;
  typ: 'guest';
}

const enc = (s: string) => new TextEncoder().encode(s);

export async function signGuestToken(userId: string, secret: string, ttlDays = 180): Promise<string> {
  return new SignJWT({ typ: 'guest' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(userId)
    .setIssuedAt()
    .setIssuer('findme')
    .setExpirationTime(`${ttlDays}d`)
    .sign(enc(secret));
}

export async function verifyGuestToken(token: string, secret: string): Promise<GuestClaims> {
  const { payload } = await jwtVerify(token, enc(secret), { algorithms: ['HS256'], issuer: 'findme' });
  if (!payload.sub) throw new Error('token without sub');
  return payload as GuestClaims;
}

/** Supabase access tokens are HS256 signed with the project JWT secret; `sub` = auth uid. */
export async function verifySupabaseToken(token: string, secret: string): Promise<JWTPayload & { sub: string }> {
  const { payload } = await jwtVerify(token, enc(secret), { algorithms: ['HS256'] });
  if (!payload.sub) throw new Error('token without sub');
  return payload as JWTPayload & { sub: string };
}
