import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';

export const systemRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get('/healthz', { schema: { tags: ['system'], summary: 'Liveness', response: { 200: z.object({ ok: z.literal(true), driver: z.string(), store: z.string(), uptimeSec: z.number(), version: z.string() }) } } }, async () => ({
    ok: true as const,
    driver: app.dbDriver,
    store: app.storeKind,
    uptimeSec: Math.round(process.uptime()),
    version: app.apiVersion,
  }));
  app.get('/metrics', { schema: { tags: ['system'], summary: 'JSON counters (prom-client later)', response: { 200: z.record(z.unknown()) } } }, async () => app.metrics.snapshot());
};
