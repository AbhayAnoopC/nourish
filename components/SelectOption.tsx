import { Pressable, Text, StyleSheet, View } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { BORDER_RADIUS, SPACING } from '@/constants/Spacing';

interface SelectOptionProps {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}

export function SelectOption({ label, description, selected, onPress }: SelectOptionProps) {
  const tokens = useTokens();

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.option,
        {
          borderColor: selected ? tokens.accent.primary : 'transparent',
          backgroundColor: selected ? tokens.accent.muted : tokens.bg.surface,
        },
      ]}
    >
      <View style={styles.content}>
        <Text style={[Type.textLg, { color: tokens.text.primary }]}>{label}</Text>
        {description !== undefined && (
          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.description]}>{description}</Text>
        )}
      </View>
      <View style={[styles.radio, { borderColor: selected ? tokens.accent.primary : tokens.border.hairline }]}>
        {selected && <View style={[styles.radioInner, { backgroundColor: tokens.accent.primary }]} />}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    marginBottom: SPACING.sm,
  },
  content: {
    flex: 1,
  },
  description: {
    marginTop: 2,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: SPACING.sm,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
