/**
 * Design tokens (docs/05 §4). Dark "night sky" is the default scheme; light mirrors it.
 * Everything here is plain data so it can feed NativeWind (tailwind.config), StyleSheet and SVG.
 */
import { Platform } from 'react-native';

export type ColorScheme = 'dark' | 'light';

export interface ColorTokens {
  bg: string;
  /** elevated card */
  surface: string;
  /** nested / pressed surfaces */
  surfaceAlt: string;
  border: string;
  text: string;
  textMuted: string;
  /** brand gold */
  primary: string;
  onPrimary: string;
  /** mystic violet accent */
  accent: string;
  onAccent: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  /** 黄道 / 黑道 day colours */
  huangdao: string;
  heidao: string;
  /** five elements: wood, fire, earth, metal, water (index 0..4, same order as engine-core) */
  elements: [string, string, string, string, string];
  /** 四化: 祿 權 科 忌 */
  mutagen: { lu: string; quan: string; ke: string; ji: string };
  /** tarot card back */
  cardBack: string;
  overlay: string;
}

export const darkColors: ColorTokens = {
  bg: '#0B1020',
  surface: '#141B2E',
  surfaceAlt: '#1C2440',
  border: '#2A3356',
  text: '#F2F4FA',
  textMuted: '#9AA3C0',
  primary: '#E7C56A',
  onPrimary: '#1A1400',
  accent: '#8B7CF6',
  onAccent: '#FFFFFF',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  info: '#60A5FA',
  huangdao: '#E7C56A',
  heidao: '#6B7280',
  elements: ['#4CAF7A', '#EF6A4C', '#C9A54B', '#D7D9E0', '#4C9BEF'],
  mutagen: { lu: '#4ADE80', quan: '#F97316', ke: '#60A5FA', ji: '#C084FC' },
  cardBack: '#1E2A5A',
  overlay: 'rgba(5, 8, 20, 0.72)',
};

export const lightColors: ColorTokens = {
  bg: '#FAFAF7',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F2F7',
  border: '#E2E4EC',
  text: '#141B2E',
  textMuted: '#5B6480',
  primary: '#B8860B',
  onPrimary: '#FFFFFF',
  accent: '#6C5CE7',
  onAccent: '#FFFFFF',
  success: '#16A34A',
  warning: '#D97706',
  danger: '#DC2626',
  info: '#2563EB',
  huangdao: '#B8860B',
  heidao: '#6B7280',
  elements: ['#2E8B57', '#D9480F', '#A67C00', '#6B7280', '#1D6FD9'],
  mutagen: { lu: '#16A34A', quan: '#EA580C', ke: '#2563EB', ji: '#7C3AED' },
  cardBack: '#2B3A7A',
  overlay: 'rgba(20, 27, 46, 0.55)',
};

export const colors: Record<ColorScheme, ColorTokens> = { dark: darkColors, light: lightColors };

/** 4pt grid */
export const spacing = { 0: 0, 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export type SpacingKey = keyof typeof spacing;

export const radii = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

/** Minimum touch target (docs/05 §4) */
export const TOUCH_TARGET = 44;

export const typeScale = {
  xs: { fontSize: 12, lineHeight: 16 },
  sm: { fontSize: 14, lineHeight: 20 },
  md: { fontSize: 16, lineHeight: 24 },
  lg: { fontSize: 18, lineHeight: 26 },
  xl: { fontSize: 22, lineHeight: 30 },
  '2xl': { fontSize: 28, lineHeight: 36 },
  '3xl': { fontSize: 34, lineHeight: 42 },
} as const;
export type TypeScaleKey = keyof typeof typeScale;

export const fontWeights = { regular: '400', medium: '500', semibold: '600', bold: '700' } as const;

/**
 * Font families per script. Latin + Vietnamese: Inter (full diacritics). CJK: Noto Sans per locale
 * (loaded by the app with expo-font when bundled; system fallbacks otherwise). Han characters inside
 * charts use a serif stack for the classic almanac feel.
 */
export const fontFamilies = {
  sans: Platform.select({
    web: "Inter, 'Noto Sans', 'Noto Sans SC', 'Noto Sans TC', 'Noto Sans JP', 'Noto Sans KR', 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    ios: 'System',
    android: 'sans-serif',
    default: 'System',
  }) as string,
  /** Han characters in charts (命盤 / 黃曆) */
  han: Platform.select({
    web: "'Noto Serif SC', 'Noto Serif TC', 'Noto Serif JP', 'Noto Serif KR', 'Songti SC', 'SimSun', serif",
    ios: 'Songti SC',
    android: 'serif',
    default: 'serif',
  }) as string,
  mono: Platform.select({ web: "ui-monospace, Menlo, Consolas, monospace", ios: 'Menlo', android: 'monospace', default: 'monospace' }) as string,
} as const;

/** Preferred sans family by locale (CJK locales fall back to their Noto Sans flavour on web). */
export function fontFamilyFor(locale: string, kind: 'sans' | 'han' | 'mono' = 'sans'): string {
  if (kind !== 'sans') return fontFamilies[kind];
  if (Platform.OS !== 'web') return fontFamilies.sans;
  const base = locale.toLowerCase();
  if (base.startsWith('zh-tw') || base.startsWith('zh-hant')) return `'Noto Sans TC', ${fontFamilies.sans}`;
  if (base.startsWith('zh')) return `'Noto Sans SC', ${fontFamilies.sans}`;
  if (base.startsWith('ja')) return `'Noto Sans JP', ${fontFamilies.sans}`;
  if (base.startsWith('ko')) return `'Noto Sans KR', ${fontFamilies.sans}`;
  return fontFamilies.sans;
}

export const shadows = {
  card: Platform.select({
    web: { boxShadow: '0 8px 24px rgba(0,0,0,0.25)' },
    default: { shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  }) as Record<string, unknown>,
} as const;

export const motion = { fast: 150, normal: 250, slow: 450 } as const;

export const tokens = { colors, spacing, radii, typeScale, fontWeights, fontFamilies, shadows, motion, TOUCH_TARGET } as const;
export type Tokens = typeof tokens;
