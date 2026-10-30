/** Session + settings (persisted in the kv tier). The token itself lives in the secure tier. */
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { CalendarStandard, Locale, TraditionPack } from '@findme/engine-core';
import { kv } from '../lib/storage';
import type { PSEUDO } from '../lib/i18n';

export type UiLocale = Locale | typeof PSEUDO;

export interface UserSettings {
  id: string;
  locale: Locale;
  country: string | null;
  traditionPack: TraditionPack;
  calendarStandard: CalendarStandard;
  tz: string;
  dailyHour: number;
  pushEnabled: boolean;
}

export type OnboardingStep = 'locale' | 'pack' | 'birth' | 'insights' | 'daily_time' | 'first_reading' | 'done';

interface SessionState {
  hydrated: boolean;
  hasToken: boolean;
  user: UserSettings | null;
  uiLocale: UiLocale;
  scheme: 'dark' | 'light' | 'system';
  fontScale: number;
  onboardingStep: OnboardingStep;
  onboardingStartedAt: number | null;
  selfProfileId: string | null;
  firstReadingId: string | null;
  lastTodayDate: string | null;
  isPlus: boolean;
  credits: number;
  freeFirstReadingAvailable: boolean;
  devPseudoLocale: boolean;
  setHydrated: (v: boolean) => void;
  setHasToken: (v: boolean) => void;
  setUser: (u: UserSettings | null) => void;
  patchUser: (p: Partial<UserSettings>) => void;
  setUiLocale: (l: UiLocale) => void;
  setScheme: (s: 'dark' | 'light' | 'system') => void;
  setFontScale: (f: number) => void;
  setOnboardingStep: (s: OnboardingStep) => void;
  setSelfProfileId: (id: string | null) => void;
  setFirstReadingId: (id: string | null) => void;
  setLastTodayDate: (d: string | null) => void;
  setEntitlements: (e: { isPlus: boolean; credits: number; freeFirstReadingAvailable: boolean }) => void;
  setDevPseudoLocale: (v: boolean) => void;
  reset: () => void;
}

const initial = {
  hydrated: false,
  hasToken: false,
  user: null,
  uiLocale: 'en' as UiLocale,
  scheme: 'dark' as const,
  fontScale: 1,
  onboardingStep: 'locale' as OnboardingStep,
  onboardingStartedAt: null,
  selfProfileId: null,
  firstReadingId: null,
  lastTodayDate: null,
  isPlus: false,
  credits: 0,
  freeFirstReadingAvailable: true,
  devPseudoLocale: false,
};

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      ...initial,
      setHydrated: (hydrated) => set({ hydrated }),
      setHasToken: (hasToken) => set({ hasToken }),
      setUser: (user) => set({ user, uiLocale: user?.locale ?? 'en' }),
      patchUser: (p) => set((s) => ({ user: s.user ? { ...s.user, ...p } : s.user })),
      setUiLocale: (uiLocale) => set({ uiLocale }),
      setScheme: (scheme) => set({ scheme }),
      setFontScale: (fontScale) => set({ fontScale }),
      setOnboardingStep: (onboardingStep) => set((s) => ({ onboardingStep, onboardingStartedAt: s.onboardingStartedAt ?? (onboardingStep !== 'done' ? Date.now() : null) })),
      setSelfProfileId: (selfProfileId) => set({ selfProfileId }),
      setFirstReadingId: (firstReadingId) => set({ firstReadingId }),
      setLastTodayDate: (lastTodayDate) => set({ lastTodayDate }),
      setEntitlements: (e) => set(e),
      setDevPseudoLocale: (devPseudoLocale) => set({ devPseudoLocale }),
      reset: () => set({ ...initial, hydrated: true }),
    }),
    {
      name: 'session',
      version: 1,
      storage: createJSONStorage(() => ({
        getItem: (k) => kv.getString(k) ?? null,
        setItem: (k, v) => kv.set(k, v),
        removeItem: (k) => kv.delete(k),
      })),
      partialize: (s) => ({ user: s.user, uiLocale: s.uiLocale, scheme: s.scheme, fontScale: s.fontScale, onboardingStep: s.onboardingStep, onboardingStartedAt: s.onboardingStartedAt, selfProfileId: s.selfProfileId, firstReadingId: s.firstReadingId, lastTodayDate: s.lastTodayDate, isPlus: s.isPlus, credits: s.credits, freeFirstReadingAvailable: s.freeFirstReadingAvailable, devPseudoLocale: s.devPseudoLocale }),
    },
  ),
);

export const selectLocale = (s: SessionState): Locale => s.user?.locale ?? (s.uiLocale === 'en-XA' ? 'en' : (s.uiLocale as Locale));
export const selectPack = (s: SessionState): TraditionPack => s.user?.traditionPack ?? 'both';
