/** Reading detail: GET /v1/readings/:id + re-stream (sections appear once the composer lands). */
import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { BaziChart } from '@findme/engine-bazi';
import type { NumerologyResult } from '@findme/engine-numerology';
import type { ZiweiChart, ZiweiHoroscope } from '@findme/engine-ziwei';
import { BaziPillars, Button, NumerologyGrid, Text, useTheme, ZiweiChartSVG } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { ReadingView } from '../../src/components/ReadingView';
import { Loading, Screen } from '../../src/components/Screen';
import { useReading } from '../../src/hooks/queries';
import { useReadingStream } from '../../src/hooks/useReadingStream';
import { track } from '../../src/lib/analytics';
import { ziweiLabels } from '../../src/lib/format';

export default function ReadingScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const q = useReading(id);
  const stream = useReadingStream(q.data ? q.data.id : null, { kind: q.data?.kind });
  const zLabels = useMemo(() => ziweiLabels(tr), [tr]);
  const facts = q.data?.engine?.facts as Record<string, unknown> | undefined;

  return (
    <Screen title={q.data ? tr(`reading.kinds.${q.data.kind}`) : tr('reading.title')} back>
      {q.isLoading ? <Loading /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {q.data && facts ? (
        <View style={{ alignItems: 'center', marginBottom: t.spacing[4] }}>
          {q.data.kind === 'ziwei_full' && (facts as { chart?: ZiweiChart }).chart ? <ZiweiChartSVG chart={(facts as { chart: ZiweiChart }).chart} horoscope={(facts as { horoscope?: ZiweiHoroscope }).horoscope ?? null} size={Math.min(width - 32, 420)} labels={zLabels} /> : null}
          {q.data.kind === 'bazi_luck' && (facts as BaziChart).pillars ? <BaziPillars chart={facts as unknown as BaziChart} /> : null}
          {q.data.kind === 'numerology_full' && (facts as NumerologyResult).lifePath ? (
            <NumerologyGrid numbers={{ lifePath: (facts as NumerologyResult).lifePath.value, expression: (facts as NumerologyResult).expression?.value ?? null, soulUrge: (facts as NumerologyResult).soulUrge?.value ?? null, personality: (facts as NumerologyResult).personality?.value ?? null, birthday: (facts as NumerologyResult).birthday.value, personalYear: (facts as NumerologyResult).personalYear.value, personalDay: (facts as NumerologyResult).personalDay.value }} masters={(facts as NumerologyResult).masters} />
          ) : null}
          {q.data.kind === 'compatibility' ? (
            <Text size="3xl" weight="bold" color="primary">
              {String((facts.numerology as { score?: number } | undefined)?.score ?? '')}
            </Text>
          ) : null}
        </View>
      ) : null}
      {q.data ? <ReadingView stream={stream} kindLabel={tr(`reading.kinds.${q.data.kind}`)} /> : null}
      {q.data ? (
        <View style={{ flexDirection: 'row', marginTop: t.spacing[4] }}>
          <Button label={tr('reading.askAbout')} onPress={() => router.push({ pathname: '/(tabs)/ask', params: { readingId: q.data!.id } })} style={{ marginEnd: t.spacing[2] }} />
          <Button label="👍" variant="ghost" accessibilityLabel={tr('reading.rateUp')} onPress={() => track({ name: 'reading_rated', kind: q.data!.kind, score: 1 })} style={{ marginEnd: t.spacing[2] }} />
          <Button label="👎" variant="ghost" accessibilityLabel={tr('reading.rateDown')} onPress={() => track({ name: 'reading_rated', kind: q.data!.kind, score: -1 })} />
        </View>
      ) : null}
    </Screen>
  );
}
