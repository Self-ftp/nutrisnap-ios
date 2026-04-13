import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, LineChart, Line } from 'recharts';
import { Meal, Workout, UserProfile } from '../types';
import { motion } from 'motion/react';
import { calculateDailyGoal } from '../utils';

interface ProgressChartsProps {
  meals: Meal[];
  workouts: Workout[];
  profile: UserProfile | null;
  dietMultiplier?: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white dark:bg-[#1A1A1A] p-4 rounded-2xl shadow-xl border border-black/5 dark:border-white/5 min-w-[160px]">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">{label}</p>
        <div className="space-y-2">
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Калории</span>
            <span className="text-sm font-black text-lime-600 dark:text-lime-400">{data.calories} ккал</span>
          </div>
          <div className="flex justify-between items-center gap-4">
            <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase">Расход</span>
            <span className="text-sm font-black text-blue-600 dark:text-blue-400">{data.burned} ккал</span>
          </div>
          <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />
          <div className="grid grid-cols-3 gap-2 pt-1">
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-orange-500 dark:text-orange-400">Белки</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{data.protein}г</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-blue-500 dark:text-blue-400">Угл.</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{data.carbs}г</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black uppercase text-purple-500 dark:text-purple-400">Жиры</p>
              <p className="text-xs font-bold text-gray-900 dark:text-white">{data.fat}г</p>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ProgressCharts: React.FC<ProgressChartsProps> = ({ meals, workouts, profile, dietMultiplier = 1 }) => {
  const chartData30Days = useMemo(() => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const groupedMeals = meals.reduce((acc, meal) => {
      const date = new Date(meal.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[date].calories += meal.calories;
      acc[date].protein += meal.protein;
      acc[date].carbs += meal.carbs;
      acc[date].fat += meal.fat;
      return acc;
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number }>);

    const groupedWorkouts = workouts.reduce((acc, workout) => {
      const date = new Date(workout.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += workout.caloriesBurned;
      return acc;
    }, {} as Record<string, number>);

    return last30Days.map(date => {
      const mealStats = groupedMeals[date] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const workoutCals = groupedWorkouts[date] || 0;
      
      return {
        name: new Date(date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
        ...mealStats,
        burned: workoutCals,
      };
    });
  }, [meals, workouts]);

  const chartData7Days = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toDateString();
    }).reverse();

    const groupedMeals = meals.reduce((acc, meal) => {
      const date = new Date(meal.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = { calories: 0, protein: 0, carbs: 0, fat: 0 };
      }
      acc[date].calories += meal.calories;
      acc[date].protein += meal.protein;
      acc[date].carbs += meal.carbs;
      acc[date].fat += meal.fat;
      return acc;
    }, {} as Record<string, { calories: number; protein: number; carbs: number; fat: number }>);

    const groupedWorkouts = workouts.reduce((acc, workout) => {
      const date = new Date(workout.timestamp).toDateString();
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += workout.caloriesBurned;
      return acc;
    }, {} as Record<string, number>);

    return last7Days.map(date => {
      const mealStats = groupedMeals[date] || { calories: 0, protein: 0, carbs: 0, fat: 0 };
      const workoutCals = groupedWorkouts[date] || 0;
      
      // Calculate goal for this specific day (including that day's workouts)
      const dayWorkouts = workouts.filter(w => new Date(w.timestamp).toDateString() === date);
      const dayGoal = calculateDailyGoal(profile, dayWorkouts, dietMultiplier);

      return {
        name: new Date(date).toLocaleDateString('ru-RU', { weekday: 'short' }),
        ...mealStats,
        burned: workoutCals,
        net: mealStats.calories - workoutCals,
        goal: dayGoal
      };
    });
  }, [meals, workouts, profile, dietMultiplier]);

  if (meals.length === 0 && workouts.length === 0) {
    return (
      <div className="text-center py-12 bg-white dark:bg-[#141414] rounded-[32px] border border-black/5 dark:border-white/5">
        <p className="text-gray-400 dark:text-gray-500 text-sm font-medium">Добавьте данные, чтобы увидеть графики прогресса</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Calories Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-[#141414] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 px-2">Калории (последние 7 дней)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData7Days}>
              <defs>
                <linearGradient id="colorCal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBurned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 20 }}
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke="#a3e635" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCal)" 
                name="Потребление"
              />
              <Area 
                type="monotone" 
                dataKey="burned" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBurned)" 
                name="Расход"
              />
              <Area 
                type="monotone" 
                dataKey="goal" 
                stroke="currentColor" 
                className="text-gray-200 dark:text-white/10"
                strokeWidth={2}
                strokeDasharray="5 5"
                fill="none"
                name="Цель"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Macros Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-[#141414] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 px-2">Макронутриенты (г)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData7Days}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 20 }}
              />
              <Bar dataKey="protein" fill="#f97316" radius={[4, 4, 0, 0]} name="Белки" />
              <Bar dataKey="carbs" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Углеводы" />
              <Bar dataKey="fat" fill="#a855f7" radius={[4, 4, 0, 0]} name="Жиры" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Weight Chart */}
      {profile?.weightHistory && profile.weightHistory.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-[#141414] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-6 px-2">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">График веса (кг)</h3>
            {profile.targetWeight && (
              <span className="text-[10px] font-bold text-lime-500 bg-lime-500/10 px-2 py-1 rounded-full uppercase tracking-widest">
                Цель: {profile.targetWeight} кг
              </span>
            )}
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={profile.weightHistory.map(w => ({ ...w, name: new Date(w.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }) }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/5" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                  className="text-gray-400 dark:text-gray-600"
                  dy={10}
                />
                <YAxis 
                  domain={['dataMin - 2', 'dataMax + 2']}
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                  className="text-gray-400 dark:text-gray-600"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'var(--tw-bg-opacity, #fff)', 
                    borderRadius: '1rem', 
                    border: '1px solid rgba(0,0,0,0.05)',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                  }}
                  itemStyle={{ fontSize: '12px', fontWeight: 700 }}
                  labelStyle={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', color: '#9ca3af', marginBottom: '4px' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="weight" 
                  stroke="#a3e635" 
                  strokeWidth={4}
                  dot={{ r: 4, fill: '#a3e635', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6, fill: '#a3e635', strokeWidth: 0 }}
                  name="Вес"
                />
                {profile.targetWeight && (
                  <Line 
                    type="monotone" 
                    dataKey={() => profile.targetWeight} 
                    stroke="currentColor" 
                    className="text-gray-300 dark:text-white/20"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    name="Цель"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Monthly Calories Chart */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white dark:bg-[#141414] p-6 rounded-[32px] border border-black/5 dark:border-white/5 shadow-sm"
      >
        <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-6 px-2">Динамика калорий (последние 30 дней)</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData30Days}>
              <defs>
                <linearGradient id="colorCal30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a3e635" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#a3e635" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorBurned30" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-gray-100 dark:text-white/5" />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 10, fontWeight: 700, fill: 'currentColor' }}
                className="text-gray-400 dark:text-gray-600"
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                verticalAlign="top" 
                align="right" 
                iconType="circle"
                wrapperStyle={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', paddingBottom: 20 }}
              />
              <Area 
                type="monotone" 
                dataKey="calories" 
                stroke="#a3e635" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorCal30)" 
                name="Потребление"
              />
              <Area 
                type="monotone" 
                dataKey="burned" 
                stroke="#3b82f6" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorBurned30)" 
                name="Расход"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
};
