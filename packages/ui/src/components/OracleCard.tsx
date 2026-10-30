import React, { useRef, useState } from 'react';
import { Pressable, ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import type { DayAlmanac, PersonalizedAlmanac } from '@findme/engine-almanac';
import type { DailySky } from '@findme/engine-astro';
import { useTheme } from '../theme.js';
import { AlmanacDayCard, isPersonalized, type AlmanacLabels } from './AlmanacDayCard.js';
import { Badge, Button, Row, Text } from './primitives.js';
import { TarotSpread, type TarotSpreadCard } from './TarotSpread.js';

/** daily_content row (ai-composer DailyOutputSchema) */
export interface DailySegmentContent {
  headline?: string;
  body?: string;
  focus?: string;
  luckyHint?: string;
  [k: string]: unknown;
}

/** Mirrors apps/api `TodayPayload`, plus the on-device tarot draw the app adds for western/both packs. */
export interface DailyPayload {
  date: string;
  tz: string;
  locale: string;
  traditionPack: string;
  profileId: string | null;
  needsProfile: boolean;
  segments: string[];
  content: Record<string, DailySegmentContent>;
  eastAsia?: { almanac: DayAlmanac | PersonalizedAlmanac; atomKeys: string[] };
  western?: { personalDay: number | null; sky: DailySky | null; lifePath: number | null; sunSign: string | null; atomKeys: string[] };
  streak: { current: number; longest: number; lastDate: string | null };
  /** added client-side: card of the day (seeded by date + segment) */
  tarot?: { card: TarotSpreadCard; keywords: string[] } | null;
}

export interface OracleLabels {
  streak: (n: number) => string;
  overview: string;
  almanacPage: string;
  tarotPage: string;
  numbersPage: string;
  actionPage: string;
  luckyNumber: string;
  luckyColor: string;
  personalDay: (n: number) => string;
  moonIn: (sign: string) => string;
  moonPhase: (phase: string) => string;
  retrograde: (bodies: string) => string;
  focus: string;
  luckyHint: string;
  share: string;
  ask: string;
  offline: string;
  noContent: string;
  almanac: Partial<AlmanacLabels>;
  page: (i: number, n: number) => string;
}

const DEFAULT_LABELS: OracleLabels = {
  streak: (n) => `${n}-day streak`,
  overview: 'Overview',
  almanacPage: 'Today’s almanac',
  tarotPage: 'Card of the day',
  numbersPage: 'Numbers & colour',
  actionPage: 'Action',
  luckyNumber: 'Lucky number',
  luckyColor: 'Lucky colour',
  personalDay: (n) => `Personal day ${n}`,
  moonIn: (s) => `Moon in ${s}`,
  moonPhase: (p) => p,
  retrograde: (b) => `Retrograde: ${b}`,
  focus: 'Focus',
  luckyHint: 'Lucky hint',
  share: 'Share',
  ask: 'Ask more',
  offline: 'Offline — computed on your device',
  noContent: 'Your daily note is being written…',
  almanac: {},
  page: (i, n) => `Page ${i} of ${n}`,
};

export interface OracleCardProps {
  payload: DailyPayload;
  streak?: number;
  dateLabel?: string;
  offline?: boolean;
  onShare?: () => void;
  onAsk?: () => void;
  onPressAlmanac?: () => void;
  onPressTarot?: () => void;
  cardImageUri?: (id: string) => string | undefined;
  labels?: Partial<OracleLabels>;
  width?: number;
  testID?: string;
}

/** Pick the most specific daily_content row: personal segment first, then the common one. */
export function pickContent(payload: DailyPayload): DailySegmentContent | null {
  const order = [...payload.segments].sort((a, b) => (a.endsWith(':common') ? 1 : 0) - (b.endsWith(':common') ? 1 : 0));
  for (const s of order) {
    const c = payload.content[s];
    if (c && (c.headline || c.body)) return c;
  }
  return null;
}

/** Large swipeable Daily Oracle: overview → almanac / card → numbers & colour → action. */
export function OracleCard({ payload, streak, dateLabel, offline, onShare, onAsk, onPressAlmanac, onPressTarot, cardImageUri, labels: overrides, width = 340, testID }: OracleCardProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const [page, setPage] = useState(0);
  const ref = useRef<ScrollView>(null);
  const content = pickContent(payload);
  const almanac = payload.eastAsia?.almanac;
  const personal = almanac && isPersonalized(almanac) ? almanac.personal : null;
  const west = payload.western;
  const current = streak ?? payload.streak.current;

  const pages: Array<{ key: string; title: string; node: React.ReactNode }> = [];
  pages.push({
    key: 'overview',
    title: labels.overview,
    node: (
      <View>
        <Text size="xl" weight="bold" testID="oracle-headline">
          {content?.headline ?? labels.noContent}
        </Text>
        {content?.body ? (
          <Text size="md" style={{ marginTop: t.spacing[2] }}>
            {content.body}
          </Text>
        ) : null}
        {!content && almanac ? (
          <Text size="md" color="muted" style={{ marginTop: t.spacing[2] }} han>
            {almanac.lunar.yearGanzhi.han} · {almanac.dayGanzhi.han} · {almanac.huangdao ? '黃道' : '黑道'}
          </Text>
        ) : null}
      </View>
    ),
  });
  if (almanac) {
    pages.push({ key: 'almanac', title: labels.almanacPage, node: <AlmanacDayCard almanac={almanac} dateLabel={dateLabel} compact onPress={onPressAlmanac} labels={labels.almanac} testID="oracle-almanac" /> });
  }
  if (payload.tarot) {
    pages.push({
      key: 'tarot',
      title: labels.tarotPage,
      node: (
        <Pressable onPress={onPressTarot} disabled={!onPressTarot} accessibilityRole={onPressTarot ? 'button' : undefined} style={{ alignItems: 'center' }}>
          <TarotSpread spread="one" cards={[payload.tarot.card]} flipState="all" cardImageUri={cardImageUri} width={width - 48} testID="oracle-tarot" />
          <Text size="lg" weight="bold" align="center" style={{ marginTop: t.spacing[5] }}>
            {payload.tarot.card.name}
          </Text>
          <Text size="sm" color="muted" align="center">
            {payload.tarot.keywords.join(' · ')}
          </Text>
        </Pressable>
      ),
    });
  }
  if (personal || west) {
    pages.push({
      key: 'numbers',
      title: labels.numbersPage,
      node: (
        <View>
          {personal ? (
            <Row style={{ marginBottom: t.spacing[3] }}>
              <View style={{ marginEnd: t.spacing[6] }}>
                <Text size="sm" color="muted">
                  {labels.luckyNumber}
                </Text>
                <Text size="3xl" weight="bold" color="primary" testID="oracle-lucky-number">
                  {personal.luckyNumbers.join(' · ')}
                </Text>
              </View>
              <View>
                <Text size="sm" color="muted">
                  {labels.luckyColor}
                </Text>
                <Row>
                  <View accessibilityLabel={personal.luckyColor.label} style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: personal.luckyColor.hex, marginEnd: t.spacing[2], borderWidth: 1, borderColor: t.colors.border }} />
                  <Text size="lg" weight="semibold">
                    {personal.luckyColor.label}
                  </Text>
                </Row>
              </View>
            </Row>
          ) : null}
          {west?.personalDay !== null && west?.personalDay !== undefined ? (
            <Text size="2xl" weight="bold" color="primary" testID="oracle-personal-day">
              {labels.personalDay(west.personalDay)}
            </Text>
          ) : null}
          {west?.sky ? (
            <View style={{ marginTop: t.spacing[2] }}>
              <Text size="md">{labels.moonIn(west.sky.moon.sign)}</Text>
              <Text size="sm" color="muted">
                {labels.moonPhase(west.sky.moon.phase.name)}
                {west.sky.retrogrades.length ? ` · ${labels.retrograde(west.sky.retrogrades.join(', '))}` : ''}
              </Text>
            </View>
          ) : null}
        </View>
      ),
    });
  }
  pages.push({
    key: 'action',
    title: labels.actionPage,
    node: (
      <View>
        {content?.focus ? (
          <View style={{ marginBottom: t.spacing[3] }}>
            <Text size="sm" color="muted">
              {labels.focus}
            </Text>
            <Text size="lg" weight="semibold">
              {content.focus}
            </Text>
          </View>
        ) : null}
        {content?.luckyHint ? (
          <View style={{ marginBottom: t.spacing[3] }}>
            <Text size="sm" color="muted">
              {labels.luckyHint}
            </Text>
            <Text size="md">{content.luckyHint}</Text>
          </View>
        ) : null}
        <Row>
          {onAsk ? <Button label={labels.ask} onPress={onAsk} testID="oracle-ask" style={{ marginEnd: t.spacing[2], marginBottom: t.spacing[2] }} /> : null}
          {onShare ? <Button label={labels.share} variant="secondary" onPress={onShare} testID="oracle-share" style={{ marginBottom: t.spacing[2] }} /> : null}
        </Row>
      </View>
    ),
  });

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const i = Math.round(e.nativeEvent.contentOffset.x / width);
    if (i !== page) setPage(Math.max(0, Math.min(pages.length - 1, i)));
  };

  return (
    <View testID={testID} style={{ width, backgroundColor: t.colors.surface, borderRadius: t.radii.xl, borderWidth: 1, borderColor: t.colors.border, overflow: 'hidden' }}>
      <Row style={{ justifyContent: 'space-between', paddingHorizontal: t.spacing[4], paddingTop: t.spacing[4] }}>
        <Text size="sm" color="muted">
          {dateLabel ?? payload.date}
        </Text>
        <Row>
          {offline ? <Badge label={labels.offline} tone="warning" style={{ marginEnd: t.spacing[2] }} testID="oracle-offline" /> : null}
          <Badge label={labels.streak(current)} tone={current > 0 ? 'primary' : 'muted'} testID="oracle-streak" />
        </Row>
      </Row>
      <ScrollView ref={ref} horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={onScrollEnd} snapToInterval={width} decelerationRate="fast" accessibilityRole="adjustable" accessibilityLabel={labels.page(page + 1, pages.length)} testID="oracle-pager">
        {pages.map((p) => (
          <View key={p.key} style={{ width, padding: t.spacing[4], minHeight: 220 }} testID={`oracle-page-${p.key}`}>
            <Text size="xs" weight="semibold" color="accent" style={{ marginBottom: t.spacing[2], letterSpacing: 1, textTransform: 'uppercase' }}>
              {p.title}
            </Text>
            {p.node}
          </View>
        ))}
      </ScrollView>
      <Row style={{ justifyContent: 'center', paddingBottom: t.spacing[3] }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {pages.map((p, i) => (
          <Pressable
            key={p.key}
            onPress={() => {
              setPage(i);
              ref.current?.scrollTo({ x: i * width, animated: !t.reduceMotion });
            }}
            hitSlop={10}
            style={{ width: i === page ? 18 : 8, height: 8, borderRadius: 4, marginHorizontal: 3, backgroundColor: i === page ? t.colors.primary : t.colors.border }}
          />
        ))}
      </Row>
    </View>
  );
}
