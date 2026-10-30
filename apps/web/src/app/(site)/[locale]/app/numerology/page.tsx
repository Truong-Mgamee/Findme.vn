import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { NumerologyNumber, NumerologyResult } from '@findme/engine-numerology';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, selfProfile } from '@/lib/app-page';
import { Notice, Panel, Table } from '@/components/app/ui';

/** TODO(@findme/ui): NumerologyGrid. */
export default async function NumerologyPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.numerology' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const { profile, result } = await selfProfile(locale);
  if (result.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!profile) redirect(`/${locale}/app/onboarding`);
  const r = await appFetch<NumerologyResult | { facts: NumerologyResult }>(locale, `/profiles/${profile.id}/numerology`);
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const n = 'facts' in r.data ? r.data.facts : r.data;
  const num = (v: NumerologyNumber | null | undefined) => (v ? `${v.value}${v.isMaster ? ` (${t('master')})` : ''}` : '—');
  const cards: Array<[string, string]> = [
    [t('lifePath'), num(n.lifePath)], [t('birthday'), num(n.birthday)], [t('expression'), num(n.expression)], [t('soulUrge'), num(n.soulUrge)],
    [t('personality'), num(n.personality)], [t('maturity'), num(n.maturity)], [t('personalYear'), num(n.personalYear)], [t('personalMonth'), num(n.personalMonth)], [t('personalDay'), num(n.personalDay)],
  ];
  const ages = (a: { from: number; to: number | null }) => (a.to === null ? t('agesOpen', { from: a.from }) : t('ages', { from: a.from, to: a.to }));
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {!n.nameSupported && <Notice tone="warn">{t('noName')}</Notice>}
      <div className="grid grid-cols-3 gap-2" data-testid="numbers">
        {cards.map(([k, v]) => (
          <div key={k} className="rounded-xl bg-night-2 p-3 text-center">
            <p className="text-xs text-white/60">{k}</p>
            <p className="text-2xl font-semibold text-gold-2">{v}</p>
          </div>
        ))}
      </div>
      <Panel title={t('pinnacles')}>
        <Table head={['#', t('pinnacles'), t('challenges'), '']} rows={n.pinnacles.map((p, i) => [p.index, num(p), num(n.challenges[i]), ages(p.ages)])} />
      </Panel>
      {n.karmicDebt.length > 0 && <Panel title={t('karmicDebt')}><p>{n.karmicDebt.map((k) => `${k.number} (${k.source})`).join(', ')}</p></Panel>}
    </div>
  );
}
