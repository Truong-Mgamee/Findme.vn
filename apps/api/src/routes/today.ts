import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { currentUser } from '../plugins/auth.js';
import { assembleToday } from '../services/today.js';
import { JsonObject } from './schemas.js';

export const todayRoutes: FastifyPluginAsyncZod = async (app) => {
  app.addHook('preHandler', app.authenticate);
  app.get(
    '/today',
    {
      schema: {
        tags: ['today'],
        summary: 'Daily Oracle: daily_content segments for the user + personalised almanac / personal day / sky + streak',
        security: [{ bearerAuth: [] }],
        response: { 200: JsonObject },
      },
    },
    async (req) => {
      const user = currentUser(req);
      const payload = await app.metrics.time('today_ms', {}, () => assembleToday({ db: app.db, store: app.store, encKey: app.config.birthEncKey }, user, req.tz, req.locale));
      return payload as unknown as Record<string, unknown>;
    },
  );
};
