import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import type { NatalChart } from '@findme/engine-astro';
import type { AppLocale } from '@/i18n/routing';
import { appFetch, selfProfile } from '@/lib/app-page';
import { Notice, Panel, Table } from '@/components/app/ui';

/** TODO(@findme/ui): natal wheel SVG. */
export default async function AstroPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.app.astro' });
  const tm = await getTranslations({ locale, namespace: 'web.moon' });
  const tc = await getTranslations({ locale, namespace: 'web.common' });
  const { profile, result } = await selfProfile(locale);
  if (result.unconfigured) return <Notice tone="warn">{tc('apiNotConfigured')}</Notice>;
  if (!profile) redirect(`/${locale}/app/onboarding`);
  const r = await appFetch<NatalChart | { facts: NatalChart }>(locale, `/profiles/${profile.id}/astro`);
  if (!r.data) return <Notice tone="error">{tc('error')} ({r.status})</Notice>;
  const c = 'facts' in r.data ? r.data.facts : r.data;
  const sign = (s: string) => tm(`signs.${s}` as never);
  const body = (b: string) => tm(`bodies.${b}` as never);
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-sm text-white/80">☉ {sign(c.sun)} · ☾ {sign(c.moon)} · {t('rising')} {sign(c.rising)} · {t('houseSystem')}: {c.houseSystem}</p>
      {c.warnings.map((w) => <Notice key={w.code} tone="warn">{w.message}</Notice>)}
      <Panel title={t('planet')}>
        <Table head={[t('planet'), t('sign'), t('position'), t('house')]} rows={c.planets.map((p) => [body(p.body), sign(p.sign), `${p.degree}°${String(p.minute).padStart(2, '0')}′${p.retrograde ? ` ${t('retro')}` : ''}`, p.house])} />
      </Panel>
      <Panel title={t('aspects')}>
        <Table head={[t('planet'), t('aspects'), t('planet'), t('orb')]} rows={c.aspects.map((a) => [body(a.a), t(`aspectTypes.${a.type}`), body(a.b), `${a.orb.toFixed(1)}°`])} />
      </Panel>
      <Panel title={t('houses')}>
        <p className="text-sm">{c.houses.map((h, i) => `${i + 1}: ${sign(['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'][Math.floor(h / 30) % 12]!)} ${(h % 30).toFixed(0)}°`).join(' · ')}</p>
      </Panel>
    </div>
  );
}
