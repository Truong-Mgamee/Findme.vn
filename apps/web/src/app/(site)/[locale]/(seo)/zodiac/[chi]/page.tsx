import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { BRANCHES_HAN } from '@findme/engine-core';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { fetchAtoms } from '@/lib/atoms';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { branchFromSlug, slugFor, zodiacInfo, ZODIAC_SLUGS, ZODIAC_TRAITS } from '@/lib/zodiac';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock, Card, Dl } from '@/components/site/Prose';

export const revalidate = 3600;
export const dynamicParams = false;

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => ZODIAC_SLUGS[locale].map((chi) => ({ locale, chi })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; chi: string }> }): Promise<Metadata> {
  const { locale, chi } = await params;
  const b = branchFromSlug(chi);
  if (b < 0) return {};
  const t = await getTranslations({ locale, namespace: 'web.zodiac' });
  const z = zodiacInfo(b, locale);
  return buildMetadata({
    locale,
    pathname: '/zodiac/[chi]',
    params: { chi: slugFor(b, locale) },
    paramsByLocale: { vi: { chi: slugFor(b, 'vi') }, en: { chi: slugFor(b, 'en') } },
    title: t('title', { animal: z.animal, branch: z.branchName }),
    description: t('description', { animal: z.animal, branch: z.branchName }),
    type: 'article',
  });
}

export default async function ZodiacPage({ params }: { params: Promise<{ locale: AppLocale; chi: string }> }) {
  const { locale, chi } = await params;
  const b = branchFromSlug(chi);
  if (b < 0) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.zodiac' });
  const z = zodiacInfo(b, locale);
  const atoms = await fetchAtoms([`zodiac.${b}.overview`, `zodiac.${b}.love`, `zodiac.${b}.career`, `glossary.branch.${b}`], locale);
  const name = (i: number) => zodiacInfo(i, locale);
  const chip = (i: number) => (
    <Link key={i} href={{ pathname: '/zodiac/[chi]', params: { chi: slugFor(i, locale) } }} className="rounded-full border border-black/15 px-3 py-1 text-sm hover:bg-white">
      {name(i).animal} ({name(i).branchName} {BRANCHES_HAN[i]})
    </Link>
  );
  const title = t('title', { animal: z.animal, branch: z.branchName });
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/zodiac/[chi]', { chi: slugFor(b, locale) }), headline: title, description: t('description', { animal: z.animal, branch: z.branchName }), locale, datePublished: '2026-01-01T00:00:00Z' })} />
      <header className="mb-6">
        <p className="font-serif text-6xl text-gold">{z.han}</p>
        <h1 className="mt-2 text-3xl font-semibold" data-testid="title">{title}</h1>
        <p className="mt-2 text-black/70">{t('intro')}</p>
      </header>
      <div className="grid gap-4 md:grid-cols-2">
        <Card title={t('traits')}>
          <p>{ZODIAC_TRAITS[locale][b]}</p>
          <div className="mt-4">
            <Dl rows={[[t('element'), z.element], [t('polarity'), z.yin ? t('yin') : t('yang')], [t('hours'), z.hours]]} />
          </div>
        </Card>
        <Card title={t('years')}>
          <p className="text-sm">{z.years.join(', ')}</p>
          <p className="mt-2 text-xs text-black/60">{t('yearNote')}</p>
        </Card>
        <Card title={t('trine')}><div className="flex flex-wrap gap-2">{z.trine.map(chip)}</div></Card>
        <Card title={t('secretFriend')}><div className="flex flex-wrap gap-2">{chip(z.secretFriend)}</div></Card>
        <Card title={t('clash')} className="md:col-span-2"><div className="flex flex-wrap gap-2">{chip(z.clash)}</div></Card>
      </div>
      <AtomBlock atom={atoms[`zodiac.${b}.overview`]} />
      <AtomBlock atom={atoms[`zodiac.${b}.love`]} />
      <AtomBlock atom={atoms[`zodiac.${b}.career`]} />
      <nav className="mt-8" aria-label={t('allSigns')}>
        <h2 className="mb-2 text-sm font-medium text-black/60">{t('allSigns')}</h2>
        <div className="flex flex-wrap gap-2">{Array.from({ length: 12 }, (_, i) => i).filter((i) => i !== b).map(chip)}</div>
      </nav>
      <AppCta />
    </article>
  );
}
