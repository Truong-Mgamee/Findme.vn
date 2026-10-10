/**
 * Type-safe client for @findme/api.
 *
 *   const api = createClient('https://api.findme.vn', () => storage.get('token'), { locale: 'vi', tz: 'Asia/Ho_Chi_Minh' });
 *   const { data, error } = await api.GET('/v1/profiles/{id}/ziwei', { params: { path: { id }, query: { school: 'default' } } });
 *
 * Regenerate `src/schema.d.ts` with `pnpm --filter @findme/api gen:openapi`.
 */
import createOpenApiClient, { type Client, type ClientOptions, type Middleware } from 'openapi-fetch';
import type { components, paths } from './schema.js';

export type { components, paths };
export type ApiClient = Client<paths>;
export type Schemas = components['schemas'];

export type TokenGetter = () => string | null | undefined | Promise<string | null | undefined>;

export interface CreateClientOptions extends Omit<ClientOptions, 'baseUrl'> {
  /** sent as `X-Locale` on every request */
  locale?: string | (() => string | undefined);
  /** sent as `X-Tz` on every request */
  tz?: string | (() => string | undefined);
  /** called with the parsed 402 body so the app can open the paywall */
  onPaywall?: (body: PaywallBody, response: Response) => void;
  /** called when the API answers 401 (expired/invalid guest token) */
  onUnauthorized?: (response: Response) => void;
}

export interface PaywallBody {
  error: string;
  reason: string;
  paywall: true;
  message?: string;
  credits?: number;
  feature?: string;
  [k: string]: unknown;
}

const resolve = (v: string | (() => string | undefined) | undefined) => (typeof v === 'function' ? v() : v);

export function createClient(baseUrl: string, getToken?: TokenGetter, options: CreateClientOptions = {}): ApiClient {
  const { locale, tz, onPaywall, onUnauthorized, ...rest } = options;
  const client = createOpenApiClient<paths>({ baseUrl, ...rest });
  const headers: Middleware = {
    async onRequest({ request }) {
      const token = await getToken?.();
      if (token && !request.headers.has('authorization')) request.headers.set('authorization', `Bearer ${token}`);
      const l = resolve(locale);
      if (l && !request.headers.has('x-locale')) request.headers.set('x-locale', l);
      const z = resolve(tz);
      if (z && !request.headers.has('x-tz')) request.headers.set('x-tz', z);
      return request;
    },
    async onResponse({ response }) {
      if (response.status === 401) onUnauthorized?.(response);
      if (response.status === 402 && onPaywall) {
        try {
          onPaywall((await response.clone().json()) as PaywallBody, response);
        } catch {
          /* body not JSON */
        }
      }
      return response;
    },
  };
  client.use(headers);
  return client;
}

export function isPaywall(body: unknown): body is PaywallBody {
  return !!body && typeof body === 'object' && (body as { paywall?: unknown }).paywall === true;
}
