import React from 'react';
import { Pressable, View } from 'react-native';
import { useTheme } from '../theme.js';
import { Text } from './primitives.js';

export type NumerologyKey = 'lifePath' | 'expression' | 'soulUrge' | 'personality' | 'birthday' | 'maturity' | 'personalYear' | 'personalMonth' | 'personalDay';

export interface NumerologyNumbers {
  lifePath: number;
  expression?: number | null;
  soulUrge?: number | null;
  personality?: number | null;
  birthday?: number | null;
  maturity?: number | null;
  personalYear?: number | null;
  personalMonth?: number | null;
  personalDay?: number | null;
}

export interface NumerologyGridProps {
  numbers: NumerologyNumbers;
  /** localized titles per key */
  labels?: Partial<Record<NumerologyKey, string>>;
  /** optional one-line meaning per key (from content atoms) */
  meanings?: Partial<Record<NumerologyKey, string>>;
  masters?: number[];
  masterLabel?: string;
  /** shown in tiles whose number is null (no name given) */
  unavailableLabel?: string;
  onPressNumber?: (key: NumerologyKey, value: number) => void;
  order?: NumerologyKey[];
  testID?: string;
}

const DEFAULT_LABELS: Record<NumerologyKey, string> = {
  lifePath: 'Life Path',
  expression: 'Expression',
  soulUrge: 'Soul Urge',
  personality: 'Personality',
  birthday: 'Birthday',
  maturity: 'Maturity',
  personalYear: 'Personal Year',
  personalMonth: 'Personal Month',
  personalDay: 'Personal Day',
};
const DEFAULT_ORDER: NumerologyKey[] = ['lifePath', 'expression', 'soulUrge', 'personality', 'birthday', 'maturity', 'personalYear', 'personalMonth', 'personalDay'];

/** 7 core numbers + personal cycles as tiles (2 columns). Life Path is the hero tile. */
export function NumerologyGrid({ numbers, labels: overrides, meanings, masters = [], masterLabel = 'Master number', unavailableLabel = '—', onPressNumber, order = DEFAULT_ORDER, testID }: NumerologyGridProps) {
  const t = useTheme();
  const labels = { ...DEFAULT_LABELS, ...overrides };
  return (
    <View testID={testID} style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -t.spacing[1] }}>
      {order.map((key) => {
        const value = numbers[key] ?? null;
        const hero = key === 'lifePath';
        const isMaster = value !== null && masters.includes(value);
        const meaning = meanings?.[key];
        const a11y = `${labels[key]}: ${value ?? unavailableLabel}${isMaster ? `, ${masterLabel}` : ''}${meaning ? `. ${meaning}` : ''}`;
        return (
          <Pressable
            key={key}
            testID={`num-${key}`}
            disabled={!onPressNumber || value === null}
            onPress={onPressNumber && value !== null ? () => onPressNumber(key, value) : undefined}
            accessibilityRole={onPressNumber ? 'button' : 'text'}
            accessibilityLabel={a11y}
            style={{ width: hero ? '100%' : '50%', padding: t.spacing[1] }}
          >
            <View style={{ backgroundColor: hero ? t.colors.primary : t.colors.surface, borderRadius: t.radii.lg, borderWidth: 1, borderColor: hero ? t.colors.primary : t.colors.border, padding: t.spacing[3], minHeight: hero ? 112 : 96, justifyContent: 'space-between' }}>
              <Text size="xs" weight="medium" style={{ color: hero ? t.colors.onPrimary : t.colors.textMuted }}>
                {labels[key]}
              </Text>
              <Text size={hero ? '3xl' : '2xl'} weight="bold" style={{ color: hero ? t.colors.onPrimary : value === null ? t.colors.textMuted : t.colors.text }}>
                {value === null ? unavailableLabel : String(value)}
              </Text>
              {isMaster ? (
                <Text size="xs" weight="semibold" style={{ color: hero ? t.colors.onPrimary : t.colors.accent }}>
                  {masterLabel}
                </Text>
              ) : meaning ? (
                <Text size="xs" numberOfLines={2} style={{ color: hero ? t.colors.onPrimary : t.colors.textMuted }}>
                  {meaning}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}
