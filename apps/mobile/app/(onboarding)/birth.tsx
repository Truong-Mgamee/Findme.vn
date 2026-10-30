/** S1: birth input → POST /v1/profiles (isSelf). */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@findme/ui';
import { BirthForm, type BirthFormValue } from '../../src/components/BirthForm';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { useCreateProfile } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { useSession } from '../../src/store/session';

export default function BirthScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const setStep = useSession((s) => s.setOnboardingStep);
  const hasToken = useSession((s) => s.hasToken);
  const pack = useSession((s) => s.user?.traditionPack ?? 'both');
  const create = useCreateProfile();
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    setStep('birth');
    track({ name: 'onboarding_step', step: 'birth', index: 2 });
  }, [setStep]);

  const submit = async (v: BirthFormValue) => {
    setError(null);
    try {
      const p = await create.mutateAsync({ birth: v.birth, fullName: v.fullName, isSelf: true, label: tr('profiles.selfLabel') });
      track({ name: 'profile_created', is_self: true, time_unknown: v.birth.timeUnknown, tz_estimated: !v.birth.place.tz, has_name: !!v.fullName });
      setStep('insights');
      router.push({ pathname: '/(onboarding)/insights', params: { profileId: p.id } });
    } catch (e) {
      setError(e);
    }
  };

  return (
    <Screen title={tr('onboarding.birth.title')} subtitle={tr('onboarding.birth.subtitle')} back>
      {!hasToken ? (
        <Text size="sm" color="warning" style={{ marginBottom: t.spacing[3] }}>
          {tr('errors.offlineGuest')}
        </Text>
      ) : null}
      <BirthForm submitLabel={tr('common.continue')} askName={pack !== 'eastAsia'} busy={create.isPending} onSubmit={(v) => void submit(v)} />
      {error ? <ErrorState error={error} /> : null}
      <Text size="xs" color="muted" style={{ marginTop: t.spacing[4] }}>
        {tr('onboarding.birth.privacy')}
      </Text>
    </Screen>
  );
}
