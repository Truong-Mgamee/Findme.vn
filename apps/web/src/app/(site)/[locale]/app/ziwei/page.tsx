import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { ZiweiChart, ZiweiHoroscope } from '@findme/engine-ziwei';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, selfProfile } from '@/lib/app-page';
import { Notice, Panel } from '@/components/app/ui';

/** 12-palace grid as a 4×4 CSS grid (centre = chart meta). TODO(@findme/ui): ZiweiChartSVG. */
const GRID: Record<number, string> = { 0: '4 / 2', 1: '4 / 1', 2: '3 / 1', 3: '2 / 1', 4: '1 / 1', 5: '1 / 2', 6: '1 / 3', 7: '1 / 4', 8: '2 / 4', 9: '3 / 4', 10: '4 / 4', 11: '4 / 3' };

export default async function ZiweiPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.ziwei' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const { profile, result } = await selfProfile(locale);
  if (result.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!profile) redirect(`/${locale}/app/onboarding`);
  const r = await appFetch<{ chart: ZiweiChart; horoscope: ZiweiHoroscope; atomKeys: string[] }>(locale, `/profiles/${profile.id}/ziwei`);
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const { chart, horoscope } = r.data;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      {profile.birthSummary.timeUnknown && <Notice tone="warn">{t('timeUnknown')}</Notice>}
      <div className="grid grid-cols-4 gap-1 text-[11px] leading-tight sm:text-xs" data-testid="ziwei-grid">
        {chart.palaces.map((p) => (
          <div key={p.key} style={{ gridArea: GRID[p.branch.index] }} className={`min-h-28 rounded-lg border p-1.5 ${p.key === chart.soul.key || p.name === chart.soul.name ? 'border-gold bg-gold/10' : 'border-white/15 bg-night-2'}`}>
            <div className="flex justify-between font-semibold text-gold-2"><span>{p.name}</span><span className="text-white/50">{p.stem.name}{p.branch.name}</span></div>
            <p className="mt-1 text-white">{p.majorStars.map((s) => `${s.name}${s.brightness ? `(${s.brightness.name})` : ''}${s.mutagen ? `·${s.mutagen.name}` : ''}`).join(' ')}</p>
            <p className="text-white/70">{p.minorStars.map((s) => s.name).join(' ')}</p>
            <p className="mt-1 text-white/40">{t('decadal')} {p.decadal.range[0]}–{p.decadal.range[1]}{p.isBodyPalace ? ` · ${t('body')}` : ''}</p>
          </div>
        ))}
        <div style={{ gridArea: '2 / 2 / 4 / 4' }} className="rounded-lg border border-white/10 bg-night p-3 text-xs">
          <p className="text-base font-semibold text-gold-2">{profile.label}</p>
          <p>{chart.lunarDateLabel}</p>
          <p>{chart.chineseDate} · {chart.time}</p>
          <p className="mt-2">{t('soul')}: {chart.soul.name} · {t('body')}: {chart.body.name}</p>
          <p>{t('fiveElements')}: {chart.fiveElementsClass.name}</p>
          <p>{t('school')}: {chart.school}</p>
          {chart.patterns.length > 0 && <p className="mt-2">{t('patterns')}: {chart.patterns.map((p) => p.key).join(', ')}</p>}
        </div>
      </div>
      <Panel title={t('horoscope', { date: horoscope.date })}>
        <dl className="grid grid-cols-2 gap-2 text-sm">
          {(['yearly', 'monthly', 'daily'] as const).map((k) => (
            <div key={k} className="rounded-lg bg-night p-2">
              <dt className="text-white/60">{t(k)}</dt>
              <dd>{(horoscope[k] as { heavenlyStem?: string; earthlyBranch?: string; palaceNames?: string[] }).heavenlyStem}{(horoscope[k] as { earthlyBranch?: string }).earthlyBranch}</dd>
            </div>
          ))}
        </dl>
      </Panel>
    </div>
  );
}
