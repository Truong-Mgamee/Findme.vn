import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { fetchAtoms } from '@/lib/atoms';
import { isLifePathNumber, LIFE_PATH_COPY, LIFE_PATH_NUMBERS } from '@/lib/lifepath';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { LifePathCalculator } from '@/components/site/LifePathCalculator';
import { AtomBlock, Card } from '@/components/site/Prose';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => LIFE_PATH_NUMBERS.map((n) => ({ locale, n: String(n) })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; n: string }> }): Promise<Metadata> {
  const { locale, n } = await params;
  const num = Number(n);
  if (!isLifePathNumber(num)) return {};
  const t = await getTranslations({ locale, namespace: 'web.lifePath' });
  const copy = LIFE_PATH_COPY[locale][num];
  return buildMetadata({ locale, pathname: '/life-path-number/[n]', params: { n }, title: t('title', { n: num, name: copy.title }), description: t('description', { n: num, name: copy.title }), type: 'article' });
}

export default async function LifePathPage({ params }: { params: Promise<{ locale: AppLocale; n: string }> }) {
  const { locale, n } = await params;
  const num = Number(n);
  if (!isLifePathNumber(num)) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.lifePath' });
  const copy = LIFE_PATH_COPY[locale][num];
  const atoms = await fetchAtoms([`numerology.lifepath.${num}`], locale);
  const title = t('title', { n: num, name: copy.title });
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/life-path-number/[n]', { n }), headline: title, description: t('description', { n: num, name: copy.title }), locale, datePublished: '2026-01-01T00:00:00Z' })} />
      <header className="mb-6">
        <p className="font-serif text-6xl text-gold">{num}</p>
        <h1 className="mt-2 text-3xl font-semibold" data-testid="title">{title}</h1>
        {num > 9 && <p className="mt-1 inline-block rounded-full bg-gold/15 px-3 py-0.5 text-sm">{t('master')}</p>}
        <p className="mt-2 text-black/70">{copy.summary}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        <Card title={t('strengths')}><ul className="list-disc pl-5 text-sm">{copy.strengths.map((s) => <li key={s}>{s}</li>)}</ul></Card>
        <Card title={t('challenges')}><ul className="list-disc pl-5 text-sm">{copy.challenges.map((s) => <li key={s}>{s}</li>)}</ul></Card>
        <Card title={t('careers')}><ul className="list-disc pl-5 text-sm">{copy.careers.map((s) => <li key={s}>{s}</li>)}</ul></Card>
      </div>
      <AtomBlock atom={atoms[`numerology.lifepath.${num}`]} />
      <section className="mt-8 rounded-xl bg-white p-5 shadow-sm">
        <h2 className="text-lg font-semibold">{t('calcTitle')}</h2>
        <p className="mt-1 text-sm text-black/70">{t('intro')}</p>
        <LifePathCalculator locale={locale} labels={{ date: t('calcDate'), button: t('calcButton'), result: t('result', { n: '{n}' }), master: t('resultMaster', { base: '{base}' }) }} />
        <h3 className="mt-6 font-semibold">{t('howTitle')}</h3>
        <p className="text-sm text-black/70">{t('howBody')}</p>
      </section>
      <nav className="mt-8" aria-label={t('allNumbers')}>
        <h2 className="mb-2 text-sm font-medium text-black/60">{t('allNumbers')}</h2>
        <ul className="flex flex-wrap gap-2">
          {LIFE_PATH_NUMBERS.map((x) => (
            <li key={x}><Link href={{ pathname: '/life-path-number/[n]', params: { n: String(x) } }} aria-current={x === num ? 'page' : undefined} className={`inline-block rounded-full border px-3 py-1 text-sm ${x === num ? 'border-gold bg-gold/15' : 'border-black/15 hover:bg-white'}`}>{x}</Link></li>
          ))}
        </ul>
      </nav>
      <AppCta />
    </article>
  );
}
