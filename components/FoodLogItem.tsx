import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/Spacing';
import { FoodLogItem as FoodLogItemType } from '@/types';

interface FoodLogItemProps {
  item: FoodLogItemType;
  onDelete: (id: string) => void;
}

export function FoodLogItem({ item, onDelete }: FoodLogItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const servingLabel =
    item.servingQuantity !== 1
      ? `${item.servingQuantity}\u00d7 ${item.servingSize}`
      : item.servingSize;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {item.foodName}
        </Text>
        {item.brandName ? (
          <Text style={[styles.secondary, { color: colors.placeholder }]} numberOfLines={1}>
            {item.brandName}
          </Text>
        ) : null}
        <Text style={[styles.secondary, { color: colors.placeholder }]}>{servingLabel}</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.calories, { color: colors.text }]}>{Math.round(item.calories)}</Text>
        <Text style={[styles.calLabel, { color: colors.placeholder }]}>kcal</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(item.id)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.6}
      >
        <Text style={[styles.deleteIcon, { color: colors.placeholder }]}>{'\u00d7'}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  info: {
    flex: 1,
    marginRight: SPACING.sm,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  secondary: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
    marginRight: SPACING.sm,
  },
  calories: {
    fontSize: FONT_SIZE.lg,
    fontWeight: '600',
  },
  calLabel: {
    fontSize: FONT_SIZE.xs,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  deleteIcon: {
    fontSize: 22,
    lineHeight: 22,
  },
});
