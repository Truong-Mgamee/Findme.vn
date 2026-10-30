import { useMemo } from "react";
import { Redirect } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import { dailyCard, CHI } from "@fortune/engine";
import { useProfile } from "../../src/store/profile";
import { ELEMENT_COLOR, colors, s } from "../../src/ui";

function Stars({ n }: { n: number }) {
  return <Text style={s.stars}>{"★".repeat(n)}{"☆".repeat(5 - n)}</Text>;
}

export default function Today() {
  const { profile, t, locale } = useProfile();
  const now = new Date();
  const dateKey = now.toDateString();
  const card = useMemo(() => (profile ? dailyCard(profile, { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() }) : null), [profile, dateKey]);
  if (!profile || !card) return <Redirect href="/onboarding" />;
  const a = card.almanac;
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.h1}>{t("today")}</Text>
      <Text style={s.sub}>{card.date} · {t("lunar")} {a.lunarVN.day}/{a.lunarVN.month}{a.lunarVN.leap ? "+" : ""} · {a.dayGanZhi}</Text>
      <Text style={{ color: a.hoangDao ? colors.good : colors.bad, fontWeight: "600" }}>{a.hoangDao ? t("hoangDao") : t("hacDao")} · {a.tianShen.vi} · {a.truc.vi}</Text>
      {card.clashWithUser && <Text style={s.warn}>{t("clash")}</Text>}
      <View style={s.card}>
        {(["overall", "love", "work", "money", "health"] as const).map((k) => (
          <View key={k} style={s.row}><Text style={s.label}>{t(k)}</Text><Stars n={card.scores[k]} /></View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.label}>{t("tarotOfDay")}</Text>
        <Text style={s.big}>{card.tarot.card.nameEn} <Text style={s.dim}>({card.tarot.reversed ? t("reversed") : t("upright")})</Text></Text>
        <Text style={s.dim}>{(card.tarot.reversed ? card.tarot.card.reversed : card.tarot.card.upright).join(" · ")}</Text>
      </View>
      <View style={s.card}>
        <View style={s.row}><Text style={s.label}>{t("luckyNumber")}</Text><Text style={s.val}>{card.luckyNumber}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("luckyElement")}</Text><Text style={[s.val, { color: ELEMENT_COLOR[card.luckyColorKey] }]}>{card.luckyColorKey}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("personalDay")}</Text><Text style={s.val}>{card.personalDay}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("moon")}</Text><Text style={s.val}>{card.moonPhase}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("goodHours")}</Text><Text style={s.val}>{card.goodHours.map((h) => CHI[h]).join(" ")}</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.label}>{profile.input.displayName}</Text>
        <Text style={s.dim}>{profile.yearGanZhi} · {t("menh")} {profile.menhNapAm[locale === "vi" ? "vi" : "en"]} · {t("lifePath")} {profile.numerology.lifePath}</Text>
      </View>
    </ScrollView>
  );
}
