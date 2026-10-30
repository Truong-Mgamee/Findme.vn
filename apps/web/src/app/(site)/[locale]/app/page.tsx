import { getTranslations } from 'next-intl/server';
import { ganzhiLabel } from '@findme/engine-core';
import type { DayAlmanac, PersonalizedAlmanac } from '@findme/engine-almanac';
import type { DailySky } from '@findme/engine-astro';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { appFetch } from '@/lib/app-page';
import { Notice, Panel } from '@/components/app/ui';

interface TodayPayload {
  date: string;
  tz: string;
  locale: string;
  traditionPack: string;
  profileId: string | null;
  needsProfile: boolean;
  segments: string[];
  content: Record<string, Record<string, unknown>>;
  eastAsia?: { almanac: DayAlmanac | PersonalizedAlmanac; atomKeys: string[] };
  western?: { personalDay: number | null; sky: DailySky; lifePath: number | null; sunSign: string | null; atomKeys: string[] };
  streak: { current: number; longest: number; lastDate: string | null };
}

const str = (v: unknown) => (typeof v === 'string' ? v : null);

/** Today (Daily Oracle) — GET /v1/today. TODO(@findme/ui): OracleCard swipe deck. */
export default async function TodayPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.today' });
  const ta = await getTranslations({ locale, namespace: 'web.almanac' });
  const tm = await getTranslations({ locale, namespace: 'web.moon' });
  const tx = await getTranslations({ locale, namespace: 'web.app.explore' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const r = await appFetch<TodayPayload>(locale, '/today');
  if (r.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const d = r.data;
  const a = d.eastAsia?.almanac;
  const personal = a && 'personal' in a ? (a as PersonalizedAlmanac).personal : null;
  const w = d.western;
  const contentEntries = Object.entries(d.content);
  return (
    <div className="space-y-4">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-semibold">{tc('today')} · {d.date}</h1>
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs text-gold-2" data-testid="streak">{t('streak', { count: d.streak.current })}</span>
      </header>
      {d.needsProfile && (
        <Notice tone="warn">
          {t('needsProfile')} <Link href="/app/onboarding" className="ml-2 underline">{t('createProfile')}</Link>
        </Notice>
      )}
      {contentEntries.length > 0 ? (
        <Panel title={t('content')}>
          <ul className="space-y-3">
            {contentEntries.map(([seg, payload]) => (
              <li key={seg} className="rounded-xl bg-night p-3">
                <p className="text-xs text-white/50">{seg}</p>
                {str(payload.title) && <p className="font-medium">{str(payload.title)}</p>}
                <p className="text-sm text-white/90">{str(payload.text) ?? str(payload.body) ?? str(payload.summary) ?? JSON.stringify(payload)}</p>
              </li>
            ))}
          </ul>
        </Panel>
      ) : (
        <Notice>{t('noContent')}</Notice>
      )}
      {a && (
        <Panel title={t('almanac')}>
          <p className="text-lg">{ta('lunarDay', { day: a.lunar.day, month: a.lunar.month })} · {ganzhiLabel(a.dayGanzhi, locale)} ({a.dayGanzhi.han})</p>
          <p className={`mt-1 text-sm ${a.huangdao ? 'text-jade' : 'text-vermilion'}`}>{a.huangdao ? ta('huangdao') : ta('heidao')}</p>
          {personal && (
            <p className="mt-2 text-sm">
              {t('score')}: <strong>{personal.score}</strong> · {t('lucky')}: {personal.luckyNumbers.join(', ')} · <span style={{ color: personal.luckyColor.hex }}>●</span> {personal.luckyColor.label}
            </p>
          )}
          <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div><p className="text-white/60">{ta('yi')}</p><p>{a.yi.map((i) => i.label).join(', ')}</p></div>
            <div><p className="text-white/60">{ta('ji')}</p><p>{a.ji.map((i) => i.label).join(', ')}</p></div>
            <div className="sm:col-span-2"><p className="text-white/60">{ta('goodHours')}</p><p>{a.hours.filter((h) => h.auspicious).map((h) => `${h.label} ${h.from}–${h.to}`).join(' · ')}</p></div>
          </div>
          <Link href="/app/almanac" className="mt-3 inline-block text-sm underline">{tx('almanac')} →</Link>
        </Panel>
      )}
      {w && (
        <Panel title={t('western')}>
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {w.personalDay !== null && <><dt className="text-white/60">{t('personalDay')}</dt><dd className="text-xl">{w.personalDay}</dd></>}
            {w.lifePath !== null && <><dt className="text-white/60">{t('lifePath')}</dt><dd className="text-xl">{w.lifePath}</dd></>}
            {w.sunSign && <><dt className="text-white/60">{t('sunSign')}</dt><dd>{tm(`signs.${w.sunSign}` as never)}</dd></>}
            <dt className="text-white/60">{t('moon')}</dt>
            <dd>{tm(`phases.${w.sky.moon.phase.name}`)} · {tm(`signs.${w.sky.moon.sign}`)}</dd>
          </dl>
        </Panel>
      )}
      <Panel title={tx('readings')}>
        <ul className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
          {([['/app/ziwei', tx('ziwei')], ['/app/bazi', tx('bazi')], ['/app/numerology', tx('numerology')], ['/app/astro', tx('astro')], ['/app/almanac/pick', tx('pick')], ['/app/readings', tx('readings')]] as const).map(([href, label]) => (
            <li key={href}><Link href={href} className="block rounded-xl bg-night px-3 py-3 hover:bg-white/10">{label}</Link></li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
