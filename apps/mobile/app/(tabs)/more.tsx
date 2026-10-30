/** More: Almanac month view entry + Date Picker + readings history + about. */
import React from 'react';
import { Pressable, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Card, Row, Text, useTheme } from '@findme/ui';
import { Screen, Section } from '../../src/components/Screen';
import { useReadings } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { fmtDate } from '../../src/lib/format';
import { useSession } from '../../src/store/session';

function RowLink({ title, subtitle, onPress, testID }: { title: string; subtitle?: string; onPress: () => void; testID?: string }) {
  const t = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} testID={testID} style={{ minHeight: 56, justifyContent: 'center', borderBottomWidth: 1, borderBottomColor: t.colors.border }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Text size="md" weight="semibold">
            {title}
          </Text>
          {subtitle ? (
            <Text size="xs" color="muted">
              {subtitle}
            </Text>
          ) : null}
        </View>
        <Text size="lg" color="muted">
          {t.isRTL ? '‹' : '›'}
        </Text>
      </Row>
    </Pressable>
  );
}

export default function MoreScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const hasToken = useSession((s) => s.hasToken);
  const uiLocale = useSession((s) => s.uiLocale);
  const readings = useReadings(10, hasToken);
  return (
    <Screen title={tr('more.title')} tabs>
      <Card padded={false} style={{ paddingHorizontal: t.spacing[4] }}>
        <RowLink
          title={tr('explore.almanac')}
          subtitle={tr('more.almanacHint')}
          testID="more-almanac"
          onPress={() => {
            track({ name: 'module_opened', module: 'almanac' });
            router.push('/almanac');
          }}
        />
        <RowLink title={tr('almanac.pick.title')} subtitle={tr('almanac.pick.hint')} testID="more-pick" onPress={() => router.push('/almanac/pick')} />
        <RowLink title={tr('explore.compat')} subtitle={tr('explore.desc.compat')} onPress={() => router.push('/compat')} />
      </Card>
      <Section title={tr('more.history')}>
        {readings.data?.length ? (
          <Card padded={false} style={{ paddingHorizontal: t.spacing[4] }}>
            {readings.data.map((r) => (
              <RowLink key={r.id} title={tr(`reading.kinds.${r.kind}`)} subtitle={`${fmtDate(r.createdAt.slice(0, 10), uiLocale)} · ${tr(`reading.paidBy.${r.paidBy}`, { defaultValue: r.paidBy })}`} onPress={() => router.push(`/reading/${r.id}`)} />
            ))}
          </Card>
        ) : (
          <Text size="sm" color="muted">
            {tr('more.noHistory')}
          </Text>
        )}
        <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
          {tr('more.historyPlusNote')}
        </Text>
      </Section>
      <Section title={tr('settings.about')}>
        <Text size="xs" color="muted">
          {tr('settings.credits')}
        </Text>
        <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
          {tr('common.disclaimer')}
        </Text>
      </Section>
    </Screen>
  );
}
