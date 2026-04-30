import { migrateDailyLogs } from './dailyLogStore';

describe('migrateDailyLogs', () => {
  it('converts old servingQuantity + servingSize pair into servingLabel', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingSize: '1 medium',
              servingQuantity: 2,
              calories: 200,
              proteinG: 0,
              carbsG: 50,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 1);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
      servingSize?: string;
      servingQuantity?: number;
    };
    expect(item.servingLabel).toBe('2 × 1 medium');
    expect(item.servingSize).toBeUndefined();
    expect(item.servingQuantity).toBeUndefined();
  });

  it('uses bare servingSize when servingQuantity is 1', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingSize: '1 medium',
              servingQuantity: 1,
              calories: 100,
              proteinG: 0,
              carbsG: 25,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 1);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
    };
    expect(item.servingLabel).toBe('1 medium');
  });

  it('is idempotent: leaves already-migrated items alone', () => {
    const persisted = {
      logs: {
        '2026-04-28': {
          date: '2026-04-28',
          foodItems: [
            {
              id: 'a',
              date: '2026-04-28',
              timestamp: '2026-04-28T08:00:00.000Z',
              foodName: 'Apple',
              servingLabel: '1 medium',
              calories: 100,
              proteinG: 0,
              carbsG: 25,
              fatG: 0,
              source: 'usda',
            },
          ],
          waterMl: 0,
          caloriesBurned: 0,
          caloriesBurnedSource: 'manual',
        },
      },
    };

    const result = migrateDailyLogs(persisted, 2);
    const item = (result as typeof persisted).logs['2026-04-28'].foodItems[0] as unknown as {
      servingLabel: string;
    };
    expect(item.servingLabel).toBe('1 medium');
  });

  it('returns persisted untouched when shape is unrecognizable', () => {
    expect(migrateDailyLogs(null, 1)).toBeNull();
    expect(migrateDailyLogs({ unknown: true }, 1)).toEqual({ unknown: true });
  });
});
