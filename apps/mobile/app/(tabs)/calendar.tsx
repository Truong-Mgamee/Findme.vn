import { useMemo, useState } from "react";
import { Redirect } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { goodDays, CHI, type EventKind } from "@fortune/engine";
import { useProfile } from "../../src/store/profile";
import { colors, s } from "../../src/ui";

const EVENTS: EventKind[] = ["general", "wedding", "opening", "travel", "contract", "moving"];

export default function CalendarScreen() {
  const { profile, t } = useProfile();
  const [event, setEvent] = useState<EventKind>("general");
  const now = new Date();
  const [ym, setYm] = useState({ y: now.getFullYear(), m: now.getMonth() + 1 });
  const branch = profile ? ((profile.lunar.year + 8) % 12) + 1 : undefined;
  const days = useMemo(() => goodDays(ym.y, ym.m, event, branch), [ym, event, branch]);
  if (!profile) return <Redirect href="/onboarding" />;
  const shift = (d: number) => { let m = ym.m + d, y = ym.y; if (m < 1) { m = 12; y--; } if (m > 12) { m = 1; y++; } setYm({ y, m }); };
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <View style={s.row}>
        <Pressable onPress={() => shift(-1)} style={s.chip}><Text style={s.chipTxt}>‹</Text></Pressable>
        <Text style={s.h2}>{String(ym.m).padStart(2, "0")}/{ym.y}</Text>
        <Pressable onPress={() => shift(1)} style={s.chip}><Text style={s.chipTxt}>›</Text></Pressable>
      </View>
      <Text style={s.sub}>{t("goodDaysTitle")}</Text>
      <View style={s.wrap}>
        {EVENTS.map((e) => <Pressable key={e} onPress={() => setEvent(e)} style={[s.chip, event === e && s.chipOn]}><Text style={[s.chipTxt, event === e && s.chipTxtOn]}>{t(e)}</Text></Pressable>)}
      </View>
      {days.length === 0 && <Text style={s.dim}>{t("noGoodDays")}</Text>}
      {days.map((d) => (
        <View key={d.solar.day} style={s.card}>
          <View style={s.row}>
            <Text style={s.big}>{String(d.solar.day).padStart(2, "0")}/{String(d.solar.month).padStart(2, "0")}</Text>
            <Text style={[s.val, { color: colors.good }]}>{d.score}/100</Text>
          </View>
          <Text style={s.dim}>{t("lunar")} {d.lunarVN.day}/{d.lunarVN.month} · {d.dayGanZhi} · {d.tianShen.vi} · {d.truc.vi} · {d.xiu.vi}</Text>
          <Text style={s.dim}>{t("goodHours")}: {d.goodHours.map((h) => CHI[h]).join(" ")} · ⚡ {d.clashBranchName}</Text>
        </View>
      ))}
    </ScrollView>
  );
}
