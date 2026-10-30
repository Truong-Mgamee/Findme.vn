import React, { createContext, useContext, useMemo } from 'react';
import { I18nManager, useColorScheme } from 'react-native';
import { colors, type ColorScheme, type ColorTokens, fontFamilies, fontFamilyFor, radii, spacing, typeScale, TOUCH_TARGET } from './tokens.js';

export interface Theme {
  scheme: ColorScheme;
  colors: ColorTokens;
  spacing: typeof spacing;
  radii: typeof radii;
  typeScale: typeof typeScale;
  fonts: { sans: string; han: string; mono: string };
  /** multiplier applied on top of the OS font scale for user-chosen text size */
  fontScale: number;
  locale: string;
  isRTL: boolean;
  reduceMotion: boolean;
  touchTarget: number;
}

export function buildTheme(opts: { scheme?: ColorScheme; locale?: string; fontScale?: number; reduceMotion?: boolean } = {}): Theme {
  const scheme = opts.scheme ?? 'dark';
  const locale = opts.locale ?? 'en';
  return {
    scheme,
    colors: colors[scheme],
    spacing,
    radii,
    typeScale,
    fonts: { sans: fontFamilyFor(locale, 'sans'), han: fontFamilies.han, mono: fontFamilies.mono },
    fontScale: opts.fontScale ?? 1,
    locale,
    isRTL: I18nManager.isRTL,
    reduceMotion: opts.reduceMotion ?? false,
    touchTarget: TOUCH_TARGET,
  };
}

const ThemeContext = createContext<Theme>(buildTheme());

export interface ThemeProviderProps {
  /** 'system' follows the OS; default dark (night sky) */
  scheme?: ColorScheme | 'system';
  locale?: string;
  fontScale?: number;
  reduceMotion?: boolean;
  children: React.ReactNode;
}

export function ThemeProvider({ scheme = 'dark', locale, fontScale, reduceMotion, children }: ThemeProviderProps) {
  const system = useColorScheme();
  const resolved: ColorScheme = scheme === 'system' ? (system === 'light' ? 'light' : 'dark') : scheme;
  const value = useMemo(() => buildTheme({ scheme: resolved, locale, fontScale, reduceMotion }), [resolved, locale, fontScale, reduceMotion]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
