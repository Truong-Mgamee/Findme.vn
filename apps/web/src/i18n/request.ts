import { getRequestConfig } from 'next-intl/server';
import { hasLocale } from 'next-intl';
import { getCatalog, LOCALE_CONFIGS } from '@findme/i18n';
import { routing } from './routing';

/** Messages are the shared catalogs in packages/i18n/messages (same files as the mobile app). */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (getCatalog(locale) ?? getCatalog('en') ?? {}) as Record<string, unknown>;
  return { locale, messages: messages as never, timeZone: locale === 'vi' ? 'Asia/Ho_Chi_Minh' : 'UTC', now: new Date(), formats: {}, ...(LOCALE_CONFIGS[locale] ? {} : {}) };
});
