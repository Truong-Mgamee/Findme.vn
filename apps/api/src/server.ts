import 'dotenv/config';
import { ENABLED_LOCALES } from '@findme/i18n';
import { buildApp } from './app.js';
import { startDailyScheduler } from './jobs/daily-oracle.js';

const app = await buildApp();
const { HOST, PORT } = app.config;
let stopScheduler: (() => void) | null = null;
try {
  await app.listen({ host: HOST, port: PORT });
  app.log.info(`docs: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/docs`);
  if (app.config.DAILY_JOB_ENABLED) {
    stopScheduler = startDailyScheduler(app, ENABLED_LOCALES);
    app.log.info({ locales: ENABLED_LOCALES, ai: !!app.config.ANTHROPIC_API_KEY && app.config.AI_ENABLED }, 'daily oracle scheduler started');
  }
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.once(sig, async () => {
    app.log.info(`${sig} received, shutting down`);
    stopScheduler?.();
    await app.close();
    process.exit(0);
  });
}
