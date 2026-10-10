/** Paywall plans (docs/01 §S price table). Stripe products/prices are wired in P12; ids are the RevenueCat product ids. */
export interface Plan {
  id: 'plus_weekly' | 'plus_monthly' | 'plus_yearly';
  period: 'week' | 'month' | 'year';
  usd: string;
  vnd: string;
  trialDays?: number;
  best?: boolean;
}

export const PLANS: Plan[] = [
  { id: 'plus_weekly', period: 'week', usd: '$4.99', vnd: '29.000₫', trialDays: 7 },
  { id: 'plus_monthly', period: 'month', usd: '$9.99', vnd: '69.000₫' },
  { id: 'plus_yearly', period: 'year', usd: '$39.99', vnd: '349.000₫', best: true },
];

export interface CreditPack {
  id: 'credits_1' | 'credits_5' | 'credits_15';
  credits: number;
  usd: string;
  vnd: string;
}

export const CREDIT_PACKS: CreditPack[] = [
  { id: 'credits_1', credits: 1, usd: '$4.99', vnd: '49.000₫' },
  { id: 'credits_5', credits: 5, usd: '$9.99', vnd: '99.000₫' },
  { id: 'credits_15', credits: 15, usd: '$19.99', vnd: '199.000₫' },
];
