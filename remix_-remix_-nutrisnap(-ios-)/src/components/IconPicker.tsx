import React from 'react';
import { motion } from 'motion/react';

const EMOJIS = ['🍎', '🍌', '🍗', '🥚', '🥣', '🍚', '☕', '🍦', '🥗', '🥩', '🍕', '🍔', '🥪', '🥨', '🥑', '🥦', '🥕', '🌽', '🥔', '🥖', '🧀', '🥓', '🍣', '🍤', '🍜', '🍲', '🍛', '🍰', '🍩', '🍪', '🍫', '🍬', '🍭', '🍮', '🍯', '🍼', '🥤', '🧃', '🧉', '🧊'];

interface IconPickerProps {
  selectedIcon: string | undefined;
  onSelect: (icon: string) => void;
}

export const IconPicker: React.FC<IconPickerProps> = ({ selectedIcon, onSelect }) => {
  return (
    <div className="space-y-4">
      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Выберите иконку</label>
      <div className="grid grid-cols-8 gap-2 p-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-[24px] max-h-[160px] overflow-y-auto no-scrollbar">
        {EMOJIS.map((emoji) => (
          <motion.button
            key={emoji}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => onSelect(emoji)}
            className={`text-2xl p-2 rounded-xl transition-all ${
              selectedIcon === emoji 
                ? 'bg-lime-100 dark:bg-lime-400/20 ring-2 ring-lime-400/20' 
                : 'hover:bg-white dark:hover:bg-white/10'
            }`}
          >
            {emoji}
          </motion.button>
        ))}
      </div>
    </div>
  );
};
