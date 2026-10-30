import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Rect } from 'react-native-svg';
import { useTheme } from '../theme.js';
import { Text } from './primitives.js';

/** 6 = old yin (changing), 7 = young yang, 8 = young yin, 9 = old yang (changing) — bottom→top */
export type HexLine = 6 | 7 | 8 | 9;

export interface HexagramViewProps {
  /** bottom→top. Booleans are treated as yang=true (no changing marks). */
  lines: readonly (HexLine | boolean)[];
  /** 1-based positions (bottom = 1) marked as changing; derived from 6/9 when omitted */
  changing?: readonly number[];
  title?: string;
  subtitle?: string;
  width?: number;
  /** render only `revealed` lines from the bottom (casting animation) */
  revealed?: number;
  labels?: { yang: string; yin: string; changing: string; line: string };
  testID?: string;
}

const DEFAULT_LABELS = { yang: 'yang', yin: 'yin', changing: 'changing', line: 'Line' };

function isYang(v: HexLine | boolean): boolean {
  return typeof v === 'boolean' ? v : v === 7 || v === 9;
}

/** Six lines drawn top (line 6) to bottom (line 1); broken = yin; ○ marks old yang, × marks old yin. */
export function HexagramView({ lines, changing, title, subtitle, width = 160, revealed, labels: overrides, testID }: HexagramViewProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  const lineH = Math.round(width / 12);
  const gap = Math.round(lineH * 0.9);
  const height = 6 * lineH + 5 * gap;
  const changingSet = new Set(changing ?? lines.flatMap((v, i) => (typeof v === 'number' && (v === 6 || v === 9) ? [i + 1] : [])));
  const shown = revealed ?? 6;
  const a11y = lines
    .map((v, i) => `${labels.line} ${i + 1}: ${isYang(v) ? labels.yang : labels.yin}${changingSet.has(i + 1) ? ` (${labels.changing})` : ''}`)
    .join(', ');
  return (
    <View testID={testID} accessible accessibilityLabel={`${title ?? ''} ${a11y}`.trim()} style={{ alignItems: 'center' }}>
      {title ? (
        <Text size="lg" weight="bold" han align="center">
          {title}
        </Text>
      ) : null}
      {subtitle ? (
        <Text size="sm" color="muted" align="center" style={{ marginBottom: t.spacing[2] }}>
          {subtitle}
        </Text>
      ) : null}
      <Svg width={width + 28} height={height} viewBox={`0 0 ${width + 28} ${height}`}>
        {lines.map((v, i) => {
          const pos = i + 1; // bottom = 1
          const y = height - pos * lineH - (pos - 1) * gap;
          if (pos > shown) return <Rect key={pos} x={0} y={y} width={width} height={lineH} fill={t.colors.surfaceAlt} opacity={0.4} rx={2} />;
          const yang = isYang(v);
          const isChanging = changingSet.has(pos);
          const fill = isChanging ? t.colors.primary : t.colors.text;
          return (
            <React.Fragment key={pos}>
              {yang ? <Rect x={0} y={y} width={width} height={lineH} fill={fill} rx={2} /> : (
                <>
                  <Rect x={0} y={y} width={width * 0.42} height={lineH} fill={fill} rx={2} />
                  <Rect x={width * 0.58} y={y} width={width * 0.42} height={lineH} fill={fill} rx={2} />
                </>
              )}
              {isChanging ? (
                yang ? (
                  <Circle cx={width + 16} cy={y + lineH / 2} r={lineH * 0.4} stroke={t.colors.primary} strokeWidth={2} fill="none" />
                ) : (
                  <>
                    <Line x1={width + 10} y1={y + 1} x2={width + 22} y2={y + lineH - 1} stroke={t.colors.primary} strokeWidth={2} />
                    <Line x1={width + 22} y1={y + 1} x2={width + 10} y2={y + lineH - 1} stroke={t.colors.primary} strokeWidth={2} />
                  </>
                )
              ) : null}
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}
