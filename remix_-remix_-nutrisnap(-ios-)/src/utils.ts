import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { UserProfile, Workout, ActivityLevel } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DEFAULT_GOAL = 2000;

export const calculateDailyGoal = (profile: UserProfile | null, workouts: Workout[] = [], dietMultiplier: number = 1): number => {
  if (!profile) return DEFAULT_GOAL;

  // If user set a custom goal, use it as the base
  if (profile.customDailyGoal) {
    return Math.round(profile.customDailyGoal * dietMultiplier);
  }

  // Mifflin-St Jeor Equation
  let bmr: number;
  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  const activityMultipliers: Record<ActivityLevel, number> = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  let tdee = bmr * activityMultipliers[profile.activityLevel];

  // Add calories burned from workouts for more accuracy
  const workoutCalories = workouts.reduce((sum, w) => sum + w.caloriesBurned, 0);
  tdee += workoutCalories;

  if (profile.goal === 'lose') {
    const weeklyDeficit = (profile.weeklyGoal || 0.5) * 7700; // 7700 kcal per kg of fat
    tdee -= (weeklyDeficit / 7);
  } else if (profile.goal === 'gain') {
    const weeklySurplus = (profile.weeklyGoal || 0.5) * 7700;
    tdee += (weeklySurplus / 7);
  }

  return Math.round(tdee * dietMultiplier);
};
