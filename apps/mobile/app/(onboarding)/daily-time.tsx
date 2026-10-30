/** S3: daily hour + pre-permission push prompt. PUT /v1/me {dailyHour, pushEnabled}. */
import React, { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Chip, Text, useTheme } from '@findme/ui';
import { Screen } from '../../src/components/Screen';
import { useUpdateMe } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { fmtHour } from '../../src/lib/format';
import { requestPushPermission, scheduleDailyPlaceholder } from '../../src/lib/notifications';
import { useSession } from '../../src/store/session';

const HOURS = [6, 7, 8, 9, 12, 18, 20, 21];

export default function DailyTimeScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const uiLocale = useSession((s) => s.uiLocale);
  const user = useSession((s) => s.user);
  const setStep = useSession((s) => s.setOnboardingStep);
  const updateMe = useUpdateMe();
  const [hour, setHour] = useState(user?.dailyHour ?? 8);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setStep('daily_time');
    track({ name: 'onboarding_step', step: 'daily_time', index: 4 });
  }, [setStep]);

  const finish = async (withPush: boolean) => {
    setBusy(true);
    let granted = false;
    if (withPush) {
      granted = await requestPushPermission();
      track({ name: 'push_permission', granted });
      if (granted) await scheduleDailyPlaceholder(hour, tr('today.pushTitle'), tr('today.pushBody'));
    }
    updateMe.mutate({ dailyHour: hour, pushEnabled: granted });
    track({ name: 'settings_changed', key: 'daily_hour' });
    setBusy(false);
    setStep('first_reading');
    router.push('/(onboarding)/first-reading');
  };

  return (
    <Screen title={tr('onboarding.dailyTime.title')} subtitle={tr('onboarding.dailyTime.subtitle')} back>
      <Card>
        <Text size="sm" color="muted" style={{ marginBottom: t.spacing[2] }}>
          {tr('onboarding.dailyTime.pickHour')}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityRole="radiogroup">
          {HOURS.map((h) => (
            <Chip key={h} label={fmtHour(h, uiLocale)} tone={h === hour ? 'selected' : 'neutral'} onPress={() => setHour(h)} testID={`hour-${h}`} />
          ))}
        </ScrollView>
      </Card>
      <Card style={{ marginTop: t.spacing[3] }}>
        <Text size="lg" weight="bold">
          {tr('onboarding.dailyTime.enablePush')}
        </Text>
        <Text size="sm" color="muted" style={{ marginTop: t.spacing[1] }}>
          {tr('onboarding.dailyTime.pushExplainer', { hour: fmtHour(hour, uiLocale) })}
        </Text>
        <View style={{ marginTop: t.spacing[3] }}>
          <Button label={tr('onboarding.dailyTime.allow')} size="lg" loading={busy} onPress={() => void finish(true)} testID="push-allow" />
          <Button label={tr('onboarding.dailyTime.notNow')} variant="ghost" disabled={busy} onPress={() => void finish(false)} testID="push-skip" style={{ marginTop: t.spacing[2] }} />
        </View>
      </Card>
    </Screen>
  );
}
