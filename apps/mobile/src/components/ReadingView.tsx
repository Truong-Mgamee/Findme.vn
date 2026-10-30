/**
 * Renders a reading's SSE stream: engine summary (atom keys, confidence, warnings) immediately,
 * structured `section` events as they arrive (P8), skeleton + "AI narrative pending" otherwise.
 */
import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge, Card, Divider, Row, Text, useTheme } from '@findme/ui';
import type { ReadingStreamState } from '../hooks/useReadingStream';
import { Loading } from './Screen';

function Skeleton({ lines = 3 }: { lines?: number }) {
  const t = useTheme();
  return (
    <View accessibilityElementsHidden>
      {Array.from({ length: lines }).map((_, i) => (
        <View key={i} style={{ height: 14, borderRadius: 7, backgroundColor: t.colors.surfaceAlt, marginBottom: t.spacing[2], width: `${90 - (i % 3) * 18}%` }} />
      ))}
    </View>
  );
}

export function ReadingView({ stream, kindLabel }: { stream: ReadingStreamState; kindLabel?: string }) {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const confidenceTone = stream.engine?.confidence === 'high' ? 'success' : stream.engine?.confidence === 'low' ? 'warning' : 'muted';
  return (
    <View>
      {stream.engine ? (
        <Card testID="engine-summary" style={{ marginBottom: t.spacing[3] }}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Text size="sm" weight="semibold">
              {kindLabel ?? stream.engine.kind} · {stream.engine.engine ?? '—'}
            </Text>
            {stream.engine.confidence ? <Badge label={tr(`reading.confidence.${stream.engine.confidence}`)} tone={confidenceTone} /> : null}
          </Row>
          {stream.engine.warnings.length ? (
            <View style={{ marginTop: t.spacing[2] }}>
              {stream.engine.warnings.map((w) => (
                <Text key={w.code} size="xs" color="warning">
                  ⚠ {w.message}
                </Text>
              ))}
            </View>
          ) : null}
          <Text size="xs" color="muted" style={{ marginTop: t.spacing[2] }}>
            {tr('reading.factsCount', { count: stream.engine.atomKeys.length })}
          </Text>
        </Card>
      ) : stream.status === 'connecting' ? (
        <Loading label={tr('reading.connecting')} />
      ) : null}

      {stream.summary ? (
        <Text size="lg" weight="semibold" style={{ marginBottom: t.spacing[3] }}>
          {stream.summary}
        </Text>
      ) : null}

      {stream.sections.map((s, i) => (
        <Card key={`${i}-${s.title}`} testID={`section-${i}`} style={{ marginBottom: t.spacing[3] }}>
          <Text size="md" weight="bold" accessibilityRole="header">
            {s.title}
          </Text>
          <Text size="md" style={{ marginTop: t.spacing[1] }}>
            {s.body}
          </Text>
        </Card>
      ))}

      {stream.status === 'streaming' || (stream.status === 'done' && stream.aiStatus === 'pending' && stream.sections.length === 0) ? (
        <Card style={{ marginBottom: t.spacing[3] }}>
          <Skeleton />
          <Text size="sm" color="muted" testID="ai-pending">
            {stream.status === 'done' ? tr('reading.aiPending') : tr('reading.streaming')}
          </Text>
        </Card>
      ) : null}

      {stream.actions.length ? (
        <Card style={{ marginBottom: t.spacing[3] }}>
          <Text size="sm" weight="semibold" color="muted">
            {tr('reading.actions')}
          </Text>
          {stream.actions.map((a, i) => (
            <Text key={i} size="md">
              • {a}
            </Text>
          ))}
        </Card>
      ) : null}
      {stream.caveats.length ? (
        <View style={{ marginBottom: t.spacing[3] }}>
          {stream.caveats.map((c, i) => (
            <Text key={i} size="xs" color="muted">
              {c}
            </Text>
          ))}
        </View>
      ) : null}
      {stream.status === 'error' ? (
        <Card accessibilityRole="alert">
          <Text size="sm" color="danger">
            {tr('reading.streamError', { code: stream.error ?? '' })}
          </Text>
        </Card>
      ) : null}
      <Divider />
      <Text size="xs" color="muted">
        {stream.disclaimer ?? tr('common.disclaimer')}
      </Text>
    </View>
  );
}
