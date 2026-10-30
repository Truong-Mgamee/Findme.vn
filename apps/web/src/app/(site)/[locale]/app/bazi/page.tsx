import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { BaziChart } from '@findme/engine-bazi';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, selfProfile } from '@/lib/app-page';
import { Notice, Panel, Table } from '@/components/app/ui';

/** TODO(@findme/ui): BaziPillars + LuckTimeline. */
export default async function BaziPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.bazi' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const { profile, result } = await selfProfile(locale);
  if (result.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!profile) redirect(`/${locale}/app/onboarding`);
  const r = await appFetch<BaziChart>(locale, `/profiles/${profile.id}/bazi`);
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const c = r.data;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <div className="grid grid-cols-4 gap-2 text-center" data-testid="pillars">
        {[...c.pillars].reverse().map((p) => (
          <div key={p.key} className="rounded-xl bg-night-2 p-2">
            <p className="text-xs text-white/60">{t(p.key)}</p>
            <p className="font-serif text-2xl text-gold-2">{p.ganzhi.han}</p>
            <p className="text-xs">{p.stemLabel} {p.branchLabel}</p>
            <p className="text-[11px] text-white/60">{p.tenGodLabel ?? t('dayMaster')}</p>
            <p className="text-[11px] text-white/50">{p.hiddenStems.map((h) => h.label).join(' ')}</p>
            <p className="text-[11px] text-white/40">{p.nayin.label}</p>
          </div>
        ))}
      </div>
      <Panel title={t('dayMaster')}>
        <p>{c.dayMaster.label} · {c.dayMaster.elementLabel} ({c.dayMaster.yin ? '−' : '+'}) · {t('strength')}: {c.strength.verdict} ({c.strength.score})</p>
        <p className="mt-1 text-sm text-white/80">{t('useful')}: {c.favorable.useful.join(', ')} · {t('unfavorable')}: {c.favorable.unfavorable.join(', ')}</p>
        <p className="mt-1 text-xs text-white/60">{c.favorable.rationale}</p>
        <p className="mt-2 text-sm">{t('elements')}: {Object.entries(c.elementCounts).map(([k, v]) => `${k} ${v}`).join(' · ')}</p>
      </Panel>
      <Panel title={t('luck')}>
        <div className="flex gap-2 overflow-x-auto pb-2" data-testid="luck-periods">
          {c.luck.periods.map((p) => (
            <div key={p.index} className="min-w-20 rounded-lg bg-night p-2 text-center text-xs">
              <p className="font-serif text-lg text-gold-2">{p.ganzhi.han}</p>
              <p>{p.label}</p>
              <p className="text-white/60">{t('startAge', { age: p.startAge })}</p>
              <p className="text-white/40">{p.startYear}–{p.endYear}</p>
            </div>
          ))}
        </div>
      </Panel>
      <Panel title={t('annual')}>
        <Table head={[t('year'), t('age'), t('stem'), t('tenGod')]} rows={c.annual.map((a) => [a.year, a.age, `${a.ganzhi.han} ${a.label}`, a.tenGodStem])} />
      </Panel>
    </div>
  );
}
