/** Paywall modal state: opened by any 402 (api-client onPaywall) or explicitly by a screen. */
import { create } from 'zustand';
import type { PaywallBody } from '@findme/api-client';

export type PaywallTrigger = 'second_reading' | 'ask_quota' | 'compat' | 'pick' | 'history' | 'explore' | 'settings' | string;

interface PaywallState {
  open: boolean;
  trigger: PaywallTrigger | null;
  reason: string | null;
  feature: string | null;
  credits: number | null;
  /** re-run the request that hit 402 after a successful purchase / credit choice */
  retry: ((payWith?: 'credit') => void) | null;
  show: (opts: { trigger: PaywallTrigger; body?: PaywallBody | null; retry?: ((payWith?: 'credit') => void) | null }) => void;
  hide: () => void;
}

const FEATURE_TRIGGER: Record<string, PaywallTrigger> = { deep_reading: 'second_reading', ask_ai: 'ask_quota', almanac_pick: 'pick' };

export const usePaywall = create<PaywallState>()((set) => ({
  open: false,
  trigger: null,
  reason: null,
  feature: null,
  credits: null,
  retry: null,
  show: ({ trigger, body, retry }) =>
    set({
      open: true,
      trigger: body?.feature ? FEATURE_TRIGGER[body.feature] ?? trigger : trigger,
      reason: body?.reason ?? null,
      feature: body?.feature ?? null,
      credits: typeof body?.credits === 'number' ? body.credits : null,
      retry: retry ?? null,
    }),
  hide: () => set({ open: false, retry: null }),
}));
