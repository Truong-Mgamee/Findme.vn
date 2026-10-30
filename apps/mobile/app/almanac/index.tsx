/**
 * S12 Almanac: month grid (lunar day under each solar day, 黄道 dots) computed on device with
 * @findme/engine-almanac, day detail from GET /v1/almanac (falls back to the local engine offline).
 */
import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { getDayAlmanac, personalizeAlmanac, type DayAlmanac } from '@findme/engine-almanac';
import { AlmanacDayCard, Button, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { Banner } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { useAlmanacDay, useProfile } from '../../src/hooks/queries';
import { almanacLabels, fmtDate, todayISO } from '../../src/lib/format';
import { selectLocale, useSession } from '../../src/store/session';

const pad = (n: number) => String(n).padStart(2, '0');

export default function AlmanacScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string }>();
  const locale = useSession(selectLocale);
  const uiLocale = useSession((s) => s.uiLocale);
  const user = useSession((s) => s.user);
  const selfProfileId = useSession((s) => s.selfProfileId);
  const std = user?.calendarStandard ?? (locale === 'vi' ? 'vn' : 'cn');
  const today = todayISO(user?.tz);
  const [selected, setSelected] = useState(params.date ?? today);
  const [cursor, setCursor] = useState(() => ({ y: Number(selected.slice(0, 4)), m: Number(selected.slice(5, 7)) }));
  const profile = useProfile(selfProfileId);
  const q = useAlmanacDay(selected, std, locale, useSession.getState().hasToken);
  const labels = useMemo(() => almanacLabels(tr), [tr]);

  const month = useMemo(() => {
    const first = new Date(cursor.y, cursor.m - 1, 1);
    const days = new Date(cursor.y, cursor.m, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // Monday first
    const cells: Array<{ date: string; day: number; lunarDay: number; lunarMonth: number; huangdao: boolean; leap: boolean } | null> = Array(lead).fill(null);
    for (let d = 1; d <= days; d++) {
      const iso = `${cursor.y}-${pad(cursor.m)}-${pad(d)}`;
      try {
        const a = getDayAlmanac(iso, std, locale);
        cells.push({ date: iso, day: d, lunarDay: a.lunar.day, lunarMonth: a.lunar.month, huangdao: a.huangdao, leap: a.lunar.isLeapMonth });
      } catch {
        cells.push({ date: iso, day: d, lunarDay: 0, lunarMonth: 0, huangdao: false, leap: false });
      }
    }
    return cells;
  }, [cursor, std, locale]);

  const localDay: DayAlmanac | null = useMemo(() => {
    try {
      const base = getDayAlmanac(selected, std, locale);
      const ea = profile.data?.core.eastAsia;
      return ea ? personalizeAlmanac(base, { yearBranch: ea.yearBranch, yearStem: ea.yearStem, usefulElements: ea.bazi.useful, dayMasterElement: ea.bazi.dayMaster.element }) : base;
    } catch {
      return null;
    }
  }, [selected, std, locale, profile.data]);
  const day = localDay ?? q.data ?? null;

  const shift = (d: number) => {
    const m = cursor.m + d;
    setCursor({ y: cursor.y + Math.floor((m - 1) / 12), m: ((m - 1 + 12) % 12) + 1 });
  };
  const monthLabel = fmtDate(`${cursor.y}-${pad(cursor.m)}-01`, uiLocale, { month: 'long', year: 'numeric' });
  const weekdays = tr('almanac.weekdays').split(',');

  return (
    <Screen title={tr('explore.almanac')} back right={<Chip label={tr(`almanac.standard.${std}`)} />}>
      <Card padded={false} style={{ padding: t.spacing[2] }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: t.spacing[2] }}>
          <Button label={t.isRTL ? '›' : '‹'} variant="ghost" accessibilityLabel={tr('common.prev')} onPress={() => shift(-1)} />
          <Text size="lg" weight="bold" accessibilityRole="header">
            {monthLabel}
          </Text>
          <Button label={t.isRTL ? '‹' : '›'} variant="ghost" accessibilityLabel={tr('common.next')} onPress={() => shift(1)} />
        </Row>
        <View style={{ flexDirection: 'row' }}>
          {weekdays.map((w) => (
            <Text key={w} size="xs" color="muted" align="center" style={{ width: `${100 / 7}%` }}>
              {w}
            </Text>
          ))}
        </View>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {month.map((c, i) =>
            c ? (
              <Pressable key={c.date} onPress={() => setSelected(c.date)} accessibilityRole="button" accessibilityState={{ selected: c.date === selected }} accessibilityLabel={`${fmtDate(c.date, uiLocale)} ${tr('almanac.lunarDate', { day: c.lunarDay, month: c.lunarMonth, leap: c.leap ? 1 : 0 })}${c.huangdao ? `, ${tr('almanac.huangdao')}` : ''}`} testID={`day-${c.date}`} style={{ width: `${100 / 7}%`, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: t.radii.sm, backgroundColor: c.date === selected ? t.colors.primary : c.date === today ? t.colors.surfaceAlt : 'transparent' }}>
                <Text size="sm" weight={c.date === today ? 'bold' : 'regular'} style={{ color: c.date === selected ? t.colors.onPrimary : t.colors.text }}>
                  {c.day}
                </Text>
                <Text size="xs" style={{ color: c.date === selected ? t.colors.onPrimary : c.lunarDay === 1 ? t.colors.accent : t.colors.textMuted, fontSize: 10 * t.fontScale }}>
                  {c.lunarDay === 1 ? `${c.lunarMonth}/1` : c.lunarDay}
                </Text>
                {c.huangdao ? <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c.date === selected ? t.colors.onPrimary : t.colors.huangdao, marginTop: 1 }} /> : null}
              </Pressable>
            ) : (
              <View key={`e${i}`} style={{ width: `${100 / 7}%`, minHeight: 48 }} />
            ),
          )}
        </View>
      </Card>
      <View style={{ marginTop: t.spacing[3] }}>
        {!profile.data && selfProfileId ? <Banner text={tr('almanac.notPersonalized')} tone="info" /> : null}
        {day ? <AlmanacDayCard almanac={day} dateLabel={fmtDate(selected, uiLocale)} labels={labels} testID="almanac-day" /> : null}
      </View>
      <Button label={tr('almanac.pick.title')} variant="secondary" onPress={() => router.push({ pathname: '/almanac/pick', params: { from: selected } })} style={{ marginTop: t.spacing[3] }} testID="almanac-pick-cta" />
      <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
        {tr('almanac.engineNote')}
      </Text>
    </Screen>
  );
}
