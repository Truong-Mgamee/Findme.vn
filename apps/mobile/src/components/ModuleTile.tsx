import React from 'react';
import { Pressable, View } from 'react-native';
import { Badge, Text, useTheme } from '@findme/ui';

export interface ModuleTileProps {
  title: string;
  subtitle?: string;
  glyph: string;
  badge?: { label: string; tone: 'success' | 'primary' | 'muted' };
  onPress: () => void;
  testID?: string;
  disabled?: boolean;
}

export function ModuleTile({ title, subtitle, glyph, badge, onPress, testID, disabled }: ModuleTileProps) {
  const t = useTheme();
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={`${title}${badge ? `, ${badge.label}` : ''}`}
      style={({ pressed }) => ({ width: '50%', padding: t.spacing[1], opacity: disabled ? 0.5 : pressed ? 0.85 : 1 })}
    >
      <View style={{ backgroundColor: t.colors.surface, borderColor: t.colors.border, borderWidth: 1, borderRadius: t.radii.lg, padding: t.spacing[3], minHeight: 128, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Text size="2xl" han accessibilityElementsHidden>
            {glyph}
          </Text>
          {badge ? <Badge label={badge.label} tone={badge.tone} /> : null}
        </View>
        <View>
          <Text size="md" weight="semibold" numberOfLines={2}>
            {title}
          </Text>
          {subtitle ? (
            <Text size="xs" color="muted" numberOfLines={2}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}
