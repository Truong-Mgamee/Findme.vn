/** S16 You: profiles, add partner, entitlements, settings (locale, calendar standard, theme, text size, dev pseudo-locale, delete data). */
import React, { useState } from 'react';
import { Alert, Platform, Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { CalendarStandard, Locale } from '@findme/engine-core';
import { ENABLED_LOCALES, LOCALE_CONFIGS } from '@findme/i18n';
import { Badge, Button, Card, Chip, Divider, Row, Text, useTheme } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen, Section } from '../../src/components/Screen';
import { useDeleteMe, useDeleteProfile, useEntitlements, useProfiles, useUpdateMe } from '../../src/hooks/queries';
import { resetAnalytics, track } from '../../src/lib/analytics';
import { setRequestContext, setToken } from '../../src/lib/api';
import { env } from '../../src/lib/env';
import { changeLocale, PSEUDO } from '../../src/lib/i18n';
import { clearSelfBirth } from '../../src/lib/offline-today';
import { wipeAllLocal } from '../../src/lib/storage';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';
import { queryClient } from '../../src/components/Providers';

export default function YouScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const session = useSession();
  const profiles = useProfiles(session.hasToken);
  const ent = useEntitlements(session.hasToken);
  const updateMe = useUpdateMe();
  const delProfile = useDeleteProfile();
  const delMe = useDeleteMe();
  const show = usePaywall((s) => s.show);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const setLocale = async (l: Locale) => {
    session.setUiLocale(l);
    session.setDevPseudoLocale(false);
    setRequestContext({ locale: l });
    await changeLocale(l);
    updateMe.mutate({ locale: l });
    track({ name: 'settings_changed', key: 'locale' });
    queryClient.clear();
  };
  const setStandard = (c: CalendarStandard) => {
    updateMe.mutate({ calendarStandard: c });
    track({ name: 'settings_changed', key: 'calendar_standard' });
  };
  const togglePseudo = async () => {
    const next = !session.devPseudoLocale;
    session.setDevPseudoLocale(next);
    await changeLocale(next ? PSEUDO : session.user?.locale ?? 'en');
  };

  const deleteEverything = async () => {
    track({ name: 'data_delete_requested' });
    try {
      await delMe.mutateAsync();
    } catch {
      /* server side may already be gone; wipe locally anyway */
    }
    await setToken(null);
    await clearSelfBirth();
    await wipeAllLocal();
    resetAnalytics();
    queryClient.clear();
    session.reset();
    router.replace('/(onboarding)/locale');
  };

  const askDelete = () => {
    if (Platform.OS === 'web') return setConfirmDelete(true);
    Alert.alert(tr('settings.deleteData'), tr('settings.deleteConfirm'), [
      { text: tr('common.cancel'), style: 'cancel' },
      { text: tr('settings.deleteData'), style: 'destructive', onPress: () => void deleteEverything() },
    ]);
  };

  return (
    <Screen title={tr('you.title')} tabs>
      <Section title={tr('settings.profiles')}>
        {profiles.isLoading ? <Loading /> : null}
        {profiles.error ? <ErrorState error={profiles.error} onRetry={() => void profiles.refetch()} /> : null}
        {profiles.data?.map((p) => (
          <Card key={p.id} testID={`profile-${p.id}`} style={{ marginBottom: t.spacing[2] }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Row>
                  <Text size="md" weight="semibold" style={{ marginEnd: t.spacing[2] }}>
                    {p.label}
                  </Text>
                  {p.isSelf ? <Badge label={tr('profiles.you')} tone="primary" /> : null}
                </Row>
                <Text size="xs" color="muted">
                  {p.birthSummary.placeName} · {tr(`onboarding.birth.genders.${p.birthSummary.gender}`)}
                  {p.birthSummary.timeUnknown ? ` · ${tr('profiles.timeUnknownShort')}` : ''}
                </Text>
                {p.insights[0] ? (
                  <Text size="sm" color="muted" numberOfLines={1}>
                    {p.insights[0].title}
                  </Text>
                ) : null}
              </View>
              {!p.isSelf ? <Button label={tr('common.delete')} variant="ghost" onPress={() => delProfile.mutate(p.id)} /> : null}
            </Row>
          </Card>
        ))}
        <Button label={tr('profiles.addPartner')} variant="secondary" onPress={() => router.push('/profile/new')} testID="add-profile" />
      </Section>

      <Section title={tr('settings.subscription')}>
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size="md" weight="semibold">
              {session.isPlus ? tr('you.plusActive') : tr('you.freePlan')}
            </Text>
            <Badge label={tr('you.credits', { count: ent.data?.credits ?? session.credits })} tone="muted" />
          </Row>
          {ent.data?.subscriptions.map((s) => (
            <Text key={s.product} size="xs" color="muted" style={{ marginTop: t.spacing[1] }}>
              {s.product} · {s.status}
              {s.expiresAt ? ` · ${new Date(s.expiresAt).toLocaleDateString()}` : ''}
              {s.trial ? ` · ${tr('you.trial')}` : ''}
            </Text>
          ))}
          <Text size="xs" color="muted" style={{ marginTop: t.spacing[1] }}>
            {session.freeFirstReadingAvailable ? tr('you.freeReadingAvailable') : tr('you.freeReadingUsed')}
          </Text>
          <Button label={session.isPlus ? tr('you.manage') : tr('paywall.title')} style={{ marginTop: t.spacing[3] }} onPress={() => show({ trigger: 'settings' })} testID="open-paywall" />
          <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
            {tr('you.cancelNote')}
          </Text>
        </Card>
      </Section>

      <Section title={tr('settings.language')}>
        <Row accessibilityRole="radiogroup">
          {ENABLED_LOCALES.map((l) => (
            <Chip key={l} label={LOCALE_CONFIGS[l].nativeName} tone={!session.devPseudoLocale && session.uiLocale === l ? 'selected' : 'neutral'} onPress={() => void setLocale(l)} testID={`settings-locale-${l}`} />
          ))}
        </Row>
      </Section>

      <Section title={tr('settings.calendarStandard')}>
        <Row accessibilityRole="radiogroup">
          {(['vn', 'cn', 'kr', 'jp'] as CalendarStandard[]).map((c) => (
            <Chip key={c} label={tr(`almanac.standard.${c}`)} tone={session.user?.calendarStandard === c ? 'selected' : 'neutral'} onPress={() => setStandard(c)} />
          ))}
        </Row>
        <Text size="xs" color="muted">
          {tr('settings.calendarStandardHint')}
        </Text>
      </Section>

      <Section title={tr('settings.appearance')}>
        <Row>
          {(['dark', 'light', 'system'] as const).map((s) => (
            <Chip key={s} label={tr(`settings.scheme.${s}`)} tone={session.scheme === s ? 'selected' : 'neutral'} onPress={() => session.setScheme(s)} />
          ))}
        </Row>
        <Row style={{ marginTop: t.spacing[2] }}>
          <Text size="sm" color="muted" style={{ marginEnd: t.spacing[2] }}>
            {tr('settings.textSize')}
          </Text>
          {[0.9, 1, 1.15, 1.3].map((f) => (
            <Chip key={f} label={`${Math.round(f * 100)}%`} tone={session.fontScale === f ? 'selected' : 'neutral'} onPress={() => session.setFontScale(f)} />
          ))}
        </Row>
      </Section>

      <Section title={tr('settings.privacy')}>
        <Card>
          <Text size="sm" color="muted">
            {tr('settings.privacyNote')}
          </Text>
          <Button label={tr('settings.deleteData')} variant="danger" onPress={askDelete} style={{ marginTop: t.spacing[3] }} testID="delete-data" loading={delMe.isPending} />
          {confirmDelete ? (
            <Row style={{ marginTop: t.spacing[2] }}>
              <Text size="sm" style={{ flex: 1 }}>
                {tr('settings.deleteConfirm')}
              </Text>
              <Button label={tr('common.confirm')} variant="danger" onPress={() => void deleteEverything()} style={{ marginEnd: t.spacing[2] }} />
              <Button label={tr('common.cancel')} variant="ghost" onPress={() => setConfirmDelete(false)} />
            </Row>
          ) : null}
        </Card>
      </Section>

      <Section title={tr('settings.about')}>
        <Text size="xs" color="muted">
          {tr('settings.credits')}
        </Text>
        <Divider />
        {env.isDev ? (
          <Pressable onPress={() => void togglePseudo()} accessibilityRole="switch" accessibilityState={{ checked: session.devPseudoLocale }} style={{ minHeight: t.touchTarget, justifyContent: 'center' }} testID="dev-pseudo-locale">
            <Text size="sm" color="accent">
              {tr('settings.devPseudoLocale')}: {session.devPseudoLocale ? 'ON' : 'OFF'}
            </Text>
          </Pressable>
        ) : null}
      </Section>
    </Screen>
  );
}
