import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useProfile } from "../src/store/profile";
import { colors } from "../src/ui";

export default function Index() {
  const { ready, input } = useProfile();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: "center" }}><ActivityIndicator color={colors.accent} /></View>;
  return <Redirect href={input ? "/(tabs)/today" : "/onboarding"} />;
}
