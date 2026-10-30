/** TanStack Query hooks over the typed API client. Engine payloads are typed via the engine packages. */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { BirthInput, Gender, ReadingEngineOutput } from '@findme/engine-core';
import type { DayAlmanac, TaskKey } from '@findme/engine-almanac';
import type { NatalChart } from '@findme/engine-astro';
import type { BaziChart } from '@findme/engine-bazi';
import type { NumerologyResult } from '@findme/engine-numerology';
import type { ZiweiChart, ZiweiHoroscope, ZiweiSchool } from '@findme/engine-ziwei';
import type { DailyPayload } from '@findme/ui';
import { api, unwrap } from '../lib/api';
import { cacheSelfBirth } from '../lib/offline-today';
import { useSession } from '../store/session';

export interface CoreInsight {
  key: string;
  title: string;
  body?: string;
}
export interface Profile {
  id: string;
  label: string;
  isSelf: boolean;
  createdAt: string;
  core: Record<string, unknown> & {
    eastAsia?: { yearBranch: number; yearStem: number; bazi: { useful: number[]; dayMaster: { element: number } } };
    western?: { numerology: { lifePath: number }; astro: { sun: string; moon: string; rising: string | null } };
    timeKnown?: boolean;
  };
  insights: CoreInsight[];
  birthSummary: { gender: Gender; timeUnknown: boolean; placeName: string; calendarStandard: BirthInput['calendarStandard']; hasName: boolean };
  birth?: Record<string, unknown>;
}

export const qk = {
  me: ['me'] as const,
  profiles: ['profiles'] as const,
  profile: (id: string) => ['profile', id] as const,
  today: (date: string, locale: string) => ['today', date, locale] as const,
  entitlements: ['entitlements'] as const,
  ziwei: (id: string, school: string, date?: string) => ['ziwei', id, school, date ?? ''] as const,
  bazi: (id: string) => ['bazi', id] as const,
  numerology: (id: string) => ['numerology', id] as const,
  astro: (id: string, houses: string) => ['astro', id, houses] as const,
  almanac: (date: string, std: string, locale: string) => ['almanac', date, std, locale] as const,
  readings: ['readings'] as const,
  reading: (id: string) => ['reading', id] as const,
};

export function useMe(enabled = true) {
  return useQuery({ queryKey: qk.me, queryFn: async () => unwrap(await api.GET('/v1/me')), enabled });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  const patchUser = useSession((s) => s.patchUser);
  return useMutation({
    mutationFn: async (body: Parameters<typeof api.PUT<'/v1/me'>>[1] extends { body: infer B } ? B : never) => unwrap(await api.PUT('/v1/me', { body })),
    onSuccess: (u) => {
      patchUser(u);
      void qc.invalidateQueries({ queryKey: qk.me });
      void qc.invalidateQueries({ queryKey: ['today'] });
    },
  });
}

export function useProfiles(enabled = true) {
  return useQuery({
    queryKey: qk.profiles,
    queryFn: async () => unwrap(await api.GET('/v1/profiles')).profiles as unknown as Profile[],
    enabled,
  });
}

export function useProfile(id: string | null | undefined) {
  return useQuery({
    queryKey: qk.profile(id ?? ''),
    queryFn: async () => unwrap(await api.GET('/v1/profiles/{id}', { params: { path: { id: id! } } })) as unknown as Profile,
    enabled: !!id,
  });
}

export interface CreateProfileInput {
  birth: BirthInput;
  label?: string;
  isSelf?: boolean;
  fullName?: string;
}

export function useCreateProfile() {
  const qc = useQueryClient();
  const setSelfProfileId = useSession((s) => s.setSelfProfileId);
  return useMutation({
    mutationFn: async (input: CreateProfileInput) => unwrap(await api.POST('/v1/profiles', { body: input })) as unknown as Profile,
    onSuccess: async (p, input) => {
      void qc.invalidateQueries({ queryKey: qk.profiles });
      if (input.isSelf) {
        setSelfProfileId(p.id);
        const ea = p.core.eastAsia;
        await cacheSelfBirth({ ...input.birth, fullName: input.fullName, profileId: p.id, profileCore: ea ? { yearBranch: ea.yearBranch, yearStem: ea.yearStem, usefulElements: ea.bazi.useful, dayMasterElement: ea.bazi.dayMaster.element } : null });
      }
    },
  });
}

export function useDeleteProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const r = await api.DELETE('/v1/profiles/{id}', { params: { path: { id } } });
      if (!r.response.ok) unwrap(r);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: qk.profiles }),
  });
}

export function useTodayQuery(date: string, locale: string, enabled = true) {
  return useQuery({
    queryKey: qk.today(date, locale),
    queryFn: async () => unwrap(await api.GET('/v1/today')) as unknown as DailyPayload,
    enabled,
    staleTime: 60 * 60 * 1000,
    retry: 1,
  });
}

export interface Entitlements {
  subscriptions: Array<{ product: string; status: string; source: string; expiresAt: string | null; trial: boolean }>;
  credits: number;
  features: string[];
  freeFirstReadingAvailable: boolean;
}

