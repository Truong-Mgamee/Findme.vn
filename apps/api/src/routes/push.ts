import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { pushTokens, users } from '../db/schema.js';
import { currentUser } from '../plugins/auth.js';

export const pushRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  const sec = [{ bearerAuth: [] }];
  app.post('/me/push-token', { schema: { tags: ['me'], summary: 'Register an Expo/Web push token and enable daily push', security: sec, body: z.object({ token: z.string().min(10).max(512), platform: z.enum(['ios', 'android', 'web']) }), response: { 200: z.object({ ok: z.literal(true), tokens: z.number().int() }) } } }, async (req) => {
    const user = currentUser(req);
    await app.db.insert(pushTokens).values({ userId: user.id, token: req.body.token, platform: req.body.platform }).onConflictDoNothing();
    await app.db.update(users).set({ pushEnabled: true }).where(eq(users.id, user.id));
    const rows = await app.db.select({ t: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, user.id));
    return { ok: true as const, tokens: rows.length };
  });
  app.delete('/me/push-token', { schema: { tags: ['me'], summary: 'Remove a push token (disables daily push when none remain)', security: sec, body: z.object({ token: z.string() }), response: { 200: z.object({ ok: z.literal(true), tokens: z.number().int() }) } } }, async (req) => {
    const user = currentUser(req);
    await app.db.delete(pushTokens).where(and(eq(pushTokens.userId, user.id), eq(pushTokens.token, req.body.token)));
    const rows = await app.db.select({ t: pushTokens.token }).from(pushTokens).where(eq(pushTokens.userId, user.id));
    if (!rows.length) await app.db.update(users).set({ pushEnabled: false }).where(eq(users.id, user.id));
    return { ok: true as const, tokens: rows.length };
  });
};
