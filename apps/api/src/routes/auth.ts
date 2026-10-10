import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { eq, sql } from 'drizzle-orm';
import { z } from 'zod';
import { defaultCalendarStandard, defaultTraditionPack } from '@findme/i18n';
import { aiMessages, creditsLedger, entitlements, experiments, profiles, pushTokens, readings, streaks, users } from '../db/schema.js';
import { signGuestToken, verifySupabaseToken } from '../lib/jwt.js';
import { isValidTz } from '../lib/locale.js';
import { badRequest, notImplemented, unauthorized } from '../lib/errors.js';
import { currentUser } from '../plugins/auth.js';
import { ErrorSchema, GuestBodySchema, TokenResponseSchema } from './schemas.js';
import { serializeUser } from './me.js';

export const authRoutes: FastifyPluginAsyncZod = async (app) => {
  app.post(
    '/auth/guest',
    {
      schema: {
        tags: ['auth'],
        summary: 'Create a guest user and return a 180-day Bearer JWT',
        description: 'locale/country/traditionPack/calendarStandard come from the body, else X-Locale / Accept-Language / X-Tz headers and @findme/i18n defaults.',
        body: GuestBodySchema,
        response: { 201: TokenResponseSchema },
      },
    },
    async (req, reply) => {
      const b = req.body ?? {};
      const locale = b.locale ?? req.locale;
      const country = b.country?.toUpperCase();
      const tz = b.tz && isValidTz(b.tz) ? b.tz : req.tz;
      const traditionPack = b.traditionPack ?? defaultTraditionPack(country, locale);
      const calendarStandard = b.calendarStandard ?? defaultCalendarStandard(country ?? (locale === 'vi' ? 'VN' : undefined));
      const [user] = await app.db.insert(users).values({ locale, country: country ?? null, traditionPack, calendarStandard, tz }).returning();
      if (!user) throw new Error('insert users failed');
      const token = await signGuestToken(user.id, app.config.jwtSecret, app.config.GUEST_TOKEN_TTL_DAYS);
      app.metrics.inc('auth_guest_total');
      return reply.code(201).send({ token, tokenType: 'Bearer', expiresInDays: app.config.GUEST_TOKEN_TTL_DAYS, user: serializeUser(user) });
    },
  );

  app.post(
    '/auth/link',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['auth'],
        summary: 'Link the guest to a Supabase account (501 until SUPABASE_JWT_SECRET is configured)',
        security: [{ bearerAuth: [] }],
        body: z.object({ supabaseAccessToken: z.string().min(10) }),
        response: { 200: TokenResponseSchema.extend({ merged: z.boolean() }), 501: ErrorSchema, 401: ErrorSchema },
      },
    },
    async (req) => {
      const secret = app.config.SUPABASE_JWT_SECRET;
      if (!secret) throw notImplemented('auth/link (set SUPABASE_JWT_SECRET)');
      const guest = currentUser(req);
      let authUid: string;
      try {
        authUid = (await verifySupabaseToken(req.body.supabaseAccessToken, secret)).sub;
      } catch {
        throw unauthorized('invalid Supabase token');
      }
      if (guest.authUid && guest.authUid !== authUid) throw badRequest('already_linked', 'this user is linked to another account');

      const [existing] = await app.db.select().from(users).where(eq(users.authUid, authUid)).limit(1);
      let target = guest;
      let merged = false;
      if (existing && existing.id !== guest.id) {
        // Merge guest data into the already-linked account, then drop the guest row.
        await app.db.transaction(async (tx) => {
          for (const t of [profiles, readings, aiMessages, creditsLedger, pushTokens, experiments] as const) {
            await tx.update(t).set({ userId: existing.id }).where(eq(t.userId, guest.id));
          }
          const ents = await tx.select().from(entitlements).where(eq(entitlements.userId, guest.id));
          for (const e of ents) {
            await tx
              .insert(entitlements)
              .values({ ...e, userId: existing.id })
              .onConflictDoUpdate({ target: [entitlements.userId, entitlements.product], set: { status: e.status, expiresAt: e.expiresAt, source: e.source, rawJson: e.rawJson, updatedAt: new Date() } });
          }
          const [gs] = await tx.select().from(streaks).where(eq(streaks.userId, guest.id));
          if (gs) {
            await tx
              .insert(streaks)
              .values({ ...gs, userId: existing.id })
              .onConflictDoUpdate({ target: streaks.userId, set: { current: sql`greatest(${streaks.current}, ${gs.current})`, longest: sql`greatest(${streaks.longest}, ${gs.longest})`, lastDate: sql`greatest(${streaks.lastDate}, ${gs.lastDate ?? null})` } });
          }
          await tx.delete(users).where(eq(users.id, guest.id));
        });
        target = existing;
        merged = true;
      } else if (!guest.authUid) {
        const [u] = await app.db.update(users).set({ authUid }).where(eq(users.id, guest.id)).returning();
        if (u) target = u;
      }
      const token = await signGuestToken(target.id, app.config.jwtSecret, app.config.GUEST_TOKEN_TTL_DAYS);
      return { token, tokenType: 'Bearer' as const, expiresInDays: app.config.GUEST_TOKEN_TTL_DAYS, user: serializeUser(target), merged };
    },
  );
};
