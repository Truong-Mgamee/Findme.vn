/** Deep link findme://invite/:code — invite acceptance (compat). The API has no invite endpoint yet: we route to add-partner. */
import React, { useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Button, Card, Text, useTheme } from '@findme/ui';
import { Screen } from '../../src/components/Screen';
import { track } from '../../src/lib/analytics';
import { useSession } from '../../src/store/session';

export default function InviteScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code: string }>();
  const step = useSession((s) => s.onboardingStep);
  useEffect(() => {
    track({ name: 'invite_accepted' });
  }, []);
  return (
    <Screen title={tr('compat.inviteTitle')} back>
      <Card>
        <Text size="md">{tr('compat.inviteBody', { code })}</Text>
        <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
          {tr('compat.inviteApiNote')}
        </Text>
        <Button label={step === 'done' ? tr('profiles.addPartner') : tr('common.continue')} size="lg" style={{ marginTop: t.spacing[3] }} onPress={() => router.replace(step === 'done' ? '/profile/new' : '/')} />
      </Card>
    </Screen>
  );
}
