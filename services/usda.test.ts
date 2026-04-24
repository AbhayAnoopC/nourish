import { lookupByBarcode, searchFoods } from './usda';

// Mock expo-constants so the module loads without the Expo runtime
jest.mock('expo-constants', () => ({
  __esModule: true,
  default: { expoConfig: { extra: { usdaApiKey: 'TEST_KEY' } } },
}));

const mockFetch = jest.fn();
global.fetch = mockFetch;

const MOCK_RESPONSE = {
  foods: [
    {
      fdcId: 12345,
      description: 'CHICKEN BREAST, GRILLED',
      brandOwner: 'Generic',
      foodNutrients: [
        { nutrientId: 1008, value: 165 }, // energy kcal
        { nutrientId: 1003, value: 31 },  // protein
        { nutrientId: 1004, value: 3.6 }, // fat
        { nutrientId: 1005, value: 0 },   // carbs
      ],
    },
    {
      fdcId: 67890,
      description: 'BROWN RICE, COOKED',
      foodNutrients: [
        { nutrientId: 1008, value: 112 },
        { nutrientId: 1003, value: 2.6 },
        { nutrientId: 1004, value: 0.9 },
        { nutrientId: 1005, value: 23.5 },
      ],
    },
  ],
};

beforeEach(() => {
  mockFetch.mockReset();
});

describe('searchFoods', () => {
  it('returns mapped SearchResult array on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const results = await searchFoods('chicken');

    expect(results).toHaveLength(2);
    expect(results[0]).toMatchObject({
      id: 'usda-12345',
      foodName: 'CHICKEN BREAST, GRILLED',
      brandName: 'Generic',
      servingSize: '100g',
      calories: 165,
      proteinG: 31,
      fatG: 3.6,
      carbsG: 0,
      source: 'usda',
    });
    expect(results[1].foodName).toBe('BROWN RICE, COOKED');
  });

  it('returns empty array when foods array is missing', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    const results = await searchFoods('xyz');
    expect(results).toEqual([]);
  });

  it('throws when the API returns a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(searchFoods('chicken')).rejects.toThrow('429');
  });

  it('throws when fetch rejects (network error)', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(searchFoods('chicken')).rejects.toThrow('Network error');
  });
});

describe('lookupByBarcode', () => {
  it('returns first search result with source barcode when match found', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => MOCK_RESPONSE,
    });

    const result = await lookupByBarcode('0012345678901');
    expect(result).not.toBeNull();
    expect(result).toMatchObject({
      id: 'usda-12345',
      foodName: 'CHICKEN BREAST, GRILLED',
      source: 'barcode',
    });
  });

  it('returns null when no foods match the barcode', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ foods: [] }),
    });

    const result = await lookupByBarcode('0000000000000');
    expect(result).toBeNull();
  });

  it('throws when the API returns a non-ok status', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429 });
    await expect(lookupByBarcode('123')).rejects.toThrow('429');
  });
});
