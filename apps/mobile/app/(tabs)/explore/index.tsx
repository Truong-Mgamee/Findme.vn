/** S6 Explore: module grid by tradition pack with Free today / Plus badges. */
import React from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, useTheme } from '@findme/ui';
import { ModuleTile } from '../../../src/components/ModuleTile';
import { Screen } from '../../../src/components/Screen';
import { useEntitlements } from '../../../src/hooks/queries';
import { track, type AnalyticsEvent } from '../../../src/lib/analytics';
import { useSession } from '../../../src/store/session';

type ModuleKey = Extract<AnalyticsEvent, { name: 'module_opened' }>['module'];

interface ModuleDef {
  key: ModuleKey;
  glyph: string;
  packs: Array<'eastAsia' | 'western'>;
  /** free forever (docs/02 anti-pattern #1) vs deep (Plus / credit after the first) */
  tier: 'free' | 'deep';
  href: (profileId: string | null) => string;
}

const MODULES: ModuleDef[] = [
  { key: 'ziwei', glyph: '紫', packs: ['eastAsia'], tier: 'free', href: (p) => `/ziwei/${p}` },
  { key: 'bazi', glyph: '柱', packs: ['eastAsia'], tier: 'free', href: (p) => `/bazi/${p}` },
  { key: 'almanac', glyph: '曆', packs: ['eastAsia'], tier: 'free', href: () => '/almanac' },
  { key: 'iching', glyph: '卦', packs: ['eastAsia'], tier: 'free', href: () => '/iching/new' },
  { key: 'tarot', glyph: '✧', packs: ['western', 'eastAsia'], tier: 'free', href: () => '/tarot/new' },
  { key: 'numerology', glyph: '7', packs: ['western'], tier: 'free', href: (p) => `/numerology/${p}` },
  { key: 'astro', glyph: '☽', packs: ['western'], tier: 'free', href: (p) => `/astro/${p}` },
  { key: 'compat', glyph: '♡', packs: ['eastAsia', 'western'], tier: 'deep', href: () => '/compat' },
];

export default function ExploreScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const pack = useSession((s) => s.user?.traditionPack ?? 'both');
  const selfProfileId = useSession((s) => s.selfProfileId);
  const isPlus = useSession((s) => s.isPlus);
  const hasToken = useSession((s) => s.hasToken);
  useEntitlements(hasToken);

  const visible = MODULES.filter((m) => pack === 'both' || m.packs.includes(pack === 'eastAsia' ? 'eastAsia' : 'western'));
  const primary = visible.filter((m) => (pack === 'eastAsia' ? m.packs[0] === 'eastAsia' : pack === 'western' ? m.packs[0] === 'western' : true));
  const rest = visible.filter((m) => !primary.includes(m));

  const open = (m: ModuleDef) => {
    track({ name: 'module_opened', module: m.key });
    router.push(m.href(selfProfileId) as never);
  };

  const grid = (list: ModuleDef[]) => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -t.spacing[1] }}>
      {list.map((m) => (
        <ModuleTile key={m.key} testID={`module-${m.key}`} glyph={m.glyph} title={tr(`explore.${m.key}`)} subtitle={tr(`explore.desc.${m.key}`)} badge={m.tier === 'free' ? { label: tr('common.freeTodayBadge'), tone: 'success' } : isPlus ? { label: tr('common.plusBadge'), tone: 'primary' } : { label: tr('common.plusBadge'), tone: 'muted' }} onPress={() => open(m)} disabled={m.key !== 'almanac' && m.key !== 'tarot' && m.key !== 'iching' && m.key !== 'compat' && !selfProfileId} />
      ))}
    </View>
  );

  return (
    <Screen title={tr('explore.title')} subtitle={tr('explore.subtitle')} tabs>
      {grid(primary)}
      {rest.length ? (
        <>
          <Text size="sm" weight="semibold" color="muted" style={{ marginTop: t.spacing[5], marginBottom: t.spacing[2] }}>
            {tr('explore.alsoAvailable')}
          </Text>
          {grid(rest)}
        </>
      ) : null}
      <Text size="xs" color="muted" style={{ marginTop: t.spacing[4] }}>
        {tr('explore.pricingNote')}
      </Text>
    </Screen>
  );
}
