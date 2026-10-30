import React from 'react';
import { Stack } from 'expo-router';
import { useTheme } from '@findme/ui';

export default function OnboardingLayout() {
  const t = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg }, animation: t.reduceMotion ? 'none' : 'slide_from_right' }} />;
}
