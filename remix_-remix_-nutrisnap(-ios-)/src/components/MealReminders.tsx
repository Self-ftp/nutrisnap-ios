import React, { useState, useRef } from 'react';
import { Plus, Trash2, Bell, BellOff, Clock, Pencil, Check, ChevronDown } from 'lucide-react';
import { MealReminder } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface MealRemindersProps {
  reminders: MealReminder[];
  onChange: (reminders: MealReminder[]) => void;
}

const MEAL_SUGGESTIONS = ['Завтрак', 'Обед', 'Ужин', 'Перекус'];

export const MealReminders: React.FC<MealRemindersProps> = ({ reminders, onChange }) => {
  const [newTime, setNewTime] = useState('12:00');
  const [newLabel, setNewLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const labelInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    }
  };

  const addReminder = async (labelOverride?: string) => {
    if (!newTime) return;
    await requestNotificationPermission();
    const reminder: MealReminder = {
      id: Math.random().toString(36).substr(2, 9),
      time: newTime,
      label: labelOverride || newLabel || 'Прием пищи',
      enabled: true,
    };
    onChange([...reminders, reminder].sort((a, b) => a.time.localeCompare(b.time)));
    setNewLabel('');
  };

  const removeReminder = (id: string) => {
    onChange(reminders.filter(r => r.id !== id));
  };

  const toggleReminder = async (id: string) => {
    const reminder = reminders.find(r => r.id === id);
    if (reminder && !reminder.enabled) {
      await requestNotificationPermission();
    }
    onChange(reminders.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Напоминания о еде</label>
        <p className="text-[10px] font-bold text-lime-500 dark:text-lime-400 uppercase tracking-widest">Помогает не пропускать еду</p>
      </div>

      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {reminders.map((reminder) => (
            <motion.div
              key={reminder.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative group"
            >
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 transition-all hover:border-lime-400/30">
                <button
                  type="button"
                  onClick={() => toggleReminder(reminder.id)}
                  className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm shrink-0",
                    reminder.enabled 
                      ? "bg-lime-400 text-black shadow-lime-400/20" 
                      : "bg-gray-200 dark:bg-white/10 text-gray-400"
                  )}
                >
                  <Clock size={18} strokeWidth={reminder.enabled ? 3 : 2} />
                </button>

                <div className="flex-1 flex flex-col min-w-0 cursor-pointer" onClick={() => labelInputRefs.current[reminder.id]?.focus()}>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={reminder.time}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        const newReminders = reminders.map(r => 
                          r.id === reminder.id ? { ...r, time: e.target.value } : r
                        ).sort((a, b) => a.time.localeCompare(b.time));
                        onChange(newReminders);
                      }}
                      className="bg-transparent text-xl font-black text-gray-900 dark:text-white focus:outline-none tracking-tighter leading-none w-20 cursor-text"
                    />
                  </div>
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      ref={el => { labelInputRefs.current[reminder.id] = el; }}
                      type="text"
                      value={reminder.label}
                      onChange={(e) => {
                        const newReminders = reminders.map(r => 
                          r.id === reminder.id ? { ...r, label: e.target.value } : r
                        );
                        onChange(newReminders);
                      }}
                      onFocus={() => setEditingId(reminder.id)}
                      onBlur={() => setTimeout(() => setEditingId(null), 200)}
                      placeholder="Название..."
                      className="bg-transparent text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest focus:outline-none w-full cursor-text"
                    />
                  </div>
                  
                  <AnimatePresence>
                    {editingId === reminder.id && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        className="flex flex-wrap gap-1 mt-2"
                      >
                        {MEAL_SUGGESTIONS.map(s => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              const newReminders = reminders.map(r => 
                                r.id === reminder.id ? { ...r, label: s } : r
                              );
                              onChange(newReminders);
                              setEditingId(null);
                            }}
                            className="px-2 py-1 bg-white dark:bg-white/10 border border-black/5 dark:border-white/5 rounded-lg text-[8px] font-black uppercase tracking-widest text-gray-500 hover:bg-lime-400 hover:text-black hover:border-lime-400 transition-all"
                          >
                            {s}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => labelInputRefs.current[reminder.id]?.focus()}
                    className="p-2 text-gray-400 hover:text-lime-500 transition-colors bg-white dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5"
                    title="Редактировать"
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeReminder(reminder.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        <div className="space-y-3">
          <motion.div 
            layout
            className="p-4 bg-gray-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5 space-y-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Новое напоминание</span>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={newTime}
                  onChange={(e) => setNewTime(e.target.value)}
                  className="bg-white dark:bg-white/10 px-3 py-1.5 rounded-xl text-lg font-black text-gray-900 dark:text-white focus:outline-none tracking-tighter border border-black/5 dark:border-white/5 shadow-sm"
                />
              </div>
            </div>

            <div className="relative">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Что напомнить? (например, Обед)"
                className="w-full bg-white dark:bg-white/10 px-4 py-3 rounded-2xl text-[11px] font-bold text-gray-900 dark:text-white focus:outline-none placeholder:text-gray-400 uppercase tracking-widest border border-black/5 dark:border-white/5 shadow-sm"
              />
            </div>

            <div className="flex gap-2">
              <div className="flex-1 flex flex-wrap gap-1.5">
                {MEAL_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => addReminder(s)}
                    className="px-3 py-2 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-500 hover:bg-lime-400 hover:text-black hover:border-lime-400 transition-all active:scale-95"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => addReminder()}
                className="px-6 h-12 bg-lime-400 text-black rounded-2xl font-black flex items-center justify-center gap-2 hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20 shrink-0"
              >
                <Plus size={20} strokeWidth={3} />
                <span className="text-[10px] uppercase tracking-widest">Добавить</span>
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
