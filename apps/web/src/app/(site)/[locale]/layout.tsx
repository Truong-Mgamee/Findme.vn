import type { Metadata, Viewport } from 'next';
import type { ReactNode } from 'react';
import { notFound } from 'next/navigation';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { setRequestLocale } from 'next-intl/server';
import { LOCALE_CONFIGS } from '@findme/i18n';
import { routing } from '@/i18n/routing';
import '../../globals.css';

export const metadata: Metadata = {
  title: { default: 'Findme', template: '%s · Findme' },
  applicationName: 'Findme',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Findme', statusBarStyle: 'black-translucent' },
  icons: { icon: '/icons/icon-192.png', apple: '/icons/icon-192.png' },
};

export const viewport: Viewport = { themeColor: '#0b1020', width: 'device-width', initialScale: 1 };

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  return (
    <html lang={LOCALE_CONFIGS[locale].intlTag} dir={LOCALE_CONFIGS[locale].direction}>
      <body className="min-h-screen">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
