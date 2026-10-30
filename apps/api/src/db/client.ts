/**
 * Driver selection:
 *  - DATABASE_URL starts with `postgres` → node-postgres Pool (production / Supabase)
 *  - DATABASE_URL = `pglite:<dir>` → persistent PGlite on disk (local dev)
 *  - otherwise → in-memory PGlite (tests, quick dev)
 */
import type { PgDatabase, PgQueryResultHKT } from 'drizzle-orm/pg-core';
import * as schema from './schema.js';

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;
export type DbDriver = 'pg' | 'pglite';

export interface DbHandle {
  db: Db;
  driver: DbDriver;
  /** apply SQL migrations in ./drizzle (+ rls.sql on pg) */
  migrate(): Promise<void>;
  close(): Promise<void>;
}

export async function createDb(databaseUrl?: string): Promise<DbHandle> {
  if (databaseUrl && /^postgres(ql)?:\/\//.test(databaseUrl)) {
    const { default: pg } = await import('pg');
    const { drizzle } = await import('drizzle-orm/node-postgres');
    const pool = new pg.Pool({ connectionString: databaseUrl, max: 10 });
    const db = drizzle(pool, { schema });
    return {
      db: db as unknown as Db,
      driver: 'pg',
      async migrate() {
        const { runMigrations } = await import('./migrate.js');
        await runMigrations({ db: db as unknown as Db, driver: 'pg', raw: db });
      },
      close: () => pool.end(),
    };
  }

  const { PGlite } = await import('@electric-sql/pglite');
  const { drizzle } = await import('drizzle-orm/pglite');
  const dir = databaseUrl?.startsWith('pglite:') ? databaseUrl.slice('pglite:'.length) : undefined;
  const client = dir && dir !== 'memory' && dir !== '' ? new PGlite(dir) : new PGlite();
  const db = drizzle(client, { schema });
  return {
    db: db as unknown as Db,
    driver: 'pglite',
    async migrate() {
      const { runMigrations } = await import('./migrate.js');
      await runMigrations({ db: db as unknown as Db, driver: 'pglite', raw: db });
    },
    close: () => client.close(),
  };
}

export { schema };
