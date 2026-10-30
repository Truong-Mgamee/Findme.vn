/**
 * PostHog wrapper. Events + props follow docs/analytics-events.md. No-op when EXPO_PUBLIC_POSTHOG_KEY is empty.
 * Never send birth dates or names (super props carry locale/pack/calendar/platform/is_plus only).
 */
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { env } from './env';

export type AnalyticsEvent =
  | { name: 'app_open'; source: 'push' | 'deeplink' | 'icon' }
  | { name: 'onboarding_step'; step: 'locale' | 'pack' | 'birth' | 'insights' | 'daily_time' | 'first_reading'; index: number }
  | { name: 'onboarding_completed'; duration_ms: number; time_unknown: boolean }
  | { name: 'profile_created'; is_self: boolean; time_unknown: boolean; tz_estimated: boolean; has_name: boolean }
  | { name: 'first_reading_done'; kind: string; first_token_ms: number; total_ms: number; used_fallback_template: boolean }
  | { name: 'daily_oracle_viewed'; streak: number; segment_key: string; from_cache: boolean; clash_day: boolean }
  | { name: 'push_permission'; granted: boolean }
  | { name: 'module_opened'; module: 'ziwei' | 'bazi' | 'tarot' | 'numerology' | 'iching' | 'almanac' | 'compat' | 'astro' }
  | { name: 'reading_started'; kind: string; paid_by: string }
  | { name: 'reading_finished'; kind: string; attempts: number; used_fallback_template: boolean; cost_usd?: number; sections: number }
  | { name: 'reading_rated'; kind: string; score: 1 | -1 }
  | { name: 'ask_sent'; quota_left: number | null; has_reading_context: boolean }
  | { name: 'paywall_shown'; trigger: string; variant: string }
  | { name: 'paywall_cta'; product: string; variant: string }
  | { name: 'share_clicked'; type: 'today' | 'ziwei' | 'tarot'; channel?: string }
  | { name: 'share_completed'; type: 'today' | 'ziwei' | 'tarot'; channel?: string }
  | { name: 'invite_sent' }
  | { name: 'invite_accepted' }
  | { name: 'date_pick_run'; task: string; range_days: number; profiles: number }
  | { name: 'settings_changed'; key: 'locale' | 'calendar_standard' | 'daily_hour' | 'tradition_pack' | 'push' }
  | { name: 'data_delete_requested' }
  | { name: 'error_shown'; code: string; route: string };

export interface SuperProps {
  locale?: string;
  tradition_pack?: string;
  calendar_standard?: string;
  country?: string;
  is_plus?: boolean;
  experiment_variants?: Record<string, string>;
}

type PostHogLike = { capture(event: string, props?: Record<string, unknown>): unknown; identify(id: string, props?: Record<string, unknown>): unknown; register(props: Record<string, unknown>): unknown; reset(): unknown; getFeatureFlag?(key: string): unknown };

let client: PostHogLike | null = null;
let superProps: Record<string, unknown> = { platform: Platform.OS, app_version: Constants.expoConfig?.version ?? '0.0.0' };
const queue: Array<[string, Record<string, unknown>]> = [];

export async function initAnalytics(): Promise<void> {
  if (!env.posthogKey || client) return;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PostHog } = require('posthog-react-native') as { PostHog: new (key: string, opts: Record<string, unknown>) => PostHogLike };
    client = new PostHog(env.posthogKey, { host: env.posthogHost, captureAppLifecycleEvents: false });
    client.register(superProps);
    for (const [n, p] of queue.splice(0)) client.capture(n, p);
  } catch (e) {
    if (env.isDev) console.warn('[analytics] PostHog unavailable', e);
  }
}

export function setSuperProps(p: SuperProps): void {
  superProps = { ...superProps, ...p };
  client?.register(superProps);
}

export function identify(userId: string): void {
  client?.identify(userId);
}

export function resetAnalytics(): void {
  client?.reset();
}

export function track<E extends AnalyticsEvent>(e: E): void {
  const { name, ...props } = e as AnalyticsEvent & Record<string, unknown>;
  if (env.isDev && !client) console.debug('[analytics]', name, props);
  if (client) client.capture(name, props);
  else if (env.posthogKey) queue.push([name, props]);
}

/** PostHog feature flag with fallback (e.g. `paywall_variant`). */
export function featureFlag(key: string, fallback: string): string {
  const v = client?.getFeatureFlag?.(key);
  return typeof v === 'string' ? v : fallback;
}
