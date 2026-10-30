/** Western natal chart (GET /v1/profiles/:id/astro): planets in signs/houses, aspects list. */
import React, { useState } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { Banner, ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen, Section } from '../../src/components/Screen';
import { useAstro } from '../../src/hooks/queries';

export default function AstroScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const [houses, setHouses] = useState<'placidus' | 'whole'>('placidus');
  const q = useAstro(profileId, houses);
  const c = q.data?.facts;
  const sign = (k: string) => tr(`astro.signs.${k}`);
  return (
    <Screen title={tr('explore.astro')} back>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {c ? (
        <>
          {c.warnings.some((w) => w.code === 'TIME_UNKNOWN') ? <Banner text={tr('astro.timeUnknownWarning')} /> : null}
          <Row>
            <Card style={{ flex: 1, marginEnd: t.spacing[2] }}>
              <Text size="xs" color="muted">
                {tr('astro.sun')}
              </Text>
              <Text size="lg" weight="bold">
                {sign(c.sun)}
              </Text>
            </Card>
            <Card style={{ flex: 1, marginEnd: t.spacing[2] }}>
              <Text size="xs" color="muted">
                {tr('astro.moon')}
              </Text>
              <Text size="lg" weight="bold">
                {sign(c.moon)}
              </Text>
            </Card>
            <Card style={{ flex: 1 }}>
              <Text size="xs" color="muted">
                {tr('astro.rising')}
              </Text>
              <Text size="lg" weight="bold">
                {sign(c.rising)}
              </Text>
            </Card>
          </Row>
          <Row style={{ marginTop: t.spacing[3] }}>
            <Chip label={tr('astro.houses.placidus')} tone={houses === 'placidus' ? 'selected' : 'neutral'} onPress={() => setHouses('placidus')} />
            <Chip label={tr('astro.houses.whole')} tone={houses === 'whole' ? 'selected' : 'neutral'} onPress={() => setHouses('whole')} />
          </Row>
          <Section title={tr('astro.planets')}>
            <Card padded={false}>
              {c.planets.map((p) => (
                <Row key={p.body} style={{ justifyContent: 'space-between', paddingHorizontal: t.spacing[4], minHeight: 44, borderBottomWidth: 1, borderBottomColor: t.colors.border }} accessibilityLabel={`${tr(`astro.bodies.${p.body}`)} ${sign(p.sign)} ${p.degree}° ${tr('astro.house', { n: p.house })}`}>
                  <Text size="md">{tr(`astro.bodies.${p.body}`)}</Text>
                  <Row>
                    <Text size="md" weight="semibold" style={{ marginEnd: t.spacing[2] }}>
                      {sign(p.sign)} {p.degree}°{String(p.minute).padStart(2, '0')}′
                    </Text>
                    <Badge label={tr('astro.house', { n: p.house })} tone="muted" />
                    {p.retrograde ? <Badge label="℞" tone="warning" style={{ marginStart: t.spacing[1] }} /> : null}
                  </Row>
                </Row>
              ))}
            </Card>
          </Section>
          <Section title={tr('astro.aspects')}>
            <Row>
              {c.aspects.slice(0, 12).map((a) => (
                <Chip key={`${a.a}-${a.type}-${a.b}`} label={`${tr(`astro.bodies.${a.a}`)} ${tr(`astro.aspectTypes.${a.type}`)} ${tr(`astro.bodies.${a.b}`)} (${a.orb.toFixed(1)}°)`} />
              ))}
            </Row>
          </Section>
        </>
      ) : null}
    </Screen>
  );
}
