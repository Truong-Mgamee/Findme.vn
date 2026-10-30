import React from 'react';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@findme/ui';

function Glyph({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <Text size="xl" color={focused ? 'primary' : 'muted'} accessibilityElementsHidden>
      {glyph}
    </Text>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: t.colors.primary,
        tabBarInactiveTintColor: t.colors.textMuted,
        tabBarStyle: { backgroundColor: t.colors.surface, borderTopColor: t.colors.border, minHeight: 56 },
        tabBarLabelStyle: { fontSize: 11 * t.fontScale },
        sceneStyle: { backgroundColor: t.colors.bg },
      }}
    >
      <Tabs.Screen name="today" options={{ title: tr('today.title'), tabBarIcon: ({ focused }) => <Glyph glyph="☀" focused={focused} />, tabBarTestID: 'tab-today' }} />
      <Tabs.Screen name="explore/index" options={{ title: tr('explore.title'), tabBarIcon: ({ focused }) => <Glyph glyph="✦" focused={focused} />, tabBarTestID: 'tab-explore' }} />
      <Tabs.Screen name="ask" options={{ title: tr('ask.title'), tabBarIcon: ({ focused }) => <Glyph glyph="✚" focused={focused} />, tabBarTestID: 'tab-ask' }} />
      <Tabs.Screen name="you" options={{ title: tr('you.title'), tabBarIcon: ({ focused }) => <Glyph glyph="☺" focused={focused} />, tabBarTestID: 'tab-you' }} />
      <Tabs.Screen name="more" options={{ title: tr('more.title'), tabBarIcon: ({ focused }) => <Glyph glyph="☰" focused={focused} />, tabBarTestID: 'tab-more' }} />
    </Tabs>
  );
}
