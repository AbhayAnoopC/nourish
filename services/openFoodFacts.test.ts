import { searchFoodsByName } from './openFoodFacts';

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_RESPONSE = {
  products: [
    {
      _id: 'abc123',
      product_name: 'Organic Oat Milk',
      brands: 'Oatly, Some Other Brand',
      nutriments: {
        'energy-kcal_100g': 47,
        proteins_100g: 1,
        fat_100g: 1.5,
        carbohydrates_100g: 6.7,
      },
    },
    {
      _id: 'def456',
      product_name: 'Whole Grain Bread',
      brands: '',
      nutriments: {
        energy_100g: 1025, // kJ only — should convert to ~245 kcal
        proteins_100g: 9,
        fat_100g: 3,
        carbohydrates_100g: 44,
      },
    },
    {
      _id: 'noname',
      product_name: '',       // no name — should be filtered out
      brands: 'Unknown',
      nutriments: {},
    },
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchFoodsByName', () => {
  it('maps products to SearchResult and filters entries with no name', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const results = await searchFoodsByName('oat');

    // Third product (no name) must be filtered
    expect(results).toHaveLength(2);

    expect(results[0]).toMatchObject({
      id: 'off-abc123',
      foodName: 'Organic Oat Milk',
      brandName: 'Oatly',
      servingSize: '100g',
      calories: 47,
      proteinG: 1,
      fatG: 1.5,
      carbsG: 6.7,
      source: 'openfoodfacts',
    });
  });

  it('falls back from kJ to kcal when energy-kcal_100g is absent', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const results = await searchFoodsByName('bread');
    const bread = results.find((r) => r.id === 'off-def456');
    expect(bread).toBeDefined();
    // 1025 kJ / 4.184 ≈ 245 kcal
    expect(bread!.calories).toBe(245);
  });

  it('returns empty array when products array is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const results = await searchFoodsByName('xyz');
    expect(results).toEqual([]);
  });

  it('throws when the API returns a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 });
    await expect(searchFoodsByName('oat')).rejects.toThrow('500');
  });

  it('throws when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('timeout'));
    await expect(searchFoodsByName('oat')).rejects.toThrow('timeout');
  });
});
