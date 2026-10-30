import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { CalendarStandardSchema, LocaleSchema } from '@findme/engine-core';
import { pickDates, type ProfileCore } from '@findme/engine-almanac';
import { and, eq, inArray } from 'drizzle-orm';
import { creditsLedger, profiles, readings } from '../db/schema.js';
import { localDate } from '../lib/locale.js';
import { badRequest } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { requireEntitlement } from '../plugins/entitlement.js';
import { debitCredits } from '../services/entitlements.js';
import { profileCoreOf } from '../services/engines.js';
import { cachedAlmanac } from '../services/today.js';
import { DateQuery, ErrorSchema, JsonObject, PaywallSchema, TaskSchema } from './schemas.js';

export const almanacRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/almanac',
    {
      schema: {
        tags: ['almanac'],
        summary: 'Public day almanac (黄历 / lịch ngày) for a national calendar standard',
        querystring: z.object({ date: DateQuery.optional(), std: CalendarStandardSchema.optional(), locale: LocaleSchema.optional() }),
        response: { 200: JsonObject },
      },
    },
    async (req, reply) => {
      const date = req.query.date ?? localDate(req.tz);
      const std = req.query.std ?? (req.locale === 'vi' ? 'vn' : 'cn');
      const locale = req.query.locale ?? req.locale;
      reply.header('cache-control', 'public, max-age=3600');
      return (await cachedAlmanac(app.store, date, std, locale)) as unknown as Record<string, unknown>;
    },
  );
};

export const almanacPickRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.post(
    '/almanac/pick',
    {
      preHandler: [requireEntitlement(app, 'almanac_pick')],
      schema: {
        tags: ['almanac'],
        summary: 'Date Picker: rank days in a window for a task, avoiding clashes with the given profiles (Plus or 1 credit)',
        security: [{ bearerAuth: [] }],
        body: z.object({
          task: TaskSchema,
          from: DateQuery,
          to: DateQuery,
          profileIds: z.array(z.string().uuid()).max(4).default([]),
          std: CalendarStandardSchema.optional(),
          limit: z.number().int().min(1).max(31).default(10),
          payWith: z.enum(['credit']).optional(),
        }),
        response: { 200: z.object({ readingId: z.string().uuid(), paidBy: z.string(), ranked: z.array(JsonObject) }), 402: PaywallSchema, 400: ErrorSchema },
      },
    },
    async (req) => {
      const user = currentUser(req);
      const { task, from, to, profileIds, limit } = req.body;
      if (to < from) throw badRequest('invalid_range', 'to must be >= from');
      const days = (Date.parse(to) - Date.parse(from)) / 86400000;
      if (days > 120) throw badRequest('range_too_large', 'window must be <= 120 days');
      const rows = profileIds.length ? await app.db.select().from(profiles).where(and(eq(profiles.userId, user.id), inArray(profiles.id, profileIds))) : [];
      const pcs = rows.map((r) => profileCoreOf(r.coreJson)).filter((p): p is ProfileCore => !!p);
      const std = req.body.std ?? (rows[0]?.coreJson.calendarStandard ?? user.calendarStandard);
      const ranked = await app.metrics.time('engine_ms', { engine: 'almanac_pick' }, () => pickDates({ task, from, to, profiles: pcs, standard: std as 'vn' | 'cn' | 'kr' | 'jp', locale: req.locale, limit }));
      const payment = req.payment!;
      const facts = { task, from, to, std, ranked: ranked.map((r) => ({ date: r.date, score: r.score, reasons: r.reasons, lunar: r.almanac.lunar, dayGanzhi: r.almanac.dayGanzhi, huangdao: r.almanac.huangdao, yi: r.almanac.yi, ji: r.almanac.ji, hours: r.almanac.hours })) };
      const readingId = await app.db.transaction(async (tx) => {
        const [r] = await tx
          .insert(readings)
          .values({ userId: user.id, profileId: rows[0]?.id ?? null, kind: 'almanac_pick', locale: req.locale, inputJson: { task, from, to, profileIds, std }, engineJson: { engine: 'almanac', engineVersion: '1.0.0', facts, atomKeys: [`almanac.task.${task}`] }, paidBy: payment.paidBy })
          .returning({ id: readings.id });
        if (!r) throw new Error('insert readings failed');
        if (payment.paidBy === 'credit') await debitCredits(tx, user.id, payment.creditCost, 'almanac_pick', r.id);
        return r.id;
      });
      app.metrics.inc('almanac_pick_total', { paidBy: payment.paidBy });
      void creditsLedger;
      return { readingId, paidBy: payment.paidBy, ranked: facts.ranked as unknown as Record<string, unknown>[] };
    },
  );
};
