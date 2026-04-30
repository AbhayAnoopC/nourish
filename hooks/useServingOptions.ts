import { useMemo } from 'react';
import type { SearchResult, ServingOption } from '@/types';
import { useUserStore } from '@/store/userStore';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { isExactMatch } from '@/utils/normalizeFoodName';

const FALLBACK_GRAMS_100 = 100;
const GRAMS_PER_OZ = 28.349523125;
const MAX_OPTIONS = 6;

export function useServingOptions(food: SearchResult): ServingOption[] {
  const profileUnits = useUserStore((s) => s.profile?.units);
  const customs = useCustomServingsStore((s) => s.findMatchesForFood(food.foodName));

  return useMemo(() => {
    const options: ServingOption[] = [];

    if (food.foodPortions) {
      for (const p of food.foodPortions) {
        options.push({ label: p.label, grams: p.gramWeight, source: 'usda' });
      }
    }

    if (food.source === 'openfoodfacts' && typeof food.servingGrams === 'number' && food.servingGrams > 0) {
      options.push({
        label: `${food.servingGrams} g (serving)`,
        grams: food.servingGrams,
        source: 'off',
      });
    }

    for (const c of customs) {
      options.push({
        label: c.label,
        grams: c.grams,
        source: 'custom',
        customId: c.id,
        isFuzzyMatch: !isExactMatch(c.matchKey, food.foodName),
      });
    }

    options.push({ label: '100 g', grams: FALLBACK_GRAMS_100, source: 'fallback' });
    if (profileUnits === 'imperial') {
      options.push({ label: '1 oz', grams: GRAMS_PER_OZ, source: 'fallback' });
    }

    // Dedupe by gramWeight (0.5g buckets); earlier-pushed wins.
    const seen = new Map<number, ServingOption>();
    for (const opt of options) {
      const key = Math.round(opt.grams * 2) / 2;
      if (!seen.has(key)) seen.set(key, opt);
    }

    return Array.from(seen.values()).slice(0, MAX_OPTIONS);
  }, [food, customs, profileUnits]);
}
