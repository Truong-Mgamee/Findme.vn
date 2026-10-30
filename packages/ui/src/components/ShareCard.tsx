import React, { forwardRef } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useTheme } from '../theme.js';
import { Text } from './primitives.js';

export type ShareCardType = 'today' | 'ziwei' | 'tarot' | 'numerology' | 'compat';

export interface ShareCardData {
  title: string;
  subtitle?: string;
  /** big centrepiece (e.g. "Life Path 7", card name, lucky number) */
  hero?: string;
  lines?: string[];
  footer?: string;
  /** any visual (chart, spread) rendered above the lines */
  children?: React.ReactNode;
}

export interface ShareCardProps {
  type: ShareCardType;
  data: ShareCardData;
  /** width in dp; height follows a 4:5 ratio (Instagram-friendly) */
  width?: number;
  /** app name/URL watermark */
  brand?: string;
  testID?: string;
}

/** Deterministic star field so the card looks identical across platforms/snapshots. */
function stars(n: number, w: number, h: number) {
  const out: Array<{ x: number; y: number; r: number; o: number }> = [];
  let s = 1337;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) out.push({ x: rnd() * w, y: rnd() * h, r: 0.6 + rnd() * 1.6, o: 0.3 + rnd() * 0.7 });
  return out;
}

/**
 * Shareable 4:5 card (capture with react-native-view-shot on native, satori/html2canvas on web).
 * Callers must not pass birth dates (docs/02 P10): only derived facts.
 */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard({ type, data, width = 320, brand = 'Findme', testID }, ref) {
  const t = useTheme();
  const height = Math.round(width * 1.25);
  const accent = type === 'tarot' ? t.colors.accent : t.colors.primary;
  const field = stars(60, width, height);
  return (
    <View ref={ref} testID={testID} collapsable={false} accessibilityLabel={`${data.title}${data.hero ? ` ${data.hero}` : ''}`} style={{ width, height, borderRadius: t.radii.xl, overflow: 'hidden', backgroundColor: '#0B1020' }}>
      <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#0B1020" />
            <Stop offset="1" stopColor="#1C2440" />
          </LinearGradient>
        </Defs>
        <Rect x={0} y={0} width={width} height={height} fill="url(#sky)" />
        {field.map((s, i) => (
          <Circle key={i} cx={s.x} cy={s.y} r={s.r} fill="#F2F4FA" opacity={s.o} />
        ))}
        <Circle cx={width * 0.82} cy={height * 0.14} r={width * 0.09} fill={accent} opacity={0.9} />
        <Circle cx={width * 0.85} cy={height * 0.125} r={width * 0.075} fill="#0B1020" opacity={0.95} />
      </Svg>
      <View style={{ flex: 1, padding: t.spacing[5], justifyContent: 'space-between' }}>
        <View>
          <Text size="xs" weight="semibold" style={{ color: accent, letterSpacing: 2, textTransform: 'uppercase' }}>
            {brand}
          </Text>
          <Text size="xl" weight="bold" style={{ color: '#F2F4FA', marginTop: t.spacing[2] }}>
            {data.title}
          </Text>
          {data.subtitle ? (
            <Text size="sm" style={{ color: '#9AA3C0', marginTop: t.spacing[1] }}>
              {data.subtitle}
            </Text>
          ) : null}
        </View>
        {data.children ? <View style={{ alignItems: 'center' }}>{data.children}</View> : null}
        <View>
          {data.hero ? (
            <Text size="3xl" weight="bold" style={{ color: accent }}>
              {data.hero}
            </Text>
          ) : null}
          {data.lines?.map((l, i) => (
            <Text key={i} size="md" style={{ color: '#F2F4FA', marginTop: t.spacing[1] }}>
              {l}
            </Text>
          ))}
          {data.footer ? (
            <Text size="xs" style={{ color: '#9AA3C0', marginTop: t.spacing[3] }}>
              {data.footer}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
});
