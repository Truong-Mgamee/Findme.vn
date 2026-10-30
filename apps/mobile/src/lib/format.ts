/** Intl-based formatting (docs/05 §6.2) + label bundles that adapt packages/ui components to i18n. */
import type { TFunction } from 'i18next';
import type { DayAlmanac } from '@findme/engine-almanac';
import type { AlmanacLabels, OracleLabels, PaywallLabels, PaywallPlan, ZiweiLabels } from '@findme/ui';
import { intlTag } from './i18n';

export function fmtDate(date: string | Date, locale: string, opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' }): string {
  const d = typeof date === 'string' ? new Date(`${date}T12:00:00`) : date;
  try {
    return new Intl.DateTimeFormat(intlTag(locale), opts).format(d);
  } catch {
    return typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  }
}

export function fmtHour(hour: number, locale: string): string {
  const d = new Date(2000, 0, 1, hour, 0);
  try {
    return new Intl.DateTimeFormat(intlTag(locale), { hour: 'numeric', minute: '2-digit' }).format(d);
  } catch {
    return `${String(hour).padStart(2, '0')}:00`;
  }
}

export function fmtNumber(n: number, locale: string): string {
  try {
    return new Intl.NumberFormat(intlTag(locale)).format(n);
  } catch {
    return String(n);
  }
}

export function todayISO(tz?: string): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
    const g = (t: string) => parts.find((p) => p.type === t)?.value ?? '';
    return `${g('year')}-${g('month')}-${g('day')}`;
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function addDaysISO(date: string, days: number): string {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function lunarDateLabel(a: DayAlmanac, t: TFunction): string {
  return t('almanac.lunarDate', { day: a.lunar.day, month: a.lunar.month, leap: a.lunar.isLeapMonth ? 1 : 0 });
}

export function almanacLabels(t: TFunction): Partial<AlmanacLabels> {
  return {
    huangdao: t('almanac.huangdao'),
    heidao: t('almanac.heidao'),
    yi: t('almanac.yi'),
    ji: t('almanac.ji'),
    goodHours: t('today.goodHours'),
    clash: (z, g) => t('almanac.clash', { zodiac: z, ganzhi: g }),
    clashesWithUser: t('almanac.clashesWithUser'),
    harmsUser: t('almanac.harmsUser'),
    luckyNumber: t('today.luckyNumber'),
    luckyColor: t('today.luckyColor'),
    standard: { vn: t('almanac.standard.vn'), cn: t('almanac.standard.cn'), kr: t('almanac.standard.kr'), jp: t('almanac.standard.jp') },
    lunarDate: (a) => lunarDateLabel(a, t),
    solarTerm: t('almanac.solarTerm'),
  };
}

export function oracleLabels(t: TFunction): Partial<OracleLabels> {
  return {
    streak: (n) => t('today.streak', { count: n }),
    overview: t('today.pages.overview'),
    almanacPage: t('today.pages.almanac'),
    tarotPage: t('today.cardOfDay'),
    numbersPage: t('today.pages.numbers'),
    actionPage: t('today.pages.action'),
    luckyNumber: t('today.luckyNumber'),
    luckyColor: t('today.luckyColor'),
    personalDay: (n) => t('today.personalDay', { number: n }),
    moonIn: (s) => t('today.moonIn', { sign: t(`astro.signs.${s}`) }),
    moonPhase: (p) => t(`astro.moonPhase.${p}`),
    retrograde: (b) => t('today.retrograde', { bodies: b }),
    focus: t('today.focus'),
    luckyHint: t('today.luckyHint'),
    share: t('today.share'),
    ask: t('today.askMore'),
    offline: t('today.offline'),
    noContent: t('today.noContent'),
    almanac: almanacLabels(t),
    page: (i, n) => t('a11y.page', { index: i, total: n }),
  };
}

export function ziweiLabels(t: TFunction): Partial<ZiweiLabels> {
  return {
    body: t('ziwei.bodyTag'),
    decadal: t('ziwei.decadal'),
    yearly: t('ziwei.yearly'),
    monthly: t('ziwei.monthly'),
    soulStar: t('ziwei.soulStar'),
    bodyStar: t('ziwei.bodyStar'),
    fiveClass: t('ziwei.fiveClass'),
    palaceA11y: (p, stars) => t('a11y.palace', { palace: p.name, branch: `${p.stem.name} ${p.branch.name}`, stars: stars || t('ziwei.emptyPalace') }),
  };
}

export function paywallLabels(t: TFunction, opts: { features?: string[] } = {}): PaywallLabels {
  const period = (p: PaywallPlan['period']) => t(`paywall.period.${p}`);
  return {
    title: t('paywall.title'),
    subtitle: t('paywall.subtitle'),
    periods: { weekly: t('paywall.weekly'), monthly: t('paywall.monthly'), yearly: t('paywall.yearly') },
    bestValue: t('paywall.bestValue'),
    cta: (plan) => (plan.trialDays ? t('paywall.trialCta') : t('paywall.subscribeCta', { price: plan.priceLabel })),
    renewNotice: (plan) => (plan.trialDays ? t('paywall.renewNotice', { price: plan.priceLabel, period: period(plan.period) }) : t('paywall.renewNoticeNoTrial', { price: plan.priceLabel, period: period(plan.period) })),
    useCredit: t('paywall.useCredit'),
    creditBalance: (n) => t('paywall.creditBalance', { count: n }),
    restore: t('paywall.restore'),
    close: t('common.close'),
    terms: t('paywall.terms'),
    features: opts.features ?? [t('paywall.features.readings'), t('paywall.features.ask'), t('paywall.features.compat'), t('paywall.features.history')],
  };
}
