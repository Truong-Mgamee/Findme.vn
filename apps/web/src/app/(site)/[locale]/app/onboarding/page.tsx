import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, type MeUser } from '@/lib/app-page';
import { OnboardingForm } from '@/components/app/OnboardingForm';
import { Panel } from '@/components/app/ui';

export default async function OnboardingPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const me = await appFetch<MeUser>(locale, '/me');
  const t = await getTranslations({ locale, namespace: 'web.app.onboarding' });
  const tb = await getTranslations({ locale, namespace: 'onboarding.birth' });
  const tc = await getTranslations({ locale, namespace: 'common' });
  return (
    <Panel>
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <OnboardingForm
        locale={locale}
        defaultStandard={me.data?.calendarStandard ?? (locale === 'vi' ? 'vn' : 'cn')}
        labels={{
          date: tb('date'), time: tb('time'), timeUnknown: tb('timeUnknown'), timeUnknownHint: tb('timeUnknownHint'), place: t('city'), placeHint: tb('placeHint'), gender: tb('gender'),
          male: t('male'), female: t('female'), other: t('other'), fullName: t('fullName'), citySearch: t('citySearch'), noCity: t('noCity'), submit: t('submit'), submitting: t('submitting'), selectCity: t('selectCity'), error: tc('errorGeneric'),
        }}
      />
    </Panel>
  );
}
