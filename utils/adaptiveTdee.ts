import type { DailyLog, AdaptiveTdeeResult } from '@/types';

const KCAL_PER_KG = 7700;

const GOAL_ADJUSTMENT: Record<string, number> = {
  lose: -500,
  maintain: 0,
  gain: 250,
};

export function calculateAdaptiveTdee(
  logs: DailyLog[],
  currentTarget: number,
  goal: 'lose' | 'maintain' | 'gain',
): AdaptiveTdeeResult | null {
  const logsWithFood = logs.filter((l) => l.foodItems.length > 0);
  const logsWithWeight = logs.filter((l) => l.bodyWeightKg != null);

  if (logsWithFood.length < 14 || logsWithWeight.length < 3) return null;

  const avgDailyIntake =
    logsWithFood.reduce(
      (sum, l) => sum + l.foodItems.reduce((s, item) => s + item.calories, 0),
      0,
    ) / logsWithFood.length;

  const sorted = [...logsWithWeight].sort((a, b) => a.date.localeCompare(b.date));
  const firstWeight = sorted[0]!.bodyWeightKg!;
  const lastWeight = sorted[sorted.length - 1]!.bodyWeightKg!;
  const weightDeltaKg = lastWeight - firstWeight;

  const days = logsWithFood.length;
  const expectedDelta = ((currentTarget - avgDailyIntake) * days) / KCAL_PER_KG;
  const impliedTdee =
    currentTarget + ((weightDeltaKg - expectedDelta) * KCAL_PER_KG) / days;

  const adjustment = GOAL_ADJUSTMENT[goal] ?? 0;
  const newTarget = Math.round(impliedTdee) + adjustment;

  return {
    newTarget,
    impliedTdee: Math.round(impliedTdee),
    oldTarget: currentTarget,
    avgDailyIntake: Math.round(avgDailyIntake),
    weightDeltaKg: Math.round(weightDeltaKg * 100) / 100,
    daysAnalysed: days,
  };
}
