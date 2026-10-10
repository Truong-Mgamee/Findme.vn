import React, { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTheme } from '../theme.js';
import { Badge, Button, Text } from './primitives.js';

export type PlanPeriod = 'weekly' | 'monthly' | 'yearly';

export interface PaywallPlan {
  id: string;
  period: PlanPeriod;
  /** localized, e.g. "4,99 US$" / "29.000 ₫" */
  priceLabel: string;
  /** optional per-week equivalent for comparison */
  perWeekLabel?: string;
  trialDays?: number;
  bestValue?: boolean;
}

export interface PaywallCreditOption {
  priceLabel: string;
  credits: number;
  /** user's current balance */
  balance?: number;
}

export interface PaywallLabels {
  title: string;
  subtitle?: string;
  periods: Record<PlanPeriod, string>;
  bestValue: string;
  cta: (plan: PaywallPlan) => string;
  /** full-price + renewal date sentence (anti dark-pattern, docs/02 F4) */
  renewNotice: (plan: PaywallPlan) => string;
  useCredit: string;
  creditBalance?: (n: number) => string;
  restore: string;
  close: string;
  terms?: string;
  features?: string[];
}

export interface PaywallSheetProps {
  plans: PaywallPlan[];
  credit?: PaywallCreditOption | null;
  labels: PaywallLabels;
  /** A/B variant (PostHog flag) — affects ordering/emphasis only */
  experimentVariant?: 'soft' | 'hard';
  onSelectPlan: (plan: PaywallPlan) => void;
  onUseCredit?: () => void;
  onRestore: () => void;
  onClose: () => void;
  busy?: boolean;
  testID?: string;
}

/** 3 plans + credit alternative + renewal notice + restore. Pure: purchasing is the caller's job. */
export function PaywallSheet({ plans, credit, labels, experimentVariant = 'soft', onSelectPlan, onUseCredit, onRestore, onClose, busy, testID }: PaywallSheetProps) {
  const t = useTheme();
  const defaultPlan = plans.find((p) => p.bestValue) ?? plans[0];
  const [selectedId, setSelectedId] = useState<string | undefined>(defaultPlan?.id);
  const selected = plans.find((p) => p.id === selectedId) ?? defaultPlan;
  return (
    <View testID={testID} style={{ backgroundColor: t.colors.bg, borderTopLeftRadius: t.radii.xl, borderTopRightRadius: t.radii.xl, paddingTop: t.spacing[3], maxHeight: '100%' }}>
      <ScrollView contentContainerStyle={{ padding: t.spacing[4], paddingBottom: t.spacing[8] }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <View style={{ flex: 1 }}>
            <Text size="2xl" weight="bold">
              {labels.title}
            </Text>
            {labels.subtitle ? (
              <Text size="md" color="muted" style={{ marginTop: t.spacing[1] }}>
                {labels.subtitle}
              </Text>
            ) : null}
          </View>
          {experimentVariant === 'soft' ? (
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel={labels.close} hitSlop={8} style={{ minWidth: t.touchTarget, minHeight: t.touchTarget, alignItems: 'center', justifyContent: 'center' }}>
              <Text size="xl" color="muted">
                ×
              </Text>
            </Pressable>
          ) : null}
        </View>
        {labels.features?.length ? (
          <View style={{ marginTop: t.spacing[3] }}>
            {labels.features.map((f) => (
              <Text key={f} size="sm" style={{ marginBottom: t.spacing[1] }}>
                ✓ {f}
              </Text>
            ))}
          </View>
        ) : null}
        <View style={{ marginTop: t.spacing[4] }} accessibilityRole="radiogroup">
          {plans.map((p) => {
            const sel = p.id === selected?.id;
            return (
              <Pressable
                key={p.id}
                testID={`plan-${p.id}`}
                onPress={() => setSelectedId(p.id)}
                accessibilityRole="radio"
                accessibilityState={{ selected: sel, checked: sel }}
                accessibilityLabel={`${labels.periods[p.period]} ${p.priceLabel}${p.bestValue ? `, ${labels.bestValue}` : ''}`}
                style={{ flexDirection: 'row', alignItems: 'center', minHeight: 64, padding: t.spacing[3], marginBottom: t.spacing[2], borderRadius: t.radii.lg, borderWidth: 2, borderColor: sel ? t.colors.primary : t.colors.border, backgroundColor: sel ? t.colors.surfaceAlt : t.colors.surface }}
              >
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: sel ? t.colors.primary : t.colors.textMuted, alignItems: 'center', justifyContent: 'center', marginEnd: t.spacing[3] }}>
                  {sel ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: t.colors.primary }} /> : null}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                    <Text size="md" weight="semibold" style={{ marginEnd: t.spacing[2] }}>
                      {labels.periods[p.period]}
                    </Text>
                    {p.bestValue ? <Badge label={labels.bestValue} tone="primary" /> : null}
                  </View>
                  {p.perWeekLabel ? (
                    <Text size="xs" color="muted">
                      {p.perWeekLabel}
                    </Text>
                  ) : null}
                </View>
                <Text size="lg" weight="bold">
                  {p.priceLabel}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {selected ? (
          <>
            <Button label={labels.cta(selected)} size="lg" loading={busy} onPress={() => onSelectPlan(selected)} testID="paywall-cta" style={{ marginTop: t.spacing[2] }} />
            <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[2] }} testID="renew-notice">
              {labels.renewNotice(selected)}
            </Text>
          </>
        ) : null}
        {credit && onUseCredit ? (
          <Button label={`${labels.useCredit}${credit.balance !== undefined && labels.creditBalance ? ` · ${labels.creditBalance(credit.balance)}` : ''}`} variant="secondary" onPress={onUseCredit} testID="paywall-credit" style={{ marginTop: t.spacing[3] }} disabled={busy} />
        ) : null}
        <Button label={labels.restore} variant="ghost" onPress={onRestore} testID="paywall-restore" style={{ marginTop: t.spacing[2] }} disabled={busy} />
        {labels.terms ? (
          <Text size="xs" color="muted" align="center" style={{ marginTop: t.spacing[3] }}>
            {labels.terms}
          </Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
