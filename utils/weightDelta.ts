import type { SparklinePoint } from './sparklineData';

export function weeklyWeightDelta(series: SparklinePoint[]): number | null {
  const actuals = series.filter((p) => p.actual);
  if (actuals.length < 2) return null;
  const oldest = actuals[0].weightKg;
  const newest = actuals[actuals.length - 1].weightKg;
  return Math.round((newest - oldest) * 10) / 10;
}
