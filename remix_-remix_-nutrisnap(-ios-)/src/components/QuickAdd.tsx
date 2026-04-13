import React from 'react';
import { CommonFood } from '../types';
import { COMMON_FOODS } from '../constants';
import { Plus } from 'lucide-react';
import { motion } from 'motion/react';

interface QuickAddProps {
  onSelect: (food: CommonFood) => void;
}

export const QuickAdd: React.FC<QuickAddProps> = ({ onSelect }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Быстрое добавление</h3>
      </div>
      
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {COMMON_FOODS.map((food) => (
          <motion.button
            key={food.id}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onSelect(food)}
            className="flex-shrink-0 w-24 p-2 bg-white dark:bg-[#1C1C1C] rounded-[32px] shadow-sm border border-black/5 dark:border-white/5 flex flex-col items-center gap-3 transition-all hover:shadow-md hover:border-lime-400/30"
          >
            <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[24px] flex items-center justify-center text-4xl shadow-inner relative overflow-hidden">
              <span>{food.icon || '🍽️'}</span>
            </div>
            <div className="text-center flex flex-col items-center gap-2 pb-1">
              <div className="space-y-0.5">
                <p className="text-[10px] font-black uppercase tracking-tight truncate w-20 leading-none text-gray-900 dark:text-white">{food.name}</p>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{food.calories} ккал</p>
              </div>
              <div className="w-8 h-8 bg-lime-400 rounded-full flex items-center justify-center shadow-lg shadow-lime-400/20 group-active:scale-90 transition-transform">
                <Plus size={16} className="text-black" strokeWidth={3} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
};
