import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { atomKeysForDailySky, dailySky } from '@findme/engine-astro';
import type { AppLocale } from '@/i18n/routing';
import { fetchAtoms } from '@/lib/atoms';
import { formatDate, utcDate } from '@/lib/dates';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock, Card, Dl } from '@/components/site/Prose';

/** ISR: sky sampled at 12:00 UTC of the current UTC day (same rule as the API's Daily Oracle). */
export const revalidate = 3600;

function sky() {
  const date = utcDate();
  return { date, sky: dailySky(new Date(`${date}T12:00:00Z`)) };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.moon' });
  const { sky: s } = sky();
  return buildMetadata({ locale, pathname: '/moon-today', title: t('title', { phase: t(`phases.${s.moon.phase.name}`), sign: t(`signs.${s.moon.sign}`) }), description: t('description'), type: 'article' });
}

export default async function MoonTodayPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.moon' });
  const { date, sky: s } = sky();
  const atoms = await fetchAtoms(atomKeysForDailySky(s), locale);
  const title = t('title', { phase: t(`phases.${s.moon.phase.name}`), sign: t(`signs.${s.moon.sign}`) });
  const pct = Math.round(s.moon.phase.illumination * 100);
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/moon-today'), headline: title, description: t('description'), locale, datePublished: `${date}T12:00:00Z` })} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold" data-testid="title">{title}</h1>
        <p className="mt-2 text-black/70">{t('intro')} · {formatDate(date, locale)}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          {/* TODO(@findme/ui): moon-phase SVG from packages/ui */}
          <div className="mx-auto h-40 w-40 rounded-full bg-night shadow-inner" aria-hidden style={{ background: `linear-gradient(90deg, #f0cf7a ${s.moon.phase.waxing ? 100 - pct : 0}%, #0b1020 ${s.moon.phase.waxing ? 100 - pct : 0}% ${s.moon.phase.waxing ? 100 : pct}%, #f0cf7a ${s.moon.phase.waxing ? 100 : pct}%)` }} />
          <p className="mt-4 text-center text-2xl font-semibold" data-testid="phase">{t(`phases.${s.moon.phase.name}`)}</p>
          <p className="text-center text-black/70">{t('illumination')}: {pct}% · {s.moon.phase.waxing ? t('waxing') : t('waning')}</p>
        </Card>
        <Card>
          <Dl
            rows={[
              [t('moonIn', { sign: '' }).replace(/\s+$/, ''), `${t(`signs.${s.moon.sign}`)} (${(s.moon.lon % 30).toFixed(1)}°)`],
              [t('sunIn', { sign: '' }).replace(/\s+$/, ''), `${t(`signs.${s.sun.sign}`)} (${(s.sun.lon % 30).toFixed(1)}°)`],
              [t('phase'), `${s.moon.phase.angle.toFixed(1)}°`],
            ]}
          />
          <h2 className="mt-4 font-semibold">{t('retrogrades')}</h2>
          {s.retrogrades.length === 0 ? (
            <p className="text-sm text-black/70">{t('noRetrogrades')}</p>
          ) : (
            <ul className="mt-1 flex flex-wrap gap-2">
              {s.retrogrades.map((b) => (
                <li key={b} className="rounded-full bg-vermilion/10 px-3 py-1 text-sm text-vermilion">{t(`bodies.${b}` as never)} ℞</li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <AtomBlock atom={atoms[`astro.moon.phase.${s.moon.phase.name}`]} />
      <AtomBlock atom={atoms[`astro.moon.${s.moon.sign}`]} />
      <AppCta />
    </article>
  );
}
