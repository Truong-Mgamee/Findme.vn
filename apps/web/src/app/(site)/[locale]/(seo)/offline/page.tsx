import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';

export const dynamic = 'force-static';

export default async function OfflinePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.app.offline' });
  return (
    <section className="mx-auto max-w-lg py-20 text-center">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-black/70">{t('body')}</p>
    </section>
  );
}
