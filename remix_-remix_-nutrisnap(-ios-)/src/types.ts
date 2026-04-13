export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface Meal {
  id: string;
  timestamp: number;
  imageUrl: string;
  name: string;
  type?: MealType;
  brand?: string;
  ingredients?: string[];
  allergens?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  analysis: string;
  icon?: string;
  vitamins?: { name: string; amount: string }[];
  minerals?: { name: string; amount: string }[];
}

export interface DailyStats {
  totalCalories: number;
  mainCalories: number;
  snackCalories: number;
  totalProtein: number;
  totalCarbs: number;
  totalFat: number;
}

export interface AnalysisResult {
  name: string;
  brand?: string;
  ingredients?: string[];
  allergens?: string[];
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
  imageUrl?: string;
  vitamins?: { name: string; amount: string }[];
  minerals?: { name: string; amount: string }[];
}

export interface DailyInsight {
  summary: string;
  advice: string;
  score: number;
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface MealReminder {
  id: string;
  time: string; // "HH:mm"
  label: string;
  enabled: boolean;
}

export interface Workout {
  id: string;
  timestamp: number;
  name: string;
  duration: number; // in minutes
  caloriesBurned: number;
  intensity: 'low' | 'moderate' | 'high';
}

export type Theme = 'light' | 'dark' | 'system';

export interface HealthIntegration {
  provider: 'strava' | 'samsung';
  connected: boolean;
  lastSync?: number;
}

export interface UserProfile {
  name: string;
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: 'male' | 'female';
  activityLevel: ActivityLevel;
  goal: 'lose' | 'maintain' | 'gain';
  targetWeight?: number; // in kg
  weeklyGoal?: number; // e.g., -0.5, 0, 0.5 kg per week
  weightHistory?: { date: string; weight: number }[];
  reminders?: MealReminder[];
  theme?: Theme;
  integrations?: HealthIntegration[];
  photoURL?: string;
  activeDietId?: string;
  customDailyGoal?: number;
  subscriptionCode?: string;
  isSubscriptionActive?: boolean;
  subscriptionExpiresAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  requirement: number;
  type: 'meals' | 'workouts' | 'calories' | 'streak' | 'water' | 'protein' | 'time' | 'custom_foods';
}

export interface UserAchievement {
  achievementId: string;
  dateEarned: number;
}

export interface CommonFood {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  unit?: string;
  icon: string;
  imageUrl?: string;
  category?: 'breakfast' | 'lunch' | 'dinner' | 'drinks' | 'fruits';
  brand?: string;
  ingredients?: string[];
  allergens?: string[];
  description?: string;
  vitamins?: { name: string; amount: string }[];
  minerals?: { name: string; amount: string }[];
}

export interface Diet {
  id: string;
  name: string;
  description: string;
  icon: string;
  caloriesMultiplier: number;
  macrosRatio: {
    protein: number;
    carbs: number;
    fat: number;
  };
  benefits: string[];
  foodsToAvoid: string[];
  foodsToEat: string[];
  fullContent?: string;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  category: 'nutrition' | 'training' | 'lifestyle' | 'health' | 'tips' | 'fitness';
  readTime: string;
  fullContent: string;
  imageUrl?: string;
}

export type RecipeCategory = 'oven' | 'multicooker' | 'pan';

export interface Recipe {
  id: string;
  name: string;
  category: RecipeCategory;
  ingredients: string[];
  instructions: string[];
  prepTime: number; // in minutes
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  imageUrl?: string;
}


