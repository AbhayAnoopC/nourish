import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable, RectButton } from 'react-native-gesture-handler';
import { Trash2 } from 'lucide-react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import type { FoodLogItem } from '@/types';

interface FoodLogRowProps {
  item: FoodLogItem;
  onDelete: (id: string) => void;
  isLast?: boolean;
}

function formatTime(ts: string): string {
  const d = new Date(ts);
  const h = d.getHours();
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${ampm}`;
}

export function FoodLogRow({ item, onDelete, isLast }: FoodLogRowProps) {
  const tokens = useTokens();
  const [pressed, setPressed] = useState(false);

  const renderRightActions = () => (
    <RectButton
      style={[styles.deleteAction, { backgroundColor: tokens.status.danger }]}
      onPress={() => onDelete(item.id)}
    >
      <Trash2 size={20} color="#FFFFFF" />
    </RectButton>
  );

  return (
    <Swipeable renderRightActions={renderRightActions} overshootRight={false}>
      <Pressable
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.row,
          {
            backgroundColor: pressed ? tokens.bg.surfaceMuted : tokens.bg.primary,
            borderBottomColor: isLast ? 'transparent' : tokens.border.hairline,
          },
        ]}
      >
        <View style={styles.left}>
          <Text style={[Type.textLg, { color: tokens.text.primary }]} numberOfLines={1}>
            {item.foodName}
          </Text>
          <Text style={[Type.textSm, { color: tokens.text.secondary }]} numberOfLines={1}>
            {item.servingLabel} · {formatTime(item.timestamp)}
          </Text>
        </View>
        <View style={styles.right}>
          <Text style={[Type.monoLg, { color: tokens.text.primary }]}>
            {Math.round(item.calories)}
          </Text>
          <Text style={[Type.monoSm, { color: tokens.text.tertiary }]}>kcal</Text>
        </View>
      </Pressable>
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    minHeight: 64,
    borderBottomWidth: 1,
  },
  left: {
    flex: 1,
    paddingRight: SPACING.md,
  },
  right: {
    alignItems: 'flex-end',
  },
  deleteAction: {
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
