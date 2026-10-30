import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import { buildProfile, type Profile, type ProfileInput } from "@fortune/engine";
import { detectLocale, makeT, type Locale } from "../i18n";

const KEY = "dailyfate.profile.v1";
const LOCALE_KEY = "dailyfate.locale.v1";

interface Ctx {
  ready: boolean;
  input: ProfileInput | null;
  profile: Profile | null;
  save: (p: ProfileInput) => Promise<void>;
  reset: () => Promise<void>;
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: ReturnType<typeof makeT>;
}

const ProfileContext = createContext<Ctx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [input, setInput] = useState<ProfileInput | null>(null);
  const [locale, setLocaleState] = useState<Locale>(detectLocale(getLocales()[0]?.languageTag));

  useEffect(() => {
    (async () => {
      try {
        const [raw, loc] = await Promise.all([AsyncStorage.getItem(KEY), AsyncStorage.getItem(LOCALE_KEY)]);
        if (raw) setInput(JSON.parse(raw) as ProfileInput);
        if (loc === "vi" || loc === "en") setLocaleState(loc);
      } catch { /* storage unavailable: run in-memory */ }
      setReady(true);
    })();
  }, []);

  const profile = useMemo(() => (input ? buildProfile(input) : null), [input]);
  const value = useMemo<Ctx>(() => ({
    ready, input, profile,
    save: async (p) => { setInput(p); try { await AsyncStorage.setItem(KEY, JSON.stringify(p)); } catch { /* ignore */ } },
    reset: async () => { setInput(null); try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ } },
    locale,
    setLocale: (l) => { setLocaleState(l); AsyncStorage.setItem(LOCALE_KEY, l).catch(() => undefined); },
    t: makeT(locale),
  }), [ready, input, profile, locale]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): Ctx {
  const c = useContext(ProfileContext);
  if (!c) throw new Error("useProfile outside ProfileProvider");
  return c;
}
