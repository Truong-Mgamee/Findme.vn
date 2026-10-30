import { defineConfig } from 'drizzle-kit';

/**
 * drizzle-kit only needs the schema to *generate* SQL (no DB connection).
 * Migrations are applied programmatically by `src/db/migrate.ts` (pg or PGlite).
 */
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  strict: true,
  verbose: true,
});
