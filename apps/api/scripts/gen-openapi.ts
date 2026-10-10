/**
 * Boots the app against an in-memory PGlite (no listen), dumps the OpenAPI document to
 * packages/api-client/openapi.json. `pnpm --filter @findme/api gen:openapi` then runs
 * openapi-typescript in @findme/api-client to refresh src/schema.d.ts.
 */
import { mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/app.js';

const out = fileURLToPath(new URL('../../../packages/api-client/openapi.json', import.meta.url));
const app = await buildApp({ env: { NODE_ENV: 'test', DATABASE_URL: undefined, REDIS_URL: undefined, JWT_SECRET: 'gen-openapi-placeholder-secret' }, logger: false });
await app.ready();
const doc = app.swagger();
await mkdir(new URL('.', `file://${out}`), { recursive: true });
await writeFile(out, `${JSON.stringify(doc, null, 2)}\n`);
await app.close();
console.log(`wrote ${out} (${Object.keys((doc as { paths: Record<string, unknown> }).paths).length} paths)`);
