import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, View, type ViewProps } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@findme/ui';

export interface ScreenProps extends ViewProps {
  title?: string;
  subtitle?: string;
  scroll?: boolean;
  back?: boolean;
  right?: React.ReactNode;
  padded?: boolean;
  /** bottom padding for tab bars */
  tabs?: boolean;
}

export function Screen({ title, subtitle, scroll = true, back, right, padded = true, tabs, children, style, ...rest }: ScreenProps) {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t: tr } = useTranslation();
  const header = title || back || right ? (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: t.spacing[4], paddingTop: t.spacing[2], paddingBottom: t.spacing[2] }}>
      {back ? (
        <Pressable onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)/today'))} accessibilityRole="button" accessibilityLabel={tr('common.back')} hitSlop={8} style={{ minWidth: t.touchTarget, minHeight: t.touchTarget, justifyContent: 'center' }}>
          <Text size="xl">{t.isRTL ? '→' : '←'}</Text>
        </Pressable>
      ) : null}
      <View style={{ flex: 1 }}>
        {title ? (
          <Text size="xl" weight="bold" accessibilityRole="header">
            {title}
          </Text>
        ) : null}
        {subtitle ? (
          <Text size="sm" color="muted">
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
    </View>
  ) : null;
  const content = (
    <View style={[{ paddingHorizontal: padded ? t.spacing[4] : 0, paddingBottom: (tabs ? 0 : insets.bottom) + t.spacing[8] }, style]} {...rest}>
      {children}
    </View>
  );
  return (
    <View style={{ flex: 1, backgroundColor: t.colors.bg, paddingTop: insets.top }}>
      {header}
      {scroll ? (
        <ScrollView keyboardShouldPersistTaps="handled" contentInsetAdjustmentBehavior="automatic">
          {content}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>{content}</View>
      )}
    </View>
  );
}

export function Loading({ label }: { label?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <View accessibilityRole="progressbar" accessibilityLabel={label ?? tr('common.loading')} style={{ padding: t.spacing[6], alignItems: 'center' }}>
      <ActivityIndicator color={t.colors.primary} />
      <Text size="sm" color="muted" style={{ marginTop: t.spacing[2] }}>
        {label ?? tr('common.loading')}
      </Text>
    </View>
  );
}

export function Section({ title, children, style }: { title?: string; children: React.ReactNode; style?: ViewProps['style'] }) {
  const t = useTheme();
  return (
    <View style={[{ marginTop: t.spacing[5] }, style]}>
      {title ? (
        <Text size="sm" weight="semibold" color="muted" accessibilityRole="header" style={{ marginBottom: t.spacing[2], textTransform: 'uppercase', letterSpacing: 1 }}>
          {title}
        </Text>
      ) : null}
      {children}
    </View>
  );
}
