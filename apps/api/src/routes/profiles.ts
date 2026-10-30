import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { defaultCalendarStandard } from '@findme/i18n';
import type { CalendarStandard, TraditionPack } from '@findme/engine-core';
import { profiles } from '../db/schema.js';
import { birthHash, decryptJson, encryptJson } from '../lib/crypto.js';
import { localDate } from '../lib/locale.js';
import { notFound } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { astroFor, baziFor, computeCore, numerologyFor, ziweiFor, type StoredBirth } from '../services/engines.js';
import { loadProfile, publicProfile } from '../services/profiles.js';
import { CreateProfileSchema, DateQuery, ErrorSchema, HouseSystemSchema, IdParams, JsonObject, ProfileSchema, ZiweiSchoolSchema } from './schemas.js';

export const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  const sec = [{ bearerAuth: [] }];

  app.post(
    '/profiles',
    {
      schema: {
        tags: ['profiles'],
        summary: 'Create a birth profile (server encrypts birth data, computes core_json + 3 insights)',
        security: sec,
        body: CreateProfileSchema,
        response: { 201: ProfileSchema },
      },
    },
    async (req, reply) => {
      const user = currentUser(req);
      const b = req.body.birth;
      const calendarStandard: CalendarStandard = b.calendarStandard ?? (b.place.country ? defaultCalendarStandard(b.place.country) : (user.calendarStandard as CalendarStandard));
      const birth: StoredBirth = { ...b, calendarStandard, ...(req.body.fullName ? { fullName: req.body.fullName } : {}) };
      const today = localDate(req.tz);
      const core = await app.metrics.time('engine_ms', { engine: 'core' }, () => computeCore(birth, { traditionPack: user.traditionPack as TraditionPack, locale: req.locale, today, fullName: birth.fullName }));
      const label = req.body.label ?? (req.body.isSelf ? (req.locale === 'vi' ? 'Tôi' : 'Me') : birth.place.name);
      if (req.body.isSelf) await app.db.update(profiles).set({ isSelf: false }).where(and(eq(profiles.userId, user.id), eq(profiles.isSelf, true)));
      const [row] = await app.db
        .insert(profiles)
        .values({ userId: user.id, label, isSelf: req.body.isSelf, birthEnc: encryptJson(birth, app.config.birthEncKey), birthHash: birthHash(birth, app.config.birthEncKey), coreJson: core })
        .returning();
      if (!row) throw new Error('insert profiles failed');
      app.metrics.inc('profiles_created_total', { pack: user.traditionPack });
      return reply.code(201).send(publicProfile(row, birth));
    },
  );

  app.get('/profiles', { schema: { tags: ['profiles'], summary: 'List my profiles', security: sec, response: { 200: z.object({ profiles: z.array(ProfileSchema) }) } } }, async (req) => {
    const user = currentUser(req);
    const rows = await app.db.select().from(profiles).where(eq(profiles.userId, user.id)).orderBy(profiles.createdAt);
    return { profiles: rows.map((r) => publicProfile(r, decryptJson<StoredBirth>(r.birthEnc, app.config.birthEncKey))) };
  });

  app.get(
    '/profiles/:id',
    { schema: { tags: ['profiles'], summary: 'Get a profile (owner may request the decrypted birth input with ?includeBirth=true)', security: sec, params: IdParams, querystring: z.object({ includeBirth: z.coerce.boolean().default(false) }), response: { 200: ProfileSchema, 404: ErrorSchema } } },
    async (req) => {
      const { row, birth } = await loadProfile(app.db, app.config.birthEncKey, currentUser(req).id, req.params.id);
      return publicProfile(row, birth, req.query.includeBirth);
    },
  );

  app.delete('/profiles/:id', { schema: { tags: ['profiles'], summary: 'Delete a profile and its readings', security: sec, params: IdParams, response: { 204: z.null(), 404: ErrorSchema } } }, async (req, reply) => {
    const res = await app.db.delete(profiles).where(and(eq(profiles.id, req.params.id), eq(profiles.userId, currentUser(req).id))).returning({ id: profiles.id });
    if (!res.length) throw notFound('profile');
    return reply.code(204).send(null);
  });

  app.get(
    '/profiles/:id/ziwei',
    {
      schema: {
        tags: ['engines'],
        summary: 'Zi Wei Dou Shu chart (12 palaces, localized) + horoscope for a date',
        security: sec,
        params: IdParams,
        querystring: z.object({ school: ZiweiSchoolSchema.default('default'), date: DateQuery.optional() }),
        response: { 200: z.object({ chart: JsonObject, horoscope: JsonObject, atomKeys: z.array(z.string()) }), 404: ErrorSchema },
      },
    },
    async (req) => {
      const { birth } = await loadProfile(app.db, app.config.birthEncKey, currentUser(req).id, req.params.id);
      const date = req.query.date ?? localDate(req.tz);
      const out = await app.metrics.time('engine_ms', { engine: 'ziwei' }, () => ziweiFor(birth, req.locale, req.query.school, date));
      return { chart: out.chart as unknown as Record<string, unknown>, horoscope: out.horoscope as unknown as Record<string, unknown>, atomKeys: out.atomKeys };
    },
  );

  app.get(
    '/profiles/:id/bazi',
    { schema: { tags: ['engines'], summary: 'Bazi: four pillars, ten gods, luck periods, annual luck', security: sec, params: IdParams, response: { 200: JsonObject, 404: ErrorSchema } } },
    async (req) => {
      const { birth } = await loadProfile(app.db, app.config.birthEncKey, currentUser(req).id, req.params.id);
      return (await app.metrics.time('engine_ms', { engine: 'bazi' }, () => baziFor(birth, req.locale, localDate(req.tz)))) as unknown as Record<string, unknown>;
    },
  );

  app.get(
    '/profiles/:id/numerology',
    { schema: { tags: ['engines'], summary: 'Numerology (Pythagorean): life path, name numbers, cycles', security: sec, params: IdParams, response: { 200: JsonObject, 404: ErrorSchema } } },
    async (req) => {
      const { birth } = await loadProfile(app.db, app.config.birthEncKey, currentUser(req).id, req.params.id);
      return (await app.metrics.time('engine_ms', { engine: 'numerology' }, () => numerologyFor(birth, req.locale, localDate(req.tz)))) as unknown as Record<string, unknown>;
    },
  );

  app.get(
    '/profiles/:id/astro',
    { schema: { tags: ['engines'], summary: 'Western natal chart (planets, houses, aspects)', security: sec, params: IdParams, querystring: z.object({ houses: HouseSystemSchema.default('placidus') }), response: { 200: JsonObject, 404: ErrorSchema } } },
    async (req) => {
      const { birth } = await loadProfile(app.db, app.config.birthEncKey, currentUser(req).id, req.params.id);
      return (await app.metrics.time('engine_ms', { engine: 'astro' }, () => astroFor(birth, req.query.houses))) as unknown as Record<string, unknown>;
    },
  );
};
