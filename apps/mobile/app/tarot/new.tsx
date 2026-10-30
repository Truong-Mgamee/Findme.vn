/**
 * S9 Tarot: pick a spread, type a question, draw locally with @findme/engine-tarot (seeded), flip cards,
 * show a keyword-based local interpretation. POST /v1/readings tarot_spread returns 501 today → "coming soon".
 */
import React, { useMemo, useState } from 'react';
import { TextInput, View, useWindowDimensions } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { drawCards, SPREAD_IDS, type Draw, type SpreadId } from '@findme/engine-tarot';
import { Badge, Button, Card, Chip, Row, TarotSpread, Text, useTheme, type TarotSpreadCard } from '@findme/ui';
import { Banner } from '../../src/components/ErrorState';
import { Screen, Section } from '../../src/components/Screen';
import { useCreateReading } from '../../src/hooks/queries';
import { track } from '../../src/lib/analytics';
import { ApiError } from '../../src/lib/api';
import { cardImageUri } from '../../src/lib/env';
import { usePaywall } from '../../src/store/paywall';
import { useSession } from '../../src/store/session';

export default function TarotScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { width } = useWindowDimensions();
  const selfProfileId = useSession((s) => s.selfProfileId);
  const [spread, setSpread] = useState<SpreadId>('three');
  const [question, setQuestion] = useState('');
  const [draw, setDraw] = useState<Draw | null>(null);
  const [flipped, setFlipped] = useState<boolean[]>([]);
  const [serverNote, setServerNote] = useState<string | null>(null);
  const create = useCreateReading();
  const show = usePaywall((s) => s.show);

  const doDraw = () => {
    const seed = `${Date.now()}:${question}`;
    const d = drawCards({ spread, seed });
    setDraw(d);
    setFlipped(d.cards.map(() => false));
    setServerNote(null);
    track({ name: 'reading_started', kind: 'tarot_spread', paid_by: 'free_first' });
    void Haptics.selectionAsync().catch(() => undefined);
  };

  const flip = (i: number) => {
    setFlipped((f) => f.map((v, j) => (j === i ? true : v)));
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const flipAll = () => setFlipped((f) => f.map(() => true));

  const cards: TarotSpreadCard[] = useMemo(() => (draw ? draw.cards.map((c) => ({ id: c.card.id, name: tr(`tarot.cards.${c.card.id}`, { defaultValue: c.card.name_en }), reversed: c.reversed, position: { key: c.position.key, label: tr(`tarot.positions.${c.position.key}`, { defaultValue: c.position.label_en }) } })) : []), [draw, tr]);
  const allFlipped = flipped.length > 0 && flipped.every(Boolean);

  const saveToServer = async (payWith?: 'credit') => {
    if (!draw || !selfProfileId) return;
    try {
      await create.mutateAsync({ kind: 'tarot_spread', profileId: selfProfileId, params: { spread, seed: String(draw.seed), question, cards: draw.cards.map((c) => ({ id: c.card.id, reversed: c.reversed, position: c.position.key })) }, payWith });
      setServerNote(tr('tarot.saved'));
    } catch (e) {
      if (e instanceof ApiError && e.status === 501) setServerNote(tr('tarot.aiComingSoon'));
      else if (e instanceof ApiError && e.paywall) show({ trigger: 'second_reading', body: e.paywall, retry: (pw) => void saveToServer(pw) });
      else setServerNote(tr('common.errorGeneric'));
    }
  };

  return (
    <Screen title={tr('explore.tarot')} subtitle={tr('tarot.subtitle')} back>
      <Row accessibilityRole="radiogroup">
        {SPREAD_IDS.map((s) => (
          <Chip key={s} label={tr(`tarot.spreads.${s}`)} tone={spread === s ? 'selected' : 'neutral'} onPress={() => setSpread(s)} testID={`spread-${s}`} />
        ))}
      </Row>
      <TextInput value={question} onChangeText={setQuestion} placeholder={tr('tarot.questionPlaceholder')} placeholderTextColor={t.colors.textMuted} accessibilityLabel={tr('tarot.question')} testID="tarot-question" style={{ borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radii.md, padding: t.spacing[3], color: t.colors.text, backgroundColor: t.colors.surface, minHeight: t.touchTarget, marginTop: t.spacing[2], fontSize: 16 * t.fontScale }} />
      <Button label={draw ? tr('tarot.redraw') : tr('tarot.draw')} size="lg" onPress={doDraw} style={{ marginTop: t.spacing[3] }} testID="tarot-draw" />
      {draw ? (
        <>
          <View style={{ marginTop: t.spacing[5], alignItems: 'center' }}>
            <TarotSpread spread={spread} cards={cards} flipState={flipped} cardImageUri={(id) => cardImageUri(id)} onPressCard={(_, i) => flip(i)} width={Math.min(width - 32, 480)} labels={{ faceDown: tr('tarot.faceDown'), reversed: tr('tarot.reversed') }} testID="tarot-spread" />
          </View>
          {!allFlipped ? (
            <Button label={tr('tarot.flipAll')} variant="secondary" onPress={flipAll} style={{ marginTop: t.spacing[6] }} testID="tarot-flip-all" />
          ) : (
            <Section title={tr('tarot.interpretation')}>
              <Banner text={tr('tarot.localNote')} tone="info" />
              {draw.cards.map((c, i) => (
                <Card key={`${c.card.id}-${i}`} style={{ marginBottom: t.spacing[2] }}>
                  <Row style={{ justifyContent: 'space-between' }}>
                    <Text size="xs" color="accent" weight="semibold">
                      {cards[i]?.position.label}
                    </Text>
                    {c.reversed ? <Badge label={tr('tarot.reversed')} tone="warning" /> : null}
                  </Row>
                  <Text size="lg" weight="bold">
                    {cards[i]?.name}
                  </Text>
                  <Text size="sm" color="muted">
                    {(c.reversed ? c.card.keywords_reversed : c.card.keywords_upright).join(' · ')}
                  </Text>
                  <Text size="sm" style={{ marginTop: t.spacing[1] }}>
                    {c.card.waite_pd_excerpt}
                  </Text>
                </Card>
              ))}
              {selfProfileId ? <Button label={tr('tarot.askAi')} onPress={() => void saveToServer()} loading={create.isPending} testID="tarot-save" /> : null}
              {serverNote ? (
                <Text size="sm" color="muted" style={{ marginTop: t.spacing[2] }} testID="tarot-note">
                  {serverNote}
                </Text>
              ) : null}
              <Text size="xs" color="muted" style={{ marginTop: t.spacing[3] }}>
                {tr('tarot.deckCredit')}
              </Text>
            </Section>
          )}
        </>
      ) : null}
    </Screen>
  );
}
