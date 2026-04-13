import React, { useState } from 'react';
import { Dumbbell, Plus, Trash2, Clock, Flame, Zap } from 'lucide-react';
import { Workout } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface WorkoutLogProps {
  workouts: Workout[];
  onAdd: (workout: Omit<Workout, 'id' | 'timestamp'>) => void;
  onDelete: (id: string) => void;
  weight: number;
}

export const WorkoutLog: React.FC<WorkoutLogProps> = ({ workouts, onAdd, onDelete, weight }) => {
  const [name, setName] = useState('');
  const [duration, setDuration] = useState('30');
  const [intensity, setIntensity] = useState<'low' | 'moderate' | 'high'>('moderate');
  const [isAdding, setIsAdding] = useState(false);

  const calculateCalories = (dur: number, intens: string) => {
    const met = intens === 'low' ? 3.0 : intens === 'moderate' ? 6.0 : 9.0;
    return Math.round(met * weight * (dur / 60));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !duration) return;

    onAdd({
      name,
      duration: parseInt(duration),
      intensity,
      caloriesBurned: calculateCalories(parseInt(duration), intensity)
    });

    setName('');
    setDuration('30');
    setIsAdding(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-lime-400 rounded-xl flex items-center justify-center text-black">
            <Dumbbell size={18} />
          </div>
          <h2 className="text-sm font-black uppercase tracking-widest text-gray-900 dark:text-white">Журнал тренировок</h2>
        </div>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="p-2 bg-black dark:bg-white dark:text-black text-white rounded-xl hover:bg-gray-900 dark:hover:bg-gray-100 transition-all"
        >
          {isAdding ? <Plus className="rotate-45" size={18} /> : <Plus size={18} />}
        </button>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-gray-50 dark:bg-white/5 rounded-3xl p-6 space-y-4 overflow-hidden border border-black/5 dark:border-white/5"
          >
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Упражнение</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Напр., Бег, Йога..."
                className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Длительность (мин)</label>
                <input
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Интенсивность</label>
                <select
                  value={intensity}
                  onChange={(e) => setIntensity(e.target.value as any)}
                  className="w-full px-4 py-3 bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/5 rounded-2xl text-sm font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 appearance-none"
                >
                  <option value="low" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Низкая</option>
                  <option value="moderate" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Средняя</option>
                  <option value="high" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Высокая</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-lime-300 transition-all active:scale-[0.98]"
            >
              Добавить тренировку
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      <div className="space-y-3">
        {workouts.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 dark:bg-white/5 rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Нет тренировок за сегодня</p>
          </div>
        ) : (
          workouts.map((workout) => (
            <motion.div
              key={workout.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white dark:bg-[#141414] border border-black/5 dark:border-white/5 rounded-3xl p-4 flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  workout.intensity === 'high' ? 'bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400' :
                  workout.intensity === 'moderate' ? 'bg-lime-100 dark:bg-lime-400/20 text-lime-700 dark:text-lime-400' :
                  'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                }`}>
                  <Zap size={20} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">{workout.name}</h3>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                      <Clock size={12} />
                      {workout.duration} мин
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-lime-500 dark:text-lime-400 uppercase tracking-widest">
                      <Flame size={12} />
                      {workout.caloriesBurned} ккал
                    </div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => onDelete(workout.id)}
                className="p-2 text-gray-300 dark:text-gray-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
              >
                <Trash2 size={18} />
              </button>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
