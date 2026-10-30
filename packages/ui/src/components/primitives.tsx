import React from 'react';
import { Pressable, StyleSheet, Text as RNText, View, type PressableProps, type StyleProp, type TextProps as RNTextProps, type TextStyle, type ViewProps, type ViewStyle } from 'react-native';
import { useTheme } from '../theme.js';
import { fontWeights, type TypeScaleKey } from '../tokens.js';

export interface TextProps extends RNTextProps {
  size?: TypeScaleKey;
  weight?: keyof typeof fontWeights;
  color?: 'text' | 'muted' | 'primary' | 'accent' | 'danger' | 'success' | 'warning' | 'onPrimary';
  /** Han characters (命盤 / 黃曆) use the serif stack */
  han?: boolean;
  align?: TextStyle['textAlign'];
}

/** Text with dynamic type: RN scales fontSize with the OS setting; `maxFontSizeMultiplier` keeps layouts sane. */
export function Text({ size = 'md', weight = 'regular', color = 'text', han, align, style, ...rest }: TextProps) {
  const t = useTheme();
  const c = color === 'muted' ? t.colors.textMuted : color === 'primary' ? t.colors.primary : color === 'accent' ? t.colors.accent : color === 'danger' ? t.colors.danger : color === 'success' ? t.colors.success : color === 'warning' ? t.colors.warning : color === 'onPrimary' ? t.colors.onPrimary : t.colors.text;
  const scale = t.typeScale[size];
  return (
    <RNText
      maxFontSizeMultiplier={1.6}
      {...rest}
      style={[
        { color: c, fontSize: scale.fontSize * t.fontScale, lineHeight: scale.lineHeight * t.fontScale, fontWeight: fontWeights[weight], fontFamily: han ? t.fonts.han : t.fonts.sans, textAlign: align, writingDirection: t.isRTL ? 'rtl' : 'ltr' },
        style,
      ]}
    />
  );
}

export interface CardProps extends ViewProps {
  padded?: boolean;
  alt?: boolean;
}

export function Card({ padded = true, alt, style, ...rest }: CardProps) {
  const t = useTheme();
  return <View {...rest} style={[{ backgroundColor: alt ? t.colors.surfaceAlt : t.colors.surface, borderRadius: t.radii.lg, borderWidth: StyleSheet.hairlineWidth, borderColor: t.colors.border, padding: padded ? t.spacing[4] : 0 }, style]} />;
}

export interface BadgeProps {
  label: string;
  tone?: 'primary' | 'accent' | 'success' | 'warning' | 'danger' | 'muted' | 'info';
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export function Badge({ label, tone = 'primary', style, testID }: BadgeProps) {
  const t = useTheme();
  const bg = tone === 'muted' ? t.colors.surfaceAlt : tone === 'accent' ? t.colors.accent : tone === 'success' ? t.colors.success : tone === 'warning' ? t.colors.warning : tone === 'danger' ? t.colors.danger : tone === 'info' ? t.colors.info : t.colors.primary;
  const fg = tone === 'muted' ? t.colors.text : tone === 'primary' ? t.colors.onPrimary : tone === 'warning' ? '#1A1400' : '#FFFFFF';
  return (
    <View testID={testID} accessibilityRole="text" style={[{ backgroundColor: bg, borderRadius: t.radii.full, paddingHorizontal: t.spacing[2], paddingVertical: 2, alignSelf: 'flex-start' }, style]}>
      <RNText style={{ color: fg, fontSize: 12 * t.fontScale, fontWeight: '600', fontFamily: t.fonts.sans }} maxFontSizeMultiplier={1.4}>
        {label}
      </RNText>
    </View>
  );
}

export interface ChipProps {
  label: string;
  tone?: 'good' | 'bad' | 'neutral' | 'selected';
  onPress?: () => void;
  accessibilityLabel?: string;
  testID?: string;
  han?: boolean;
}

/** 44pt-tall tappable chip (or static when no onPress) */
export function Chip({ label, tone = 'neutral', onPress, accessibilityLabel, testID, han }: ChipProps) {
  const t = useTheme();
  const border = tone === 'good' ? t.colors.success : tone === 'bad' ? t.colors.danger : tone === 'selected' ? t.colors.primary : t.colors.border;
  const bg = tone === 'selected' ? t.colors.primary : t.colors.surfaceAlt;
  const fg = tone === 'selected' ? t.colors.onPrimary : t.colors.text;
  const inner = (
    <View style={{ borderColor: border, borderWidth: 1, backgroundColor: bg, borderRadius: t.radii.full, paddingHorizontal: t.spacing[3], minHeight: onPress ? t.touchTarget : 28, justifyContent: 'center', marginEnd: t.spacing[2], marginBottom: t.spacing[2] }}>
      <RNText style={{ color: fg, fontSize: 14 * t.fontScale, fontFamily: han ? t.fonts.han : t.fonts.sans }} maxFontSizeMultiplier={1.4}>
        {label}
      </RNText>
    </View>
  );
  if (!onPress) return <View testID={testID} accessibilityLabel={accessibilityLabel ?? label}>{inner}</View>;
  return (
    <Pressable testID={testID} onPress={onPress} accessibilityRole="button" accessibilityLabel={accessibilityLabel ?? label} accessibilityState={{ selected: tone === 'selected' }} hitSlop={6}>
      {inner}
    </Pressable>
  );
}

export interface ButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'md' | 'lg';
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  leading?: React.ReactNode;
}

/** ≥44pt target, text may expand +35% (de/pt) without truncation. */
export function Button({ label, variant = 'primary', size = 'md', loading, disabled, style, leading, accessibilityLabel, ...rest }: ButtonProps) {
  const t = useTheme();
  const bg = variant === 'primary' ? t.colors.primary : variant === 'secondary' ? t.colors.surfaceAlt : variant === 'danger' ? t.colors.danger : 'transparent';
  const fg = variant === 'primary' ? t.colors.onPrimary : variant === 'danger' ? '#FFFFFF' : t.colors.text;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: !!disabled || !!loading, busy: !!loading }}
      disabled={disabled || loading}
      {...rest}
      style={({ pressed }) => [
        { backgroundColor: bg, borderRadius: t.radii.md, minHeight: size === 'lg' ? 52 : t.touchTarget, paddingHorizontal: t.spacing[4], paddingVertical: t.spacing[2], alignItems: 'center', justifyContent: 'center', flexDirection: 'row', opacity: disabled ? 0.5 : pressed ? 0.85 : 1, borderWidth: variant === 'ghost' ? 1 : 0, borderColor: t.colors.border },
        style,
      ]}
    >
      {leading ? <View style={{ marginEnd: t.spacing[2] }}>{leading}</View> : null}
      <RNText style={{ color: fg, fontSize: (size === 'lg' ? 17 : 16) * t.fontScale, fontWeight: '600', fontFamily: t.fonts.sans, textAlign: 'center' }} maxFontSizeMultiplier={1.4}>
        {loading ? '…' : label}
      </RNText>
    </Pressable>
  );
}

export function Row({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }, style]} />;
}

export function Divider() {
  const t = useTheme();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: t.colors.border, marginVertical: t.spacing[3] }} />;
}
