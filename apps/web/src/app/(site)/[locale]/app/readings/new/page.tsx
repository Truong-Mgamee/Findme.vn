import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, type Profile } from '@/lib/app-page';
import { NewReadingForm } from '@/components/app/NewReadingForm';
import { Notice } from '@/components/app/ui';

const KINDS = ['ziwei_full', 'bazi_luck', 'numerology_full', 'compatibility'] as const;

export default async function NewReadingPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.readings' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<{ profiles: Profile[] }>(locale, '/profiles');
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  const profiles = (r.data?.profiles ?? []).map((p) => ({ id: p.id, label: p.label }));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('new')}</h1>
      {profiles.length === 0 ? (
        <Notice tone="warn">{t('noProfiles')}</Notice>
      ) : (
        <NewReadingForm locale={locale} profiles={profiles} kinds={KINDS.map((k) => ({ key: k, label: t(`kinds.${k}`) }))} labels={{ kind: t('kind'), profile: t('profile'), create: t('create'), creating: t('creating'), error: tc('error'), useCredit: t('paidBy') + ': credit' }} />
      )}
    </div>
  );
}
