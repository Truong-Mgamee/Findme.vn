import 'dotenv/config';
import { buildApp } from './app.js';

const app = await buildApp();
const { HOST, PORT } = app.config;
try {
  await app.listen({ host: HOST, port: PORT });
  app.log.info(`docs: http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}/docs`);
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
for (const sig of ['SIGINT', 'SIGTERM'] as const) {
  process.once(sig, async () => {
    app.log.info(`${sig} received, shutting down`);
    await app.close();
    process.exit(0);
  });
}
