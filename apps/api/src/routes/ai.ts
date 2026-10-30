import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { readings } from '../db/schema.js';
import { localDate } from '../lib/locale.js';
import { notFound, PaywallError } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { consumeDailyQuota, DAILY_FREE_QUOTA, hasSubscriptionFor } from '../services/entitlements.js';
import { selfProfile } from '../services/profiles.js';
import { askAi } from '../services/ai.js';
import { ErrorSchema, PaywallSchema } from './schemas.js';

export const aiRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.post(
    '/ai/ask',
    {
      schema: {
        tags: ['readings'],
        summary: 'Ask the AI guide a follow-up question grounded on your core facts and (optionally) a reading',
        description: `Free users get ${DAILY_FREE_QUOTA.ask_ai} questions per local day; Plus is unlimited. Answers are grounded on stored engine facts only.`,
        security: [{ bearerAuth: [] }],
        body: z.object({ question: z.string().min(2).max(600), readingId: z.string().uuid().optional() }),
        response: { 200: z.object({ text: z.string(), quotaLeft: z.number().int().nullable(), model: z.string().nullable() }), 402: PaywallSchema, 404: ErrorSchema },
      },
    },
    async (req) => {
      const user = currentUser(req);
      const day = localDate(req.tz);
      const plus = await hasSubscriptionFor(app.db, user.id, 'ask_ai');
      let quotaLeft: number | null = null;
      if (!plus) {
        const q = await consumeDailyQuota(app.store, user.id, 'ask_ai', day);
        if (!q.allowed) throw new PaywallError('ask_ai_quota_exceeded', { quotaLeft: 0, message: 'Daily free question limit reached' });
        quotaLeft = q.remaining;
      }
      let readingSummary: unknown = null;
      if (req.body.readingId) {
        const [r] = await app.db.select().from(readings).where(and(eq(readings.id, req.body.readingId), eq(readings.userId, user.id))).limit(1);
        if (!r) throw notFound('reading');
        readingSummary = { kind: r.kind, engine: r.engineJson, ai: r.aiJson };
      }
      const profile = await selfProfile(app.db, user.id);
      const context = { profileCore: profile?.coreJson ?? null, reading: readingSummary, today: day };
      const r = await askAi(app, { userId: user.id, locale: req.locale, question: req.body.question, context, readingId: req.body.readingId ?? null, day });
      app.metrics.inc('ai_ask_total', { plus: String(plus) });
      return { text: r.text, quotaLeft, model: r.model };
    },
  );
};
