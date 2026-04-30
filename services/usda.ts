import Constants from 'expo-constants';
import { USDA_API_BASE } from '@/constants/Api';
import type { FoodPortion, SearchResult } from '@/types';

// Standard USDA FoodData Central nutrient IDs
const NUTRIENT_ENERGY_KCAL = 1008;
const NUTRIENT_PROTEIN = 1003;
const NUTRIENT_FAT = 1004;
const NUTRIENT_CARBS = 1005;

interface FdcNutrient {
  nutrientId: number;
  value: number;
}

interface FdcFoodPortion {
  amount?: number;
  modifier?: string;
  gramWeight?: number;
}

interface FdcFood {
  fdcId: number;
  description: string;
  brandOwner?: string;
  brandName?: string;
  foodNutrients: FdcNutrient[];
  foodPortions?: FdcFoodPortion[];
}

interface FdcSearchResponse {
  foods?: FdcFood[];
}

function getNutrientValue(nutrients: FdcNutrient[], id: number): number {
  return nutrients.find((n) => n.nutrientId === id)?.value ?? 0;
}

function formatPortionAmount(amount: number): string {
  return Number(amount).toString();
}

function parseFoodPortions(portions?: FdcFoodPortion[]): FoodPortion[] | undefined {
  if (!portions || portions.length === 0) return undefined;
  const parsed: FoodPortion[] = [];
  for (const p of portions) {
    if (!p.modifier || typeof p.gramWeight !== 'number' || p.gramWeight <= 0) continue;
    if (typeof p.amount !== 'number' || p.amount <= 0) continue;
    parsed.push({
      label: `${formatPortionAmount(p.amount)} ${p.modifier.trim()}`,
      gramWeight: p.gramWeight,
    });
  }
  if (parsed.length === 0) return undefined;
  parsed.sort((a, b) => a.gramWeight - b.gramWeight);
  return parsed;
}

function mapFdcFoodToSearchResult(food: FdcFood): SearchResult {
  return {
    id: `usda-${food.fdcId}`,
    foodName: food.description,
    brandName: food.brandOwner ?? food.brandName,
    servingSize: '100g',
    calories: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_ENERGY_KCAL)),
    proteinG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_PROTEIN) * 10) / 10,
    carbsG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_CARBS) * 10) / 10,
    fatG: Math.round(getNutrientValue(food.foodNutrients, NUTRIENT_FAT) * 10) / 10,
    source: 'usda',
    foodPortions: parseFoodPortions(food.foodPortions),
  };
}

export async function lookupByBarcode(barcode: string): Promise<SearchResult | null> {
  // USDA branded food records include GTINs; searching the UPC as a query
  // string often surfaces the exact product when OFF doesn't have it.
  const results = await searchFoods(barcode);
  const match = results[0] ?? null;
  return match ? { ...match, source: 'barcode' } : null;
}

export async function searchFoods(query: string): Promise<SearchResult[]> {
  const apiKey: string =
    (Constants.expoConfig?.extra?.usdaApiKey as string) || 'DEMO_KEY';

  const url =
    `${USDA_API_BASE}/foods/search` +
    `?query=${encodeURIComponent(query)}&pageSize=20&api_key=${encodeURIComponent(apiKey)}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`USDA API responded with status ${response.status}`);
    }
    const data: FdcSearchResponse = await response.json();
    return (data.foods ?? []).map(mapFdcFoodToSearchResult);
  } catch (error) {
    console.error('[usda] searchFoods failed:', error);
    throw error;
  }
}
