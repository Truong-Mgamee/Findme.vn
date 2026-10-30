/** S10 Numerology: core numbers as tiles + personal year/month/day + pinnacles/challenges. */
import React from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, NumerologyGrid, Row, Text, useTheme } from '@findme/ui';
import { Banner, ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen, Section } from '../../src/components/Screen';
import { useCreateReading, useNumerology } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { usePaywall } from '../../src/store/paywall';

export default function NumerologyScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const q = useNumerology(profileId);
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);
  const r = q.data?.facts;

  const deep = async (payWith?: 'credit') => {
    if (!profileId) return;
    try {
      track({ name: 'reading_started', kind: 'numerology_full', paid_by: payWith ?? 'subscription' });
      const rd = await create.mutateAsync({ kind: 'numerology_full', profileId, payWith });
      router.push(`/reading/${rd.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'second_reading', body: e.paywall, retry: (pw) => void deep(pw) });
    }
  };

  return (
    <Screen title={tr('explore.numerology')} back>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {r ? (
        <>
          {!r.nameSupported ? <Banner text={tr('numerology.nameMissing')} tone="info" /> : null}
          <NumerologyGrid
            numbers={{ lifePath: r.lifePath.value, expression: r.expression?.value ?? null, soulUrge: r.soulUrge?.value ?? null, personality: r.personality?.value ?? null, birthday: r.birthday.value, maturity: r.maturity?.value ?? null, personalYear: r.personalYear.value, personalMonth: r.personalMonth.value, personalDay: r.personalDay.value }}
            masters={r.masters}
            labels={{ lifePath: tr('numerology.lifePath'), expression: tr('numerology.expression'), soulUrge: tr('numerology.soulUrge'), personality: tr('numerology.personality'), birthday: tr('numerology.birthday'), maturity: tr('numerology.maturity'), personalYear: tr('numerology.personalYear'), personalMonth: tr('numerology.personalMonth'), personalDay: tr('numerology.personalDay') }}
            masterLabel={tr('numerology.master')}
            unavailableLabel={tr('numerology.needsName')}
            testID="numerology-grid"
          />
          {r.karmicDebt.length ? (
            <Card style={{ marginTop: t.spacing[3] }}>
              <Text size="sm" weight="semibold">
                {tr('numerology.karmicDebt')}
              </Text>
              <Text size="sm" color="muted">
                {r.karmicDebt.map((k) => `${k.number} (${tr(`numerology.${k.source}`)})`).join(' · ')}
              </Text>
            </Card>
          ) : null}
          <Section title={tr('numerology.pinnacles')}>
            <Row>
              {r.pinnacles.map((p) => (
                <Card key={p.index} style={{ width: '48%', marginEnd: '2%', marginBottom: t.spacing[2] }}>
                  <Text size="xs" color="muted">
                    {tr('numerology.ages', { from: p.ages.from, to: p.ages.to ?? '…' })}
                  </Text>
                  <Text size="xl" weight="bold">
                    {p.value}
                  </Text>
                  <Text size="xs" color="muted">
                    {tr('numerology.challenge')}: {r.challenges[p.index - 1]?.value}
                  </Text>
                </Card>
              ))}
            </Row>
          </Section>
          <Button label={tr('reading.deepCta')} size="lg" loading={create.isPending} onPress={() => void deep()} style={{ marginTop: t.spacing[4] }} testID="numerology-deep" />
        </>
      ) : null}
    </Screen>
  );
}
