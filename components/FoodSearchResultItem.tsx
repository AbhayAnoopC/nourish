import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { SPACING, FONT_SIZE, BORDER_RADIUS } from '@/constants/Spacing';
import { SearchResult } from '@/types';

interface FoodSearchResultItemProps {
  item: SearchResult;
  onSelect: (item: SearchResult) => void;
}

export function FoodSearchResultItem({ item, onSelect }: FoodSearchResultItemProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const sourceLabel = item.source === 'usda' ? 'USDA' : 'OFF';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: colors.border }]}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={2}>
          {item.foodName}
        </Text>
        {item.brandName ? (
          <Text style={[styles.brand, { color: colors.placeholder }]} numberOfLines={1}>
            {item.brandName}
          </Text>
        ) : null}
        <Text style={[styles.perServing, { color: colors.placeholder }]}>per 100 g</Text>
      </View>
      <View style={styles.right}>
        <Text style={[styles.calories, { color: colors.text }]}>{item.calories}</Text>
        <Text style={[styles.calLabel, { color: colors.placeholder }]}>kcal</Text>
        <Text style={[styles.sourceTag, { color: colors.tint }]}>{sourceLabel}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
    marginRight: SPACING.md,
  },
  name: {
    fontSize: FONT_SIZE.md,
    fontWeight: '500',
  },
  brand: {
    fontSize: FONT_SIZE.sm,
    marginTop: 2,
  },
  perServing: {
    fontSize: FONT_SIZE.xs,
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: FONT_SIZE.xl,
    fontWeight: '700',
  },
  calLabel: {
    fontSize: FONT_SIZE.xs,
  },
  sourceTag: {
    fontSize: FONT_SIZE.xs,
    fontWeight: '600',
    marginTop: SPACING.xs,
  },
});
