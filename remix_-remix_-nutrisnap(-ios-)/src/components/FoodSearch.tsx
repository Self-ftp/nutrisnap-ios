import React, { useState, useMemo } from 'react';
import { Search, Plus, Utensils, Sparkles, Loader2 } from 'lucide-react';
import { CommonFood, Meal, UserProfile } from '../types';
import { COMMON_FOODS } from '../constants';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../utils';
import { analyzeFoodText, fetchFoodImage } from '../services/ai';
import { toast } from 'sonner';

interface FoodSearchProps {
  customFoods: CommonFood[];
  meals: Meal[];
  onSelect: (food: CommonFood) => void;
  onAddCustom: () => void;
  onAddFromAI: (food: CommonFood) => void;
  profile?: UserProfile | null;
}

export const FoodSearch: React.FC<FoodSearchProps> = ({ 
  customFoods, 
  meals, 
  onSelect, 
  onAddCustom, 
  onAddFromAI, 
  profile
}) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);

  const allFoods = useMemo(() => {
    // Convert meals to CommonFood format for searching
    const mealFoods: CommonFood[] = meals.map(m => ({
      id: m.id,
      name: m.name,
      calories: m.calories,
      protein: m.protein,
      carbs: m.carbs,
      fat: m.fat,
      icon: m.icon,
      imageUrl: m.imageUrl
    }));

    // Deduplicate by name to avoid clutter
    const seen = new Set<string>();
    const uniqueFoods: CommonFood[] = [];
    
    [...COMMON_FOODS, ...customFoods, ...mealFoods].forEach(food => {
      const key = food.name.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        uniqueFoods.push(food);
      }
    });

    return uniqueFoods;
  }, [customFoods, meals]);

  const frequentFoods = useMemo(() => {
    const counts: Record<string, { count: number; food: CommonFood }> = {};
    
    meals.forEach(meal => {
      const key = meal.name.toLowerCase();
      if (!counts[key]) {
        counts[key] = {
          count: 0,
          food: {
            id: meal.id,
            name: meal.name,
            calories: meal.calories,
            protein: meal.protein,
            carbs: meal.carbs,
            fat: meal.fat,
            icon: meal.icon,
            imageUrl: meal.imageUrl
          }
        };
      }
      counts[key].count++;
    });

    return Object.values(counts)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map(item => item.food);
  }, [meals]);

  const results = useMemo(() => {
    if (!query.trim()) {
      return frequentFoods.length > 0 ? frequentFoods : COMMON_FOODS.slice(0, 5);
    }
    const lowerQuery = query.toLowerCase();
    return allFoods.filter(food => 
      food.name.toLowerCase().includes(lowerQuery)
    ).slice(0, 8);
  }, [allFoods, query, frequentFoods]);

  const isShowingFrequent = !query.trim();

  const handleAISearch = async () => {
    if (!query.trim()) return;
    setIsSearchingAI(true);
    try {
      const result = await analyzeFoodText(
        query, 
        undefined, 
        undefined
      );
      
      // Use imageUrl from result if available, otherwise fetch it
      const imageUrl = result.imageUrl || await fetchFoodImage(result.name);
      
      const newFood: CommonFood = {
        id: Math.random().toString(36).substr(2, 9),
        name: result.name,
        calories: result.calories,
        protein: result.protein,
        carbs: result.carbs,
        fat: result.fat,
        icon: '🍽️',
        imageUrl: imageUrl,
        brand: result.brand,
        ingredients: result.ingredients,
        allergens: result.allergens,
        description: result.description,
        vitamins: result.vitamins,
        minerals: result.minerals,
      };
      onAddFromAI(newFood);
      setQuery('');
      setIsFocused(false);
      toast.success(`Продукт "${newFood.name}" добавлен с помощью ИИ!`);
    } catch (error: any) {
      console.error(error);
      if (error.isLimit) {
        toast.error(error.message, {
          duration: 5000,
          action: {
            label: 'В Telegram',
            onClick: () => window.open('https://t.me/NutriSnap_App', '_blank')
          }
        });
      } else {
        toast.error('Не удалось найти продукт через ИИ');
      }
    } finally {
      setIsSearchingAI(false);
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative group flex items-center gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
            <Search size={18} className="text-gray-400 group-focus-within:text-lime-500 transition-colors" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            placeholder="Поиск блюд и продуктов..."
            className="w-full pl-14 pr-14 py-4 bg-white dark:bg-[#141414] border border-black/5 dark:border-white/5 rounded-[24px] font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all shadow-sm"
          />
          {query.trim() && (
            <button
              onClick={handleAISearch}
              disabled={isSearchingAI}
              className="absolute inset-y-2 right-2 px-3 bg-lime-400 text-black rounded-xl flex items-center justify-center hover:bg-lime-300 transition-all active:scale-95 disabled:opacity-50"
              title="Найти через ИИ"
            >
              {isSearchingAI ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            </button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {isFocused && (query.trim() || results.length > 0) && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A1A] border border-black/5 dark:border-white/10 rounded-[32px] shadow-2xl overflow-hidden z-50 backdrop-blur-xl"
          >
            <div className="max-h-[400px] overflow-y-auto p-2">
              {isShowingFrequent && results.length > 0 && (
                <div className="px-4 py-2 mb-1 text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">
                  Часто добавляемые
                </div>
              )}
              {results.length > 0 ? (
                <div className="space-y-1">
                  {results.map((food) => (
                    <button
                      key={food.id}
                      onClick={() => {
                        onSelect(food);
                        setQuery('');
                      }}
                      className="w-full flex items-center gap-4 p-2.5 hover:bg-gray-50 dark:hover:bg-white/5 rounded-2xl transition-all group text-left"
                    >
                      <div className="w-11 h-11 bg-gray-100 dark:bg-white/10 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform overflow-hidden shadow-sm">
                        <span>{food.icon || '🍽️'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 dark:text-white leading-tight truncate">{food.name}</p>
                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mt-0.5">
                          {food.calories} ккал • Б:{food.protein}г Ж:{food.fat}г У:{food.carbs}г
                        </p>
                      </div>
                      <Plus size={16} className="text-gray-300 group-hover:text-lime-500 transition-colors mr-2" />
                    </button>
                  ))}
                  
                  {query.trim() && (
                    <button
                      onClick={handleAISearch}
                      disabled={isSearchingAI}
                      className="w-full flex items-center gap-4 p-3 mt-1 bg-lime-400/10 hover:bg-lime-400/20 rounded-2xl transition-all group border border-lime-400/20"
                    >
                      <div className="w-10 h-10 bg-lime-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-lime-400/20">
                        {isSearchingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                      </div>
                      <div className="text-left">
                        <p className="font-black text-lime-700 dark:text-lime-400 text-[10px] uppercase tracking-widest">Найти через ИИ</p>
                        <p className="text-[9px] font-bold text-lime-600/60 dark:text-lime-400/40">Для точного расчета БЖУ</p>
                      </div>
                    </button>
                  )}
                </div>
              ) : query.trim() ? (
                <div className="p-8 text-center space-y-4">
                  <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-[24px] flex items-center justify-center mx-auto text-gray-300 dark:text-gray-700">
                    <Utensils size={24} />
                  </div>
                  <p className="text-sm font-bold text-gray-400 dark:text-gray-500">Ничего не найдено</p>
                  <button
                    onClick={handleAISearch}
                    disabled={isSearchingAI}
                    className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20"
                  >
                    {isSearchingAI ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                    {isSearchingAI ? 'Ищем...' : `Найти "${query}" через ИИ`}
                  </button>
                </div>
              ) : null}

              <button
                onClick={() => {
                  onAddCustom();
                  setIsFocused(false);
                }}
                className="w-full flex items-center gap-4 p-3 mt-1 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-2xl transition-all group border border-black/5 dark:border-white/5"
              >
                <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-xl flex items-center justify-center text-gray-400">
                  <Plus size={20} strokeWidth={3} />
                </div>
                <div className="text-left">
                  <p className="font-black text-gray-600 dark:text-gray-400 text-[10px] uppercase tracking-widest">Добавить вручную</p>
                  <p className="text-[9px] font-bold text-gray-400/60 dark:text-gray-500/40">Если продукта нет в базе</p>
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
