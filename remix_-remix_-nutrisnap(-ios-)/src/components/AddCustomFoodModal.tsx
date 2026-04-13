import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Save, Plus } from 'lucide-react';
import { CommonFood } from '../types';
import { IconPicker } from './IconPicker';
import { toast } from 'sonner';

interface AddCustomFoodModalProps {
  onClose: () => void;
  onSave: (food: CommonFood) => void;
}

export const AddCustomFoodModal: React.FC<AddCustomFoodModalProps> = ({ onClose, onSave }) => {
  const [name, setName] = useState('');
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [allergens, setAllergens] = useState('');
  const [icon, setIcon] = useState('🍎');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: Math.random().toString(36).substr(2, 9),
      name,
      calories: Math.round(Number(calories)),
      protein: Math.round(Number(protein)),
      carbs: Math.round(Number(carbs)),
      fat: Math.round(Number(fat)),
      allergens: allergens ? allergens.split(',').map(i => i.trim()).filter(Boolean) : undefined,
      icon,
    });
    toast.success(`Продукт "${name}" добавлен в ваш список`, {
      icon: icon || '🍎',
      duration: 3000
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-[#0A0A0A] w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5"
      >
        <div className="p-8">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Свой продукт</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
              <X size={24} className="text-gray-400 dark:text-gray-500" />
            </button>
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
                placeholder="Напр., Домашний сэндвич"
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
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Белки (г)</label>
                <input
                  type="number"
                  value={protein}
                  onChange={(e) => setProtein(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Углеводы (г)</label>
                <input
                  type="number"
                  value={carbs}
                  onChange={(e) => setCarbs(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Жиры (г)</label>
                <input
                  type="number"
                  value={fat}
                  onChange={(e) => setFat(Number(e.target.value))}
                  className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Аллергены (через запятую)</label>
              <input
                type="text"
                value={allergens}
                onChange={(e) => setAllergens(e.target.value)}
                className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                placeholder="Напр., молоко, орехи"
              />
            </div>

            <button
              type="submit"
              className="w-full py-5 bg-lime-400 text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20 mt-4"
            >
              <Plus size={18} strokeWidth={3} />
              Добавить в список
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
