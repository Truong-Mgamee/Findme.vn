/**
 * S14 Ask AI: chat UI calling POST /v1/ai/ask {question, readingId?} → {text, quotaLeft}.
 * The route does not exist in the API yet (P8) → 404 is shown as "coming soon"; 402 opens the paywall.
 */
import React, { useMemo, useRef, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Badge, Button, Card, Chip, Row, Text, useTheme } from '@findme/ui';
import { Banner } from '../../src/components/ErrorState';
import { Screen } from '../../src/components/Screen';
import { useReadings } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { apiUrl, authHeaders, isPaywallBody } from '../../src/lib/ask';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

interface Msg {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
}

const FREE_QUOTA = 3;

export default function AskScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const params = useLocalSearchParams<{ readingId?: string }>();
  const hasToken = useSession((s) => s.hasToken);
  const show = usePaywall((s) => s.show);
  const readings = useReadings(5, hasToken);
  const [readingId, setReadingId] = useState<string | undefined>(params.readingId);
  const [input, setInput] = useState('');
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [quota, setQuota] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const suggestions = useMemo(() => [tr('ask.suggest.today'), tr('ask.suggest.love'), tr('ask.suggest.career'), tr('ask.suggest.decision')], [tr]);

  const send = async (question: string, payWith?: 'credit') => {
    const q = question.trim();
    if (!q || busy) return;
    setInput('');
    setBusy(true);
    setMsgs((m) => [...m, { id: `${Date.now()}-u`, role: 'user', text: q }]);
    try {
      const res = await fetch(apiUrl('/v1/ai/ask'), { method: 'POST', headers: authHeaders({ 'content-type': 'application/json' }), body: JSON.stringify({ question: q, readingId, payWith }) });
      if (res.status === 404 || res.status === 501) {
        setUnavailable(true);
        setMsgs((m) => [...m, { id: `${Date.now()}-s`, role: 'system', text: tr('ask.comingSoon') }]);
        return;
      }
      const body = (await res.json().catch(() => ({}))) as { text?: string; quotaLeft?: number; reason?: string; paywall?: boolean; feature?: string; credits?: number; error?: string };
      if (res.status === 402 && isPaywallBody(body)) {
        show({ trigger: 'ask_quota', body, retry: (pw) => void send(q, pw) });
        setMsgs((m) => m.slice(0, -1));
        return;
      }
      if (!res.ok) {
        setMsgs((m) => [...m, { id: `${Date.now()}-e`, role: 'system', text: tr('common.errorGeneric') }]);
        return;
      }
      setQuota(typeof body.quotaLeft === 'number' ? body.quotaLeft : null);
      track({ name: 'ask_sent', quota_left: typeof body.quotaLeft === 'number' ? body.quotaLeft : null, has_reading_context: !!readingId });
      setMsgs((m) => [...m, { id: `${Date.now()}-a`, role: 'assistant', text: body.text ?? '' }]);
    } catch {
      setMsgs((m) => [...m, { id: `${Date.now()}-e`, role: 'system', text: tr('errors.network') }]);
    } finally {
      setBusy(false);
      setTimeout(() => scroll.current?.scrollToEnd({ animated: !t.reduceMotion }), 50);
    }
  };

  return (
    <Screen title={tr('ask.title')} subtitle={tr('ask.subtitle')} scroll={false} tabs right={<Badge label={tr('ask.quota', { count: quota ?? FREE_QUOTA })} tone={quota === 0 ? 'warning' : 'muted'} />}>
      {unavailable ? <Banner text={tr('ask.comingSoon')} tone="info" testID="ask-unavailable" /> : null}
      {readings.data?.length ? (
        <Row style={{ marginBottom: t.spacing[2] }}>
          <Text size="xs" color="muted" style={{ marginEnd: t.spacing[2] }}>
            {tr('ask.context')}
          </Text>
          <Chip label={tr('ask.noContext')} tone={!readingId ? 'selected' : 'neutral'} onPress={() => setReadingId(undefined)} />
          {readings.data.slice(0, 3).map((r) => (
            <Chip key={r.id} label={tr(`reading.kinds.${r.kind}`)} tone={readingId === r.id ? 'selected' : 'neutral'} onPress={() => setReadingId(r.id)} />
          ))}
        </Row>
      ) : null}
      <ScrollView ref={scroll} style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: t.spacing[4] }} keyboardShouldPersistTaps="handled">
        {msgs.length === 0 ? (
          <Card>
            <Text size="md" color="muted">
              {tr('ask.empty')}
            </Text>
            <Row style={{ marginTop: t.spacing[3] }}>
              {suggestions.map((s) => (
                <Chip key={s} label={s} onPress={() => void send(s)} />
              ))}
            </Row>
          </Card>
        ) : null}
        {msgs.map((m) => (
          <View key={m.id} accessibilityRole="text" accessibilityLabel={`${tr(`ask.role.${m.role}`)}: ${m.text}`} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%', marginBottom: t.spacing[2], backgroundColor: m.role === 'user' ? t.colors.primary : m.role === 'system' ? t.colors.surfaceAlt : t.colors.surface, borderRadius: t.radii.lg, padding: t.spacing[3], borderWidth: 1, borderColor: t.colors.border }}>
            <Text size="md" style={{ color: m.role === 'user' ? t.colors.onPrimary : t.colors.text }}>
              {m.text}
            </Text>
          </View>
        ))}
        {busy ? (
          <Text size="sm" color="muted">
            {tr('ask.thinking')}
          </Text>
        ) : null}
      </ScrollView>
      <Row style={{ flexWrap: 'nowrap', paddingVertical: t.spacing[2] }}>
        <TextInput value={input} onChangeText={setInput} placeholder={tr('ask.placeholder')} placeholderTextColor={t.colors.textMuted} multiline accessibilityLabel={tr('ask.placeholder')} testID="ask-input" onSubmitEditing={() => void send(input)} style={{ flex: 1, minHeight: t.touchTarget, maxHeight: 120, borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radii.md, padding: t.spacing[3], color: t.colors.text, backgroundColor: t.colors.surface, fontSize: 16 * t.fontScale, marginEnd: t.spacing[2] }} />
        <Button label={tr('ask.send')} onPress={() => void send(input)} disabled={!input.trim() || busy} testID="ask-send" />
      </Row>
      <Text size="xs" color="muted">
        {tr('ask.guardrail')}
      </Text>
    </Screen>
  );
}
