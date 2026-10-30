/**
 * Purchases boundary. RevenueCat (react-native-purchases) is wired in P12 behind this interface;
 * the mock grants Plus locally in dev so the paywall flow can be exercised end-to-end.
 * Product ids follow docs/06 P12: plus_weekly (7-day trial), plus_monthly, plus_yearly, credits_1/5/15.
 */
import type { PaywallPlan } from '@findme/ui';
import { env } from './env';
import { kv } from './storage';

export interface Offering {
  plans: PaywallPlan[];
  credit: { productId: string; credits: number; priceLabel: string } | null;
}

export interface PurchaseResult {
  ok: boolean;
  productId?: string;
  /** entitlement granted locally (mock) or confirmed by the store */
  isPlus?: boolean;
  credits?: number;
  cancelled?: boolean;
  error?: string;
}

export interface PurchasesAdapter {
  configure(userId: string): Promise<void>;
  getOfferings(country: string | undefined, locale: string): Promise<Offering>;
  purchase(productId: string): Promise<PurchaseResult>;
  restore(): Promise<PurchaseResult>;
  /** local view of entitlements until the API webhook catches up */
  isPlus(): boolean;
}

/** Launch prices (docs/01 §S) — the store (RevenueCat offerings) is the source of truth in P12. */
const PRICE_TABLE: Record<string, { currency: string; weekly: number; monthly: number; yearly: number; credit: number }> = {
  US: { currency: 'USD', weekly: 4.99, monthly: 9.99, yearly: 39.99, credit: 4.99 },
  VN: { currency: 'VND', weekly: 29000, monthly: 69000, yearly: 349000, credit: 49000 },
  BR: { currency: 'BRL', weekly: 12.9, monthly: 24.9, yearly: 99.9, credit: 12.9 },
  JP: { currency: 'JPY', weekly: 600, monthly: 1200, yearly: 4800, credit: 600 },
  KR: { currency: 'KRW', weekly: 4900, monthly: 9900, yearly: 39000, credit: 4900 },
};

export function buildOffering(country: string | undefined, locale: string): Offering {
  const row = PRICE_TABLE[(country ?? 'US').toUpperCase()] ?? PRICE_TABLE.US!;
  const fmt = (n: number) => {
    try {
      return new Intl.NumberFormat(locale === 'en-XA' ? 'en-US' : locale, { style: 'currency', currency: row.currency, maximumFractionDigits: row.currency === 'VND' || row.currency === 'JPY' || row.currency === 'KRW' ? 0 : 2 }).format(n);
    } catch {
      return `${n} ${row.currency}`;
    }
  };
  return {
    plans: [
      { id: 'plus_weekly', period: 'weekly', priceLabel: fmt(row.weekly), trialDays: 7 },
      { id: 'plus_monthly', period: 'monthly', priceLabel: fmt(row.monthly), perWeekLabel: `≈ ${fmt(row.monthly / 4.33)} / wk` },
      { id: 'plus_yearly', period: 'yearly', priceLabel: fmt(row.yearly), perWeekLabel: `≈ ${fmt(row.yearly / 52)} / wk`, bestValue: true },
    ],
    credit: { productId: 'credits_1', credits: 1, priceLabel: fmt(row.credit) },
  };
}

const MOCK_KEY = 'purchases.mock.plus';

export class MockPurchasesAdapter implements PurchasesAdapter {
  private plus = kv.getString(MOCK_KEY) === '1';
  async configure(): Promise<void> {
    /* nothing to configure */
  }
  async getOfferings(country: string | undefined, locale: string): Promise<Offering> {
    return buildOffering(country, locale);
  }
  async purchase(productId: string): Promise<PurchaseResult> {
    if (!env.isDev) return { ok: false, error: 'purchases_not_configured' };
    if (productId.startsWith('credits_')) return { ok: true, productId, credits: Number(productId.split('_')[1] ?? 1) };
    this.plus = true;
    kv.set(MOCK_KEY, '1');
    return { ok: true, productId, isPlus: true };
  }
  async restore(): Promise<PurchaseResult> {
    return { ok: true, isPlus: this.plus };
  }
  isPlus(): boolean {
    return this.plus;
  }
}

let adapter: PurchasesAdapter = new MockPurchasesAdapter();
export function setPurchasesAdapter(a: PurchasesAdapter): void {
  adapter = a;
}
export function purchases(): PurchasesAdapter {
  return adapter;
}
