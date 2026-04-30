import { useMemo } from 'react';
import type { SearchResult, ServingOption } from '@/types';
import { useUserStore } from '@/store/userStore';
import { useCustomServingsStore } from '@/store/customServingsStore';
import { isExactMatch, isFuzzyMatch } from '@/utils/normalizeFoodName';

const FALLBACK_GRAMS_100 = 100;
const GRAMS_PER_OZ = 28.349523125;
const MAX_OPTIONS = 6;

export function useServingOptions(food: SearchResult): ServingOption[] {
  const profileUnits = useUserStore((s) => s.profile?.units);
  // Select the raw array — stable reference when store hasn't changed.
  // Never call a method here; method calls return new arrays every render,
  // causing Zustand to see a changed value and loop indefinitely.
  const allCustoms = useCustomServingsStore((s) => s.customs);

  // Stable filtered list — only recomputed when the store or food name changes.
  const customs = useMemo(
    () => allCustoms.filter((c) => isFuzzyMatch(c.matchKey, food.foodName)),
    [allCustoms, food.foodName],
  );

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
  }, [food.foodName, food.foodPortions, food.source, food.servingGrams, customs, profileUnits]);
}
