/**
 * /v1/admin — content operations (atoms CMS, coverage, bulk import, daily job trigger).
 * Auth: `X-Admin-Token` equal to ADMIN_TOKEN (MVP; swap for Supabase role 'editor' later).
 */
import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, desc, eq, ilike, or, sql, type SQL } from 'drizzle-orm';
import { timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { LocaleSchema, LOCALES, type Locale } from '@findme/engine-core';
import { contentAtoms, dailyContent, glossary } from '../db/schema.js';
import { AppError, notFound, unauthorized } from '../lib/errors.js';
import { runDailyOracleJob } from '../jobs/daily-oracle.js';
import { ErrorSchema } from './schemas.js';

const TRADITIONS = ['ziwei', 'bazi', 'almanac', 'tarot', 'iching', 'numerology', 'astro'] as const;
const STATUSES = ['draft', 'reviewed', 'published', 'archived'] as const;

export const AdminAtomSchema = z.object({
  id: z.string(),
  tradition: z.string(),
  key: z.string(),
  locale: z.string(),
  title: z.string(),
  bodyMd: z.string(),
  tone: z.string().nullable(),
  sourceRef: z.string().nullable(),
  author: z.string().nullable(),
  reviewer: z.string().nullable(),
  status: z.string(),
  version: z.number().int(),
  updatedAt: z.string(),
});

export const AtomImportSchema = z.object({
  id: z.string().optional(),
  tradition: z.enum(TRADITIONS),
  key: z.string().min(3),
  locale: LocaleSchema,
  title: z.string().min(1),
  body_md: z.string().min(1),
  tone: z.string().optional().nullable(),
  source_ref: z.string().optional().nullable(),
  author: z.string().optional().nullable(),
  reviewer: z.string().optional().nullable(),
  status: z.enum(STATUSES).default('draft'),
  version: z.number().int().min(1).default(1),
});

function serialize(r: typeof contentAtoms.$inferSelect): z.infer<typeof AdminAtomSchema> {
  return { id: r.id, tradition: r.tradition, key: r.key, locale: r.locale, title: r.title, bodyMd: r.bodyMd, tone: r.tone, sourceRef: r.sourceRef, author: r.author, reviewer: r.reviewer, status: r.status, version: r.version, updatedAt: r.updatedAt.toISOString() };
}

export const adminRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('onRequest', async (req) => {
    const expected = app.config.ADMIN_TOKEN;
    if (!expected) throw new AppError(503, 'admin_disabled', 'ADMIN_TOKEN is not configured');
    const got = String(req.headers['x-admin-token'] ?? '');
    const a = Buffer.from(got);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw unauthorized('invalid admin token');
  });
  const tag = ['admin'];

  app.get(
    '/admin/atoms',
    {
      schema: {
        tags: tag,
        summary: 'List content atoms (latest version per key+locale unless includeVersions)',
        querystring: z.object({
          tradition: z.enum(TRADITIONS).optional(),
          locale: LocaleSchema.optional(),
          status: z.enum(STATUSES).optional(),
          q: z.string().max(80).optional(),
          page: z.coerce.number().int().min(1).default(1),
          pageSize: z.coerce.number().int().min(1).max(200).default(50),
        }),
        response: { 200: z.object({ items: z.array(AdminAtomSchema), total: z.number().int(), page: z.number().int(), pageSize: z.number().int() }) },
      },
    },
    async (req) => {
      const { tradition, locale, status, q, page, pageSize } = req.query;
      const conds: SQL[] = [];
      if (tradition) conds.push(eq(contentAtoms.tradition, tradition));
      if (locale) conds.push(eq(contentAtoms.locale, locale));
      if (status) conds.push(eq(contentAtoms.status, status));
      if (q) conds.push(or(ilike(contentAtoms.key, `%${q}%`), ilike(contentAtoms.title, `%${q}%`))!);
      const where = conds.length ? and(...conds) : undefined;
      const countRows = await app.db.select({ count: sql<number>`count(*)::int` }).from(contentAtoms).where(where);
      const count = countRows[0]?.count ?? 0;
      const rows = await app.db.select().from(contentAtoms).where(where).orderBy(contentAtoms.key, contentAtoms.locale, desc(contentAtoms.version)).limit(pageSize).offset((page - 1) * pageSize);
      return { items: rows.map(serialize), total: count, page, pageSize };
    },
  );

  app.get('/admin/atoms/:id', { schema: { tags: tag, summary: 'One atom (any status)', params: z.object({ id: z.string() }), response: { 200: AdminAtomSchema, 404: ErrorSchema } } }, async (req) => {
    const [r] = await app.db.select().from(contentAtoms).where(eq(contentAtoms.id, req.params.id)).limit(1);
    if (!r) throw notFound('atom');
    return serialize(r);
  });

  app.put(
    '/admin/atoms/:id',
    {
      schema: {
        tags: tag,
        summary: 'Edit title/body/status/reviewer in place',
        params: z.object({ id: z.string() }),
        body: z.object({ title: z.string().min(1).optional(), bodyMd: z.string().min(1).optional(), status: z.enum(STATUSES).optional(), reviewer: z.string().optional(), tone: z.string().optional() }),
        response: { 200: AdminAtomSchema, 404: ErrorSchema },
      },
    },
    async (req) => {
      const [r] = await app.db.update(contentAtoms).set({ ...req.body, updatedAt: new Date() }).where(eq(contentAtoms.id, req.params.id)).returning();
      if (!r) throw notFound('atom');
      return serialize(r);
    },
  );

  app.post(
    '/admin/atoms',
    {
      schema: { tags: tag, summary: 'Create a new version of an atom (version = max+1)', body: AtomImportSchema.omit({ version: true, id: true }), response: { 201: AdminAtomSchema } },
    },
    async (req, reply) => {
      const b = req.body;
      const maxRows = await app.db.select({ max: sql<number | null>`max(version)` }).from(contentAtoms).where(and(eq(contentAtoms.key, b.key), eq(contentAtoms.locale, b.locale)));
      const version = Number(maxRows[0]?.max ?? 0) + 1;
      const [r] = await app.db
        .insert(contentAtoms)
        .values({ id: `${b.key}@${b.locale}@v${version}`, tradition: b.tradition, key: b.key, locale: b.locale, title: b.title, bodyMd: b.body_md, tone: b.tone ?? null, sourceRef: b.source_ref ?? null, author: b.author ?? 'human', reviewer: b.reviewer ?? null, status: b.status, version })
        .returning();
      return reply.code(201).send(serialize(r!));
    },
  );

  app.post(
    '/admin/atoms/import',
    {
      schema: {
        tags: tag,
        summary: 'Bulk upsert atoms (JSONL rows from packages/content). Upsert by id; keeps existing status unless overwriteStatus',
        body: z.object({ atoms: z.array(AtomImportSchema).min(1).max(2000), overwriteStatus: z.boolean().default(false) }),
        response: { 200: z.object({ inserted: z.number().int(), updated: z.number().int() }) },
      },
    },
    async (req) => {
      let inserted = 0;
      let updated = 0;
      for (const a of req.body.atoms) {
        const id = a.id ?? `${a.key}@${a.locale}@v${a.version}`;
        const [existing] = await app.db.select({ id: contentAtoms.id }).from(contentAtoms).where(eq(contentAtoms.id, id)).limit(1);
        const values = { tradition: a.tradition, key: a.key, locale: a.locale, title: a.title, bodyMd: a.body_md, tone: a.tone ?? null, sourceRef: a.source_ref ?? null, author: a.author ?? null, reviewer: a.reviewer ?? null, version: a.version, updatedAt: new Date() };
        if (existing) {
          await app.db.update(contentAtoms).set(req.body.overwriteStatus ? { ...values, status: a.status } : values).where(eq(contentAtoms.id, id));
          updated++;
        } else {
          await app.db.insert(contentAtoms).values({ id, ...values, status: a.status });
          inserted++;
        }
      }
      return { inserted, updated };
    },
  );

  app.get(
    '/admin/coverage',
    { schema: { tags: tag, summary: 'Atom counts per tradition × locale × status', response: { 200: z.object({ rows: z.array(z.object({ tradition: z.string(), locale: z.string(), total: z.number().int(), draft: z.number().int(), reviewed: z.number().int(), published: z.number().int() })) }) } } },
    async () => {
      const rows = await app.db
        .select({
          tradition: contentAtoms.tradition,
          locale: contentAtoms.locale,
          total: sql<number>`count(*)::int`,
          draft: sql<number>`sum(case when status = 'draft' then 1 else 0 end)::int`,
          reviewed: sql<number>`sum(case when status = 'reviewed' then 1 else 0 end)::int`,
          published: sql<number>`sum(case when status = 'published' then 1 else 0 end)::int`,
        })
        .from(contentAtoms)
        .groupBy(contentAtoms.tradition, contentAtoms.locale)
        .orderBy(contentAtoms.tradition, contentAtoms.locale);
      return { rows };
    },
  );

  app.post(
    '/admin/glossary/import',
    { schema: { tags: tag, summary: 'Bulk upsert glossary rows', body: z.object({ rows: z.array(z.object({ termKey: z.string(), locale: LocaleSchema, term: z.string(), note: z.string().optional().nullable() })).min(1).max(5000) }), response: { 200: z.object({ upserted: z.number().int() }) } } },
    async (req) => {
      for (const r of req.body.rows) {
        await app.db.insert(glossary).values({ termKey: r.termKey, locale: r.locale, term: r.term, note: r.note ?? null }).onConflictDoUpdate({ target: [glossary.termKey, glossary.locale], set: { term: r.term, note: r.note ?? null } });
      }
      return { upserted: req.body.rows.length };
    },
  );

  app.post(
    '/admin/jobs/daily-oracle',
    {
      schema: {
        tags: tag,
        summary: 'Run the Daily Oracle generator now for a date and locales (idempotent upsert)',
        body: z.object({ date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), locales: z.array(LocaleSchema).default(['vi', 'en']), force: z.boolean().default(false) }),
        response: { 200: z.object({ date: z.string(), generated: z.number().int(), skipped: z.number().int(), costUsd: z.number(), ai: z.boolean() }) },
      },
    },
    async (req) => runDailyOracleJob(app, { date: req.body.date, locales: req.body.locales as Locale[], force: req.body.force }),
  );

  app.get(
    '/admin/daily-content',
    { schema: { tags: tag, summary: 'Preview generated Daily Oracle rows', querystring: z.object({ date: z.string(), locale: LocaleSchema.optional() }), response: { 200: z.object({ rows: z.array(z.object({ date: z.string(), locale: z.string(), segmentKey: z.string(), payload: z.record(z.unknown()) })) }) } } },
    async (req) => {
      const rows = await app.db.select().from(dailyContent).where(req.query.locale ? and(eq(dailyContent.date, req.query.date), eq(dailyContent.locale, req.query.locale)) : eq(dailyContent.date, req.query.date));
      return { rows: rows.map((r) => ({ date: r.date, locale: r.locale, segmentKey: r.segmentKey, payload: r.payloadJson })) };
    },
  );
  void LOCALES;
};
