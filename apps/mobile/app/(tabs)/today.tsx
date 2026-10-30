/**
 * S5 Today: OracleCard from GET /v1/today (cached 24h); when the request fails, compute locally with
 * the engines from the securely cached birth input and show an offline banner. Share → ShareCard
 * captured with react-native-view-shot; Ask → Ask tab.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Platform, Share, View, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { isPersonalized, OracleCard, ShareCard, Text, useTheme, type DailyPayload } from '@findme/ui';
import { Banner, ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen } from '../../src/components/Screen';
import { useTodayQuery } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { cardImageUri } from '../../src/lib/env';
import { fmtDate, oracleLabels, todayISO } from '../../src/lib/format';
import { cachedToday, cacheToday, computeOfflineToday, loadSelfBirth, tarotForToday } from '../../src/lib/offline-today';
import { selectLocale, useSession } from '../../src/store/session';

export default function TodayScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const user = useSession((s) => s.user);
  const locale = useSession(selectLocale);
  const uiLocale = useSession((s) => s.uiLocale);
  const hasToken = useSession((s) => s.hasToken);
  const setLastTodayDate = useSession((s) => s.setLastTodayDate);
  const tz = user?.tz;
  const date = todayISO(tz);
  const q = useTodayQuery(date, locale, hasToken);
  const [offline, setOffline] = useState<DailyPayload | null>(null);
  const [sharing, setSharing] = useState(false);
  const shareRef = useRef<View>(null);

  // Offline / failure path: cached payload → local engines.
  useEffect(() => {
    if (!q.isError && !(q.fetchStatus === 'idle' && !q.data && !hasToken)) return;
    const cached = cachedToday(date, locale);
    if (cached) return setOffline(cached);
    void loadSelfBirth().then((birth) => {
      try {
        setOffline(computeOfflineToday({ date, tz: tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone, locale, traditionPack: user?.traditionPack ?? 'both', calendarStandard: user?.calendarStandard ?? 'cn', birth }));
      } catch {
        setOffline(null);
      }
    });
  }, [q.isError, q.fetchStatus, q.data, hasToken, date, locale, tz, user?.traditionPack, user?.calendarStandard]);

  // Decorate the API payload with the on-device card of the day (western/both) and cache it.
  const payload = useMemo<DailyPayload | null>(() => {
    const base = q.data ?? offline;
    if (!base) return null;
    if (base.western && !base.tarot) {
      const seg = base.segments.find((s) => s.startsWith('w:lp:')) ?? 'w:common';
      const { draw, keywords } = tarotForToday(base.date, seg);
      base.tarot = { card: { id: draw.card.id, name: draw.card.name_en, reversed: draw.reversed, position: { key: 'card', label: tr('today.cardOfDay') } }, keywords };
    }
    if (base.tarot) base.tarot.card.position.label = tr('today.cardOfDay');
    return base;
  }, [q.data, offline, tr]);

  useEffect(() => {
    if (!q.data) return;
    cacheToday(q.data);
    const almanac = q.data.eastAsia?.almanac;
    track({ name: 'daily_oracle_viewed', streak: q.data.streak.current, segment_key: q.data.segments.join(','), from_cache: false, clash_day: !!(almanac && isPersonalized(almanac) && almanac.personal.clashesWithUser) });
    setLastTodayDate(q.data.date);
  }, [q.data, setLastTodayDate]);

  const labels = useMemo(() => oracleLabels(tr), [tr]);
  const dateLabel = fmtDate(date, uiLocale);

  const onShare = async () => {
    track({ name: 'share_clicked', type: 'today' });
    setSharing(true);
    try {
      let message = `${tr('today.shareText', { date: dateLabel })}`;
      if (Platform.OS !== 'web' && shareRef.current) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const { captureRef } = require('react-native-view-shot') as { captureRef: (ref: unknown, o: Record<string, unknown>) => Promise<string> };
          const uri = await captureRef(shareRef, { format: 'png', quality: 0.95, result: 'tmpfile' });
          await Share.share({ url: uri, message });
          track({ name: 'share_completed', type: 'today' });
          return;
        } catch {
          /* fall back to text */
        }
      }
      await Share.share({ message });
      track({ name: 'share_completed', type: 'today' });
    } finally {
      setSharing(false);
    }
  };

  const cardWidth = Math.min(width - 32, 480);
  const almanac = payload?.eastAsia?.almanac;
  const personal = almanac && isPersonalized(almanac) ? almanac.personal : null;

  return (
    <Screen title={tr('today.title')} subtitle={dateLabel} tabs>
      {payload?.needsProfile ? <Banner text={tr('today.needsProfile')} tone="info" /> : null}
      {!q.data && offline ? <Banner text={tr('today.offlineBanner')} testID="offline-banner" /> : null}
      {q.isLoading && !offline ? <Loading /> : null}
      {q.isError && !offline ? <ErrorState error={q.error} onRetry={() => void q.refetch()} /> : null}
      {payload ? (
        <View style={{ alignItems: 'center' }}>
          <OracleCard payload={payload} dateLabel={dateLabel} offline={!q.data} width={cardWidth} labels={labels} cardImageUri={(id) => cardImageUri(id)} onShare={() => void onShare()} onAsk={() => router.push('/(tabs)/ask')} onPressAlmanac={() => router.push({ pathname: '/almanac', params: { date } })} onPressTarot={() => router.push('/tarot/new')} testID="oracle-card" />
          <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[3] }}>
            {tr('common.disclaimer')}
          </Text>
          {/* off-screen share card (no birth data) */}
          <View style={{ position: 'absolute', left: -10000, top: 0 }} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <ShareCard
              ref={shareRef}
              type="today"
              width={360}
              data={{
                title: tr('today.title'),
                subtitle: dateLabel,
                hero: payload.content[payload.segments[0] ?? '']?.headline ?? (almanac ? `${almanac.lunar.day}/${almanac.lunar.month}` : ''),
                lines: [
                  ...(almanac ? [`${almanac.lunar.yearGanzhi.han} · ${almanac.dayGanzhi.han}`] : []),
                  ...(personal ? [`${tr('today.luckyNumber')}: ${personal.luckyNumbers.join(', ')}`, `${tr('today.luckyColor')}: ${personal.luckyColor.label}`] : []),
                  ...(payload.tarot ? [`${tr('today.cardOfDay')}: ${payload.tarot.card.name}`] : []),
                ],
                footer: tr('today.streak', { count: payload.streak.current }),
              }}
            />
          </View>
          {sharing ? <Loading label={tr('today.sharing')} /> : null}
        </View>
      ) : null}
    </Screen>
  );
}
