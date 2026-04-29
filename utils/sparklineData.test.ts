import { buildSparklineSeries } from './sparklineData';

describe('buildSparklineSeries', () => {
  it('returns 7 entries with carry-forward for missing days', () => {
    const entries = [
      { date: '2026-04-22', weightKg: 75.0 },
      { date: '2026-04-25', weightKg: 74.5 },
      { date: '2026-04-28', weightKg: 74.0 },
    ];
    const series = buildSparklineSeries(entries, '2026-04-28');
    expect(series).toHaveLength(7);
    expect(series.map((p) => p.weightKg)).toEqual([75.0, 75.0, 75.0, 74.5, 74.5, 74.5, 74.0]);
    expect(series.map((p) => p.actual)).toEqual([true, false, false, true, false, false, true]);
  });

  it('carries forward from before the 7-day window', () => {
    const entries = [{ date: '2026-04-15', weightKg: 76.0 }];
    const series = buildSparklineSeries(entries, '2026-04-28');
    expect(series.map((p) => p.weightKg)).toEqual([76.0, 76.0, 76.0, 76.0, 76.0, 76.0, 76.0]);
    expect(series.every((p) => p.actual === false)).toBe(true);
  });

  it('returns empty array if no entries at all', () => {
    expect(buildSparklineSeries([], '2026-04-28')).toEqual([]);
  });

  it('returns empty array if no entries exist on or before the anchor date', () => {
    const entries = [{ date: '2026-05-01', weightKg: 75.0 }];
    expect(buildSparklineSeries(entries, '2026-04-28')).toEqual([]);
  });

  it('counts only actual entries within the window for "fewer than 2" check', () => {
    const entries = [{ date: '2026-04-28', weightKg: 74.0 }];
    const series = buildSparklineSeries(entries, '2026-04-28');
    const actualCount = series.filter((p) => p.actual).length;
    expect(actualCount).toBe(1);
  });
});
