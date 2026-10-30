import { getTranslations } from 'next-intl/server';
import { LOCALE_CONFIGS } from '@findme/i18n';
import { routing, type AppLocale } from '@/i18n/routing';
import { appFetch, type MeUser } from '@/lib/app-page';
import { SettingsForm } from '@/components/app/SettingsForm';
import { Notice, Panel } from '@/components/app/ui';

export default async function SettingsPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.settings' });
  const ta = await getTranslations({ locale, namespace: 'web.almanac' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<MeUser>(locale, '/me');
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <SettingsForm
        locale={locale}
        me={r.data}
        locales={routing.locales.map((l) => ({ value: l, label: LOCALE_CONFIGS[l].nativeName }))}
        standards={(['vn', 'cn', 'kr', 'jp'] as const).map((s) => ({ value: s, label: ta(`standards.${s}`) }))}
        labels={{ locale: t('locale'), calendarStandard: t('calendarStandard'), dailyHour: t('dailyHour'), save: t('save'), saving: t('saving'), saved: t('saved'), deleteTitle: t('deleteTitle'), deleteBody: t('deleteBody'), deleteButton: t('deleteButton'), deleteConfirm: t('deleteConfirm'), deleted: t('deleted'), logout: t('logout'), tz: t('tz'), error: tc('error') }}
      />
      <Panel title={t('about')}><p className="text-sm text-white/70">{t('aboutBody')}</p></Panel>
    </div>
  );
}
