import React, { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, G, Line, Rect, Text as SvgText } from 'react-native-svg';
import type { PalaceView, StarView, ZiweiChart, ZiweiHoroscope } from '@findme/engine-ziwei';
import { useTheme } from '../theme.js';

export interface ZiweiLabels {
  /** tag shown on the body palace */
  body: string;
  decadal: string;
  yearly: string;
  monthly: string;
  /** centre panel */
  soulStar: string;
  bodyStar: string;
  fiveClass: string;
  ages: string;
  /** a11y: "{palace} palace, {branch}, stars: …" */
  palaceA11y: (p: PalaceView, stars: string) => string;
}

const DEFAULT_LABELS: ZiweiLabels = {
  body: '身',
  decadal: '大限',
  yearly: '流年',
  monthly: '流月',
  soulStar: '命主',
  bodyStar: '身主',
  fiveClass: '局',
  ages: '',
  palaceA11y: (p, stars) => `${p.name} (${p.stem.name}${p.branch.name}). ${stars}`,
};

export interface ZiweiChartSVGProps {
  chart: ZiweiChart;
  /** square size in dp (default 360) */
  size?: number;
  /** palace key to highlight (e.g. 'spousePalace'); soul palace is always outlined */
  highlight?: string;
  horoscope?: Pick<ZiweiHoroscope, 'decadal' | 'yearly' | 'monthly'> | null;
  onPressPalace?: (palace: PalaceView) => void;
  showMinorStars?: boolean;
  labels?: Partial<ZiweiLabels>;
  testID?: string;
}

/** Traditional 4×4 ring: 巳午未申 on top, 亥 bottom-right, 寅 bottom-left, centre 2×2 panel. */
const GRID_BY_BRANCH: Record<number, [number, number]> = {
  5: [0, 0], 6: [1, 0], 7: [2, 0], 8: [3, 0],
  4: [0, 1], 9: [3, 1],
  3: [0, 2], 10: [3, 2],
  2: [0, 3], 1: [1, 3], 0: [2, 3], 11: [3, 3],
};

const MUTAGEN_SHORT: Record<string, string> = { sihuaLu: '祿', sihuaQuan: '權', sihuaKe: '科', sihuaJi: '忌' };
const BRIGHT_SHORT: Record<string, string> = { miao: '廟', wang: '旺', de: '得', li: '利', ping: '平', bu: '不', xian: '陷' };

export function mutagenTone(key: string | undefined): 'lu' | 'quan' | 'ke' | 'ji' | null {
  if (!key) return null;
  const k = key.toLowerCase();
  if (k.includes('lu')) return 'lu';
  if (k.includes('quan')) return 'quan';
  if (k.includes('ke')) return 'ke';
  if (k.includes('ji')) return 'ji';
  return null;
}

function starLabel(s: StarView): string {
  const b = s.brightness ? BRIGHT_SHORT[s.brightness.key] ?? s.brightness.name : '';
  const m = s.mutagen ? MUTAGEN_SHORT[s.mutagen.key] ?? s.mutagen.name : '';
  return `${s.name}${b ? ` ${b}` : ''}${m ? ` ${m}` : ''}`;
}

