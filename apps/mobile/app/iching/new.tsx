/** S11 I Ching: cast 6 lines (coins/yarrow) with haptics, primary + relating hexagram, judgment/image text. API `iching` is 501 → local only. */
import React, { useState } from 'react';
import { TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Haptics from 'expo-haptics';
import { castHexagram, castLine, resolveLines, type CastMethod, type LineValue } from '@findme/engine-iching';
import { Badge, Button, Card, Chip, HexagramView, Row, Text, useTheme } from '@findme/ui';
import { Banner } from '../../src/components/ErrorState';
import { Screen, Section } from '../../src/components/Screen';
import { track } from '../../src/lib/analytics';
import { selectLocale, useSession } from '../../src/store/session';

function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export default function IchingScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const locale = useSession(selectLocale);
  const [method, setMethod] = useState<CastMethod>('coins');
  const [question, setQuestion] = useState('');
  const [lines, setLines] = useState<LineValue[]>([]);
  const [rnd, setRnd] = useState<(() => number) | null>(null);
  const hexLabels = { yang: tr('iching.yang'), yin: tr('iching.yin'), changing: tr('iching.changing'), line: tr('iching.line') };

  const castOne = () => {
    const r = rnd ?? mulberry(Date.now() ^ question.length);
    if (!rnd) {
      setRnd(() => r);
      track({ name: 'reading_started', kind: 'iching', paid_by: 'free_first' });
    }
    const v = castLine(method, r);
    setLines((l) => [...l, v]);
    void Haptics.impactAsync(v === 6 || v === 9 ? Haptics.ImpactFeedbackStyle.Heavy : Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
  };
  const castAll = () => {
    const c = castHexagram({ method, seed: `${Date.now()}:${question}` });
    setLines(c.lines);
    track({ name: 'reading_started', kind: 'iching', paid_by: 'free_first' });
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
  };
  const reset = () => {
    setLines([]);
    setRnd(null);
  };
  const result = lines.length === 6 ? resolveLines(lines) : null;
  const name = (h: { name_zh: string; name_en: string; name_vi: string; number: number }) => `${h.number}. ${locale === 'vi' && h.name_vi ? h.name_vi : h.name_en} ${h.name_zh}`;

  return (
    <Screen title={tr('explore.iching')} subtitle={tr('iching.subtitle')} back>
      <Row accessibilityRole="radiogroup">
        <Chip label={tr('iching.coins')} tone={method === 'coins' ? 'selected' : 'neutral'} onPress={() => setMethod('coins')} />
        <Chip label={tr('iching.yarrow')} tone={method === 'yarrow' ? 'selected' : 'neutral'} onPress={() => setMethod('yarrow')} />
      </Row>
      <TextInput value={question} onChangeText={setQuestion} editable={lines.length === 0} placeholder={tr('tarot.questionPlaceholder')} placeholderTextColor={t.colors.textMuted} accessibilityLabel={tr('tarot.question')} style={{ borderWidth: 1, borderColor: t.colors.border, borderRadius: t.radii.md, padding: t.spacing[3], color: t.colors.text, backgroundColor: t.colors.surface, minHeight: t.touchTarget, marginTop: t.spacing[2], fontSize: 16 * t.fontScale }} />
      <View style={{ alignItems: 'center', marginTop: t.spacing[5] }}>
        <HexagramView lines={lines.length ? lines : [7, 7, 7, 7, 7, 7]} revealed={lines.length} width={180} labels={hexLabels} testID="hexagram-primary" title={result ? name(result.primary) : undefined} />
      </View>
      <Row style={{ marginTop: t.spacing[4], justifyContent: 'center' }}>
        {lines.length < 6 ? (
          <>
            <Button label={tr('iching.castLine', { n: lines.length + 1 })} size="lg" onPress={castOne} style={{ marginEnd: t.spacing[2] }} testID="iching-cast" />
            <Button label={tr('iching.castAll')} variant="secondary" onPress={castAll} testID="iching-cast-all" />
          </>
        ) : (
          <Button label={tr('iching.again')} variant="secondary" onPress={reset} testID="iching-reset" />
        )}
      </Row>
      {result ? (
        <Section title={tr('iching.result')}>
          <Card style={{ marginBottom: t.spacing[2] }}>
            <Text size="xs" color="accent" weight="semibold">
              {tr('iching.primary')}
            </Text>
            <Text size="lg" weight="bold" han>
              {name(result.primary)}
            </Text>
            <Text size="sm" color="muted">
              {result.primary.name_en_modern}
            </Text>
            <Text size="sm" style={{ marginTop: t.spacing[2] }}>
              {locale === 'vi' && result.primary.text_vi ? result.primary.text_vi : result.primary.judgment_en}
            </Text>
            <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
              {result.primary.image_en}
            </Text>
          </Card>
          {result.changingLines.length ? (
            <Card style={{ marginBottom: t.spacing[2] }}>
              <Row>
                <Text size="xs" color="accent" weight="semibold" style={{ marginEnd: t.spacing[2] }}>
                  {tr('iching.changingLines')}
                </Text>
                {result.changingLines.map((n) => (
                  <Badge key={n} label={String(n)} tone="primary" style={{ marginEnd: 4 }} />
                ))}
              </Row>
              {result.changingLines.map((n) => (
                <Text key={n} size="sm" style={{ marginTop: t.spacing[1] }}>
                  {n}. {result.primary.lines[n - 1]?.text_en}
                </Text>
              ))}
            </Card>
          ) : null}
          {result.relating ? (
            <Card>
              <Text size="xs" color="accent" weight="semibold">
                {tr('iching.relating')}
              </Text>
              <Row style={{ justifyContent: 'space-between' }}>
                <View style={{ flex: 1 }}>
                  <Text size="lg" weight="bold" han>
                    {name(result.relating)}
                  </Text>
                  <Text size="sm" color="muted">
                    {result.relating.name_en_modern}
                  </Text>
                </View>
                <HexagramView lines={result.relating.lines_binary.split('').map((b) => b === '1')} width={72} labels={hexLabels} testID="hexagram-relating" />
              </Row>
            </Card>
          ) : null}
          <Banner text={tr('iching.aiComingSoon')} tone="info" />
          <Text size="xs" color="muted">
            {tr('iching.sourceCredit')}
          </Text>
        </Section>
      ) : null}
    </Screen>
  );
}
