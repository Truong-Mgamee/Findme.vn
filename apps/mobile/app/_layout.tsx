import '../global.css';
import React from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Text, useTheme } from '@findme/ui';
import { Providers } from '../src/components/Providers';
import { PaywallHost } from '../src/components/PaywallHost';
import { useBootstrap } from '../src/hooks/useBootstrap';

function Shell() {
  const t = useTheme();
  const { ready } = useBootstrap();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: t.colors.bg, alignItems: 'center', justifyContent: 'center' }} accessibilityRole="progressbar">
        <Text size="2xl" weight="bold" color="primary">
          Findme
        </Text>
      </View>
    );
  }
  return (
    <>
      <StatusBar style={t.scheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.colors.bg }, animation: t.reduceMotion ? 'none' : 'default' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
      <PaywallHost />
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Providers>
          <Shell />
        </Providers>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
