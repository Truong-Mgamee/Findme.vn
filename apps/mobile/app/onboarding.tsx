import { useState } from "react";
import { useRouter } from "expo-router";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { CHI, hourToBranch, type ProfileInput } from "@fortune/engine";
import { useProfile } from "../src/store/profile";
import { PLACES } from "../src/data/places";
import { s } from "../src/ui";

type TimeMode = "clock" | "branch" | "unknown";

export default function Onboarding() {
  const { input, save, t } = useProfile();
  const router = useRouter();
  const [name, setName] = useState(input?.displayName ?? "");
  const [fullName, setFullName] = useState(input?.fullName ?? "");
  const [gender, setGender] = useState<ProfileInput["gender"]>(input?.gender ?? "female");
  const [d, setD] = useState(input ? String(input.day) : "");
  const [m, setM] = useState(input ? String(input.month) : "");
  const [y, setY] = useState(input ? String(input.year) : "");
  const [mode, setMode] = useState<TimeMode>(input?.precision === "unknown" ? "unknown" : input?.precision === "canh_gio" ? "branch" : "clock");
  const [hh, setHh] = useState(input?.hour !== undefined ? String(input.hour) : "");
  const [mm, setMm] = useState(input?.minute !== undefined ? String(input.minute) : "0");
  const [branch, setBranch] = useState<number>(input?.hourBranch ?? (input?.hour !== undefined ? hourToBranch(input.hour) : 1));
  const [placeId, setPlaceId] = useState(PLACES.find((p) => p.lat === input?.latitude)?.id ?? "hanoi");
  const [error, setError] = useState("");

  const submit = async () => {
    const day = Number(d), month = Number(m), year = Number(y);
    const dt = new Date(Date.UTC(year, month - 1, day));
    if (!day || !month || !year || year < 1900 || year > 2100 || dt.getUTCMonth() !== month - 1 || dt.getUTCDate() !== day) { setError(t("invalidDate")); return; }
    const place = PLACES.find((p) => p.id === placeId)!;
    const base: ProfileInput = {
      id: input?.id ?? `local-${Date.now()}`, displayName: name.trim() || "—", gender, year, month, day,
      precision: mode === "unknown" ? "unknown" : mode === "branch" ? "canh_gio" : "exact",
      utcOffsetHours: place.utcOffsetHours, latitude: place.lat, longitude: place.lng, locale: "vi",
    };
    if (fullName.trim()) base.fullName = fullName.trim();
    if (mode === "clock") { const h = Number(hh), mi = Number(mm); if (Number.isNaN(h) || h < 0 || h > 23) { setError(t("invalidDate")); return; } base.hour = h; base.minute = Number.isNaN(mi) ? 0 : Math.min(59, Math.max(0, mi)); }
    if (mode === "branch") base.hourBranch = branch;
    await save(base);
    router.replace("/(tabs)/today");
  };

  return (
    <ScrollView style={s.root} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Text style={s.h1}>{t("onboardingTitle")}</Text>
      <Text style={s.sub}>{t("onboardingHint")}</Text>
      <Text style={s.label}>{t("name")}</Text>
      <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Lan" placeholderTextColor="#666" />
      <Text style={s.label}>{t("fullName")}</Text>
      <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholder="Nguyễn Thị Lan" placeholderTextColor="#666" />
      <Text style={s.label}>{t("gender")}</Text>
      <View style={s.wrap}>
        {(["female", "male", "other"] as const).map((g) => <Pressable key={g} onPress={() => setGender(g)} style={[s.chip, gender === g && s.chipOn]}><Text style={[s.chipTxt, gender === g && s.chipTxtOn]}>{t(g)}</Text></Pressable>)}
      </View>
      <Text style={s.label}>{t("birthDate")}</Text>
      <View style={[s.row, { justifyContent: "flex-start" }]}>
        <TextInput style={[s.input, { width: 70 }]} value={d} onChangeText={setD} placeholder={t("day")} placeholderTextColor="#666" keyboardType="number-pad" maxLength={2} />
        <TextInput style={[s.input, { width: 70 }]} value={m} onChangeText={setM} placeholder={t("month")} placeholderTextColor="#666" keyboardType="number-pad" maxLength={2} />
        <TextInput style={[s.input, { width: 90 }]} value={y} onChangeText={setY} placeholder={t("year")} placeholderTextColor="#666" keyboardType="number-pad" maxLength={4} />
      </View>
      <Text style={s.label}>{t("birthTime")}</Text>
      <View style={s.wrap}>
        {(["clock", "branch", "unknown"] as const).map((k) => <Pressable key={k} onPress={() => setMode(k)} style={[s.chip, mode === k && s.chipOn]}><Text style={[s.chipTxt, mode === k && s.chipTxtOn]}>{t(k === "clock" ? "timeClock" : k === "branch" ? "timeBranch" : "timeUnknown")}</Text></Pressable>)}
      </View>
      {mode === "clock" && (
        <View style={[s.row, { justifyContent: "flex-start" }]}>
          <TextInput style={[s.input, { width: 70 }]} value={hh} onChangeText={setHh} placeholder={t("hour")} placeholderTextColor="#666" keyboardType="number-pad" maxLength={2} />
          <TextInput style={[s.input, { width: 70 }]} value={mm} onChangeText={setMm} placeholder={t("minute")} placeholderTextColor="#666" keyboardType="number-pad" maxLength={2} />
        </View>
      )}
      {mode === "branch" && (
        <View style={s.wrap}>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((b) => <Pressable key={b} onPress={() => setBranch(b)} style={[s.chip, branch === b && s.chipOn]}><Text style={[s.chipTxt, branch === b && s.chipTxtOn]}>{CHI[b]} {String((b * 2 + 21) % 24).padStart(2, "0")}–{String((b * 2 + 23) % 24).padStart(2, "0")}h</Text></Pressable>)}
        </View>
      )}
      {mode === "unknown" && <Text style={s.dim}>{t("unknownTimeNote")}</Text>}
      <Text style={s.label}>{t("birthPlace")}</Text>
      <View style={s.wrap}>
        {PLACES.map((p) => <Pressable key={p.id} onPress={() => setPlaceId(p.id)} style={[s.chip, placeId === p.id && s.chipOn]}><Text style={[s.chipTxt, placeId === p.id && s.chipTxtOn]}>{p.name}</Text></Pressable>)}
      </View>
      {!!error && <Text style={s.warn}>{error}</Text>}
      <Pressable style={s.btn} onPress={submit}><Text style={s.btnTxt}>{t("continue")}</Text></Pressable>
    </ScrollView>
  );
}
