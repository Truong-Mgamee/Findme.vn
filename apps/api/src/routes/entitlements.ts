import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { currentUser } from '../plugins/auth.js';
import { entitlementSummary } from '../services/entitlements.js';
import { EntitlementSummarySchema } from './schemas.js';

export const entitlementRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.get('/entitlements', { schema: { tags: ['billing'], summary: 'Active subscriptions, credit balance, unlocked features', security: [{ bearerAuth: [] }], response: { 200: EntitlementSummarySchema } } }, async (req) =>
    entitlementSummary(app.db, currentUser(req).id),
  );
};
