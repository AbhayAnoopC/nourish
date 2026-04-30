export interface UserProfile {
  name?: string;
  sex: 'male' | 'female' | 'other';
  dateOfBirth: string;
  heightCm: number;
  weightKg: number;
  activityLevel: 'sedentary' | 'light' | 'moderate' | 'very' | 'extreme';
  goal: 'lose' | 'maintain' | 'gain';
  dailyCalorieTarget: number;
  dailyProteinTarget: number;
  dailyCarbTarget: number;
  dailyFatTarget: number;
  dailyWaterTargetMl: number;
  units: 'metric' | 'imperial';
  onboardingComplete: boolean;
}

export interface FoodLogItem {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO datetime
  foodName: string;
  brandName?: string;
  servingLabel: string; // pre-formatted, e.g. "1 large breast" or "150 g"
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'photo' | 'barcode' | 'label' | 'voice' | 'manual';
}

export interface DailyLog {
  date: string;
  foodItems: FoodLogItem[];
  waterMl: number;
  caloriesBurned: number;
  caloriesBurnedSource: 'zepp' | 'healthconnect' | 'applehealth' | 'manual';
  bodyWeightKg?: number;
}

export interface SavedMeal {
  id: string;
  name: string;
  createdAt: string;
  items: Omit<FoodLogItem, 'id' | 'date' | 'timestamp'>[];
  totalCalories: number;
  totalProteinG: number;
  totalCarbsG: number;
  totalFatG: number;
}

export type ActivityLevel = UserProfile['activityLevel'];
export type Goal = UserProfile['goal'];
export type FoodSource = FoodLogItem['source'];
export type CaloriesBurnedSource = DailyLog['caloriesBurnedSource'];
export type AmazfitConnectionTier = 'zepp' | 'healthconnect' | 'applehealth' | 'manual' | 'none';

export interface FoodPortion {
  label: string;       // e.g. "1 cup, chopped"
  gramWeight: number;  // e.g. 142
}

export interface SearchResult {
  id: string;
  foodName: string;
  brandName?: string;
  servingSize: string;
  calories: number; // kcal per 100g
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'barcode';
  foodPortions?: FoodPortion[];   // populated by USDA service when available
  servingGrams?: number;          // populated by OFF service when available (single serving)
}

export interface CustomServing {
  id: string;
  matchKey: string;  // normalized food name to match, e.g. "chicken breast"
  label: string;     // e.g. "1 large breast"
  grams: number;     // e.g. 220
  createdAt: string;
}

export interface ServingOption {
  label: string;
  grams: number;
  source: 'usda' | 'off' | 'custom' | 'fallback';
  customId?: string;
  isFuzzyMatch?: boolean; // true when source = 'custom' and matchKey != normalized food name
}

export type { WeightEntry } from '@/utils/sparklineData';
