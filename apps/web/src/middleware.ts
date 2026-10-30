import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Locale routing applies to pages only: skip /admin, /api, Next internals, PWA files and anything with an extension.
  matcher: ['/((?!api|admin|_next|_vercel|sw\\.js|manifest\\.webmanifest|.*\\..*).*)'],
};
