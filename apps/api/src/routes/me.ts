import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { users, webhookEvents, type User } from '../db/schema.js';
import { isValidTz } from '../lib/locale.js';
import { badRequest } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { UserPatchSchema, UserSchema } from './schemas.js';

export function serializeUser(u: User): z.infer<typeof UserSchema> {
  return {
    id: u.id,
    authUid: u.authUid,
    locale: u.locale as z.infer<typeof UserSchema>['locale'],
    country: u.country,
    traditionPack: u.traditionPack as z.infer<typeof UserSchema>['traditionPack'],
    calendarStandard: u.calendarStandard as z.infer<typeof UserSchema>['calendarStandard'],
    tz: u.tz,
    dailyHour: u.dailyHour,
    pushEnabled: u.pushEnabled,
    createdAt: u.createdAt.toISOString(),
  };
}

export const meRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);

  app.get('/me', { schema: { tags: ['me'], summary: 'Current user settings', security: [{ bearerAuth: [] }], response: { 200: UserSchema } } }, async (req) => serializeUser(currentUser(req)));

  app.put('/me', { schema: { tags: ['me'], summary: 'Update locale / tradition pack / calendar standard / tz / daily hour', security: [{ bearerAuth: [] }], body: UserPatchSchema, response: { 200: UserSchema } } }, async (req) => {
    const user = currentUser(req);
    if (req.body.tz && !isValidTz(req.body.tz)) throw badRequest('invalid_tz', `unknown IANA zone ${req.body.tz}`);
    const patch = { ...req.body, country: req.body.country?.toUpperCase() };
    const [u] = await app.db.update(users).set(patch).where(eq(users.id, user.id)).returning();
    return serializeUser(u ?? user);
  });

  app.delete('/me', { schema: { tags: ['me'], summary: 'Hard-delete the user and every owned row (profiles, readings, credits, …)', security: [{ bearerAuth: [] }], response: { 204: z.null() } } }, async (req, reply) => {
    const user = currentUser(req);
    await app.db.transaction(async (tx) => {
      await tx.delete(webhookEvents).where(eq(webhookEvents.userId, user.id));
      await tx.delete(users).where(eq(users.id, user.id)); // FK cascades do the rest
    });
    app.metrics.inc('user_deleted_total');
    return reply.code(204).send(null);
  });
};
