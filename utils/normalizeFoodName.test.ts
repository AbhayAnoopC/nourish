import {
  normalizeFoodName,
  tokenize,
  isFuzzyMatch,
  isExactMatch,
} from './normalizeFoodName';

describe('normalizeFoodName', () => {
  it('lowercases and trims', () => {
    expect(normalizeFoodName('  Chicken Breast  ')).toBe('chicken breast');
  });

  it('strips punctuation and collapses whitespace', () => {
    expect(normalizeFoodName('Chicken breast, raw (boneless)')).toBe(
      'chicken breast raw boneless',
    );
  });

  it('preserves unicode letters and digits', () => {
    expect(normalizeFoodName('Café — 80g')).toBe('café 80g');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeFoodName('   ')).toBe('');
  });
});

describe('tokenize', () => {
  it('splits on whitespace and drops tokens shorter than 2 chars', () => {
    expect(tokenize('chicken breast a b')).toEqual(['chicken', 'breast']);
  });

  it('returns an empty array for empty input', () => {
    expect(tokenize('')).toEqual([]);
  });
});

describe('isExactMatch', () => {
  it('matches identical normalized names', () => {
    expect(isExactMatch('Chicken Breast', 'chicken breast')).toBe(true);
  });

  it('does not match when names differ', () => {
    expect(isExactMatch('chicken breast', 'chicken breast, raw')).toBe(false);
  });
});

describe('isFuzzyMatch', () => {
  it('returns true when all matchKey tokens appear in food name', () => {
    expect(isFuzzyMatch('chicken breast', 'Boneless skinless chicken breast')).toBe(true);
  });

  it('returns false when any matchKey token is absent', () => {
    expect(isFuzzyMatch('chicken thigh', 'Boneless skinless chicken breast')).toBe(false);
  });

  it('is case-insensitive', () => {
    expect(isFuzzyMatch('CHICKEN', 'Chicken Breast')).toBe(true);
  });

  it('returns false when matchKey produces no tokens (e.g., all 1-char)', () => {
    expect(isFuzzyMatch('a b', 'Chicken Breast')).toBe(false);
  });

  it('returns false when food name is empty', () => {
    expect(isFuzzyMatch('chicken', '')).toBe(false);
  });
});
