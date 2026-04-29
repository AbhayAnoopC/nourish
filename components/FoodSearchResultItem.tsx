import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { useTokens } from '@/hooks/useTokens';
import { Type } from '@/constants/Typography';
import { SPACING } from '@/constants/Spacing';
import { SearchResult } from '@/types';

interface FoodSearchResultItemProps {
  item: SearchResult;
  onSelect: (item: SearchResult) => void;
}

export function FoodSearchResultItem({ item, onSelect }: FoodSearchResultItemProps) {
  const tokens = useTokens();

  const sourceLabel = item.source === 'usda' ? 'USDA' : 'OFF';

  return (
    <TouchableOpacity
      style={[styles.container, { borderBottomColor: tokens.border.hairline }]}
      onPress={() => onSelect(item)}
      activeOpacity={0.6}
    >
      <View style={styles.info}>
        <Text style={[Type.textLg, { color: tokens.text.primary }]} numberOfLines={2}>
          {item.foodName}
        </Text>
        {item.brandName ? (
          <Text style={[Type.textSm, { color: tokens.text.secondary }, styles.brand]} numberOfLines={1}>
            {item.brandName}
          </Text>
        ) : null}
        <Text style={[Type.textSm, { color: tokens.text.tertiary }, styles.perServing]}>per 100 g</Text>
      </View>
      <View style={styles.right}>
        <Text style={[Type.monoLg, { color: tokens.text.primary }]}>{item.calories}</Text>
        <Text style={[Type.monoSm, { color: tokens.text.tertiary }]}>kcal</Text>
        <Text style={[Type.textXs, { color: tokens.accent.primary }, styles.sourceTag]}>{sourceLabel}</Text>
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
    minHeight: 64,
    borderBottomWidth: 1,
  },
  info: {
    flex: 1,
    marginRight: SPACING.md,
  },
  brand: {
    marginTop: 2,
  },
  perServing: {
    marginTop: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  sourceTag: {
    marginTop: SPACING.xs,
  },
});
