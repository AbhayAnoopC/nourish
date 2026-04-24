import { getTodayDateString, formatDisplayDate, getTimeOfDayGreeting } from './dateUtils';

afterEach(() => {
  jest.useRealTimers();
});

describe('getTodayDateString', () => {
  it('returns a string in YYYY-MM-DD format', () => {
    const result = getTodayDateString();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('matches today in local time', () => {
    const result = getTodayDateString();
    const now = new Date();
    const year = String(now.getFullYear());
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    expect(result).toBe(`${year}-${month}-${day}`);
  });

  it('zero-pads single-digit month and day', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-03-05T10:00:00'));
    expect(getTodayDateString()).toBe('2024-03-05');
  });

  it('handles end of month correctly', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-12-31T23:59:59'));
    expect(getTodayDateString()).toBe('2024-12-31');
  });
});

describe('formatDisplayDate', () => {
  it('returns a non-empty string', () => {
    const result = formatDisplayDate(new Date('2024-04-23T12:00:00'));
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the day number', () => {
    const result = formatDisplayDate(new Date('2024-04-23T12:00:00'));
    expect(result).toContain('23');
  });
});

describe('getTimeOfDayGreeting', () => {
  it('returns "Good morning" at 8:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T08:00:00'));
    expect(getTimeOfDayGreeting()).toBe('Good morning');
  });

  it('returns "Good morning" at 11:59', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T11:59:00'));
    expect(getTimeOfDayGreeting()).toBe('Good morning');
  });

  it('returns "Good afternoon" at 12:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T12:00:00'));
    expect(getTimeOfDayGreeting()).toBe('Good afternoon');
  });

  it('returns "Good afternoon" at 17:59', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T17:59:00'));
    expect(getTimeOfDayGreeting()).toBe('Good afternoon');
  });

  it('returns "Good evening" at 18:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T18:00:00'));
    expect(getTimeOfDayGreeting()).toBe('Good evening');
  });

  it('returns "Good evening" at 23:00', () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2024-01-01T23:00:00'));
    expect(getTimeOfDayGreeting()).toBe('Good evening');
  });
});
