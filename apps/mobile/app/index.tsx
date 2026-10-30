import React from 'react';
import { Redirect } from 'expo-router';
import { useSession } from '../src/store/session';

const STEP_ROUTE = {
  locale: '/(onboarding)/locale',
  pack: '/(onboarding)/locale',
  birth: '/(onboarding)/birth',
  insights: '/(onboarding)/insights',
  daily_time: '/(onboarding)/daily-time',
  first_reading: '/(onboarding)/first-reading',
  done: '/(tabs)/today',
} as const;

export default function Index() {
  const step = useSession((s) => s.onboardingStep);
  const selfProfileId = useSession((s) => s.selfProfileId);
  const target = step === 'done' && !selfProfileId ? STEP_ROUTE.birth : STEP_ROUTE[step];
  return <Redirect href={target} />;
}
