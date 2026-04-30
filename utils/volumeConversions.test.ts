import { ML_PER_UNIT, modifierToMl } from './volumeConversions';

describe('ML_PER_UNIT', () => {
  it('has correct conversion factors', () => {
    expect(ML_PER_UNIT.ml).toBe(1);
    expect(ML_PER_UNIT.cup).toBeCloseTo(236.588, 3);
    expect(ML_PER_UNIT.tbsp).toBeCloseTo(14.7868, 4);
    expect(ML_PER_UNIT.tsp).toBeCloseTo(4.92892, 5);
    expect(ML_PER_UNIT['fl oz']).toBeCloseTo(29.5735, 4);
  });
});

describe('modifierToMl', () => {
  it('detects cup', () => {
    expect(modifierToMl('cup, chopped')).toBeCloseTo(236.588, 3);
    expect(modifierToMl('1 cup')).toBeCloseTo(236.588, 3);
  });

  it('detects tablespoon', () => {
    expect(modifierToMl('tbsp')).toBeCloseTo(14.7868, 4);
    expect(modifierToMl('tablespoon')).toBeCloseTo(14.7868, 4);
  });

  it('detects teaspoon', () => {
    expect(modifierToMl('tsp')).toBeCloseTo(4.92892, 5);
    expect(modifierToMl('teaspoon')).toBeCloseTo(4.92892, 5);
  });

  it('detects fl oz', () => {
    expect(modifierToMl('fl oz')).toBeCloseTo(29.5735, 4);
    expect(modifierToMl('fluid ounce')).toBeCloseTo(29.5735, 4);
  });

  it('detects ml', () => {
    expect(modifierToMl('ml')).toBe(1);
    expect(modifierToMl('100 ml')).toBe(1);
  });

  it('returns null for non-volume modifiers', () => {
    expect(modifierToMl('breast, half')).toBeNull();
    expect(modifierToMl('medium')).toBeNull();
    expect(modifierToMl('g')).toBeNull();
    expect(modifierToMl('')).toBeNull();
  });
});
