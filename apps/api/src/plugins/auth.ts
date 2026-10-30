import fp from 'fastify-plugin';
import type { FastifyReply, FastifyRequest } from 'fastify';
import { eq } from 'drizzle-orm';
import type { Locale } from '@findme/engine-core';
import { users, type User } from '../db/schema.js';
import { verifyGuestToken } from '../lib/jwt.js';
import { unauthorized } from '../lib/errors.js';

declare module 'fastify' {
  interface FastifyRequest {
    user: User | null;
  }
  interface FastifyInstance {
    /** preHandler: requires a valid Bearer guest JWT and loads the user row */
    authenticate: (req: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

export default fp(
  async (app) => {
    app.decorateRequest('user', null);
    app.decorateRequest('payment', null);
    app.decorate('authenticate', async (req: FastifyRequest) => {
      const header = req.headers.authorization;
      if (!header?.startsWith('Bearer ')) throw unauthorized();
      const token = header.slice('Bearer '.length).trim();
      let sub: string;
      try {
        sub = (await verifyGuestToken(token, app.config.jwtSecret)).sub;
      } catch {
        throw unauthorized();
      }
      const [user] = await app.db.select().from(users).where(eq(users.id, sub)).limit(1);
      if (!user || user.deletedAt) throw unauthorized('user not found');
      req.user = user;
      if (!req.localeFromHeader) req.locale = user.locale as Locale;
      if (!req.tzFromHeader) req.tz = user.tz;
    });
  },
  { name: 'auth', dependencies: ['locale'] },
);

/** Narrow helper for handlers under `authenticate`. */
export function currentUser(req: FastifyRequest): User {
  if (!req.user) throw unauthorized();
  return req.user;
}
