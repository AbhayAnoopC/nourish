import { SearchResult } from '@/types';

const SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const PRODUCT_URL = 'https://world.openfoodfacts.org/api/v0/product';

interface OFFNutriments {
  'energy-kcal_100g'?: number;
  energy_100g?: number; // kJ fallback
  proteins_100g?: number;
  fat_100g?: number;
  carbohydrates_100g?: number;
}

interface OFFProduct {
  _id: string;
  product_name?: string;
  brands?: string;
  nutriments: OFFNutriments;
}

interface OFFSearchResponse {
  products?: OFFProduct[];
}

function mapOFFProductToSearchResult(product: OFFProduct): SearchResult | null {
  const name = product.product_name?.trim();
  if (!name) return null;

  // Prefer kcal per 100g; fall back to kJ converted to kcal
  const rawKcal = product.nutriments['energy-kcal_100g'];
  const rawKj = product.nutriments['energy_100g'];
  const calories =
    rawKcal != null
      ? Math.round(rawKcal)
      : rawKj != null
        ? Math.round(rawKj / 4.184)
        : 0;

  return {
    id: `off-${product._id}`,
    foodName: name,
    brandName: product.brands?.split(',')[0]?.trim() || undefined,
    servingSize: '100g',
    calories,
    proteinG: Math.round((product.nutriments.proteins_100g ?? 0) * 10) / 10,
    carbsG: Math.round((product.nutriments.carbohydrates_100g ?? 0) * 10) / 10,
    fatG: Math.round((product.nutriments.fat_100g ?? 0) * 10) / 10,
    source: 'openfoodfacts',
  };
}

export async function lookupByBarcode(barcode: string): Promise<SearchResult | null> {
  const url = `${PRODUCT_URL}/${encodeURIComponent(barcode)}.json`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open Food Facts API responded with status ${response.status}`);
    }
    const data: { status: number; product?: OFFProduct } = await response.json();
    if (data.status !== 1 || !data.product) return null;
    const result = mapOFFProductToSearchResult(data.product);
    return result ? { ...result, source: 'barcode' } : null;
  } catch (error) {
    console.error('[openFoodFacts] lookupByBarcode failed:', error);
    throw error;
  }
}

export async function searchFoodsByName(query: string): Promise<SearchResult[]> {
  const url =
    `${SEARCH_URL}` +
    `?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=20`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Open Food Facts API responded with status ${response.status}`);
    }
    const data: OFFSearchResponse = await response.json();
    return (data.products ?? [])
      .map(mapOFFProductToSearchResult)
      .filter((item): item is SearchResult => item !== null);
  } catch (error) {
    console.error('[openFoodFacts] searchFoodsByName failed:', error);
    throw error;
  }
}
