import { and, eq } from 'drizzle-orm';
import type { Db } from '../db/client.js';
import { profiles, type Profile } from '../db/schema.js';
import { decryptJson } from '../lib/crypto.js';
import { notFound } from '../lib/errors.js';
import type { StoredBirth } from './engines.js';

export function publicProfile(p: Profile, birth: StoredBirth, includeBirth = false) {
  return {
    id: p.id,
    label: p.label,
    isSelf: p.isSelf,
    createdAt: p.createdAt.toISOString(),
    core: p.coreJson as unknown as Record<string, unknown>,
    insights: p.coreJson.insights,
    birthSummary: { gender: birth.gender, timeUnknown: birth.timeUnknown, placeName: birth.place.name, calendarStandard: birth.calendarStandard, hasName: !!birth.fullName },
    ...(includeBirth ? { birth: birth as unknown as Record<string, unknown> } : {}),
  };
}

export async function loadProfile(db: Db, key: Buffer, userId: string, id: string): Promise<{ row: Profile; birth: StoredBirth }> {
  const [row] = await db.select().from(profiles).where(and(eq(profiles.id, id), eq(profiles.userId, userId))).limit(1);
  if (!row) throw notFound('profile');
  return { row, birth: decryptJson<StoredBirth>(row.birthEnc, key) };
}

export async function selfProfile(db: Db, userId: string): Promise<Profile | null> {
  const rows = await db.select().from(profiles).where(eq(profiles.userId, userId)).orderBy(profiles.createdAt);
  return rows.find((r) => r.isSelf) ?? rows[0] ?? null;
}
