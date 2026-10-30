import 'server-only';
import { headers } from 'next/headers';
import { apiUrl } from './env';
import { getToken } from './auth';

export interface ApiResult<T> {
  status: number;
  data: T | null;
  /** parsed error / paywall body when status >= 400 */
  error: Record<string, unknown> | null;
  /** true when no API URL is configured */
  unconfigured: boolean;
}

/**
 * Server-component fetch against @findme/api with the guest token from the httpOnly cookie.
 * Always resolves (never throws) so pages can branch on `status` (401 → welcome, 402 → paywall).
 */
export async function serverApi<T>(path: string, init: RequestInit & { locale?: string; tz?: string } = {}): Promise<ApiResult<T>> {
  const base = apiUrl();
  if (!base) return { status: 0, data: null, error: null, unconfigured: true };
  const token = await getToken();
  const h = await headers();
  const { locale, tz, ...rest } = init;
  const reqHeaders = new Headers(rest.headers);
  reqHeaders.set('accept', 'application/json');
  if (token) reqHeaders.set('authorization', `Bearer ${token}`);
  if (locale) reqHeaders.set('x-locale', locale);
  reqHeaders.set('x-tz', tz ?? h.get('x-tz') ?? 'UTC');
  if (rest.body && !reqHeaders.has('content-type')) reqHeaders.set('content-type', 'application/json');
  try {
    const res = await fetch(`${base}/v1${path.startsWith('/') ? path : `/${path}`}`, { ...rest, headers: reqHeaders, cache: 'no-store', signal: AbortSignal.timeout(15000) });
    const text = await res.text();
    const json = text ? (JSON.parse(text) as unknown) : null;
    if (res.ok) return { status: res.status, data: json as T, error: null, unconfigured: false };
    return { status: res.status, data: null, error: (json as Record<string, unknown>) ?? { error: res.statusText }, unconfigured: false };
  } catch (e) {
    return { status: 599, data: null, error: { error: 'network', message: e instanceof Error ? e.message : String(e) }, unconfigured: false };
  }
}
