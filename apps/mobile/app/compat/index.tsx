/** S13 Compatibility: pick/add profile 2 (or share an invite link) → POST /v1/readings compatibility (402 → paywall). */
import React, { useState } from 'react';
import { Share, View } from 'react-native';
import * as Linking from 'expo-linking';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { ErrorState } from '../../src/components/ErrorState';
import { Loading, Screen, Section } from '../../src/components/Screen';
import { useCreateReading, useProfiles } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

interface CompatFacts {
  numerology: { score: number; reasons: Array<{ key: string; weight: number }>; lifePaths: [number, number] };
  eastAsia?: { yearBranches: [number, number]; branchRelation: string; dayMasterElements: [number, number]; dayMasterRelation: string };
}

export default function CompatScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const hasToken = useSession((s) => s.hasToken);
  const selfProfileId = useSession((s) => s.selfProfileId);
  const profiles = useProfiles(hasToken);
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);
  const [partnerId, setPartnerId] = useState<string | null>(null);
  const [facts, setFacts] = useState<CompatFacts | null>(null);
  const [readingId, setReadingId] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);
  const partners = profiles.data?.filter((p) => !p.isSelf) ?? [];

  const run = async (payWith?: 'credit') => {
    if (!selfProfileId || !partnerId) return;
    setError(null);
    try {
      track({ name: 'reading_started', kind: 'compatibility', paid_by: payWith ?? 'subscription' });
      const r = await create.mutateAsync({ kind: 'compatibility', profileId: selfProfileId, partnerProfileId: partnerId, payWith });
      setFacts(r.engine?.facts as unknown as CompatFacts);
      setReadingId(r.id);
    } catch (e) {
      if (e instanceof ApiError && e.paywall) show({ trigger: 'compat', body: e.paywall, retry: (pw) => void run(pw) });
      else setError(e);
    }
  };

  const invite = async () => {
    const url = Linking.createURL(`/invite/${selfProfileId ?? 'me'}`);
    track({ name: 'invite_sent' });
    await Share.share({ message: tr('compat.inviteText', { url }) });
  };

  return (
    <Screen title={tr('explore.compat')} subtitle={tr('compat.subtitle')} back>
      {profiles.isLoading ? <Loading /> : null}
      <Section title={tr('compat.pickPartner')}>
        <Row>
          {partners.map((p) => (
            <Chip key={p.id} label={p.label} tone={partnerId === p.id ? 'selected' : 'neutral'} onPress={() => setPartnerId(p.id)} testID={`partner-${p.id}`} />
          ))}
          <Chip label={`+ ${tr('profiles.addPartner')}`} onPress={() => router.push('/profile/new')} testID="compat-add" />
        </Row>
        <Button label={tr('compat.invite')} variant="ghost" onPress={() => void invite()} style={{ marginTop: t.spacing[2] }} />
      </Section>
      <Button label={tr('compat.run')} size="lg" disabled={!partnerId || !selfProfileId} loading={create.isPending} onPress={() => void run()} style={{ marginTop: t.spacing[4] }} testID="compat-run" />
      {error ? <ErrorState error={error} onRetry={() => void run()} /> : null}
      {facts ? (
        <Section title={tr('compat.result')}>
          <Card style={{ alignItems: 'center' }}>
            <Text size="sm" color="muted">
              {tr('compat.score')}
            </Text>
            <Text size="3xl" weight="bold" color="primary" testID="compat-score">
              {facts.numerology.score}
            </Text>
            <Text size="sm" color="muted">
              {tr('compat.lifePaths', { a: facts.numerology.lifePaths[0], b: facts.numerology.lifePaths[1] })}
            </Text>
          </Card>
          {facts.eastAsia ? (
            <Card style={{ marginTop: t.spacing[2] }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Text size="md" weight="semibold">
                  {tr('compat.branchRelation')}
                </Text>
                <Badge label={tr(`compat.relations.${facts.eastAsia.branchRelation}`)} tone={facts.eastAsia.branchRelation === 'clash' ? 'danger' : facts.eastAsia.branchRelation === 'neutral' ? 'muted' : 'success'} />
              </Row>
              <Row style={{ justifyContent: 'space-between', marginTop: t.spacing[2] }}>
                <Text size="md" weight="semibold">
                  {tr('compat.dayMasterRelation')}
                </Text>
                <Badge label={tr(`compat.dayMasters.${facts.eastAsia.dayMasterRelation}`)} tone="accent" />
              </Row>
            </Card>
          ) : null}
          <View style={{ marginTop: t.spacing[3] }}>
            {facts.numerology.reasons.map((r) => (
              <Text key={r.key} size="sm" color="muted">
                • {tr(`compat.reasons.${r.key}`, { defaultValue: r.key })}
              </Text>
            ))}
          </View>
          {readingId ? <Button label={tr('reading.openDetail')} variant="secondary" onPress={() => router.push(`/reading/${readingId}`)} style={{ marginTop: t.spacing[3] }} /> : null}
        </Section>
      ) : null}
    </Screen>
  );
}
