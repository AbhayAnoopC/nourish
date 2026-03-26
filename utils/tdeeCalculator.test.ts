import {
  calculateAge,
  calculateBMR,
  calculateTDEE,
  calculateCalorieTarget,
  calculateMacros,
  calculateTargets,
} from './tdeeCalculator';

describe('calculateAge', () => {
  it('returns correct age for a past date of birth', () => {
    // Fixed reference: someone born 30 years ago today
    const today = new Date();
    const dob = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(calculateAge(dob.toISOString().split('T')[0])).toBe(30);
  });

  it('returns age - 1 when birthday has not yet occurred this year', () => {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    const dob = new Date(today.getFullYear() - 25, nextMonth.getMonth(), nextMonth.getDate());
    expect(calculateAge(dob.toISOString().split('T')[0])).toBe(24);
  });
});

describe('calculateBMR', () => {
  // Male, 80 kg, 180 cm, 30 years → 10*80 + 6.25*180 - 5*30 + 5 = 1780
  it('computes male BMR with Mifflin-St Jeor', () => {
    expect(calculateBMR('male', 80, 180, 30)).toBeCloseTo(1780, 0);
  });

  // Female, 60 kg, 165 cm, 30 years → 10*60 + 6.25*165 - 5*30 - 161 = 1320.25
  it('computes female BMR with Mifflin-St Jeor', () => {
    expect(calculateBMR('female', 60, 165, 30)).toBeCloseTo(1320, 0);
  });

  it('computes other BMR as average of male/female adjustments', () => {
    const male = calculateBMR('male', 70, 170, 25);
    const female = calculateBMR('female', 70, 170, 25);
    const other = calculateBMR('other', 70, 170, 25);
    expect(other).toBeCloseTo((male + female) / 2, 0);
  });
});

describe('calculateTDEE', () => {
  it('applies sedentary multiplier (×1.2)', () => {
    expect(calculateTDEE(1780, 'sedentary')).toBe(Math.round(1780 * 1.2));
  });

  it('applies moderate multiplier (×1.55)', () => {
    expect(calculateTDEE(1780, 'moderate')).toBe(Math.round(1780 * 1.55));
  });

  it('applies extreme multiplier (×1.9)', () => {
    expect(calculateTDEE(1780, 'extreme')).toBe(Math.round(1780 * 1.9));
  });
});

describe('calculateCalorieTarget', () => {
  it('subtracts 500 kcal for lose goal', () => {
    expect(calculateCalorieTarget(2000, 'lose')).toBe(1500);
  });

  it('keeps TDEE unchanged for maintain goal', () => {
    expect(calculateCalorieTarget(2000, 'maintain')).toBe(2000);
  });

  it('adds 250 kcal for gain goal', () => {
    expect(calculateCalorieTarget(2000, 'gain')).toBe(2250);
  });
});

describe('calculateMacros', () => {
  it('splits 2000 kcal into correct macro grams', () => {
    const macros = calculateMacros(2000);
    // Protein: 25% of 2000 / 4 cal/g = 125g
    expect(macros.proteinG).toBe(125);
    // Carbs: 45% of 2000 / 4 cal/g = 225g
    expect(macros.carbsG).toBe(225);
    // Fat: 30% of 2000 / 9 cal/g = 67g
    expect(macros.fatG).toBe(67);
  });

  it('macro calories sum to approximately the input calories', () => {
    const kcal = 2200;
    const { proteinG, carbsG, fatG } = calculateMacros(kcal);
    const total = proteinG * 4 + carbsG * 4 + fatG * 9;
    // Allow ±20 kcal rounding tolerance
    expect(total).toBeGreaterThan(kcal - 20);
    expect(total).toBeLessThan(kcal + 20);
  });
});

describe('calculateTargets', () => {
  it('returns all four nutrition targets', () => {
    const result = calculateTargets({
      sex: 'male',
      weightKg: 80,
      heightCm: 180,
      dateOfBirth: '1994-01-01',
      activityLevel: 'moderate',
      goal: 'maintain',
    });
    expect(result.dailyCalorieTarget).toBeGreaterThan(0);
    expect(result.dailyProteinTarget).toBeGreaterThan(0);
    expect(result.dailyCarbTarget).toBeGreaterThan(0);
    expect(result.dailyFatTarget).toBeGreaterThan(0);
  });

  it('lose goal gives fewer calories than maintain', () => {
    const base = { sex: 'female' as const, weightKg: 65, heightCm: 165, dateOfBirth: '1995-06-15', activityLevel: 'light' as const };
    const maintain = calculateTargets({ ...base, goal: 'maintain' });
    const lose = calculateTargets({ ...base, goal: 'lose' });
    expect(lose.dailyCalorieTarget).toBeLessThan(maintain.dailyCalorieTarget);
  });
});
