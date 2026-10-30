/** S12b Date Picker: task + window + profiles → POST /v1/almanac/pick (402 → paywall → retry with credit). */
import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { TaskKey } from '@findme/engine-almanac';
import { Badge, Button, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen, Section } from '../../src/components/Screen';
import { usePickDates, useProfiles, type RankedDayDto } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { addDaysISO, fmtDate, todayISO } from '../../src/lib/format';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

const TASKS: TaskKey[] = ['wedding', 'opening', 'moving', 'contract', 'travel', 'groundbreaking', 'haircut', 'pray', 'burial', 'study'];
const WINDOWS = [14, 30, 60, 90];

export default function PickScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ from?: string }>();
  const user = useSession((s) => s.user);
  const uiLocale = useSession((s) => s.uiLocale);
  const hasToken = useSession((s) => s.hasToken);
  const profiles = useProfiles(hasToken);
  const pick = usePickDates();
  const show = usePaywall((s) => s.show);
  const [task, setTask] = useState<TaskKey>('wedding');
  const [days, setDays] = useState(30);
  const [profileIds, setProfileIds] = useState<string[]>([]);
  const [result, setResult] = useState<RankedDayDto[] | null>(null);
  const [error, setError] = useState<unknown>(null);
  const from = params.from ?? todayISO(user?.tz);

  React.useEffect(() => {
    const self = profiles.data?.find((p) => p.isSelf);
    if (self && profileIds.length === 0) setProfileIds([self.id]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profiles.data]);

  const run = async (payWith?: 'credit') => {
    setError(null);
    try {
      track({ name: 'date_pick_run', task, range_days: days, profiles: profileIds.length });
      const r = await pick.mutateAsync({ task, from, to: addDaysISO(from, days), profileIds, std: user?.calendarStandard, limit: 10, payWith });
      setResult(r.ranked);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'pick', body: e.paywall, retry: (pw) => void run(pw) });
      else setError(e);
    }
  };

  return (
    <Screen title={tr('almanac.pick.title')} subtitle={tr('almanac.pick.hint')} back>
      <Section title={tr('almanac.pick.task')}>
        <Row accessibilityRole="radiogroup">
          {TASKS.map((k) => (
            <Chip key={k} label={tr(`almanac.tasks.${k}`)} tone={task === k ? 'selected' : 'neutral'} onPress={() => setTask(k)} testID={`task-${k}`} />
          ))}
        </Row>
      </Section>
      <Section title={tr('almanac.pick.window', { from: fmtDate(from, uiLocale, { day: 'numeric', month: 'short' }) })}>
        <Row accessibilityRole="radiogroup">
          {WINDOWS.map((d) => (
            <Chip key={d} label={tr('almanac.pick.days', { count: d })} tone={days === d ? 'selected' : 'neutral'} onPress={() => setDays(d)} />
          ))}
        </Row>
      </Section>
      <Section title={tr('almanac.pick.profiles')}>
        <Row>
          {profiles.data?.map((p) => {
            const on = profileIds.includes(p.id);
            return <Chip key={p.id} label={p.label} tone={on ? 'selected' : 'neutral'} onPress={() => setProfileIds((ids) => (on ? ids.filter((x) => x !== p.id) : [...ids, p.id].slice(-2)))} />;
          })}
          <Chip label={`+ ${tr('profiles.addPartner')}`} onPress={() => router.push('/profile/new')} />
        </Row>
      </Section>
      <Button label={tr('almanac.pick.run')} size="lg" loading={pick.isPending} onPress={() => void run()} style={{ marginTop: t.spacing[4] }} testID="pick-run" />
      <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[1] }}>
        {tr('almanac.pick.paidNote')}
      </Text>
      {error ? <ErrorState error={error} onRetry={() => void run()} /> : null}
      {result ? (
        <Section title={tr('almanac.pick.results', { count: result.length })}>
          {result.length === 0 ? (
            <Text size="sm" color="muted">
              {tr('almanac.pick.none')}
            </Text>
          ) : null}
          {result.map((d, i) => (
            <Card key={d.date} testID={`pick-result-${i}`} style={{ marginBottom: t.spacing[2] }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text size="md" weight="bold">
                    #{i + 1} · {fmtDate(d.date, uiLocale)}
                  </Text>
                  <Text size="sm" color="muted" han>
                    {tr('almanac.lunarDate', { day: d.lunar.day, month: d.lunar.month, leap: d.lunar.isLeapMonth ? 1 : 0 })} · {d.dayGanzhi.han}
                  </Text>
                </View>
                <Badge label={`${Math.round(d.score)}`} tone={d.huangdao ? 'primary' : 'muted'} />
              </Row>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: t.spacing[2] }}>
                {d.reasons.map((r) => (
                  <Chip key={r.key} label={tr(`almanac.reasons.${r.key}`, { defaultValue: r.key })} tone={r.weight >= 0 ? 'good' : 'bad'} />
                ))}
              </ScrollView>
              <Button label={tr('almanac.openDay')} variant="ghost" onPress={() => router.push({ pathname: '/almanac', params: { date: d.date } })} style={{ marginTop: t.spacing[2] }} />
            </Card>
          ))}
          <Text size="xs" color="muted">
            {tr('almanac.pick.exportSoon')}
          </Text>
        </Section>
      ) : null}
    </Screen>
  );
}
