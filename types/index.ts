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
  date: string; // ISO date string YYYY-MM-DD
  timestamp: string; // ISO datetime
  foodName: string;
  brandName?: string;
  servingSize: string; // e.g. "1 cup", "100g", "1 medium"
  servingQuantity: number;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts' | 'photo' | 'barcode' | 'label' | 'voice' | 'manual';
}

export interface DailyLog {
  date: string; // YYYY-MM-DD
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

// Unified search result from USDA or Open Food Facts — values are per 100 g
export interface SearchResult {
  id: string;
  foodName: string;
  brandName?: string;
  servingSize: string; // always '100g' for search results in step 4
  calories: number;    // kcal per 100 g
  proteinG: number;
  carbsG: number;
  fatG: number;
  source: 'usda' | 'openfoodfacts';
}
