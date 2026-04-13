import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, AlertTriangle, Info, Zap, Flame, Droplets } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Diet } from '../types';
import { cn } from '../utils';

interface DietModalProps {
  diet: Diet | null;
  isOpen: boolean;
  onClose: () => void;
  isActive: boolean;
  onApply: (dietId: string | null) => void;
}

export const DietModal: React.FC<DietModalProps> = ({ diet, isOpen, onClose, isActive, onApply }) => {
  if (!diet) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-white dark:bg-[#141414] rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/5"
          >
            <div className="absolute top-6 right-6 z-10">
              <button
                onClick={onClose}
                className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[80vh] overflow-y-auto custom-scrollbar">
              <div className="p-8 sm:p-10 space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
                  <div className="w-24 h-24 bg-gray-50 dark:bg-white/5 rounded-3xl flex items-center justify-center text-5xl shadow-inner">
                    {diet.icon}
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{diet.name}</h2>
                    <p className="text-sm font-bold text-lime-500 uppercase tracking-widest">Программа питания</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                    <Info size={20} className="text-lime-500" />
                    Описание
                  </h3>
                  <div className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>
                      {diet.fullContent || diet.description}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4 bg-orange-500/5 rounded-2xl border border-orange-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-orange-500">
                      <Zap size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Белки</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{diet.macrosRatio.protein}%</p>
                  </div>
                  <div className="p-4 bg-blue-500/5 rounded-2xl border border-blue-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-blue-500">
                      <Droplets size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Углеводы</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{diet.macrosRatio.carbs}%</p>
                  </div>
                  <div className="p-4 bg-purple-500/5 rounded-2xl border border-purple-500/10 space-y-2">
                    <div className="flex items-center gap-2 text-purple-500">
                      <Flame size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Жиры</span>
                    </div>
                    <p className="text-2xl font-black text-gray-900 dark:text-white">{diet.macrosRatio.fat}%</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-green-500 flex items-center gap-2">
                      <Check size={20} />
                      Что можно есть
                    </h3>
                    <ul className="space-y-2">
                      {diet.foodsToEat.map((food, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-black text-red-500 flex items-center gap-2">
                      <AlertTriangle size={20} />
                      Чего избегать
                    </h3>
                    <ul className="space-y-2">
                      {diet.foodsToAvoid.map((food, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                          <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                          {food}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    onClick={() => onApply(isActive ? null : diet.id)}
                    className={cn(
                      "w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-[0.98] shadow-xl",
                      isActive 
                        ? "bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/20" 
                        : "bg-lime-400 text-black hover:bg-lime-300 shadow-lime-400/20"
                    )}
                  >
                    {isActive ? 'Отменить диету' : 'Применить диету'}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