export function useEntitlements(enabled = true) {
  const setEntitlements = useSession((s) => s.setEntitlements);
  return useQuery({
    queryKey: qk.entitlements,
    queryFn: async () => {
      const e = unwrap(await api.GET('/v1/entitlements')) as Entitlements;
      setEntitlements({ isPlus: e.subscriptions.some((s) => s.status === 'active' || s.status === 'trialing') || e.features.includes('plus'), credits: e.credits, freeFirstReadingAvailable: e.freeFirstReadingAvailable });
      return e;
    },
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

export function useZiwei(profileId: string | undefined, school: ZiweiSchool = 'default', date?: string) {
  return useQuery({
    queryKey: qk.ziwei(profileId ?? '', school, date),
    queryFn: async () => unwrap(await api.GET('/v1/profiles/{id}/ziwei', { params: { path: { id: profileId! }, query: { school, date } } })) as unknown as { chart: ZiweiChart; horoscope: ZiweiHoroscope; atomKeys: string[] },
    enabled: !!profileId,
    staleTime: Infinity,
  });
}

export function useBazi(profileId: string | undefined) {
  return useQuery({
    queryKey: qk.bazi(profileId ?? ''),
    queryFn: async () => unwrap(await api.GET('/v1/profiles/{id}/bazi', { params: { path: { id: profileId! } } })) as unknown as ReadingEngineOutput<BaziChart>,
    enabled: !!profileId,
    staleTime: Infinity,
  });
}

export function useNumerology(profileId: string | undefined) {
  return useQuery({
    queryKey: qk.numerology(profileId ?? ''),
    queryFn: async () => unwrap(await api.GET('/v1/profiles/{id}/numerology', { params: { path: { id: profileId! } } })) as unknown as ReadingEngineOutput<NumerologyResult>,
    enabled: !!profileId,
    staleTime: Infinity,
  });
}

export function useAstro(profileId: string | undefined, houses: 'placidus' | 'whole' = 'placidus') {
  return useQuery({
    queryKey: qk.astro(profileId ?? '', houses),
    queryFn: async () => unwrap(await api.GET('/v1/profiles/{id}/astro', { params: { path: { id: profileId! }, query: { houses } } })) as unknown as ReadingEngineOutput<NatalChart>,
    enabled: !!profileId,
    staleTime: Infinity,
  });
}

export function useAlmanacDay(date: string, std: DayAlmanac['standard'], locale: string, enabled = true) {
  return useQuery({
    queryKey: qk.almanac(date, std, locale),
    queryFn: async () => unwrap(await api.GET('/v1/almanac', { params: { query: { date, std, locale: locale as 'vi' } } })) as unknown as DayAlmanac,
    enabled,
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export interface Reading {
  id: string;
  kind: string;
  locale: string;
  profileId: string | null;
  partnerProfileId: string | null;
  paidBy: string;
  createdAt: string;
  input: Record<string, unknown>;
  engine: (ReadingEngineOutput<Record<string, unknown>> & Record<string, unknown>) | null;
  ai: Record<string, unknown> | null;
}

export type ReadingKind = 'ziwei_full' | 'bazi_luck' | 'numerology_full' | 'compatibility' | 'almanac_pick' | 'tarot_spread' | 'iching';

export function useCreateReading() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (body: { kind: ReadingKind; profileId: string; partnerProfileId?: string; params?: Record<string, unknown>; payWith?: 'credit' }) => unwrap(await api.POST('/v1/readings', { body })) as unknown as Reading,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: qk.readings });
      void qc.invalidateQueries({ queryKey: qk.entitlements });
    },
  });
}

export function useReadings(limit = 20, enabled = true) {
  return useQuery({ queryKey: [...qk.readings, limit], queryFn: async () => unwrap(await api.GET('/v1/readings', { params: { query: { limit } } })).readings as unknown as Reading[], enabled });
}

export function useReading(id: string | undefined) {
  return useQuery({ queryKey: qk.reading(id ?? ''), queryFn: async () => unwrap(await api.GET('/v1/readings/{id}', { params: { path: { id: id! } } })) as unknown as Reading, enabled: !!id });
}

export interface PickInput {
  task: TaskKey;
  from: string;
  to: string;
  profileIds?: string[];
  std?: DayAlmanac['standard'];
  limit?: number;
  payWith?: 'credit';
}
export interface RankedDayDto {
  date: string;
  score: number;
  reasons: Array<{ key: string; weight: number; detail?: string }>;
  lunar: DayAlmanac['lunar'];
  dayGanzhi: DayAlmanac['dayGanzhi'];
  huangdao: boolean;
  yi: DayAlmanac['yi'];
  ji: DayAlmanac['ji'];
  hours?: DayAlmanac['hours'];
}

export function usePickDates() {
  return useMutation({
    mutationFn: async (body: PickInput) => unwrap(await api.POST('/v1/almanac/pick', { body })) as unknown as { readingId: string; paidBy: string; ranked: RankedDayDto[] },
  });
}

export function useDeleteMe() {
  return useMutation({
    mutationFn: async () => {
      const r = await api.DELETE('/v1/me');
      if (!r.response.ok) unwrap(r);
    },
  });
}
