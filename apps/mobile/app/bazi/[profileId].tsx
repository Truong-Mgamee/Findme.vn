/** S8 Bazi: four pillars, element bars (radar stand-in), luck timeline (大運) + annual luck. */
import React, { useMemo } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ELEMENTS_EN, ELEMENTS_VI } from '@findme/engine-core';
import { BaziPillars, Button, Card, LuckTimeline, Row, Text, useTheme } from '@findme/ui';
import { Banner, ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen, Section } from '../../src/components/Screen';
import { useBazi, useCreateReading } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { usePaywall } from '../../src/store/paywall';
import { selectLocale, useSession } from '../../src/store/session';

export default function BaziScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const locale = useSession(selectLocale);
  const q = useBazi(profileId);
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);
  const chart = q.data?.facts;
  const year = new Date().getFullYear();
  const currentPeriod = useMemo(() => chart?.luck.periods.find((p) => year >= p.startYear && year <= p.endYear)?.index ?? null, [chart, year]);
  const elementNames = locale === 'vi' ? ELEMENTS_VI : ELEMENTS_EN;

  const deep = async (payWith?: 'credit') => {
    if (!profileId) return;
    try {
      track({ name: 'reading_started', kind: 'bazi_luck', paid_by: payWith ?? 'subscription' });
      const r = await create.mutateAsync({ kind: 'bazi_luck', profileId, payWith });
      router.push(`/reading/${r.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'second_reading', body: e.paywall, retry: (pw) => void deep(pw) });
    }
  };

  return (
    <Screen title={tr('explore.bazi')} back>
      {q.isLoading ? <Loading label={tr('reading.computing')} /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {chart ? (
        <>
          {chart.resolved.moment.timeUnknown ? <Banner text={tr('bazi.timeUnknownWarning')} /> : null}
          <BaziPillars chart={chart} showHidden labels={{ year: tr('bazi.pillars.year'), month: tr('bazi.pillars.month'), day: tr('bazi.pillars.day'), hour: tr('bazi.pillars.hour'), hourUnknown: tr('bazi.hourUnknown'), dayMaster: tr('bazi.dayMaster'), hidden: tr('bazi.hidden'), nayin: tr('bazi.nayin'), stage: tr('bazi.stage') }} testID="bazi-pillars" />
          <Section title={tr('bazi.elements')}>
            <Card>
              {([0, 1, 2, 3, 4] as const).map((e) => {
                const score = chart.elementScores[e] ?? 0;
                const max = Math.max(1, ...Object.values(chart.elementScores));
                return (
                  <Row key={e} style={{ marginBottom: t.spacing[2], flexWrap: 'nowrap' }} accessibilityLabel={`${elementNames[e]} ${Math.round(score)}`}>
                    <Text size="sm" style={{ width: 64 }}>
                      {elementNames[e]}
                    </Text>
                    <View style={{ flex: 1, height: 10, backgroundColor: t.colors.surfaceAlt, borderRadius: 5, overflow: 'hidden' }}>
                      <View style={{ width: `${(score / max) * 100}%`, height: '100%', backgroundColor: t.colors.elements[e] }} />
                    </View>
                    <Text size="xs" color="muted" style={{ width: 36, textAlign: 'right' }}>
                      {Math.round(score)}
                    </Text>
                  </Row>
                );
              })}
              <Text size="xs" color="muted" style={{ marginTop: t.spacing[1] }}>
                {tr('bazi.useful')}: {chart.favorable.useful.map((e) => elementNames[e]).join(', ')} · {tr('bazi.unfavorable')}: {chart.favorable.unfavorable.map((e) => elementNames[e]).join(', ')}
              </Text>
              <Text size="xs" color="muted">
                {chart.favorable.rationale}
              </Text>
            </Card>
          </Section>
          <Section title={tr('bazi.luck')}>
            <LuckTimeline
              periods={chart.luck.periods.map((p) => ({ index: p.index, label: p.label, han: p.ganzhi.han, startAge: p.startAge, startYear: p.startYear, endYear: p.endYear, tenGodLabel: p.tenGodStem }))}
              currentIndex={currentPeriod}
              annual={chart.annual.map((a) => ({ year: a.year, age: a.age, label: a.label, han: a.ganzhi.han }))}
              currentYear={year}
              labels={{ age: tr('bazi.age'), current: tr('bazi.now'), decadal: tr('bazi.luckPeriods'), annual: tr('bazi.annual') }}
              testID="luck-timeline"
            />
            <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
              {tr('bazi.luckStart', { years: chart.luck.startAgeYears, months: chart.luck.startAgeMonths, direction: tr(`bazi.direction.${chart.luck.direction}`) })}
            </Text>
          </Section>
          <Button label={tr('reading.deepCta')} size="lg" loading={create.isPending} onPress={() => void deep()} style={{ marginTop: t.spacing[4] }} testID="bazi-deep" />
        </>
      ) : null}
    </Screen>
  );
}
