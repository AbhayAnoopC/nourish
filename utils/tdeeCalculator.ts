import { ActivityLevel, Goal, UserProfile } from '@/types';

const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  very: 1.725,
  extreme: 1.9,
};

const GOAL_ADJUSTMENTS: Record<Goal, number> = {
  lose: -500,
  maintain: 0,
  gain: 250,
};

export function calculateAge(dateOfBirth: string): number {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const monthDiff = today.getMonth() - dob.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(
  sex: UserProfile['sex'],
  weightKg: number,
  heightCm: number,
  ageYears: number,
): number {
  // Mifflin-St Jeor equation
  const base = 10 * weightKg + 6.25 * heightCm - 5 * ageYears;
  if (sex === 'male') return base + 5;
  if (sex === 'female') return base - 161;
  // 'other': average of male/female adjustments
  return base - 78;
}

export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  return Math.round(bmr * ACTIVITY_FACTORS[activityLevel]);
}

export function calculateCalorieTarget(tdee: number, goal: Goal): number {
  return Math.round(tdee + GOAL_ADJUSTMENTS[goal]);
}

export interface MacroTargets {
  proteinG: number;
  carbsG: number;
  fatG: number;
}

export function calculateMacros(dailyCalories: number): MacroTargets {
  return {
    proteinG: Math.round((dailyCalories * 0.25) / 4),
    carbsG: Math.round((dailyCalories * 0.45) / 4),
    fatG: Math.round((dailyCalories * 0.3) / 9),
  };
}

export interface NutritionTargets {
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
}

export function calculateTargets(
  profile: Pick<
    UserProfile,
    'sex' | 'weightKg' | 'heightCm' | 'dateOfBirth' | 'activityLevel' | 'goal'
  >,
): NutritionTargets {
  const age = calculateAge(profile.dateOfBirth);
  const bmr = calculateBMR(profile.sex, profile.weightKg, profile.heightCm, age);
  const tdee = calculateTDEE(bmr, profile.activityLevel);
  const calories = calculateCalorieTarget(tdee, profile.goal);
  const macros = calculateMacros(calories);
  return {
    dailyCalorieTarget: calories,
    dailyProteinTarget: macros.proteinG,
    dailyCarbTarget: macros.carbsG,
    dailyFatTarget: macros.fatG,
  };
}
