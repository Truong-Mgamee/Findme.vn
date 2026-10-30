/** S2 "This is you": 3 LLM-free insight cards from core_json.insights (<300ms, no network beyond the profile). */
import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Text, useTheme } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen } from '../../src/components/Screen';
import { useProfile } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { useSession } from '../../src/store/session';

export default function InsightsScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ profileId?: string }>();
  const selfProfileId = useSession((s) => s.selfProfileId);
  const setStep = useSession((s) => s.setOnboardingStep);
  const profileId = params.profileId ?? selfProfileId ?? undefined;
  const q = useProfile(profileId);

  useEffect(() => {
    setStep('insights');
    track({ name: 'onboarding_step', step: 'insights', index: 3 });
  }, [setStep]);

  const next = () => {
    setStep('daily_time');
    router.push('/(onboarding)/daily-time');
  };

  return (
    <Screen title={tr('onboarding.insights.title')} subtitle={tr('onboarding.insights.subtitle')}>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data ? (
        <>
          {q.data.birthSummary.timeUnknown ? (
            <Badge label={tr('onboarding.birth.timeUnknownHint')} tone="warning" style={{ marginBottom: t.spacing[3] }} />
          ) : null}
          {q.data.insights.map((i, idx) => (
            <Card key={i.key} testID={`insight-${idx}`} style={{ marginBottom: t.spacing[3] }}>
              <Text size="xs" color="accent" weight="semibold" style={{ marginBottom: t.spacing[1], letterSpacing: 1 }}>
                {String(idx + 1).padStart(2, '0')}
              </Text>
              <Text size="lg" weight="bold">
                {i.title}
              </Text>
              {i.body ? (
                <Text size="md" color="muted" style={{ marginTop: t.spacing[1] }}>
                  {i.body}
                </Text>
              ) : null}
            </Card>
          ))}
          <Text size="xs" color="muted" style={{ marginBottom: t.spacing[3] }}>
            {tr('onboarding.insights.engineNote')}
          </Text>
        </>
      ) : null}
      <Button label={tr('common.continue')} size="lg" onPress={next} testID="insights-continue" />
    </Screen>
  );
}
