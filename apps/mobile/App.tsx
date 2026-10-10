import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { getLocales } from "expo-localization";
import { buildProfile, dailyCard, CHI, type ProfileInput } from "@fortune/engine";
import { detectLocale, makeT, type Locale } from "./src/i18n";

// Demo profile until onboarding (T-FE-01..07) lands.
const DEMO: ProfileInput = {
  id: "demo", displayName: "Nguyễn Văn Trường", gender: "male", year: 1997, month: 12, day: 24, hour: 8,
  precision: "exact", utcOffsetHours: 7, latitude: 21.03, longitude: 105.85, locale: "vi",
};

const ELEMENT_COLOR: Record<string, string> = { Kim: "#E8E4D8", Mộc: "#4CAF7A", Thủy: "#3B82F6", Hỏa: "#EF5350", Thổ: "#C9A227" };

function Stars({ n }: { n: number }) {
  return <Text style={styles.stars}>{"★".repeat(n)}{"☆".repeat(5 - n)}</Text>;
}

export default function App() {
  const [locale, setLocale] = useState<Locale>(detectLocale(getLocales()[0]?.languageTag));
  const t = makeT(locale);
  const now = new Date();
  const profile = useMemo(() => buildProfile(DEMO), []);
  const card = useMemo(() => dailyCard(profile, { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }), [profile, now.toDateString()]);
  const a = card.almanac;
  const sun = profile.natal.planets[0]!;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.h1}>{t("today")}</Text>
        <Pressable onPress={() => setLocale(locale === "vi" ? "en" : "vi")} style={styles.langBtn}>
          <Text style={styles.langTxt}>{locale.toUpperCase()}</Text>
        </Pressable>
      </View>
      <Text style={styles.sub}>{card.date} · {t("lunar")} {a.lunarVN.day}/{a.lunarVN.month}{a.lunarVN.leap ? "+" : ""} · {a.dayGanZhi}</Text>
      <Text style={[styles.badge, { color: a.hoangDao ? "#7CE38B" : "#F28B82" }]}>{a.hoangDao ? t("hoangDao") : t("hacDao")} · {a.tianShen.vi} · {a.truc.vi}</Text>
      {card.clashWithUser && <Text style={styles.warn}>{t("clash")}</Text>}

      <View style={styles.card}>
        {(["overall", "love", "work", "money", "health"] as const).map((k) => (
          <View key={k} style={styles.row}><Text style={styles.label}>{t(k)}</Text><Stars n={card.scores[k]} /></View>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t("tarotOfDay")}</Text>
        <Text style={styles.big}>{card.tarot.card.nameEn} <Text style={styles.dim}>({card.tarot.reversed ? t("reversed") : t("upright")})</Text></Text>
        <Text style={styles.dim}>{(card.tarot.reversed ? card.tarot.card.reversed : card.tarot.card.upright).join(" · ")}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.row}><Text style={styles.label}>{t("luckyNumber")}</Text><Text style={styles.val}>{card.luckyNumber}</Text></View>
        <View style={styles.row}><Text style={styles.label}>{t("luckyElement")}</Text><Text style={[styles.val, { color: ELEMENT_COLOR[card.luckyColorKey] }]}>{card.luckyColorKey}</Text></View>
        <View style={styles.row}><Text style={styles.label}>{t("personalDay")}</Text><Text style={styles.val}>{card.personalDay}</Text></View>
        <View style={styles.row}><Text style={styles.label}>{t("moon")}</Text><Text style={styles.val}>{card.moonPhase}</Text></View>
        <View style={styles.row}><Text style={styles.label}>{t("goodHours")}</Text><Text style={styles.val}>{card.goodHours.map((h) => CHI[h]).join(" ")}</Text></View>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>{t("demoProfile")}: {profile.input.displayName}</Text>
        <Text style={styles.dim}>{profile.yearGanZhi} · {t("menh")} {profile.menhNapAm[locale === "vi" ? "vi" : "en"]}</Text>
        <Text style={styles.dim}>{t("sun")} {sun.sign} {sun.degree.toFixed(1)}° · {t("asc")} {profile.natal.ascSign} · {t("lifePath")} {profile.numerology.lifePath}</Text>
        {profile.tuvi && <Text style={styles.dim}>Tử vi: {profile.tuvi.cuc.name} · Mệnh tại {profile.tuvi.palaces[profile.tuvi.cungMenh - 1]!.branch} ({profile.tuvi.palaces[profile.tuvi.cungMenh - 1]!.stars.filter((s) => s.kind === 1).map((s) => s.name).join(", ") || "Vô chính diệu"})</Text>}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0F0E17" },
  content: { padding: 20, paddingTop: 60, gap: 12, maxWidth: 560, width: "100%", alignSelf: "center" },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  h1: { color: "#FFFFFE", fontSize: 32, fontWeight: "700" },
  sub: { color: "#A7A9BE", fontSize: 14 },
  badge: { fontSize: 14, fontWeight: "600" },
  warn: { color: "#F28B82", fontSize: 13 },
  langBtn: { borderWidth: 1, borderColor: "#A7A9BE", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  langTxt: { color: "#FFFFFE", fontWeight: "600" },
  card: { backgroundColor: "#1B1A2E", borderRadius: 16, padding: 16, gap: 8 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  label: { color: "#A7A9BE", fontSize: 14 },
  val: { color: "#FFFFFE", fontSize: 15, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  stars: { color: "#FFB84D", fontSize: 16, letterSpacing: 2 },
  big: { color: "#FFFFFE", fontSize: 20, fontWeight: "700" },
  dim: { color: "#A7A9BE", fontSize: 13, lineHeight: 19 },
});
