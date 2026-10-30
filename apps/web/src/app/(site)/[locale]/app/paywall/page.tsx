import { getTranslations } from 'next-intl/server';
import type { AppLocale } from '@/i18n/routing';
import { CREDIT_PACKS, PLANS } from '@/lib/plans';
import { PaywallPlans } from '@/components/app/PaywallPlans';
import { Notice } from '@/components/app/ui';

/** S15 — shown on 402. Checkout → POST /api/checkout → /v1/billing/checkout (501 until Stripe/P12). TODO(@findme/ui): PaywallSheet. */
export default async function PaywallPage({ params, searchParams }: { params: Promise<{ locale: AppLocale }>; searchParams: Promise<{ reason?: string; feature?: string }> }) {
  const { locale } = await params;
  const sp = await searchParams;
  const t = await getTranslations({ locale, namespace: 'web.app.paywall' });
  const tp = await getTranslations({ locale, namespace: 'paywall' });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t('title')}</h1>
      <p className="text-white/80">{t('sub')}</p>
      {sp.reason && <Notice tone="warn">{t('reason', { reason: sp.feature ? `${sp.feature}: ${sp.reason}` : sp.reason })}</Notice>}
      <PaywallPlans
        locale={locale}
        plans={PLANS.map((p) => ({ id: p.id, price: locale === 'vi' ? p.vnd : p.usd, period: t(p.period === 'week' ? 'perWeek' : p.period === 'month' ? 'perMonth' : 'perYear'), name: tp(p.period === 'week' ? 'weekly' : p.period === 'month' ? 'monthly' : 'yearly'), trial: p.trialDays ? t('trial', { days: p.trialDays }) : null, best: !!p.best }))}
        credits={CREDIT_PACKS.map((c) => ({ id: c.id, price: locale === 'vi' ? c.vnd : c.usd, name: t('credit', { count: c.credits }) }))}
        labels={{ plans: t('plans'), credits: t('credits'), checkout: t('checkout'), stub: t('checkoutStub'), best: t('best'), terms: t('terms'), restore: tp('restore'), freeFirst: t('freeFirst') }}
      />
    </div>
  );
}
