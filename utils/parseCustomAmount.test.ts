import { parseCustomAmount } from './parseCustomAmount';

describe('parseCustomAmount', () => {
  it('passes grams through directly', () => {
    expect(parseCustomAmount(150, 'g')).toBe(150);
  });

  it('converts ounces to grams', () => {
    expect(parseCustomAmount(1, 'oz')).toBeCloseTo(28.3, 1);
    expect(parseCustomAmount(4, 'oz')).toBeCloseTo(113.4, 1);
  });

  it('converts ml to grams when density is provided', () => {
    expect(parseCustomAmount(100, 'ml', 1)).toBe(100);
    expect(parseCustomAmount(100, 'ml', 1.03)).toBeCloseTo(103, 0);
  });

  it('throws when ml is requested without density', () => {
    expect(() => parseCustomAmount(100, 'ml')).toThrow(/density/i);
  });

  it('rounds to 1 decimal place', () => {
    expect(parseCustomAmount(0.789, 'oz')).toBeCloseTo(22.4, 1);
  });

  it('handles zero', () => {
    expect(parseCustomAmount(0, 'g')).toBe(0);
  });
});
