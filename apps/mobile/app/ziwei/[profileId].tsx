/** S7 Zi Wei chart: SVG 12 palaces, tap → palace sheet, decadal/yearly/monthly toggle, school selector, time-unknown warning. */
import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, View, useWindowDimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { PalaceView, ZiweiSchool } from '@findme/engine-ziwei';
import { Badge, Button, Card, Chip, Row, Text, useTheme, ZiweiChartSVG } from '@findme/ui';
import { Banner, ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen } from '../../src/components/Screen';
import { useCreateReading, useZiwei } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { todayISO, ziweiLabels } from '../../src/lib/format';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

const SCHOOLS: ZiweiSchool[] = ['default', 'zhongzhou', 'quanshu', 'khamThienTuHoa'];

export default function ZiweiScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { profileId } = useLocalSearchParams<{ profileId: string }>();
  const tz = useSession((s) => s.user?.tz);
  const [school, setSchool] = useState<ZiweiSchool>('default');
  const [overlay, setOverlay] = useState<'none' | 'horoscope'>('horoscope');
  const [palace, setPalace] = useState<PalaceView | null>(null);
  const q = useZiwei(profileId, school, todayISO(tz));
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);
  const labels = useMemo(() => ziweiLabels(tr), [tr]);

  const deepReading = async (payWith?: 'credit') => {
    if (!profileId) return;
    try {
      track({ name: 'reading_started', kind: 'ziwei_full', paid_by: payWith ?? 'subscription' });
      const r = await create.mutateAsync({ kind: 'ziwei_full', profileId, params: { school }, payWith });
      router.push(`/reading/${r.id}`);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'second_reading', body: e.paywall, retry: (pw) => void deepReading(pw) });
    }
  };

  const chart = q.data?.chart;
  return (
    <Screen title={tr('explore.ziwei')} back subtitle={chart ? `${chart.lunarDateLabel} · ${chart.fiveElementsClass.name}` : undefined}>
      {q.isLoading ? <Loading label={tr('reading.computing')} /> : null}
      {q.error ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {chart ? (
        <>
          {chart.confidence === 'low' ? <Banner text={tr('ziwei.timeUnknownWarning')} /> : null}
          {!chart.schoolVerified ? <Banner text={tr('ziwei.schoolUnverified')} tone="info" /> : null}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: t.spacing[2] }}>
            {SCHOOLS.map((s) => (
              <Chip key={s} label={tr(`ziwei.schools.${s}`)} tone={school === s ? 'selected' : 'neutral'} onPress={() => setSchool(s)} testID={`school-${s}`} />
            ))}
          </ScrollView>
          <Row style={{ marginBottom: t.spacing[2] }}>
            <Chip label={tr('ziwei.overlay.none')} tone={overlay === 'none' ? 'selected' : 'neutral'} onPress={() => setOverlay('none')} />
            <Chip label={tr('ziwei.overlay.horoscope')} tone={overlay === 'horoscope' ? 'selected' : 'neutral'} onPress={() => setOverlay('horoscope')} testID="overlay-horoscope" />
          </Row>
          <View style={{ alignItems: 'center' }}>
            <ZiweiChartSVG chart={chart} horoscope={overlay === 'horoscope' ? q.data!.horoscope : null} size={Math.min(width - 32, 480)} onPressPalace={setPalace} highlight={palace?.key} labels={labels} testID="ziwei-chart" />
          </View>
          {q.data?.horoscope ? (
            <Card style={{ marginTop: t.spacing[3] }}>
              <Text size="sm" color="muted">
                {tr('ziwei.horoscopeFor', { date: q.data.horoscope.date })}
              </Text>
              <Text size="md" han>
                {tr('ziwei.decadal')}: {q.data.horoscope.decadal.name} ({q.data.horoscope.decadal.stem}{q.data.horoscope.decadal.branch}) · {tr('ziwei.yearly')}: {q.data.horoscope.yearly.name} · {tr('ziwei.monthly')}: {q.data.horoscope.monthly.name}
              </Text>
              {q.data.horoscope.yearly.mutagen.length ? (
                <Text size="xs" color="muted" han>
                  {tr('ziwei.yearlyMutagen')}: {q.data.horoscope.yearly.mutagen.map((m) => m.name).join(' · ')}
                </Text>
              ) : null}
            </Card>
          ) : null}
          {chart.patterns.length ? (
            <Row style={{ marginTop: t.spacing[3] }}>
              {chart.patterns.map((p) => (
                <Badge key={p.key} label={`${tr('ziwei.pattern')}: ${p.key}`} tone="accent" style={{ marginEnd: t.spacing[2], marginBottom: t.spacing[1] }} />
              ))}
            </Row>
          ) : null}
          <Button label={tr('reading.deepCta')} size="lg" loading={create.isPending} onPress={() => void deepReading()} style={{ marginTop: t.spacing[4] }} testID="ziwei-deep" />
          <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[2] }}>
            {tr('reading.deepNote')}
          </Text>
        </>
      ) : null}
      <Modal visible={!!palace} transparent animationType={t.reduceMotion ? 'none' : 'slide'} onRequestClose={() => setPalace(null)}>
        <Pressable style={{ flex: 1, backgroundColor: t.colors.overlay }} onPress={() => setPalace(null)} accessibilityLabel={tr('common.close')} />
        {palace ? (
          <View style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: t.radii.xl, borderTopRightRadius: t.radii.xl, padding: t.spacing[4], maxHeight: '70%' }} testID="palace-sheet">
            <Row style={{ justifyContent: 'space-between' }}>
              <Text size="xl" weight="bold" han>
                {palace.name} · {palace.stem.han}{palace.branch.han}
              </Text>
              {palace.isBodyPalace ? <Badge label={tr('ziwei.bodyPalace')} tone="accent" /> : null}
            </Row>
            <Text size="xs" color="muted">
              {tr('ziwei.ages')}: {palace.decadal.range[0]}–{palace.decadal.range[1]} · {palace.changsheng12}
            </Text>
            <ScrollView style={{ marginTop: t.spacing[3] }}>
              {[...palace.majorStars, ...palace.minorStars, ...palace.adjectiveStars].map((s) => (
                <Row key={s.key} style={{ justifyContent: 'space-between', minHeight: 36 }}>
                  <Text size="md" han weight={palace.majorStars.includes(s) ? 'bold' : 'regular'}>
                    {s.name}
                  </Text>
                  <Row>
                    {s.brightness ? <Badge label={s.brightness.name} tone="muted" style={{ marginEnd: t.spacing[1] }} /> : null}
                    {s.mutagen ? <Badge label={s.mutagen.name} tone="primary" /> : null}
                  </Row>
                </Row>
              ))}
              {palace.majorStars.length === 0 ? (
                <Text size="sm" color="muted">
                  {tr('ziwei.emptyPalace')}
                </Text>
              ) : null}
            </ScrollView>
            <Button label={tr('common.close')} variant="secondary" onPress={() => setPalace(null)} style={{ marginTop: t.spacing[3] }} />
          </View>
        ) : null}
      </Modal>
    </Screen>
  );
}
