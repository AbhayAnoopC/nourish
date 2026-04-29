export interface WeightEntry {
  date: string; // YYYY-MM-DD
  weightKg: number;
}

export interface SparklinePoint {
  date: string;
  weightKg: number;
  actual: boolean;
}

function addDays(dateIso: string, days: number): string {
  const d = new Date(dateIso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function buildSparklineSeries(
  entries: WeightEntry[],
  anchorDate: string,
): SparklinePoint[] {
  const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date));
  const startDate = addDays(anchorDate, -6);

  const onOrBeforeStart = sorted.filter((e) => e.date <= startDate);
  const inWindow = sorted.filter((e) => e.date >= startDate && e.date <= anchorDate);

  if (inWindow.length === 0 && onOrBeforeStart.length === 0) {
    return [];
  }

  let carry: number | null =
    onOrBeforeStart.length > 0 ? onOrBeforeStart[onOrBeforeStart.length - 1].weightKg : null;

  const byDate = new Map<string, number>();
  inWindow.forEach((e) => byDate.set(e.date, e.weightKg));

  const series: SparklinePoint[] = [];
  for (let i = 0; i < 7; i += 1) {
    const date = addDays(startDate, i);
    const actualValue = byDate.get(date);
    if (actualValue !== undefined) {
      carry = actualValue;
      series.push({ date, weightKg: actualValue, actual: true });
    } else if (carry !== null) {
      series.push({ date, weightKg: carry, actual: false });
    }
  }

  return series;
}
