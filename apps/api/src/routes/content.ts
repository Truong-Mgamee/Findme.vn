import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { LocaleSchema } from '@findme/engine-core';
import { contentAtoms } from '../db/schema.js';
import { AtomSchema } from './schemas.js';

export const contentRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/content/atoms',
    {
      schema: {
        tags: ['content'],
        summary: 'Published content atoms by key (fallback locale → en); public, CDN-cacheable',
        querystring: z.object({ keys: z.string().min(1).describe('comma-separated, max 50'), locale: LocaleSchema.optional() }),
        response: { 200: z.object({ locale: z.string(), atoms: z.array(AtomSchema), missing: z.array(z.string()) }) },
      },
    },
    async (req, reply) => {
      const keys = [...new Set(req.query.keys.split(',').map((k) => k.trim()).filter(Boolean))].slice(0, 50);
      const locale = req.query.locale ?? req.locale;
      const locales = locale === 'en' ? ['en'] : [locale, 'en'];
      const rows = await app.db
        .select()
        .from(contentAtoms)
        .where(and(inArray(contentAtoms.key, keys), inArray(contentAtoms.locale, locales), eq(contentAtoms.status, 'published')));
      const atoms = [];
      const missing: string[] = [];
      for (const key of keys) {
        const candidates = rows.filter((r) => r.key === key).sort((a, b) => (a.locale === locale ? -1 : 1) - (b.locale === locale ? -1 : 1) || b.version - a.version);
        const pick = candidates[0];
        if (!pick) {
          missing.push(key);
          continue;
        }
        atoms.push({ id: pick.id, key: pick.key, locale: pick.locale, tradition: pick.tradition, title: pick.title, bodyMd: pick.bodyMd, tone: pick.tone, version: pick.version, fallback: pick.locale !== locale });
      }
      reply.header('cache-control', 'public, max-age=300, stale-while-revalidate=3600');
      return { locale, atoms, missing };
    },
  );
};
