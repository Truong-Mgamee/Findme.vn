import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { readings, type Reading } from '../db/schema.js';
import { localDate } from '../lib/locale.js';
import { badRequest, notFound } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { requireEntitlement } from '../plugins/entitlement.js';
import { debitCredits } from '../services/entitlements.js';
import { redactBirth, runReadingEngine } from '../services/engines.js';
import { loadProfile } from '../services/profiles.js';
import { CreateReadingSchema, ErrorSchema, IdParams, PaywallSchema, ReadingSchema } from './schemas.js';

export function serializeReading(r: Reading): z.infer<typeof ReadingSchema> {
  return { id: r.id, kind: r.kind, locale: r.locale, profileId: r.profileId, partnerProfileId: r.partnerProfileId, paidBy: r.paidBy, createdAt: r.createdAt.toISOString(), input: r.inputJson, engine: r.engineJson ?? null, ai: r.aiJson ?? null };
}

export const readingRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  const sec = [{ bearerAuth: [] }];

  app.post(
    '/readings',
    {
      preHandler: [requireEntitlement(app, 'deep_reading', { allowFreeFirst: app.config.FREE_FIRST_READING })],
      schema: {
        tags: ['readings'],
        summary: 'Create a deep reading: engine runs synchronously; AI narrative streams later via /readings/:id/stream',
        description: 'Payment: first deep reading is free (free_first), then Plus subscription, then `payWith:"credit"` (1 credit, debited transactionally). Otherwise 402 `{reason, paywall:true}`. tarot_spread / iching return 501 until their engines land.',
        security: sec,
        body: CreateReadingSchema,
        response: { 201: ReadingSchema, 402: PaywallSchema, 400: ErrorSchema, 404: ErrorSchema, 501: ErrorSchema },
      },
    },
    async (req, reply) => {
      const user = currentUser(req);
      const { kind, profileId, partnerProfileId, params } = req.body;
      const main = await loadProfile(app.db, app.config.birthEncKey, user.id, profileId);
      const partner = partnerProfileId ? await loadProfile(app.db, app.config.birthEncKey, user.id, partnerProfileId) : undefined;
      if (kind === 'compatibility' && !partner) throw badRequest('partner_required', 'compatibility needs partnerProfileId');
      const today = localDate(req.tz);
      const out = await app.metrics.time('engine_ms', { engine: kind }, () =>
        runReadingEngine({ kind, locale: req.locale, today, birth: main.birth, profileCore: main.row.coreJson, partner: partner ? { birth: partner.birth, core: partner.row.coreJson } : undefined, params }),
      );
      const payment = req.payment!;
      const row = await app.db.transaction(async (tx) => {
        const [r] = await tx
          .insert(readings)
          .values({ userId: user.id, profileId, partnerProfileId: partnerProfileId ?? null, kind, locale: req.locale, inputJson: { params, today }, engineJson: redactBirth(out) as unknown as Record<string, unknown>, paidBy: payment.paidBy })
          .returning();
        if (!r) throw new Error('insert readings failed');
        if (payment.paidBy === 'credit') await debitCredits(tx, user.id, payment.creditCost, 'reading', r.id);
        return r;
      });
      app.metrics.inc('readings_total', { kind, paidBy: payment.paidBy });
      return reply.code(201).send(serializeReading(row));
    },
  );

  app.get('/readings', { schema: { tags: ['readings'], summary: 'My readings (newest first)', security: sec, querystring: z.object({ limit: z.coerce.number().int().min(1).max(100).default(20) }), response: { 200: z.object({ readings: z.array(ReadingSchema) }) } } }, async (req) => {
    const rows = await app.db.select().from(readings).where(eq(readings.userId, currentUser(req).id)).orderBy(desc(readings.createdAt)).limit(req.query.limit);
    return { readings: rows.map(serializeReading) };
  });

  app.get('/readings/:id', { schema: { tags: ['readings'], summary: 'One reading', security: sec, params: IdParams, response: { 200: ReadingSchema, 404: ErrorSchema } } }, async (req) => {
    const [r] = await app.db.select().from(readings).where(and(eq(readings.id, req.params.id), eq(readings.userId, currentUser(req).id))).limit(1);
    if (!r) throw notFound('reading');
    return serializeReading(r);
  });

  app.get(
    '/readings/:id/stream',
    {
      schema: {
        tags: ['readings'],
        summary: 'SSE: `engine_summary` then `done` (AI composer events `section`/`delta` arrive in P8)',
        security: sec,
        params: IdParams,
        produces: ['text/event-stream'],
        response: { 404: ErrorSchema },
      },
    },
    async (req, reply) => {
      const [r] = await app.db.select().from(readings).where(and(eq(readings.id, req.params.id), eq(readings.userId, currentUser(req).id))).limit(1);
      if (!r) throw notFound('reading');
      reply.hijack();
      const res = reply.raw;
      res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-cache, no-transform', connection: 'keep-alive', 'x-accel-buffering': 'no' });
      const send = (event: string, data: unknown) => res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      const engine = (r.engineJson ?? {}) as { engine?: string; atomKeys?: string[]; confidence?: string; warnings?: unknown[] };
      send('engine_summary', { readingId: r.id, kind: r.kind, engine: engine.engine ?? null, atomKeys: engine.atomKeys ?? [], confidence: engine.confidence ?? null, warnings: engine.warnings ?? [] });
      // TODO(P8): stream reading-composer output (summary/sections/actions/caveats) as `section` + `delta` events.
      send('done', { readingId: r.id, ai: r.aiJson ? 'ready' : 'pending' });
      res.end();
    },
  );
};
