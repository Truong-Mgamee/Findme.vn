/**
 * Programmatic migrator. Applies the SQL files drizzle-kit generated into ./drizzle, then —
 * only on a real Postgres — `drizzle/rls.sql` (Supabase RLS policies; PGlite has no roles/JWT).
 *
 *   pnpm --filter @findme/api db:migrate          # scripts/db-migrate.ts, uses DATABASE_URL from .env
 */
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { sql } from 'drizzle-orm';
import type { Db, DbDriver } from './client.js';

const migrationsFolder = fileURLToPath(new URL('../../drizzle', import.meta.url));

export async function runMigrations(opts: { db: Db; driver: DbDriver; raw: unknown; applyRls?: boolean }): Promise<void> {
  if (opts.driver === 'pg') {
    const { migrate } = await import('drizzle-orm/node-postgres/migrator');
    await migrate(opts.raw as Parameters<typeof migrate>[0], { migrationsFolder });
    if (opts.applyRls ?? process.env.APPLY_RLS !== 'false') await applyRls(opts.db);
  } else {
    const { migrate } = await import('drizzle-orm/pglite/migrator');
    await migrate(opts.raw as Parameters<typeof migrate>[0], { migrationsFolder });
  }
}

/** rls.sql is idempotent (CREATE OR REPLACE / DROP POLICY IF EXISTS) so it can run on every deploy. */
export async function applyRls(db: Db): Promise<void> {
  const text = await readFile(`${migrationsFolder}/rls.sql`, 'utf8');
  await db.execute(sql.raw(text));
}
