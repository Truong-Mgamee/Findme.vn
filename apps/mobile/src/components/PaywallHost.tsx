/**
 * Global paywall modal (S15). Opens on every 402 from the API client and on explicit `usePaywall().show()`.
 * Purchasing goes through the PurchasesAdapter (mock until P12); on success entitlements are refetched
 * and the original request is retried.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { Modal, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useQueryClient } from '@tanstack/react-query';
import { PaywallSheet, useTheme, type PaywallPlan } from '@findme/ui';
import { onPaywall } from '../lib/api';
import { featureFlag, track } from '../lib/analytics';
import { paywallLabels } from '../lib/format';
import { purchases, type Offering } from '../lib/purchases';
import { qk } from '../hooks/queries';
import { usePaywall } from '../store/paywall';
import { useSession } from '../store/session';

export function PaywallHost() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const qc = useQueryClient();
  const { open, trigger, retry, credits, hide, show } = usePaywall();
  const user = useSession((s) => s.user);
  const uiLocale = useSession((s) => s.uiLocale);
  const setEntitlements = useSession((s) => s.setEntitlements);
  const [offering, setOffering] = useState<Offering | null>(null);
  const [busy, setBusy] = useState(false);
  const variant = featureFlag('paywall_variant', 'soft') as 'soft' | 'hard';

  useEffect(() => onPaywall((body) => show({ trigger: 'api', body })), [show]);

  useEffect(() => {
    if (!open) return;
    track({ name: 'paywall_shown', trigger: trigger ?? 'unknown', variant });
    purchases()
      .getOfferings(user?.country ?? undefined, uiLocale)
      .then(setOffering)
      .catch(() => setOffering(null));
  }, [open, trigger, variant, user?.country, uiLocale]);

  const labels = useMemo(() => paywallLabels(tr), [tr]);

  const onSelectPlan = async (plan: PaywallPlan) => {
    track({ name: 'paywall_cta', product: plan.id, variant });
    setBusy(true);
    try {
      const r = await purchases().purchase(plan.id);
      if (r.ok && r.isPlus) {
        setEntitlements({ isPlus: true, credits: useSession.getState().credits, freeFirstReadingAvailable: useSession.getState().freeFirstReadingAvailable });
        await qc.invalidateQueries({ queryKey: qk.entitlements });
        hide();
        retry?.();
      }
    } finally {
      setBusy(false);
    }
  };

  const onUseCredit = () => {
    hide();
    retry?.('credit');
  };

  const onRestore = async () => {
    setBusy(true);
    try {
      const r = await purchases().restore();
      await qc.invalidateQueries({ queryKey: qk.entitlements });
      if (r.isPlus) {
        hide();
        retry?.();
      }
    } finally {
      setBusy(false);
    }
  };

  const balance = credits ?? useSession.getState().credits;
  return (
    <Modal visible={open} animationType={t.reduceMotion ? 'none' : 'slide'} transparent onRequestClose={hide} accessibilityViewIsModal>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: t.colors.overlay }}>
        <View style={{ maxHeight: '92%' }}>
          <PaywallSheet
            testID="paywall"
            plans={offering?.plans ?? []}
            credit={offering?.credit ? { priceLabel: offering.credit.priceLabel, credits: offering.credit.credits, balance } : null}
            labels={labels}
            experimentVariant={variant}
            busy={busy}
            onSelectPlan={(p) => void onSelectPlan(p)}
            onUseCredit={balance > 0 && retry ? onUseCredit : undefined}
            onRestore={() => void onRestore()}
            onClose={hide}
          />
        </View>
      </View>
    </Modal>
  );
}
