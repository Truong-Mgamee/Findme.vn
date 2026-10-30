import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { useProfile } from "../../src/store/profile";
import { s } from "../../src/ui";

export default function SettingsScreen() {
  const { t, locale, setLocale, reset } = useProfile();
  const router = useRouter();
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.h1}>{t("settings")}</Text>
      <View style={s.card}>
        <Text style={s.label}>{t("language")}</Text>
        <View style={s.wrap}>
          {(["vi", "en"] as const).map((l) => <Pressable key={l} onPress={() => setLocale(l)} style={[s.chip, locale === l && s.chipOn]}><Text style={[s.chipTxt, locale === l && s.chipTxtOn]}>{l === "vi" ? "Tiếng Việt" : "English"}</Text></Pressable>)}
        </View>
      </View>
      <Pressable style={s.btnGhost} onPress={() => router.push("/onboarding")}><Text style={s.btnGhostTxt}>{t("editProfile")}</Text></Pressable>
      <Pressable style={s.btnGhost} onPress={async () => { await reset(); router.replace("/onboarding"); }}><Text style={s.btnGhostTxt}>{t("resetProfile")}</Text></Pressable>
      <View style={s.card}>
        <Text style={s.label}>{t("licenses")}</Text>
        <Text style={s.dim}>astronomy-engine (MIT) · lunar-javascript (MIT) · lasotuvi (MIT, © doanguyen) · Hồ Ngọc Đức lunar algorithm · Rider-Waite-Smith 1909 (public domain)</Text>
      </View>
      <Text style={s.dim}>{t("disclaimer")}</Text>
    </ScrollView>
  );
}
