import { kgToLbs, lbsToKg, cmToFtIn, ftInToCm } from './unitConverter';

describe('kgToLbs', () => {
  it('converts 70 kg to ~154.3 lbs', () => {
    expect(kgToLbs(70)).toBeCloseTo(154.3, 0);
  });

  it('is inverse of lbsToKg within rounding', () => {
    const original = 80;
    expect(kgToLbs(lbsToKg(original))).toBeCloseTo(original, 0);
  });
});

describe('lbsToKg', () => {
  it('converts 154 lbs to ~69.9 kg', () => {
    expect(lbsToKg(154)).toBeCloseTo(69.9, 0);
  });
});

describe('cmToFtIn', () => {
  it('converts 180 cm to 5 feet 11 inches', () => {
    const { feet, inches } = cmToFtIn(180);
    expect(feet).toBe(5);
    expect(inches).toBe(11);
  });

  it('converts 152 cm to 4 feet 12 or 5 feet 0 inches', () => {
    const { feet, inches } = cmToFtIn(152);
    const totalInches = feet * 12 + inches;
    expect(totalInches).toBeCloseTo(152 / 2.54, 0);
  });
});

describe('ftInToCm', () => {
  it('converts 5 feet 11 inches to ~180 cm', () => {
    expect(ftInToCm(5, 11)).toBeCloseTo(180, 0);
  });

  it('is inverse of cmToFtIn within rounding', () => {
    const cm = 175;
    const { feet, inches } = cmToFtIn(cm);
    expect(ftInToCm(feet, inches)).toBeCloseTo(cm, 0);
  });
});
