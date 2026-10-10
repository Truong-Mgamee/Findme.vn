import React from 'react';
import { Image, Pressable, View } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import type { SpreadId } from '@findme/engine-tarot';
import { useTheme } from '../theme.js';
import { Text } from './primitives.js';

export interface TarotSpreadCard {
  id: string;
  /** localized card name */
  name: string;
  reversed: boolean;
  position: { key: string; label: string };
}

export type FlipState = 'none' | 'all' | readonly boolean[];

export interface TarotSpreadProps {
  spread: SpreadId;
  cards: TarotSpreadCard[];
  flipState?: FlipState;
  /** returns an image URI for a card id (CDN); undefined → placeholder with the card name */
  cardImageUri?: (id: string) => string | undefined;
  onPressCard?: (card: TarotSpreadCard, index: number) => void;
  width?: number;
  labels?: { faceDown: string; reversed: string };
  testID?: string;
}

const DEFAULT_LABELS = { faceDown: 'Face down', reversed: 'reversed' };

/** unit layouts: [x, y, rotate?] in card-width units; the container size is derived */
const LAYOUTS: Record<SpreadId, Array<[number, number, number?]>> = {
  one: [[0, 0]],
  three: [[0, 0], [1.15, 0], [2.3, 0]],
  five: [[1.15, 0], [0, 1.15], [1.15, 1.15], [2.3, 1.15], [1.15, 2.3]],
  celticCross: [
    [1.15, 1.15], // present
    [1.15, 1.15, 90], // challenge crossing
    [1.15, 2.3], // foundation (below)
    [0, 1.15], // recent past (left)
    [1.15, 0], // crown (above)
    [2.3, 1.15], // near future (right)
    [3.6, 3.45], // self
    [3.6, 2.3], // environment
    [3.6, 1.15], // hopes/fears
    [3.6, 0], // outcome
  ],
};

export function CardBack({ w, h }: { w: number; h: number }) {
  const t = useTheme();
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Rect x={0} y={0} width={w} height={h} rx={8} fill={t.colors.cardBack} stroke={t.colors.primary} strokeWidth={2} />
      <Rect x={6} y={6} width={w - 12} height={h - 12} rx={6} fill="none" stroke={t.colors.primary} strokeOpacity={0.5} />
      <Circle cx={w / 2} cy={h / 2} r={Math.min(w, h) * 0.22} fill="none" stroke={t.colors.primary} strokeWidth={1.5} />
      <Path d={`M ${w / 2} ${h / 2 - Math.min(w, h) * 0.3} L ${w / 2 + 6} ${h / 2 - 6} L ${w / 2 + Math.min(w, h) * 0.3} ${h / 2} L ${w / 2 + 6} ${h / 2 + 6} L ${w / 2} ${h / 2 + Math.min(w, h) * 0.3} L ${w / 2 - 6} ${h / 2 + 6} L ${w / 2 - Math.min(w, h) * 0.3} ${h / 2} L ${w / 2 - 6} ${h / 2 - 6} Z`} fill={t.colors.primary} fillOpacity={0.85} />
    </Svg>
  );
}

/** Card slots for one / three / five / Celtic Cross spreads; flip state, reversed rotation, CDN image or placeholder. */
export function TarotSpread({ spread, cards, flipState = 'all', cardImageUri, onPressCard, width = 320, labels: overrides, testID }: TarotSpreadProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const layout = LAYOUTS[spread];
  const unitsW = Math.max(...layout.map(([x]) => x)) + 1;
  const unitsH = Math.max(...layout.map(([, y]) => y)) + 1;
  const cardW = Math.min(width / unitsW, spread === 'one' ? 180 : 110);
  const cardH = cardW * 1.6;
  const unit = cardW;
  const unitY = cardH;
  const containerW = unitsW * unit;
  const containerH = unitsH * unitY;

  return (
    <View testID={testID} style={{ width: containerW, height: containerH, alignSelf: 'center' }}>
      {cards.map((card, i) => {
        const slot = layout[i];
        if (!slot) return null;
        const [ux, uy, rot = 0] = slot;
        const flipped = flipState === 'all' ? true : flipState === 'none' ? false : !!flipState[i];
        const uri = flipped ? cardImageUri?.(card.id) : undefined;
        const a11y = flipped ? `${card.position.label}: ${card.name}${card.reversed ? ` (${labels.reversed})` : ''}` : `${card.position.label}: ${labels.faceDown}`;
        return (
          <Pressable
            key={`${card.id}-${i}`}
            testID={`tarot-card-${i}`}
            onPress={onPressCard ? () => onPressCard(card, i) : undefined}
            disabled={!onPressCard}
            accessibilityRole={onPressCard ? 'button' : 'image'}
            accessibilityLabel={a11y}
            style={{ position: 'absolute', left: ux * unit, top: uy * unitY, width: cardW, height: cardH, transform: [{ rotate: `${rot + (flipped && card.reversed ? 180 : 0)}deg` }], zIndex: rot ? 2 : 1 }}
          >
            {flipped ? (
              uri ? (
                <Image source={{ uri }} accessibilityIgnoresInvertColors style={{ width: cardW, height: cardH, borderRadius: 8, borderWidth: 1, borderColor: t.colors.primary }} resizeMode="cover" />
              ) : (
                <View style={{ width: cardW, height: cardH, borderRadius: 8, borderWidth: 1.5, borderColor: t.colors.primary, backgroundColor: t.colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', padding: 6 }}>
                  <Text size="xs" weight="semibold" align="center" numberOfLines={3}>
                    {card.name}
                  </Text>
                </View>
              )
            ) : (
              <CardBack w={cardW} h={cardH} />
            )}
            {flipped ? (
              <View style={{ position: 'absolute', bottom: -18, left: 0, right: 0, transform: [{ rotate: card.reversed ? '180deg' : '0deg' }] }}>
                <Text size="xs" color="muted" align="center" numberOfLines={1}>
                  {card.position.label}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
