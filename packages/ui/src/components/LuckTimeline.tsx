import React, { useEffect, useRef } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../theme.js';
import { Text } from './primitives.js';

export interface LuckPeriodItem {
  index: number;
  /** localized ganzhi label e.g. "Giáp Tý" */
  label: string;
  han?: string;
  startAge: number;
  startYear: number;
  endYear: number;
  /** ten god of the period stem (localized) */
  tenGodLabel?: string;
}

export interface AnnualItem {
  year: number;
  age: number;
  label: string;
  han?: string;
}

export interface LuckTimelineProps {
  periods: LuckPeriodItem[];
  /** index of the current 大運 */
  currentIndex: number | null;
  annual?: AnnualItem[];
  currentYear?: number;
  onPressPeriod?: (p: LuckPeriodItem) => void;
  onPressYear?: (y: AnnualItem) => void;
  labels?: { age: string; current: string; decadal: string; annual: string };
  testID?: string;
}

const DEFAULT_LABELS = { age: 'Age', current: 'Now', decadal: 'Luck periods', annual: 'Annual' };

/** Horizontal 大運 timeline with the current period highlighted; optional 流年 row. */
export function LuckTimeline({ periods, currentIndex, annual, currentYear, onPressPeriod, onPressYear, labels: overrides, testID }: LuckTimelineProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const ref = useRef<ScrollView>(null);
  const itemW = 92;
  useEffect(() => {
    if (currentIndex !== null && currentIndex > 1) ref.current?.scrollTo({ x: (currentIndex - 1) * (itemW + t.spacing[2]), animated: !t.reduceMotion });
  }, [currentIndex, t.reduceMotion, t.spacing]);
  return (
    <View testID={testID}>
      <Text size="sm" color="muted" style={{ marginBottom: t.spacing[1] }}>
        {labels.decadal}
      </Text>
      <ScrollView ref={ref} horizontal showsHorizontalScrollIndicator={false} accessibilityRole="list" contentContainerStyle={{ paddingVertical: t.spacing[1] }}>
        {periods.map((p) => {
          const cur = p.index === currentIndex;
          return (
            <Pressable
              key={p.index}
              onPress={onPressPeriod ? () => onPressPeriod(p) : undefined}
              disabled={!onPressPeriod}
              accessibilityRole={onPressPeriod ? 'button' : 'text'}
              accessibilityState={{ selected: cur }}
              accessibilityLabel={`${p.label} ${p.startYear}–${p.endYear}, ${labels.age} ${p.startAge}${cur ? `, ${labels.current}` : ''}`}
              testID={`luck-period-${p.index}`}
              style={{ width: itemW, minHeight: t.touchTarget, marginEnd: t.spacing[2], padding: t.spacing[2], borderRadius: t.radii.md, backgroundColor: cur ? t.colors.primary : t.colors.surfaceAlt, borderWidth: 1, borderColor: cur ? t.colors.primary : t.colors.border }}
            >
              <Text size="lg" weight="bold" han align="center" style={{ color: cur ? t.colors.onPrimary : t.colors.text }}>
                {p.han ?? p.label}
              </Text>
              <Text size="xs" align="center" numberOfLines={1} style={{ color: cur ? t.colors.onPrimary : t.colors.textMuted }}>
                {p.label}
              </Text>
              <Text size="xs" align="center" style={{ color: cur ? t.colors.onPrimary : t.colors.textMuted }}>
                {p.startYear}–{p.endYear}
              </Text>
              <Text size="xs" align="center" style={{ color: cur ? t.colors.onPrimary : t.colors.textMuted }}>
                {labels.age} {p.startAge}
                {p.tenGodLabel ? ` · ${p.tenGodLabel}` : ''}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
      {annual && annual.length ? (
        <View style={{ marginTop: t.spacing[2] }}>
          <Text size="sm" color="muted" style={{ marginBottom: t.spacing[1] }}>
            {labels.annual}
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {annual.map((y) => {
              const cur = y.year === currentYear;
              return (
                <Pressable key={y.year} onPress={onPressYear ? () => onPressYear(y) : undefined} disabled={!onPressYear} accessibilityRole={onPressYear ? 'button' : 'text'} accessibilityState={{ selected: cur }} accessibilityLabel={`${y.year} ${y.label}, ${labels.age} ${y.age}`} style={{ minWidth: 64, minHeight: t.touchTarget, marginEnd: t.spacing[2], padding: t.spacing[1], borderRadius: t.radii.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: cur ? t.colors.accent : t.colors.surfaceAlt }}>
                  <Text size="sm" weight="semibold" han style={{ color: cur ? t.colors.onAccent : t.colors.text }}>
                    {y.han ?? y.label}
                  </Text>
                  <Text size="xs" style={{ color: cur ? t.colors.onAccent : t.colors.textMuted }}>
                    {y.year}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );
}
