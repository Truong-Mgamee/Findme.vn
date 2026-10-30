/** S0: language + tradition pack (pre-selected from device locale / country). */
import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import type { Locale, TraditionPack } from '@findme/engine-core';
import { defaultTraditionPack, ENABLED_LOCALES, LOCALE_CONFIGS } from '@findme/i18n';
import { Button, Card, Text, useTheme } from '@findme/ui';
import { Screen } from '../../src/components/Screen';
import { useUpdateMe } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { setRequestContext } from '../../src/lib/api';
import { changeLocale, deviceCountry } from '../../src/lib/i18n';
import { useSession } from '../../src/store/session';

export default function LocaleScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const user = useSession((s) => s.user);
  const uiLocale = useSession((s) => s.uiLocale);
  const setUiLocale = useSession((s) => s.setUiLocale);
  const patchUser = useSession((s) => s.patchUser);
  const setStep = useSession((s) => s.setOnboardingStep);
  const updateMe = useUpdateMe();
  const country = user?.country ?? deviceCountry();
  const [locale, setLocale] = useState<Locale>(user?.locale ?? (uiLocale === 'en-XA' ? 'en' : (uiLocale as Locale)));
  const [pack, setPack] = useState<TraditionPack>(user?.traditionPack ?? defaultTraditionPack(country, locale));

  useEffect(() => {
    setStep('locale');
    track({ name: 'onboarding_step', step: 'locale', index: 0 });
  }, [setStep]);

  const pickLocale = async (l: Locale) => {
    setLocale(l);
    setPack(defaultTraditionPack(country, l));
    setUiLocale(l);
    setRequestContext({ locale: l });
    await changeLocale(l);
  };

  const next = () => {
    track({ name: 'onboarding_step', step: 'pack', index: 1 });
    patchUser({ locale, traditionPack: pack });
    if (user) updateMe.mutate({ locale, traditionPack: pack, country });
    setStep('birth');
    router.push('/(onboarding)/birth');
  };

  return (
    <Screen title={tr('onboarding.locale.title')} subtitle={tr('onboarding.locale.subtitle')}>
      <View accessibilityRole="radiogroup" style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {ENABLED_LOCALES.map((l) => {
          const sel = l === locale;
          return (
            <Pressable key={l} onPress={() => void pickLocale(l)} accessibilityRole="radio" accessibilityState={{ checked: sel }} accessibilityLabel={LOCALE_CONFIGS[l].nativeName} testID={`locale-${l}`} style={{ width: '50%', padding: t.spacing[1] }}>
              <Card style={{ borderColor: sel ? t.colors.primary : t.colors.border, borderWidth: 2, minHeight: 64, justifyContent: 'center' }}>
                <Text size="lg" weight="semibold">
                  {LOCALE_CONFIGS[l].nativeName}
                </Text>
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Text size="xl" weight="bold" accessibilityRole="header" style={{ marginTop: t.spacing[6] }}>
        {tr('onboarding.pack.title')}
      </Text>
      <View accessibilityRole="radiogroup" style={{ marginTop: t.spacing[2] }}>
        {(['eastAsia', 'western', 'both'] as TraditionPack[]).map((p) => {
          const sel = p === pack;
          return (
            <Pressable key={p} onPress={() => setPack(p)} accessibilityRole="radio" accessibilityState={{ checked: sel }} testID={`pack-${p}`} style={{ marginBottom: t.spacing[2] }}>
              <Card style={{ borderColor: sel ? t.colors.primary : t.colors.border, borderWidth: 2, minHeight: 64, justifyContent: 'center' }}>
                <Text size="md" weight={sel ? 'semibold' : 'regular'}>
                  {tr(`onboarding.pack.${p}`)}
                </Text>
                {p === defaultTraditionPack(country, locale) ? (
                  <Text size="xs" color="primary">
                    {tr('onboarding.pack.suggested')}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          );
        })}
      </View>
      <Button label={tr('common.continue')} size="lg" onPress={next} testID="onboarding-continue" style={{ marginTop: t.spacing[4] }} />
    </Screen>
  );
}
