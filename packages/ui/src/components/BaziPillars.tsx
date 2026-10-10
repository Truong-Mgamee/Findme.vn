import React from 'react';
import { View } from 'react-native';
import type { BaziChart, PillarView } from '@findme/engine-bazi';
import { useTheme } from '../theme.js';
import { Badge, Text } from './primitives.js';

export interface BaziLabels {
  year: string;
  month: string;
  day: string;
  hour: string;
  hourUnknown: string;
  dayMaster: string;
  hidden: string;
  nayin: string;
  stage: string;
}

const DEFAULT_LABELS: BaziLabels = { year: 'Year', month: 'Month', day: 'Day', hour: 'Hour', hourUnknown: '?', dayMaster: 'Day master', hidden: 'Hidden', nayin: 'Nayin', stage: 'Stage' };

export interface BaziPillarsProps {
  chart: BaziChart;
  showHidden?: boolean;
  showNayin?: boolean;
  labels?: Partial<BaziLabels>;
  /** mark the hour pillar as unreliable (birth time unknown) */
  hourUnknown?: boolean;
  testID?: string;
}

function PillarColumn({ p, labels, showHidden, showNayin, dim, isDay }: { p: PillarView; labels: BaziLabels; showHidden: boolean; showNayin: boolean; dim: boolean; isDay: boolean }) {
  const t = useTheme();
  const title = labels[p.key];
  const a11y = `${title}: ${p.stemLabel} ${p.branchLabel}${p.tenGodLabel ? `, ${p.tenGodLabel}` : ''}${showHidden ? `, ${labels.hidden}: ${p.hiddenStems.map((h) => `${h.label} ${h.tenGodLabel}`).join(', ')}` : ''}`;
  return (
    <View accessible accessibilityLabel={a11y} testID={`pillar-${p.key}`} style={{ flex: 1, alignItems: 'center', paddingVertical: t.spacing[2], paddingHorizontal: 2, opacity: dim ? 0.45 : 1, borderRadius: t.radii.md, backgroundColor: isDay ? t.colors.surfaceAlt : 'transparent', borderWidth: isDay ? 1 : 0, borderColor: t.colors.primary }}>
      <Text size="xs" color="muted" align="center">
        {title}
      </Text>
      <Text size="xs" color={isDay ? 'primary' : 'muted'} align="center" numberOfLines={1}>
        {p.tenGodLabel ?? (isDay ? labels.dayMaster : '')}
      </Text>
      <Text size="2xl" weight="bold" han align="center" style={{ color: t.colors.elements[p.stemElement], marginTop: t.spacing[1] }}>
        {p.ganzhi.han[0]}
      </Text>
      <Text size="xs" align="center" numberOfLines={1}>
        {p.stemLabel}
      </Text>
      <Text size="2xl" weight="bold" han align="center" style={{ color: t.colors.elements[p.branchElement], marginTop: t.spacing[1] }}>
        {p.ganzhi.han[1]}
      </Text>
      <Text size="xs" align="center" numberOfLines={1}>
        {p.branchLabel}
      </Text>
      {showHidden ? (
        <View style={{ marginTop: t.spacing[2], alignItems: 'center' }}>
          {p.hiddenStems.map((h) => (
            <Text key={h.stem} size="xs" color="muted" align="center" numberOfLines={1}>
              {h.label} · {h.tenGodLabel}
            </Text>
          ))}
        </View>
      ) : null}
      {showNayin ? (
        <View style={{ marginTop: t.spacing[2], alignItems: 'center' }}>
          <Text size="xs" color="muted" align="center" numberOfLines={1}>
            {p.nayin.label}
          </Text>
          <Text size="xs" color="muted" align="center" numberOfLines={1}>
            {p.stage.label}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

/** Four pillars (年月日時) as columns: stem/branch Han glyphs coloured by element, ten gods, hidden stems. */
export function BaziPillars({ chart, showHidden = true, showNayin = false, labels: overrides, hourUnknown, testID }: BaziPillarsProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const timeUnknown = hourUnknown ?? chart.resolved.moment.timeUnknown;
  // display order: hour, day, month, year (right-to-left tradition) → in LTR we show year … hour left→right for readability
  const ordered = ['year', 'month', 'day', 'hour'].map((k) => chart.pillars.find((p) => p.key === k)).filter((p): p is PillarView => !!p);
  return (
    <View testID={testID} style={{ backgroundColor: t.colors.surface, borderRadius: t.radii.lg, borderWidth: 1, borderColor: t.colors.border, padding: t.spacing[2] }}>
      <View style={{ flexDirection: 'row' }}>
        {ordered.map((p) => (
          <PillarColumn key={p.key} p={p} labels={labels} showHidden={showHidden} showNayin={showNayin} dim={p.key === 'hour' && timeUnknown} isDay={p.key === 'day'} />
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: t.spacing[3], alignItems: 'center' }}>
        <Badge label={`${labels.dayMaster}: ${chart.dayMaster.label} · ${chart.dayMaster.elementLabel}`} tone="primary" style={{ marginEnd: t.spacing[2], marginBottom: t.spacing[1] }} />
        <Badge label={chart.strength.verdict} tone={chart.strength.verdict === 'balanced' ? 'success' : 'muted'} style={{ marginEnd: t.spacing[2], marginBottom: t.spacing[1] }} />
        {timeUnknown ? <Badge label={labels.hourUnknown} tone="warning" style={{ marginBottom: t.spacing[1] }} /> : null}
      </View>
    </View>
  );
}
