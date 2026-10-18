import { calculateAdaptiveTdee } from './adaptiveTdee';
import type { DailyLog, FoodLogItem } from '@/types';

function makeLog(date: string, calories: number, bodyWeightKg?: number): DailyLog {
  const items: FoodLogItem[] = calories > 0
    ? [{
        id: date, date, timestamp: `${date}T12:00:00.000Z`,
        foodName: 'Food', servingSize: '1 serving', servingQuantity: 1,
        calories, proteinG: 30, carbsG: 50, fatG: 20, source: 'manual',
      }]
    : [];
  return {
    date, foodItems: items, waterMl: 0,
    caloriesBurned: 0, caloriesBurnedSource: 'manual', bodyWeightKg,
  };
}

function makeLogs(count: number, calories: number, weightEvery = 3): DailyLog[] {
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(2026, 0, i + 1);
    const dateStr = d.toISOString().slice(0, 10)!;
    return makeLog(dateStr, calories, i % weightEvery === 0 ? 70 - i * 0.05 : undefined);
  });
}

describe('calculateAdaptiveTdee', () => {
  it('returns null with fewer than 14 food logs', () => {
    expect(calculateAdaptiveTdee(makeLogs(13, 2000), 2200, 'maintain')).toBeNull();
  });

  it('returns null with fewer than 3 weight entries', () => {
    const logs = Array.from({ length: 14 }, (_, i) => {
      const d = new Date(2026, 0, i + 1).toISOString().slice(0, 10)!;
      return makeLog(d, 2000, i < 2 ? 70 : undefined);
    });
    expect(calculateAdaptiveTdee(logs, 2200, 'maintain')).toBeNull();
  });

  it('returns a result when conditions are met', () => {
    const result = calculateAdaptiveTdee(makeLogs(14, 2000), 2500, 'maintain');
    expect(result).not.toBeNull();
    expect(result!.oldTarget).toBe(2500);
    expect(result!.avgDailyIntake).toBe(2000);
    expect(result!.daysAnalysed).toBe(14);
  });

  it('applies -500 adjustment for lose goal', () => {
    const result = calculateAdaptiveTdee(makeLogs(14, 2000), 2200, 'lose');
    expect(result).not.toBeNull();
    expect(result!.newTarget).toBe(result!.impliedTdee - 500);
  });

  it('applies +250 adjustment for gain goal', () => {
    const result = calculateAdaptiveTdee(makeLogs(14, 2000), 2200, 'gain');
    expect(result).not.toBeNull();
    expect(result!.newTarget).toBe(result!.impliedTdee + 250);
  });

  it('applies 0 adjustment for maintain goal', () => {
    const result = calculateAdaptiveTdee(makeLogs(14, 2000), 2200, 'maintain');
    expect(result).not.toBeNull();
    expect(result!.newTarget).toBe(result!.impliedTdee);
  });
});
