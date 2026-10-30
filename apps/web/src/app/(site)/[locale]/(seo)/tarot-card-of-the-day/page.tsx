import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { atomKeysForTarot, dailyCard } from '@findme/engine-tarot';
import { Link } from '@/i18n/navigation';
import type { AppLocale } from '@/i18n/routing';
import { fetchAtoms } from '@/lib/atoms';
import { formatDate, utcDate } from '@/lib/dates';
import { absoluteUrl, articleJsonLd, buildMetadata } from '@/lib/seo';
import { cardSlug } from '@/lib/tarot';
import { AppCta } from '@/components/site/AppCta';
import { JsonLd } from '@/components/site/JsonLd';
import { AtomBlock } from '@/components/site/Prose';
import { TarotCardView } from '@/components/site/TarotCardView';

/**
 * ISR: the card equals the Daily Oracle `w:common` segment — `dailyCard(utcDate, 'w:common')` with the UTC date,
 * exactly what apps/api's daily job seeds. Revalidated hourly so the page flips at 00:00 UTC.
 */
export const revalidate = 3600;

function draw() {
  const date = utcDate();
  const d = dailyCard(date, 'w:common');
  const c = d.cards[0]!;
  return { date, draw: d, card: c.card, reversed: c.reversed };
}

export async function generateMetadata({ params }: { params: Promise<{ locale: AppLocale }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'web.tarot' });
  const { date, card, reversed } = draw();
  const title = t('cardOfDayTitle', { date: formatDate(date, locale) });
  return buildMetadata({ locale, pathname: '/tarot-card-of-the-day', title, description: t('cardOfDayDescription', { card: card.name_en, orientation: reversed ? t('reversed') : t('upright'), date }), type: 'article' });
}

export default async function TarotCardOfTheDayPage({ params }: { params: Promise<{ locale: AppLocale }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: 'web.tarot' });
  const { date, draw: d, card, reversed } = draw();
  const atoms = await fetchAtoms(atomKeysForTarot(d), locale);
  const title = t('cardOfDayTitle', { date: formatDate(date, locale) });
  return (
    <article>
      <JsonLd data={articleJsonLd({ url: absoluteUrl(locale, '/tarot-card-of-the-day'), headline: title, description: t('cardOfDayDescription', { card: card.name_en, orientation: reversed ? t('reversed') : t('upright'), date }), locale, datePublished: `${date}T00:00:00Z` })} />
      <header className="mb-6">
        <h1 className="text-3xl font-semibold" data-testid="title">{title}</h1>
        <p className="mt-2 text-black/70">{t('cardOfDayIntro')}</p>
        <p className="mt-1 text-xs text-black/50" data-testid="draw-date" data-date={date} data-card-id={card.id} data-reversed={String(reversed)}>
          {t('drawDate', { date })} · {t('seed')}: {String(d.seed)}
        </p>
      </header>
      <TarotCardView card={card} reversed={reversed} locale={locale} />
      <AtomBlock atom={atoms[`tarot.${card.id}.${reversed ? 'reversed' : 'upright'}`]} />
      <AtomBlock atom={atoms['tarot.position.one.focus']} />
      <p className="mt-6 text-sm">
        <Link href={{ pathname: '/tarot/[card]', params: { card: cardSlug(card) } }} className="underline">{t('cardTitle', { name: card.name_en })}</Link>
        {' · '}
        <Link href={{ pathname: '/tarot/[card]', params: { card: 'the-fool' } }} className="underline">{t('allCards')}</Link>
      </p>
      <AppCta />
    </article>
  );
}
