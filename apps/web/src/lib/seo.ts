import type { Metadata } from 'next';
import { routing, type AppLocale, type Pathname } from '@/i18n/routing';
import { getPathname } from '@/i18n/navigation';
import { ANDROID_PACKAGE, IOS_APP_ID, siteUrl } from './env';

type Params = Record<string, string>;

export interface SeoInput {
  locale: AppLocale;
  /** internal route name from PATHNAMES */
  pathname: Pathname;
  /** params for the current locale */
  params?: Params;
  /** params for other locales when they differ (e.g. zodiac slugs); defaults to `params` */
  paramsByLocale?: Partial<Record<AppLocale, Params>>;
  title: string;
  description: string;
  /** locales that can render this page; defaults to all */
  locales?: readonly AppLocale[];
  images?: string[];
  type?: 'website' | 'article';
}

/** Absolute public URL for an internal route in a locale (localized slug from PATHNAMES). */
export function absoluteUrl(locale: AppLocale, pathname: Pathname, params?: Params): string {
  const href = params ? ({ pathname, params } as never) : (pathname as never);
  return `${siteUrl()}${getPathname({ locale, href })}`;
}

/** Canonical + hreflang alternates + OpenGraph + smart app banner meta for a localized page. */
export function buildMetadata(input: SeoInput): Metadata {
  const locales = input.locales ?? routing.locales;
  const languages: Record<string, string> = {};
  for (const l of locales) {
    const p = input.paramsByLocale?.[l] ?? input.params;
    languages[l === 'vi' ? 'vi-VN' : 'en'] = absoluteUrl(l, input.pathname, p);
  }
  const canonical = absoluteUrl(input.locale, input.pathname, input.params);
  languages['x-default'] = languages[input.locale === 'vi' ? 'vi-VN' : 'en'] ?? canonical;
  const other: Record<string, string> = { 'google-play-app': `app-id=${ANDROID_PACKAGE}` };
  if (IOS_APP_ID) other['apple-itunes-app'] = `app-id=${IOS_APP_ID}, app-argument=findme://today`;
  return {
    title: input.title,
    description: input.description,
    metadataBase: new URL(siteUrl()),
    alternates: { canonical, languages },
    openGraph: {
      title: input.title,
      description: input.description,
      url: canonical,
      siteName: 'Findme',
      locale: input.locale === 'vi' ? 'vi_VN' : 'en_US',
      type: input.type ?? 'website',
      images: input.images ?? ['/og-default.png'],
    },
    twitter: { card: 'summary_large_image', title: input.title, description: input.description },
    other,
  };
}

/** schema.org Article/WebPage JSON-LD for ISR content pages. */
export function articleJsonLd(input: { url: string; headline: string; description: string; locale: AppLocale; datePublished: string; dateModified?: string }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.headline,
    description: input.description,
    inLanguage: input.locale === 'vi' ? 'vi-VN' : 'en',
    url: input.url,
    datePublished: input.datePublished,
    dateModified: input.dateModified ?? input.datePublished,
    author: { '@type': 'Organization', name: 'Findme' },
    publisher: { '@type': 'Organization', name: 'Findme', url: siteUrl() },
    mainEntityOfPage: input.url,
  };
}

export function breadcrumbJsonLd(items: Array<{ name: string; url: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: it.url })),
  };
}

export const DEEP_LINK = 'findme://today';
