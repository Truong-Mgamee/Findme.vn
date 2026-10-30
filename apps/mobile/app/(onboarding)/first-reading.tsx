/**
 * S4: first deep reading (free). POST /v1/readings (ziwei_full for eastAsia/both, numerology_full for western),
 * render the chart immediately from `engine.facts`, then stream /readings/:id/stream.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { NumerologyResult } from '@findme/engine-numerology';
import type { ZiweiChart, ZiweiHoroscope } from '@findme/engine-ziwei';
import { Button, NumerologyGrid, Text, useTheme, ZiweiChartSVG } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { ReadingView } from '../../src/components/ReadingView';
import { Loading, Screen } from '../../src/components/Screen';
import { useCreateReading, type Reading, type ReadingKind } from '../../src/hooks/queries';
import { useReadingStream } from '../../src/hooks/useReadingStream';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { ziweiLabels } from '../../src/lib/format';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

export default function FirstReadingScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const pack = useSession((s) => s.user?.traditionPack ?? 'both');
  const selfProfileId = useSession((s) => s.selfProfileId);
  const firstReadingId = useSession((s) => s.firstReadingId);
  const setFirstReadingId = useSession((s) => s.setFirstReadingId);
  const setStep = useSession((s) => s.setOnboardingStep);
  const startedAt = useSession((s) => s.onboardingStartedAt);
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);
  const [reading, setReading] = useState<Reading | null>(null);
  const [error, setError] = useState<unknown>(null);
  const kind: ReadingKind = pack === 'western' ? 'numerology_full' : 'ziwei_full';
  const started = useRef(false);

  useEffect(() => {
    setStep('first_reading');
    track({ name: 'onboarding_step', step: 'first_reading', index: 5 });
  }, [setStep]);

  const run = async (payWith?: 'credit') => {
    if (!selfProfileId) return;
    setError(null);
    try {
      track({ name: 'reading_started', kind, paid_by: payWith ?? 'free_first' });
      const r = await create.mutateAsync({ kind, profileId: selfProfileId, payWith });
      setReading(r);
      setFirstReadingId(r.id);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'second_reading', body: e.paywall, retry: (pw) => void run(pw) });
      else setError(e);
    }
  };

  useEffect(() => {
    if (started.current || !selfProfileId) return;
    started.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfProfileId]);

  const stream = useReadingStream(reading?.id ?? null, { kind, isFirst: true });
  const facts = reading?.engine?.facts as { chart?: ZiweiChart; horoscope?: ZiweiHoroscope } | NumerologyResult | undefined;
  const zLabels = useMemo(() => ziweiLabels(tr), [tr]);

  const finish = () => {
    track({ name: 'onboarding_completed', duration_ms: startedAt ? Date.now() - startedAt : 0, time_unknown: false });
    setStep('done');
    router.replace('/(tabs)/today');
  };

  return (
    <Screen title={tr('onboarding.firstReading.title')} subtitle={tr('onboarding.firstReading.subtitle')}>
      {!selfProfileId ? <ErrorState message={tr('errors.noProfile')} onRetry={() => router.replace('/(onboarding)/birth')} /> : null}
      {create.isPending ? <Loading label={tr('reading.computing')} /> : null}
      {error ? <ErrorState error={error} onRetry={() => void run()} /> : null}
      {reading && facts ? (
        <View style={{ alignItems: 'center', marginBottom: t.spacing[4] }}>
          {kind === 'ziwei_full' && 'chart' in facts && facts.chart ? (
            <ZiweiChartSVG chart={facts.chart} horoscope={facts.horoscope ?? null} size={Math.min(width - 32, 420)} labels={zLabels} testID="first-reading-chart" />
          ) : null}
          {kind === 'numerology_full' && 'lifePath' in facts ? (
            <NumerologyGrid
              numbers={{ lifePath: facts.lifePath.value, expression: facts.expression?.value ?? null, soulUrge: facts.soulUrge?.value ?? null, personality: facts.personality?.value ?? null, birthday: facts.birthday.value, maturity: facts.maturity?.value ?? null, personalYear: facts.personalYear.value, personalMonth: facts.personalMonth.value, personalDay: facts.personalDay.value }}
              masters={facts.masters}
              labels={{ lifePath: tr('numerology.lifePath'), expression: tr('numerology.expression'), soulUrge: tr('numerology.soulUrge'), personality: tr('numerology.personality'), birthday: tr('numerology.birthday'), maturity: tr('numerology.maturity'), personalYear: tr('numerology.personalYear'), personalMonth: tr('numerology.personalMonth'), personalDay: tr('numerology.personalDay') }}
              masterLabel={tr('numerology.master')}
              unavailableLabel={tr('numerology.needsName')}
              testID="first-reading-numbers"
            />
          ) : null}
        </View>
      ) : null}
      {reading ? <ReadingView stream={stream} kindLabel={tr(`reading.kinds.${kind}`)} /> : null}
      {reading && (stream.status === 'done' || stream.status === 'error') ? (
        <View style={{ marginTop: t.spacing[4] }}>
          <Button label={tr('onboarding.firstReading.goToday')} size="lg" onPress={finish} testID="first-reading-done" />
          <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[2] }}>
            {tr('onboarding.firstReading.accountLater')}
          </Text>
        </View>
      ) : null}
      {!reading && !create.isPending && firstReadingId ? <Button label={tr('common.continue')} variant="secondary" onPress={finish} style={{ marginTop: t.spacing[4] }} /> : null}
    </Screen>
  );
}
