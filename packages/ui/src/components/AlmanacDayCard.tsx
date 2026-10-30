import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import type { DayAlmanac, PersonalizedAlmanac } from '@findme/engine-almanac';
import { useTheme } from '../theme.js';
import { Badge, Chip, Row, Text } from './primitives.js';

export interface AlmanacLabels {
  huangdao: string;
  heidao: string;
  yi: string;
  ji: string;
  goodHours: string;
  clash: (zodiac: string, ganzhi: string) => string;
  clashesWithUser: string;
  harmsUser: string;
  luckyNumber: string;
  luckyColor: string;
  standard: Record<'vn' | 'cn' | 'kr' | 'jp', string>;
  /** lunar date formatter; default "{day}/{month}" + leap marker */
  lunarDate: (a: DayAlmanac) => string;
  solarTerm: string;
}

const DEFAULT_LABELS: AlmanacLabels = {
  huangdao: '黃道',
  heidao: '黑道',
  yi: '宜',
  ji: '忌',
  goodHours: 'Good hours',
  clash: (z, g) => `Clash ${z} (${g})`,
  clashesWithUser: 'Clashes with your year — take it easy today',
  harmsUser: 'Harms your year',
  luckyNumber: 'Lucky number',
  luckyColor: 'Lucky color',
  standard: { vn: 'VN', cn: 'CN', kr: 'KR', jp: 'JP' },
  lunarDate: (a) => `${a.lunar.day}/${a.lunar.month}${a.lunar.isLeapMonth ? '+' : ''}`,
  solarTerm: 'Solar term',
};

export interface AlmanacDayCardProps {
  almanac: DayAlmanac | PersonalizedAlmanac;
  /** Intl-formatted Gregorian date (the app formats per locale) */
  dateLabel?: string;
  compact?: boolean;
  maxChips?: number;
  onPress?: () => void;
  onPressHour?: (branch: number) => void;
  labels?: Partial<AlmanacLabels>;
  testID?: string;
}

export function isPersonalized(a: DayAlmanac | PersonalizedAlmanac): a is PersonalizedAlmanac {
  return 'personal' in a && !!(a as PersonalizedAlmanac).personal;
}

/** Lunar date per standard, 黄道/黑道 badge, 宜/忌 chips, good-hour strip and clash warning. */
export function AlmanacDayCard({ almanac, dateLabel, compact, maxChips = 6, onPress, onPressHour, labels: overrides, testID }: AlmanacDayCardProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const personal = isPersonalized(almanac) ? almanac.personal : null;
  const goodHours = almanac.hours.filter((h) => h.auspicious);
  const yi = almanac.yi.slice(0, maxChips);
  const ji = almanac.ji.slice(0, maxChips);
  const body = (
    <View style={{ backgroundColor: t.colors.surface, borderRadius: t.radii.lg, borderWidth: 1, borderColor: personal?.clashesWithUser ? t.colors.warning : t.colors.border, padding: t.spacing[4] }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          {dateLabel ? (
            <Text size="sm" color="muted">
              {dateLabel}
            </Text>
          ) : null}
          <Row>
            <Text size="xl" weight="bold" han testID="lunar-date">
              {labels.lunarDate(almanac)}
            </Text>
            <Badge label={labels.standard[almanac.standard]} tone="muted" style={{ marginStart: t.spacing[2] }} />
          </Row>
          <Text size="sm" color="muted" han>
            {almanac.lunar.yearGanzhi.han} · {almanac.monthGanzhi.han} · {almanac.dayGanzhi.han}
          </Text>
        </View>
        <Badge testID="huangdao-badge" label={almanac.huangdao ? labels.huangdao : labels.heidao} tone={almanac.huangdao ? 'primary' : 'muted'} />
      </Row>
      {personal?.clashesWithUser || personal?.harmsUser ? (
        <View testID="clash-warning" accessibilityRole="alert" style={{ marginTop: t.spacing[3], backgroundColor: t.colors.surfaceAlt, borderRadius: t.radii.md, padding: t.spacing[2], borderStartWidth: 3, borderStartColor: t.colors.warning }}>
          <Text size="sm" color="warning">
            {personal.clashesWithUser ? labels.clashesWithUser : labels.harmsUser}
          </Text>
        </View>
      ) : null}
      <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
        {labels.clash(almanac.clash.zodiacLabel, almanac.clash.ganzhiHan)} · {almanac.zhixing.label} · {almanac.xiu.label}
      </Text>
      <View style={{ marginTop: t.spacing[3] }}>
        <Row>
          <Text size="sm" weight="semibold" color="success" han style={{ marginEnd: t.spacing[2] }}>
            {labels.yi}
          </Text>
          {yi.map((i) => (
            <Chip key={i.code} label={i.label} tone="good" />
          ))}
        </Row>
        <Row>
          <Text size="sm" weight="semibold" color="danger" han style={{ marginEnd: t.spacing[2] }}>
            {labels.ji}
          </Text>
          {ji.map((i) => (
            <Chip key={i.code} label={i.label} tone="bad" />
          ))}
        </Row>
      </View>
      {!compact ? (
        <View style={{ marginTop: t.spacing[2] }}>
          <Text size="sm" color="muted" style={{ marginBottom: t.spacing[1] }}>
            {labels.goodHours}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {goodHours.map((h) => (
              <Chip key={h.branch} label={`${h.label} ${h.from}–${h.to}`} tone="neutral" han onPress={onPressHour ? () => onPressHour(h.branch) : undefined} accessibilityLabel={`${h.label} ${h.from} ${h.to}`} testID={`hour-${h.branch}`} />
            ))}
          </ScrollView>
        </View>
      ) : null}
      {personal && !compact ? (
        <Row style={{ marginTop: t.spacing[2] }}>
          <Text size="sm" color="muted" style={{ marginEnd: t.spacing[2] }}>
            {labels.luckyNumber}: <Text size="sm" weight="semibold">{personal.luckyNumbers.join(', ')}</Text>
          </Text>
          <Row>
            <View accessibilityLabel={personal.luckyColor.label} style={{ width: 14, height: 14, borderRadius: 7, backgroundColor: personal.luckyColor.hex, marginEnd: 4, borderWidth: 1, borderColor: t.colors.border }} />
            <Text size="sm" color="muted">
              {labels.luckyColor}: <Text size="sm" weight="semibold">{personal.luckyColor.label}</Text>
            </Text>
          </Row>
        </Row>
      ) : null}
      {!compact ? (
        <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
          {labels.solarTerm}: {almanac.solarTerm.current} → {almanac.solarTerm.next} ({almanac.solarTerm.nextDate}) · {almanac.moonPhase}
        </Text>
      ) : null}
    </View>
  );
  if (!onPress) return <View testID={testID}>{body}</View>;
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={`${dateLabel ?? almanac.date} ${labels.lunarDate(almanac)} ${almanac.huangdao ? labels.huangdao : labels.heidao}`}>
      {body}
    </Pressable>
  );
}
