import { getTranslations } from 'next-intl/server';
import type { TarotCard } from '@findme/engine-tarot';
import type { AppLocale } from '@/i18n/routing';
import { cardImage, cardNumeral } from '@/lib/tarot';
import { Card, Dl } from './Prose';

/** TODO(@findme/ui): replace with the shared `TarotSpread` SVG component once packages/ui ships. */
export async function TarotCardView({ card, reversed, locale }: { card: TarotCard; reversed: boolean; locale: AppLocale }) {
  const t = await getTranslations({ locale, namespace: 'web.tarot' });
  const keywords = reversed ? card.keywords_reversed : card.keywords_upright;
  return (
    <div className="grid gap-4 md:grid-cols-[220px_1fr]">
      <figure className="mx-auto w-[220px]">
        <div className={`relative aspect-[7/12] overflow-hidden rounded-xl border-4 border-gold bg-night shadow-lg ${reversed ? 'rotate-180' : ''}`}>
          {/* Deck art is not hosted yet; the placeholder is inlined so the page never fetches a missing asset. */}
          <img src={cardImage(card)} alt={card.name_en} width={220} height={377} className="h-full w-full object-cover" loading="lazy" />
          <span className="absolute inset-x-0 bottom-2 text-center font-serif text-lg text-gold-2">{cardNumeral(card)} · {card.name_en}</span>
        </div>
        <figcaption className="mt-2 text-center text-xs text-black/60">{t('imageSoon')}</figcaption>
      </figure>
      <div className="space-y-4">
        <Card>
          <h2 className="text-2xl font-semibold" data-testid="card-name">
            {card.name_en} <span className="text-base font-normal text-black/60">({reversed ? t('reversed') : t('upright')})</span>
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2" data-testid="keywords">
            {keywords.map((k) => (
              <li key={k} className="rounded-full bg-gold/15 px-3 py-1 text-sm">{k}</li>
            ))}
          </ul>
          <div className="mt-4">
            <Dl
              rows={[
                [t('arcana'), card.arcana === 'major' ? t('major') : t('minor')],
                ...(card.suit ? ([[t('suit'), t(`suits.${card.suit}`)]] as Array<[string, React.ReactNode]>) : []),
                [t('number'), cardNumeral(card)],
                [t('element'), t(`elements.${card.element}`)],
                [t('astrology'), card.astrology],
              ]}
            />
          </div>
        </Card>
        <Card title={t('classicReading')}>
          <p className="text-black/80">{card.waite_pd_excerpt}</p>
        </Card>
        <Card title={reversed ? t('keywordsUpright') : t('keywordsReversed')}>
          <p className="text-sm text-black/70">{(reversed ? card.keywords_upright : card.keywords_reversed).join(' · ')}</p>
        </Card>
      </div>
    </div>
  );
}
