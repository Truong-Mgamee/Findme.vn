import { Tabs } from "expo-router";
import { Text, type ColorValue } from "react-native";
import { useProfile } from "../../src/store/profile";
import { colors } from "../../src/ui";

const icon = (glyph: string) => ({ color }: { color: ColorValue }) => <Text style={{ color, fontSize: 18 }}>{glyph}</Text>;

export default function TabsLayout() {
  const { t } = useProfile();
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { backgroundColor: colors.card, borderTopColor: colors.line }, tabBarActiveTintColor: colors.accent, tabBarInactiveTintColor: colors.dim }}>
      <Tabs.Screen name="today" options={{ title: t("tabToday"), tabBarIcon: icon("☀") }} />
      <Tabs.Screen name="profile" options={{ title: t("tabProfile"), tabBarIcon: icon("☯") }} />
      <Tabs.Screen name="calendar" options={{ title: t("tabCalendar"), tabBarIcon: icon("☾") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabSettings"), tabBarIcon: icon("◎") }} />
    </Tabs>
  );
}
