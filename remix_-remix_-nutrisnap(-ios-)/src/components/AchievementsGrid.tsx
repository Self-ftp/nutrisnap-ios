import React from 'react';
import { motion } from 'motion/react';
import { Trophy, Lock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Achievement, UserAchievement, Meal, Workout, CommonFood, UserProfile } from '../types';
import { ACHIEVEMENTS, DIETS } from '../constants';
import { cn, calculateDailyGoal } from '../utils';

interface AchievementsGridProps {
  userAchievements: UserAchievement[];
  meals: Meal[];
  workouts: Workout[];
  customFoods: CommonFood[];
  waterIntake: Record<string, number>;
  profile: UserProfile | null;
}

export function AchievementsGrid({ 
  userAchievements, 
  meals, 
  workouts, 
  customFoods, 
  waterIntake, 
  profile 
}: AchievementsGridProps) {
  const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));

  const calculateProgress = (achievement: Achievement): { current: number; target: number; percentage: number } => {
    let current = 0;
    const target = achievement.requirement;

    switch (achievement.type) {
      case 'meals':
        current = meals.length;
        break;
      case 'workouts':
        current = workouts.length;
        break;
      case 'custom_foods':
        current = customFoods.length;
        break;
      case 'time':
        if (achievement.id === 'early_bird_logger') {
          current = meals.some(m => {
            const date = new Date(m.timestamp);
            return date.getHours() < 7;
          }) ? 1 : 0;
        }
        break;
      case 'streak': {
        const dates = Array.from(new Set(meals.map(m => new Date(m.timestamp).toDateString()))).sort() as string[];
        let currentStreak = 0;
        let maxStreak = 0;
        for (let i = 0; i < dates.length; i++) {
          if (i === 0) currentStreak = 1;
          else {
            const prev = new Date(dates[i-1]).getTime();
            const curr = new Date(dates[i]).getTime();
            const diff = (curr - prev) / (1000 * 60 * 60 * 24);
            if (Math.round(diff) === 1) currentStreak++;
            else currentStreak = 1;
          }
          maxStreak = Math.max(maxStreak, currentStreak);
        }
        current = maxStreak;
        break;
      }
      case 'calories': {
        const mealsByDate: Record<string, number> = {};
        meals.forEach(m => {
          const d = new Date(m.timestamp).toDateString();
          mealsByDate[d] = (mealsByDate[d] || 0) + m.calories;
        });
        
        let daysMet = 0;
        Object.entries(mealsByDate).forEach(([date, cals]) => {
          const diet = DIETS.find(d => d.id === profile?.activeDietId);
          const multiplier = diet?.caloriesMultiplier || 1;
          const goal = calculateDailyGoal(profile, workouts.filter(w => new Date(w.timestamp).toDateString() === date), multiplier);
          if (cals <= goal && cals > 0) daysMet++;
        });
        current = daysMet;
        break;
      }
      case 'water': {
        const today = new Date().toISOString().split('T')[0];
        current = waterIntake[today] || 0;
        break;
      }
      case 'protein': {
        const mealsByDate: Record<string, number> = {};
        meals.forEach(m => {
          const d = new Date(m.timestamp).toDateString();
          mealsByDate[d] = (mealsByDate[d] || 0) + m.protein;
        });
        current = Math.max(0, ...Object.values(mealsByDate));
        break;
      }
    }

    const percentage = Math.min(100, (current / target) * 100);
    return { current, target, percentage };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-amber-100 dark:bg-amber-500/20 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400">
          <Trophy size={20} />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Достижения</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Разблокировано {earnedIds.size} из {ACHIEVEMENTS.length}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {ACHIEVEMENTS.map((achievement) => {
          const isEarned = earnedIds.has(achievement.id);
          const earnedDate = userAchievements.find(ua => ua.achievementId === achievement.id)?.dateEarned;
          const progress = calculateProgress(achievement);

          return (
            <motion.div
              key={achievement.id}
              whileHover={{ scale: 1.02 }}
              className={cn(
                "relative p-5 rounded-[32px] border transition-all overflow-hidden flex flex-col",
                isEarned 
                  ? "bg-white dark:bg-[#141414] border-amber-100 dark:border-amber-500/20 shadow-sm" 
                  : "bg-gray-50/50 dark:bg-white/5 border-black/5 dark:border-white/5"
              )}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-inner",
                  isEarned ? "bg-amber-50 dark:bg-amber-500/10" : "bg-gray-100 dark:bg-white/5 grayscale opacity-50"
                )}>
                  {achievement.icon}
                </div>
                {isEarned ? (
                  <div className="bg-amber-100 dark:bg-amber-500/20 p-1.5 rounded-full text-amber-600 dark:text-amber-400">
                    <CheckCircle2 size={16} />
                  </div>
                ) : (
                  <div className="bg-gray-100 dark:bg-white/5 p-1.5 rounded-full text-gray-400 dark:text-gray-500">
                    <Lock size={16} />
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <h3 className={cn(
                  "text-sm font-bold mb-1 leading-tight",
                  isEarned ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"
                )}>
                  {achievement.title}
                </h3>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight mb-4">
                  {achievement.description}
                </p>
              </div>

              {isEarned ? (
                earnedDate && (
                  <div className="mt-auto pt-3 border-t border-amber-50 dark:border-amber-500/10 text-[8px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest">
                    Получено {new Date(earnedDate).toLocaleDateString()}
                  </div>
                )
              ) : (
                <div className="mt-auto space-y-2">
                  <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                    <div className="flex items-center gap-1">
                      <TrendingUp size={10} />
                      Прогресс
                    </div>
                    <span>{Math.round(progress.current)} / {progress.target}</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.percentage}%` }}
                      className="h-full bg-lime-400"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
