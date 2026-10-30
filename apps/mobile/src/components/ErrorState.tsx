import React, { useEffect } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { usePathname } from 'expo-router';
import { Button, Card, Text, useTheme } from '@findme/ui';
import { errorCode } from '../lib/api';
import { track } from '../lib/analytics';

export function ErrorState({ error, onRetry, message }: { error?: unknown; onRetry?: () => void; message?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const route = usePathname();
  const code = error ? errorCode(error) : 'unknown';
  useEffect(() => {
    track({ name: 'error_shown', code, route });
  }, [code, route]);
  const text = message ?? (code === 'network' ? tr('errors.network') : code === 'not_found' || code === 'http_404' ? tr('errors.notFound') : code === 'http_501' || code === 'not_implemented' ? tr('errors.comingSoon') : tr('common.errorGeneric'));
  return (
    <Card accessibilityRole="alert" style={{ marginTop: t.spacing[4] }}>
      <Text size="md" weight="semibold">
        {text}
      </Text>
      <Text size="xs" color="muted" style={{ marginTop: t.spacing[1] }}>
        {code}
      </Text>
      {onRetry ? (
        <View style={{ marginTop: t.spacing[3] }}>
          <Button label={tr('common.retry')} variant="secondary" onPress={onRetry} />
        </View>
      ) : null}
    </Card>
  );
}

export function Banner({ text, tone = 'warning', testID }: { text: string; tone?: 'warning' | 'info'; testID?: string }) {
  const t = useTheme();
  return (
    <View testID={testID} accessibilityRole="alert" style={{ backgroundColor: t.colors.surfaceAlt, borderStartWidth: 3, borderStartColor: tone === 'warning' ? t.colors.warning : t.colors.info, borderRadius: t.radii.md, padding: t.spacing[3], marginBottom: t.spacing[3] }}>
      <Text size="sm">{text}</Text>
    </View>
  );
}
