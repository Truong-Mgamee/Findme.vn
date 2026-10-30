import { useState } from "react";
import { Redirect } from "expo-router";
import { Pressable, ScrollView, Text, View } from "react-native";
import { lifePathText } from "@fortune/content";
import { useProfile } from "../../src/store/profile";
import { ELEMENT_COLOR, colors, s } from "../../src/ui";

type System = "tuvi" | "astro" | "numerology" | "bazi";

export default function ProfileScreen() {
  const { profile, t, locale } = useProfile();
  const [sys, setSys] = useState<System>(locale === "vi" ? "tuvi" : "astro");
  if (!profile) return <Redirect href="/onboarding" />;
  const order: System[] = locale === "vi" ? ["tuvi", "bazi", "numerology", "astro"] : ["astro", "numerology", "tuvi", "bazi"];
  return (
    <ScrollView style={s.root} contentContainerStyle={s.content}>
      <Text style={s.h1}>{profile.input.displayName}</Text>
      <Text style={s.sub}>{profile.input.day}/{profile.input.month}/{profile.input.year} · {profile.yearGanZhi} · {profile.zodiacAnimalEn}</Text>
      <View style={s.wrap}>
        {order.map((k) => (
          <Pressable key={k} onPress={() => setSys(k)} style={[s.chip, sys === k && s.chipOn]}><Text style={[s.chipTxt, sys === k && s.chipTxtOn]}>{t(k)}</Text></Pressable>
        ))}
      </View>
      {sys === "tuvi" && <TuVi />}
      {sys === "astro" && <Astro />}
      {sys === "numerology" && <Numerology />}
      {sys === "bazi" && <Bazi />}
    </ScrollView>
  );
}

/** 4×4 grid, classic layout: Tỵ Ngọ Mùi Thân / Thìn . . Dậu / Mão . . Tuất / Dần Sửu Tý Hợi */
const GRID = [6, 7, 8, 9, 5, 0, 0, 10, 4, 0, 0, 11, 3, 2, 1, 12];

