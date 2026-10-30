import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { DECK } from '@findme/engine-tarot';
import { Link } from '@/i18n/navigation';
import { routing, type AppLocale } from '@/i18n/routing';
import { fetchAtoms } from '@/lib/atoms';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { ALL_CARD_SLUGS, cardBySlug, cardSlug } from '@/lib/tarot';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock } from '@/components/site/Prose';
import { TarotCardView } from '@/components/site/TarotCardView';

export const revalidate = 3600;
export const dynamicParams = false;

/** 78 pages per locale from @findme/content/tarot/deck-classic-1909.json */
export function generateStaticParams() {
  return routing.locales.flatMap((locale) => ALL_CARD_SLUGS.map((card) => ({ locale, card })));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale; card: string }> }): Promise<Metadata> {
  const { locale, card: slug } = await params;
  const card = cardBySlug(slug);
  if (!card) return {};
  const t = await getTranslations({ locale, namespace: 'web.tarot' });
  return buildMetadata({ locale, pathname: '/tarot/[card]', params: { card: slug }, title: t('cardTitle', { name: card.name_en }), description: t('cardDescription', { name: card.name_en }), type: 'article' });
}

export default async function TarotCardPage({ params }: { params: Promise<{ locale: AppLocale; card: string }> }) {
  const { locale, card: slug } = await params;
  const card = cardBySlug(slug);
  if (!card) notFound();
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.tarot' });
  const atoms = await fetchAtoms([`tarot.${card.id}.upright`, `tarot.${card.id}.reversed`], locale);
  const idx = DECK.cards.findIndex((c) => c.id === card.id);
  const prev = DECK.cards[(idx + 77) % 78]!;
  const next = DECK.cards[(idx + 1) % 78]!;
  const title = t('cardTitle', { name: card.name_en });
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/tarot/[card]', { card: slug }), headline: title, description: t('cardDescription', { name: card.name_en }), locale, datePublished: '2026-01-01T00:00:00Z' })} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold" data-testid="title">{title}</h1>
      </header>
      <TarotCardView card={card} reversed={false} locale={locale} />
      <AtomBlock atom={atoms[`tarot.${card.id}.upright`]} />
      <AtomBlock atom={atoms[`tarot.${card.id}.reversed`]} />
      <nav className="mt-8 flex justify-between text-sm" aria-label="Cards">
        <Link href={{ pathname: '/tarot/[card]', params: { card: cardSlug(prev) } }} rel="prev" className="underline">← {prev.name_en}</Link>
        <Link href="/tarot-card-of-the-day" className="underline">{t('cardOfDayTitle', { date: '' }).replace(/\s*—\s*$/, '')}</Link>
        <Link href={{ pathname: '/tarot/[card]', params: { card: cardSlug(next) } }} rel="next" className="underline">{next.name_en} →</Link>
      </nav>
      <details className="mt-6 text-sm">
        <summary className="cursor-pointer text-black/60">{t('allCards')}</summary>
        <ul className="mt-2 columns-2 gap-4 sm:columns-4">
          {DECK.cards.map((c) => (
            <li key={c.id}><Link href={{ pathname: '/tarot/[card]', params: { card: cardSlug(c) } }} className="hover:underline">{c.name_en}</Link></li>
          ))}
        </ul>
      </details>
      <AppCta />
    </article>
  );
}
