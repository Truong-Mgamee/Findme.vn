import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { ALL_TASKS } from '@/lib/almanac';
import { addDays, localDate } from '@/lib/dates';
import { appFetch, type Profile } from '@/lib/app-page';
import { DatePickerForm } from '@/components/app/DatePickerForm';
import { Notice } from '@/components/app/ui';

export default async function PickPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.pick' });
  const tt = await getTranslations({ locale, namespace: 'web.tasks' });
  const ta = await getTranslations({ locale, namespace: 'web.almanac' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<{ profiles: Profile[] }>(locale, '/profiles');
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  const from = localDate(locale === 'vi' ? 'Asia/Ho_Chi_Minh' : 'UTC');
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-white/80">{t('intro')}</p>
      <DatePickerForm
        locale={locale}
        profiles={(r.data?.profiles ?? []).map((p) => ({ id: p.id, label: p.label }))}
        tasks={ALL_TASKS.map((k) => ({ key: k, label: tt(k) }))}
        defaults={{ from, to: addDays(from, 30) }}
        labels={{ task: t('task'), from: t('from'), to: t('to'), limit: t('limit'), submit: t('submit'), submitting: t('submitting'), results: t('results'), useCredit: t('useCredit'), score: ta('score'), lunar: ta('lunarDate'), huangdao: ta('huangdao'), heidao: ta('heidao'), error: tc('error') }}
      />
    </div>
  );
}
