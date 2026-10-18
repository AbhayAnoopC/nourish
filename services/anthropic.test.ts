jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ base64: 'fakebase64data' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('@/constants/Api', () => ({
  getAppApiBase: () => 'http://localhost:8081',
}));

import { scanMealPhoto, scanNutritionLabel, AnthropicServiceError } from './anthropic';

const mockFetch = jest.fn();
global.fetch = mockFetch as typeof fetch;

describe('scanMealPhoto', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('returns parsed items on 200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        items: [{ foodName: 'Chicken', servingSize: '150g', calories: 250, proteinG: 30, carbsG: 0, fatG: 12 }],
      }),
    });
    const result = await scanMealPhoto('file:///photo.jpg');
    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.foodName).toBe('Chicken');
  });

  it('throws AnthropicServiceError with errorType "network" on fetch rejection', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network down'));
    await expect(scanMealPhoto('file:///photo.jpg')).rejects.toMatchObject({
      errorType: 'network',
    });
  });

  it('throws AnthropicServiceError with errorType "anthropic" on non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'anthropic', message: 'Server error' }),
    });
    await expect(scanMealPhoto('file:///photo.jpg')).rejects.toMatchObject({
      errorType: 'anthropic',
    });
  });
});

describe('scanNutritionLabel', () => {
  beforeEach(() => { mockFetch.mockReset(); });

  it('returns parsed label result on 200 response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        foodName: 'Wonder Bread',
        servingDescription: '2 slices',
        servingQuantity: 2,
        caloriesPerServing: 140,
        proteinGPerServing: 4,
        carbsGPerServing: 26,
        fatGPerServing: 2,
      }),
    });
    const result = await scanNutritionLabel('file:///label.jpg');
    expect(result.foodName).toBe('Wonder Bread');
    expect(result.caloriesPerServing).toBe(140);
  });

  it('throws AnthropicServiceError with errorType "parse" on parse error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'parse', message: 'Bad JSON' }),
    });
    await expect(scanNutritionLabel('file:///label.jpg')).rejects.toMatchObject({
      errorType: 'parse',
    });
  });
});
