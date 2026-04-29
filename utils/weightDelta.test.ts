import { weeklyWeightDelta } from './weightDelta';

describe('weeklyWeightDelta', () => {
  it('returns delta from oldest to newest actual entry within last 7 days', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.0, actual: true },
      { date: '2026-04-25', weightKg: 74.5, actual: false },
      { date: '2026-04-28', weightKg: 74.0, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(-1.0);
  });

  it('ignores carry-forward entries when computing delta', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.0, actual: false },
      { date: '2026-04-23', weightKg: 75.0, actual: false },
      { date: '2026-04-28', weightKg: 74.5, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBeNull();
  });

  it('returns null when fewer than 2 actual entries', () => {
    expect(weeklyWeightDelta([])).toBeNull();
    expect(weeklyWeightDelta([{ date: '2026-04-28', weightKg: 74.0, actual: true }])).toBeNull();
  });

  it('handles a positive delta', () => {
    const series = [
      { date: '2026-04-22', weightKg: 73.0, actual: true },
      { date: '2026-04-28', weightKg: 74.0, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(1.0);
  });

  it('rounds to 1 decimal place', () => {
    const series = [
      { date: '2026-04-22', weightKg: 75.123, actual: true },
      { date: '2026-04-28', weightKg: 74.876, actual: true },
    ];
    expect(weeklyWeightDelta(series)).toBe(-0.2);
  });
});
