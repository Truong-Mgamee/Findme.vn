import fp from 'fastify-plugin';
import type { Locale } from '@findme/engine-core';
import { localeFromHeaders, tzFromHeaders } from '../lib/locale.js';

declare module 'fastify' {
  interface FastifyRequest {
    /** resolved: X-Locale > user.locale > Accept-Language > 'en' */
    locale: Locale;
    /** true when the client pinned a locale via header (so user.locale must not override it) */
    localeFromHeader: boolean;
    /** IANA zone: X-Tz > user.tz > 'UTC' */
    tz: string;
    tzFromHeader: boolean;
  }
}

export default fp(
  async (app) => {
    app.decorateRequest('locale', 'en');
    app.decorateRequest('localeFromHeader', false);
    app.decorateRequest('tz', 'UTC');
    app.decorateRequest('tzFromHeader', false);
    app.addHook('onRequest', async (req) => {
      const l = localeFromHeaders(req.headers);
      req.locale = l ?? 'en';
      req.localeFromHeader = l !== null;
      const tz = tzFromHeaders(req.headers);
      req.tz = tz ?? 'UTC';
      req.tzFromHeader = tz !== null;
    });
  },
  { name: 'locale' },
);
