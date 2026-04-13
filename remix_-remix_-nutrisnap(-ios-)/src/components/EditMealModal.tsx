import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save } from 'lucide-react';
import { Meal } from '../types';
import { IconPicker } from './IconPicker';

interface EditMealModalProps {
  meal: Meal;
  onClose: () => void;
  onSave: (updatedMeal: Meal) => void;
  isAdding?: boolean;
}

export const EditMealModal: React.FC<EditMealModalProps> = ({ meal, onClose, onSave, isAdding }) => {
  const [name, setName] = useState(meal.name);
  const [brand, setBrand] = useState(meal.brand || '');
  const [ingredients, setIngredients] = useState(meal.ingredients?.join(', ') || '');
  const [calories, setCalories] = useState(meal.calories);
  const [protein, setProtein] = useState(meal.protein);
  const [carbs, setCarbs] = useState(meal.carbs);
  const [fat, setFat] = useState(meal.fat);
  const [allergens, setAllergens] = useState(meal.allergens?.join(', ') || '');
  const [icon, setIcon] = useState(meal.icon);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...meal,
      name,
      brand,
      ingredients: ingredients ? ingredients.split(',').map(i => i.trim()).filter(Boolean) : undefined,
      allergens: allergens ? allergens.split(',').map(i => i.trim()).filter(Boolean) : undefined,
      calories: Number(calories),
      protein: Number(protein),
      carbs: Number(carbs),
      fat: Number(fat),
      icon,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#0A0A0A] w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5 max-h-[90vh] overflow-y-auto"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              {isAdding ? 'Добавить блюдо' : 'Изменить блюдо'}
            </h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-gray-400 dark:text-gray-500" />
            </button>
          </div>

          <div className="w-full h-48 rounded-3xl overflow-hidden mb-6 shadow-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center">
            {meal.imageUrl ? (
              <div className="relative w-full h-full">
                <img 
                  src={meal.imageUrl} 
                  alt={meal.name} 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    e.currentTarget.nextElementSibling?.classList.add('flex');
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-6xl">
                  {meal.icon || '🍽️'}
                </div>
              </div>
            ) : (
              <div className="text-6xl">{meal.icon || '🍽️'}</div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Название</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Бренд / Производитель (необязательно)</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                placeholder="Напр., Данон, ВкусВилл"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Ингредиенты (через запятую)</label>
              <input
                type="text"
                value={ingredients}
                onChange={(e) => setIngredients(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                placeholder="Напр., курица, картофель, морковь"
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Аллергены (через запятую)</label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                placeholder="Напр., молоко, орехи, глютен"
              />
            </div>

            <IconPicker selectedIcon={icon} onSelect={setIcon} />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Калории</label>
                <input
                  type="number"
                  value={calories}
                  onChange={(e) => setCalories(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                  required
                />
              </div>
              <div className="flex items-center justify-center pt-4">
                <div className="flex gap-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-1.5 h-12 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        animate={{ height: `${Math.min((protein / (protein + carbs + fat || 1)) * 100, 100)}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-orange-500 rounded-full"
                      />
                    </div>
                    <span className="text-[8px] font-black text-orange-500 uppercase">Б</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-1.5 h-12 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        animate={{ height: `${Math.min((carbs / (protein + carbs + fat || 1)) * 100, 100)}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-full"
                      />
                    </div>
                    <span className="text-[8px] font-black text-blue-500 uppercase">У</span>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-1.5 h-12 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                      <motion.div 
                        animate={{ height: `${Math.min((fat / (protein + carbs + fat || 1)) * 100, 100)}%` }}
                        className="absolute bottom-0 left-0 right-0 bg-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-[8px] font-black text-purple-500 uppercase">Ж</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Белки (г)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all text-center"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Углеводы (г)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all text-center"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Жиры (г)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full px-4 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all text-center"
                  required
                />
              </div>
            </div>

            {(meal.vitamins && meal.vitamins.length > 0) || (meal.minerals && meal.minerals.length > 0) ? (
              <div className="space-y-4 pt-4 border-t border-black/5 dark:border-white/5">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Микронутриенты</h3>
                <div className="grid grid-cols-2 gap-3">
                  {meal.vitamins?.map((v, i) => (
                    <div key={`vit-${i}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{v.name}</span>
                      <span className="text-xs font-black text-lime-600 dark:text-lime-400">{v.amount}</span>
                    </div>
                  ))}
                  {meal.minerals?.map((m, i) => (
                    <div key={`min-${i}`} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400">{m.name}</span>
                      <span className="text-xs font-black text-blue-500 dark:text-blue-400">{m.amount}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <button
              type="submit"
              className="w-full py-5 bg-lime-400 text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20 mt-4"
            >
              <Save size={18} strokeWidth={3} />
              {isAdding ? 'Добавить прием пищи' : 'Сохранить изменения'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
