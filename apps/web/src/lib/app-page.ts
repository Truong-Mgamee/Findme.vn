import 'server-only';
import { redirect } from 'next/navigation';
import type { AppLocale } from '@/i18n/routing';
import { serverApi, type ApiResult } from './server-api';
import { getToken } from './auth';

/** Server-component fetch for /app pages: no token or 401 → /app/welcome (guest bootstrap). */
export async function appFetch<T>(locale: AppLocale, path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  if (!(await getToken())) redirect(`/${locale}/app/welcome`);
  const r = await serverApi<T>(path, { ...init, locale });
  if (r.status === 401) redirect(`/${locale}/app/welcome`);
  return r;
}

export interface Profile {
  id: string;
  label: string;
  isSelf: boolean;
  createdAt: string;
  core: Record<string, unknown>;
  insights: Array<{ key: string; title: string; body?: string }>;
  birthSummary: { gender: string; timeUnknown: boolean; placeName: string; calendarStandard: string; hasName: boolean };
}

/** The user's self profile (or first profile); null when none exists yet. */
export async function selfProfile(locale: AppLocale): Promise<{ profile: Profile | null; result: ApiResult<{ profiles: Profile[] }> }> {
  const r = await appFetch<{ profiles: Profile[] }>(locale, '/profiles');
  const list = r.data?.profiles ?? [];
  return { profile: list.find((p) => p.isSelf) ?? list[0] ?? null, result: r };
}

export interface MeUser {
  id: string;
  locale: string;
  country: string | null;
  traditionPack: 'eastAsia' | 'western' | 'both';
  calendarStandard: 'vn' | 'cn' | 'kr' | 'jp';
  tz: string;
  dailyHour: number;
  pushEnabled: boolean;
}
