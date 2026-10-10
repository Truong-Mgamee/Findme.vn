/** CLI: apply drizzle/*.sql (+ rls.sql on Postgres) to DATABASE_URL. */
import 'dotenv/config';
import { createDb } from '../src/db/client.js';

const handle = await createDb(process.env.DATABASE_URL);
await handle.migrate();
console.log(`migrations applied (${handle.driver}${handle.driver === 'pg' && process.env.APPLY_RLS !== 'false' ? ' + rls.sql' : ''})`);
await handle.close();