function TuVi() {
  const { profile, t } = useProfile();
  const c = profile!.tuvi;
  if (!c) return <View style={s.card}><Text style={s.body}>{t("tuviUnavailable")}</Text></View>;
  return (
    <View style={{ gap: 12 }}>
      <View style={s.grid}>
        {GRID.map((pos, i) => {
          if (pos === 0) {
            if (i === 6 || i === 9) return null; // covered by the 50 %-wide centre / spacer
            if (i === 10) return <View key={i} style={[s.cell, { width: "50%", aspectRatio: 1.7 }]} />;
            return (
              <View key={i} style={[s.cell, { width: "50%", aspectRatio: 1.7 }]}>
                <View style={s.cellIn}>
                  <Text style={s.cellTitle}>{t("cuc")}: {c.cuc.name}</Text>
                  <Text style={s.cellMinor}>{t("menh")}: {c.menh.napAm} ({c.menh.element})</Text>
                  <Text style={s.cellMinor}>{t("menhChu")}: {c.menhChu} · {t("thanChu")}: {c.thanChu}</Text>
                  <Text style={s.cellMinor}>{c.menhCucRelation} · {c.yinYang} {c.gender === "male" ? "Nam" : "Nữ"} {c.amDuongMenh}</Text>
                  <Text style={s.cellMinor}>{c.year.can} {c.year.chi} · {c.month.can} {c.month.chi} · {c.day.can} {c.day.chi} · {c.hour.can} {c.hour.chi}</Text>
                </View>
              </View>
            );
          }
          const p = c.palaces[pos - 1]!;
          const main = p.stars.filter((x) => x.kind === 1);
          const minor = p.stars.filter((x) => x.kind !== 1).slice(0, 6);
          return (
            <View key={i} style={s.cell}>
              <View style={[s.cellIn, pos === c.cungMenh && s.cellMenh]}>
                <Text style={s.cellTitle}>{p.name}{p.isThan ? ` · ${t("than")}` : ""}</Text>
                <Text style={s.cellBranch}>{p.branch} · {p.daiHan}{p.tuan ? ` · ${t("tuan")}` : ""}{p.triet ? ` · ${t("triet")}` : ""}</Text>
                {main.length === 0 ? <Text style={s.cellMinor}>{t("noMainStar")}</Text> : main.map((x) => <Text key={x.id} style={[s.cellStar, { color: ELEMENT_COLOR[x.element] ?? colors.text }]}>{x.name}{x.brightness ? ` (${x.brightness})` : ""}</Text>)}
                {minor.map((x) => <Text key={x.id} style={s.cellMinor}>{x.name}</Text>)}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function Astro() {
  const { profile, t } = useProfile();
  const n = profile!.natal;
  return (
    <View style={{ gap: 12 }}>
      <View style={s.card}>
        <View style={s.row}><Text style={s.label}>{t("asc")}</Text><Text style={s.val}>{n.ascSign} {(n.ascendant % 30).toFixed(1)}°</Text></View>
        <View style={s.row}><Text style={s.label}>MC</Text><Text style={s.val}>{n.mcSign} {(n.midheaven % 30).toFixed(1)}°</Text></View>
        <View style={s.row}><Text style={s.label}>{t("moon")}</Text><Text style={s.val}>{n.moonPhase.name}</Text></View>
      </View>
      <View style={s.card}>
        {n.planets.map((p) => (
          <View key={p.planet} style={s.row}>
            <Text style={s.label}>{p.planet}{p.retrograde ? " ℞" : ""}</Text>
            <Text style={s.val}>{p.sign} {p.degree.toFixed(1)}° · {t("house")} {p.house}</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.label}>{t("aspects")}</Text>
        {n.aspects.slice(0, 12).map((a, i) => <Text key={i} style={s.dim}>{a.a} {a.type} {a.b} ({a.orb}°)</Text>)}
      </View>
    </View>
  );
}

function Numerology() {
  const { profile, t, locale } = useProfile();
  const num = profile!.numerology;
  const year = new Date().getFullYear();
  const l1 = lifePathText(locale, num.lifePath, 1);
  const l2 = lifePathText(locale, num.lifePath, 2);
  return (
    <View style={{ gap: 12 }}>
      <View style={s.card}>
        <Text style={s.label}>{t("lifePath")}</Text>
        <Text style={[s.big, { fontSize: 40, color: colors.accent }]}>{num.lifePath}</Text>
        {l1 && <Text style={s.body}>{l1}</Text>}
        {l2 && l2.split("\n").map((line, i) => <Text key={i} style={s.dim}>• {line}</Text>)}
      </View>
      <View style={s.card}>
        {([["expression", num.expression], ["soulUrge", num.soulUrge], ["personality", num.personality], ["birthday", num.birthday], ["maturity", num.maturity], ["personalYear", num.personalYear(year)]] as const).map(([k, v]) => (
          <View key={k} style={s.row}><Text style={s.label}>{t(k)}</Text><Text style={s.val}>{v}</Text></View>
        ))}
      </View>
    </View>
  );
}

function Bazi() {
  const { profile, t } = useProfile();
  const b = profile!.bazi;
  return (
    <View style={{ gap: 12 }}>
      <View style={[s.card, { flexDirection: "row", justifyContent: "space-around" }]}>
        {([["pillarYear", b.year], ["pillarMonth", b.month], ["pillarDay", b.day], ["pillarHour", b.hour]] as const).map(([k, p]) => (
          <View key={k} style={{ alignItems: "center", gap: 2 }}>
            <Text style={s.label}>{t(k)}</Text>
            <Text style={s.big}>{p.ganVi}</Text>
            <Text style={s.big}>{p.zhiVi}</Text>
            <Text style={s.cellMinor}>{p.shiShenGan}</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <View style={s.row}><Text style={s.label}>{t("dayMaster")}</Text><Text style={s.val}>{b.dayMaster.ganVi} · {b.dayMaster.element} ({b.dayMaster.yinYang})</Text></View>
        <View style={s.row}><Text style={s.label}>{t("strength")}</Text><Text style={s.val}>{b.strength}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("favorable")}</Text><Text style={s.val}>{b.favorable.join(", ")}</Text></View>
        <View style={s.row}><Text style={s.label}>{t("unfavorable")}</Text><Text style={s.val}>{b.unfavorable.join(", ")}</Text></View>
      </View>
      <View style={s.card}>
        <Text style={s.label}>{t("elements")}</Text>
        {Object.entries(b.elements).map(([el, pct]) => (
          <View key={el} style={s.row}>
            <Text style={[s.label, { color: ELEMENT_COLOR[el] }]}>{el}</Text>
            <View style={{ flex: 1, height: 8, backgroundColor: colors.line, borderRadius: 4, marginHorizontal: 8 }}><View style={{ width: `${pct}%`, height: 8, backgroundColor: ELEMENT_COLOR[el], borderRadius: 4 }} /></View>
            <Text style={s.val}>{pct}%</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.label}>{t("luckPillars")}</Text>
        <View style={s.wrap}>{b.luckPillars.map((p) => <Text key={p.startAge} style={s.dim}>{p.startAge}–{p.endAge}: {p.ganZhi}</Text>)}</View>
      </View>
    </View>
  );
}
