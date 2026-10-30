/** Add a partner / family profile (POST /v1/profiles, isSelf=false). */
import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { BirthForm, type BirthFormValue } from '../../src/components/BirthForm';
import { ErrorState } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { useCreateProfile } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';

export default function NewProfileScreen() {
  const { t: tr } = useTranslation();
  const router = useRouter();
  const create = useCreateProfile();
  const [error, setError] = useState<unknown>(null);
  const submit = async (v: BirthFormValue) => {
    setError(null);
    try {
      await create.mutateAsync({ birth: v.birth, fullName: v.fullName, isSelf: false, label: v.label ?? tr('profiles.partnerLabel') });
      track({ name: 'profile_created', is_self: false, time_unknown: v.birth.timeUnknown, tz_estimated: !v.birth.place.tz, has_name: !!v.fullName });
      router.back();
    } catch (e) {
      setError(e);
    }
  };
  return (
    <Screen title={tr('profiles.addPartner')} subtitle={tr('profiles.addPartnerHint')} back>
      <BirthForm submitLabel={tr('common.save')} askName askLabel busy={create.isPending} onSubmit={(v) => void submit(v)} />
      {error ? <ErrorState error={error} /> : null}
    </Screen>
  );
}