export function ZiweiChartSVG({ chart, size = 360, highlight, horoscope, onPressPalace, showMinorStars = true, labels: labelOverrides, testID }: ZiweiChartSVGProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...labelOverrides };
  const cell = size / 4;
  const fs = Math.max(9, Math.min(13, cell / 8)) * t.fontScale;
  const lineH = fs * 1.25;
  const pad = 4;
  const maxLines = Math.max(1, Math.floor((cell - fs * 2.6 - pad * 2) / lineH));

  const palaces = useMemo(() => chart.palaces.map((p) => ({ p, pos: GRID_BY_BRANCH[p.branch.index] ?? [0, 0] })), [chart.palaces]);
  const decadalIdx = horoscope?.decadal.index ?? -1;
  const yearlyIdx = horoscope?.yearly.index ?? -1;
  const monthlyIdx = horoscope?.monthly.index ?? -1;

  return (
    <View testID={testID} accessible={false} style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel={`${chart.soul.name} / ${chart.body.name} · ${chart.fiveElementsClass.name}`}>
        <Rect x={0} y={0} width={size} height={size} rx={t.radii.md} fill={t.colors.surface} stroke={t.colors.border} />
        {palaces.map(({ p, pos }) => {
          const [col, row] = pos;
          const x = col * cell;
          const y = row * cell;
          const isSoul = p.key === 'soulPalace';
          const isHi = highlight === p.key;
          const majors = p.majorStars;
          const minors = showMinorStars ? [...p.minorStars, ...p.adjectiveStars] : [];
          const starsText = [...majors, ...minors].map(starLabel).join(', ');
          const nameColor = isSoul ? t.colors.primary : isHi ? t.colors.accent : t.colors.text;
          const tags: string[] = [];
          if (decadalIdx === p.index) tags.push(labels.decadal);
          if (yearlyIdx === p.index) tags.push(labels.yearly);
          if (monthlyIdx === p.index) tags.push(labels.monthly);
          return (
            <G
              key={p.key}
              onPress={onPressPalace ? () => onPressPalace(p) : undefined}
              accessible
              accessibilityRole={onPressPalace ? 'button' : undefined}
              accessibilityLabel={labels.palaceA11y(p, starsText)}
              testID={`palace-${p.key}`}
            >
              <Rect x={x} y={y} width={cell} height={cell} fill={isHi ? t.colors.surfaceAlt : 'transparent'} stroke={isSoul ? t.colors.primary : isHi ? t.colors.accent : t.colors.border} strokeWidth={isSoul || isHi ? 2 : 1} strokeDasharray={p.isBodyPalace && !isSoul ? '4 3' : undefined} />
              {/* major stars column */}
              {majors.slice(0, maxLines).map((s, i) => {
                const tone = mutagenTone(s.mutagen?.key);
                const bright = s.brightness ? BRIGHT_SHORT[s.brightness.key] ?? '' : '';
                return (
                  <G key={`${s.key}-${i}`}>
                    <SvgText x={x + pad} y={y + pad + lineH * (i + 1) - 3} fontSize={fs} fontWeight="700" fill={t.colors.text} fontFamily={t.fonts.han}>
                      {s.name}
                    </SvgText>
                    {bright ? (
                      <SvgText x={x + pad + fs * (s.name.length + 0.2)} y={y + pad + lineH * (i + 1) - 3} fontSize={fs * 0.8} fill={t.colors.textMuted} fontFamily={t.fonts.han}>
                        {bright}
                      </SvgText>
                    ) : null}
                    {tone ? (
                      <G>
                        <Circle cx={x + cell - pad - fs * 0.55} cy={y + pad + lineH * (i + 1) - 3 - fs * 0.35} r={fs * 0.55} fill={t.colors.mutagen[tone]} />
                        <SvgText x={x + cell - pad - fs * 0.55} y={y + pad + lineH * (i + 1) - 3 - fs * 0.35 + fs * 0.32} fontSize={fs * 0.75} fill="#FFFFFF" fontFamily={t.fonts.han} textAnchor="middle">
                          {MUTAGEN_SHORT[s.mutagen!.key] ?? ''}
                        </SvgText>
                      </G>
                    ) : null}
                  </G>
                );
              })}
              {/* minor stars (smaller, second column) */}
              {minors.slice(0, Math.max(0, maxLines)).map((s, i) => (
                <SvgText key={`${s.key}-m-${i}`} x={x + cell * 0.52} y={y + pad + lineH * (i + 1) - 3} fontSize={fs * 0.78} fill={mutagenTone(s.mutagen?.key) ? t.colors.mutagen[mutagenTone(s.mutagen?.key)!] : t.colors.textMuted} fontFamily={t.fonts.han}>
                  {s.name}
                </SvgText>
              ))}
              {/* ages (decadal range) */}
              <SvgText x={x + cell - pad} y={y + cell - fs * 1.55} fontSize={fs * 0.75} fill={t.colors.textMuted} textAnchor="end" fontFamily={t.fonts.sans}>
                {`${labels.ages}${p.decadal.range[0]}-${p.decadal.range[1]}`}
              </SvgText>
              {/* palace name + body tag */}
              <SvgText x={x + pad} y={y + cell - pad - 1} fontSize={fs} fontWeight="700" fill={nameColor} fontFamily={t.fonts.han}>
                {p.name}
              </SvgText>
              {p.isBodyPalace ? (
                <SvgText x={x + pad + fs * (p.name.length + 0.4)} y={y + cell - pad - 1} fontSize={fs * 0.8} fill={t.colors.accent} fontFamily={t.fonts.han}>
                  {labels.body}
                </SvgText>
              ) : null}
              {/* stem/branch */}
              <SvgText x={x + cell - pad} y={y + cell - pad - 1} fontSize={fs} fill={t.colors.textMuted} textAnchor="end" fontFamily={t.fonts.han}>
                {`${p.stem.han}${p.branch.han}`}
              </SvgText>
              {/* horoscope tags */}
              {tags.map((tag, i) => (
                <G key={tag}>
                  <Rect x={x + cell - pad - fs * 2.2} y={y + pad + i * (fs * 1.3)} width={fs * 2.2} height={fs * 1.15} rx={3} fill={i === 0 && decadalIdx === p.index ? t.colors.accent : t.colors.primary} />
                  <SvgText x={x + cell - pad - fs * 1.1} y={y + pad + i * (fs * 1.3) + fs * 0.9} fontSize={fs * 0.7} fill={i === 0 && decadalIdx === p.index ? t.colors.onAccent : t.colors.onPrimary} textAnchor="middle" fontFamily={t.fonts.han}>
                    {tag}
                  </SvgText>
                </G>
              ))}
            </G>
          );
        })}
        {/* centre panel */}
        <G testID="ziwei-centre">
          <Rect x={cell} y={cell} width={cell * 2} height={cell * 2} fill={t.colors.surfaceAlt} stroke={t.colors.border} />
          <Line x1={cell} y1={cell * 2} x2={cell * 3} y2={cell * 2} stroke={t.colors.border} strokeDasharray="2 4" />
          <SvgText x={cell * 2} y={cell + fs * 1.8} fontSize={fs * 1.1} fontWeight="700" fill={t.colors.text} textAnchor="middle" fontFamily={t.fonts.han}>
            {chart.lunarDateLabel}
          </SvgText>
          <SvgText x={cell * 2} y={cell + fs * 3.3} fontSize={fs * 0.9} fill={t.colors.textMuted} textAnchor="middle" fontFamily={t.fonts.han}>
            {`${chart.chineseDate} · ${chart.timeRange}`}
          </SvgText>
          <SvgText x={cell * 2} y={cell + fs * 4.9} fontSize={fs} fill={t.colors.primary} textAnchor="middle" fontFamily={t.fonts.han}>
            {`${labels.fiveClass}: ${chart.fiveElementsClass.name}`}
          </SvgText>
          <SvgText x={cell * 2} y={cell * 2 + fs * 1.6} fontSize={fs * 0.95} fill={t.colors.text} textAnchor="middle" fontFamily={t.fonts.han}>
            {`${labels.soulStar}: ${chart.soul.name}`}
          </SvgText>
          <SvgText x={cell * 2} y={cell * 2 + fs * 3.0} fontSize={fs * 0.95} fill={t.colors.text} textAnchor="middle" fontFamily={t.fonts.han}>
            {`${labels.bodyStar}: ${chart.body.name}`}
          </SvgText>
          <SvgText x={cell * 2} y={cell * 2 + fs * 4.5} fontSize={fs * 0.85} fill={t.colors.textMuted} textAnchor="middle" fontFamily={t.fonts.han}>
            {`${chart.zodiac} · ${chart.sign}`}
          </SvgText>
          {chart.confidence !== 'high' ? (
            <SvgText x={cell * 2} y={cell * 3 - fs * 0.8} fontSize={fs * 0.8} fill={t.colors.warning} textAnchor="middle" fontFamily={t.fonts.sans}>
              {chart.confidence === 'low' ? '⚠ ≈' : '≈'}
            </SvgText>
          ) : null}
        </G>
      </Svg>
    </View>
  );
}
