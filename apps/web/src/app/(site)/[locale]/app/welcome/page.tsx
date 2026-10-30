import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { apiUrl } from '@/lib/env';
import { GuestStart } from '@/components/app/GuestStart';
import { Notice, Panel } from '@/components/app/ui';

export default async function WelcomePage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.welcome' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  return (
    <Panel>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="mt-2 text-white/80">{t('body')}</p>
      {apiUrl() ? <GuestStart locale={locale} labels={{ start: t('start'), starting: t('starting'), failed: t('failed') }} /> : <div className="mt-4"><Notice tone="warn">{tc('apiNotConfigured')}</Notice></div>}
    </Panel>
  );
}
