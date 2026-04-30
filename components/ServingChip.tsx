import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';
import type { ServingOption } from '@/types';

interface ServingChipProps {
  option: ServingOption;
  selected: boolean;
  onPress: () => void;
  onLongPress?: () => void;
}

export function ServingChip({ option, selected, onPress, onLongPress }: ServingChipProps) {
  const tokens = useTokens();

  const showFuzzyTag = option.source === 'custom' && option.isFuzzyMatch === true;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={[
        styles.chip,
        {
          borderColor: selected ? tokens.accent.primary : tokens.border.hairline,
          backgroundColor: selected ? tokens.accent.muted : tokens.bg.surface,
        },
      ]}
    >
      <Text style={[Type.textMd, { color: tokens.text.primary }]} numberOfLines={1}>
        {option.label}
      </Text>
      {showFuzzyTag && (
        <View style={[styles.tag, { backgroundColor: tokens.bg.surfaceMuted }]}>
          <Text style={[Type.textXs, { color: tokens.text.secondary }]}>custom</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1.5,
  },
  tag: {
    paddingHorizontal: SPACING.xs,
    paddingVertical: 1,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.xs,
  },
});
