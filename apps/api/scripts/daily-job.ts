/** One-shot Daily Oracle generation: `pnpm --filter @findme/api job:daily -- 2026-10-11 vi,en` */
import 'dotenv/config';
import { ENABLED_LOCALES } from '@findme/i18n';
import type { Locale } from '@findme/engine-core';
import { buildApp } from '../src/app.js';
import { runDailyOracleJob } from '../src/jobs/daily-oracle.js';

const date = process.argv[2] ?? new Date().toISOString().slice(0, 10);
const locales = (process.argv[3]?.split(',') as Locale[] | undefined) ?? ENABLED_LOCALES;
const app = await buildApp({ logger: false });
const r = await runDailyOracleJob(app, { date, locales, force: process.argv.includes('--force') });
console.log(JSON.stringify(r));
await app.close();
