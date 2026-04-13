import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { Camera, Upload, History, PieChart, Plus, X, Loader2, Utensils, Flame, Zap, Droplets, Sparkles, ChevronRight, MessageSquare, User as UserIcon, Settings, Save, Pencil, Trash2, Sun, Moon, Monitor, RefreshCw, ZoomIn, ZoomOut, Activity, Heart, Smartphone, BookOpen, Compass, Clock, AlertTriangle, ShoppingBag, Bell, CreditCard, ShieldCheck, ShieldAlert, HelpCircle, ChevronLeft, Layout, LogOut, Search, Dumbbell, Calendar } from 'lucide-react';
import axios from 'axios';
import { DayPicker, DateRange } from 'react-day-picker';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { motion, AnimatePresence } from 'motion/react';
import { useDropzone } from 'react-dropzone';
import confetti from 'canvas-confetti';
import { Toaster, toast } from 'sonner';
import Cropper from 'react-easy-crop';
import { BarcodeScanner } from './components/BarcodeScanner';
import { analyzeFoodImage, analyzeFoodText, fetchFoodImage, getDailyInsight, API_BASE_URL } from './services/ai';
import { Meal, DailyStats, DailyInsight, UserProfile, ActivityLevel, MealReminder, Workout, Achievement, UserAchievement, CommonFood, Theme, HealthIntegration, Diet, Post, MealType, Recipe, RecipeCategory } from './types';
import { cn, calculateDailyGoal } from './utils';
import getCroppedImg from './utils/image';
import { ACHIEVEMENTS, COMMON_FOODS, DIETS, POSTS, RECIPES } from './constants';
import { ProgressCharts } from './components/ProgressCharts';
import { EditMealModal } from './components/EditMealModal';
import { MealReminders } from './components/MealReminders';
import { WorkoutLog } from './components/WorkoutLog';
import { AchievementsGrid } from './components/AchievementsGrid';
import { AddCustomFoodModal } from './components/AddCustomFoodModal';
import { DietModal } from './components/DietModal';
import { PostModal } from './components/PostModal';
import { FoodSearch } from './components/FoodSearch';
import { QuickAdd } from './components/QuickAdd';
import { Recipes } from './components/Recipes';

import { supabase } from './lib/supabase';

const DEFAULT_GOAL = 2000;

// calculateDailyGoal is imported from ./utils

export default function App() {
  const [meals, setMeals] = useState<Meal[]>(() => {
    const saved = localStorage.getItem('nutrisnap_meals');
    if (saved) {
      const parsedMeals = JSON.parse(saved);
      return parsedMeals.map((meal: Meal) => {
        if (meal.imageUrl === 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' || 
            meal.imageUrl === 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80' ||
            meal.imageUrl === 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&q=80' ||
            meal.imageUrl === 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80' ||
            (meal.imageUrl && !meal.imageUrl.includes('images.weserv.nl') && meal.imageUrl.includes('images.unsplash.com'))) {
          // Try to find original URL from constants
          const commonFood = COMMON_FOODS.find(f => f.name === meal.name);
          if (commonFood) return { ...meal, imageUrl: commonFood.imageUrl };
          const recipe = RECIPES.find(r => r.name === meal.name);
          if (recipe) return { ...meal, imageUrl: recipe.imageUrl };
        }
        return meal;
      });
    }
    return [];
  });
  const [workouts, setWorkouts] = useState<Workout[]>(() => {
    const saved = localStorage.getItem('nutrisnap_workouts');
    return saved ? JSON.parse(saved) : [];
  });
  const [customFoods, setCustomFoods] = useState<CommonFood[]>(() => {
    const saved = localStorage.getItem('nutrisnap_customFoods');
    if (saved) {
      const parsedFoods = JSON.parse(saved);
      return parsedFoods.map((food: CommonFood) => {
        if (food.imageUrl === 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' || 
            food.imageUrl === 'https://images.unsplash.com/photo-1517673132405-a56a62b18caf?w=600&q=80' ||
            food.imageUrl === 'https://images.unsplash.com/photo-1633321702518-7feccafb94d5?w=600&q=80' ||
            food.imageUrl === 'https://images.unsplash.com/photo-1600891964092-4316c288032e?w=600&q=80' ||
            (food.imageUrl && !food.imageUrl.includes('images.weserv.nl') && food.imageUrl.includes('images.unsplash.com'))) {
          const commonFood = COMMON_FOODS.find(f => f.name === food.name);
          if (commonFood) return { ...food, imageUrl: commonFood.imageUrl };
          const recipe = RECIPES.find(r => r.name === food.name);
          if (recipe) return { ...food, imageUrl: recipe.imageUrl };
        }
        return food;
      });
    }
    return [];
  });
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem('nutrisnap_profile');
    return saved ? JSON.parse(saved) : null;
  });
  const [waterIntake, setWaterIntake] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('nutrisnap_water');
    return saved ? JSON.parse(saved) : {};
  });
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>(() => {
    const saved = localStorage.getItem('nutrisnap_achievements');
    return saved ? JSON.parse(saved) : [];
  });
  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem('nutrisnap_recipes');
    if (saved) {
      const parsedRecipes = JSON.parse(saved);
      return parsedRecipes.map((recipe: Recipe) => {
        if (recipe.imageUrl === 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&q=80' || 
            (recipe.imageUrl && !recipe.imageUrl.includes('images.weserv.nl') && recipe.imageUrl.includes('images.unsplash.com'))) {
          const originalRecipe = RECIPES.find(r => r.name === recipe.name);
          if (originalRecipe) return { ...recipe, imageUrl: originalRecipe.imageUrl };
        }
        return recipe;
      });
    }
    return [];
  });
  const [tempPhotoURL, setTempPhotoURL] = useState<string | undefined>(undefined);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showAISearchModal, setShowAISearchModal] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [pendingPermissionAction, setPendingPermissionAction] = useState<'camera' | 'gallery' | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(() => !localStorage.getItem('nutrisnap_profile'));
  const [showAddCustomFood, setShowAddCustomFood] = useState(false);
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [isAddingSnack, setIsAddingSnack] = useState(false);
  const [manualAddImage, setManualAddImage] = useState<string | undefined>(undefined);
  const [showGreeting, setShowGreeting] = useState(() => !!localStorage.getItem('nutrisnap_profile'));
  const [activeTab, setActiveTab] = useState<'today' | 'history' | 'analytics' | 'achievements' | 'explore' | 'diets' | 'recipes'>('today');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: new Date(),
    to: new Date()
  });
  const [selectedDiet, setSelectedDiet] = useState<Diet | null>(null);
  const [isDietModalOpen, setIsDietModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [showReminder, setShowReminder] = useState(true);
  const [subscriptionCodeInput, setSubscriptionCodeInput] = useState('');
  const [subscriptionCheckStatus, setSubscriptionCheckStatus] = useState<'idle' | 'checking' | 'success' | 'error'>('idle');
  
  // Cropping states
  const [isCropping, setIsCropping] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

  // Permission states
  const [cameraPermission, setCameraPermission] = useState<PermissionState | 'unknown'>('unknown');

  const checkCameraPermission = async () => {
    try {
      if (navigator.permissions && navigator.permissions.query) {
        const result = await navigator.permissions.query({ name: 'camera' as any });
        setCameraPermission(result.state);
        result.onchange = () => setCameraPermission(result.state);
      }
    } catch (e) {
      console.error('Error checking camera permission:', e);
    }
  };

  const requestCameraPermission = async (): Promise<boolean> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setCameraPermission('granted');
      toast.success('Доступ к камере разрешен!');
      return true;
    } catch (e) {
      console.error('Error requesting camera permission:', e);
      setCameraPermission('denied');
      toast.error('Доступ к камере отклонен. Пожалуйста, разрешите его в настройках браузера.');
      return false;
    }
  };


  // Load from LocalStorage
  useEffect(() => {
    if (showGreeting) {
      const timer = setTimeout(() => setShowGreeting(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showGreeting]);

  useEffect(() => {
    const savedAchievements = localStorage.getItem('nutrisnap_achievements');
    if (savedAchievements) setUserAchievements(JSON.parse(savedAchievements));
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    if (profile) localStorage.setItem('nutrisnap_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_meals', JSON.stringify(meals));
  }, [meals]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_workouts', JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_customFoods', JSON.stringify(customFoods));
  }, [customFoods]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_water', JSON.stringify(waterIntake));
  }, [waterIntake]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_achievements', JSON.stringify(userAchievements));
  }, [userAchievements]);

  useEffect(() => {
    localStorage.setItem('nutrisnap_recipes', JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const handleSamsungHealthImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        const exercises = Array.isArray(data) ? data : (data.exercises || []);
        const newWorkouts: Workout[] = exercises.map((ex: any, i: number) => ({
          id: `samsung-${i}-${ex.start_time || Date.now()}`,
          timestamp: ex.start_time ? new Date(ex.start_time).getTime() : Date.now(),
          name: ex.exercise_type || 'Тренировка Samsung',
          duration: Math.round((ex.duration || 0) / 60000),
          caloriesBurned: Math.round(ex.calorie || 0),
          intensity: 'moderate'
        }));

        if (data.step_count) {
          const totalSteps = data.step_count.reduce((acc: number, curr: any) => acc + (curr.count || 0), 0);
          const caloriesFromSteps = Math.round(totalSteps * 0.04);
          if (totalSteps > 0) {
            newWorkouts.push({
              id: `samsung-steps-${Date.now()}`,
              timestamp: Date.now(),
              name: `Шаги (${totalSteps})`,
              duration: 0,
              caloriesBurned: caloriesFromSteps,
              intensity: 'low'
            });
          }
        }

        if (data.sleep) {
          const sleepRecords = Array.isArray(data.sleep) ? data.sleep : [data.sleep];
          sleepRecords.forEach((record: any, i: number) => {
            if (record.duration) {
              newWorkouts.push({
                id: `samsung-sleep-${i}-${Date.now()}`,
                timestamp: record.start_time ? new Date(record.start_time).getTime() : Date.now(),
                name: `Сон (${Math.round(record.duration / 3600000)}ч ${Math.round((record.duration % 3600000) / 60000)}м)`,
                duration: Math.round(record.duration / 60000),
                caloriesBurned: 0,
                intensity: 'low'
              });
            }
          });
        }

        if (data.weight) {
          const weightRecords = Array.isArray(data.weight) ? data.weight : [data.weight];
          if (weightRecords.length > 0 && profile) {
            const latestWeight = weightRecords[weightRecords.length - 1].weight;
            if (latestWeight) {
              setProfile({
                ...profile,
                weight: latestWeight
              });
              toast.success(`Обновлен вес: ${latestWeight} кг`);
            }
          }
        }

        const existingIds = new Set(workouts.map(w => w.id));
        const filtered = newWorkouts.filter(nw => !existingIds.has(nw.id));
        if (filtered.length > 0) {
          setWorkouts(prev => [...filtered, ...prev]);
          toast.success(`Импортировано ${filtered.length} записей здоровья из Samsung Health!`);
        } else {
          toast.info('Новых данных для импорта не найдено.');
        }
      } catch (error) {
        console.error('Samsung Health parse error:', error);
        toast.error('Ошибка при разборе файла Samsung Health. Убедитесь, что это верный JSON экспорт.');
      }
    };
    reader.readAsText(file);
  };



  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleNativeCamera = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
      e.target.value = '';
    }
  };

  const handleNativeGallery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImage(file);
      e.target.value = '';
    }
  };

  const [showWeightModal, setShowWeightModal] = useState(false);
  const [tempWeight, setTempWeight] = useState(profile?.weight?.toString() || '');

  const handleLogWeight = async (e: React.FormEvent) => {
    e.preventDefault();
    const newWeight = parseFloat(tempWeight);
    if (!isNaN(newWeight) && newWeight > 0 && profile) {
      const today = new Date().toISOString().split('T')[0];
      let updatedWeightHistory = profile.weightHistory || [];
      
      updatedWeightHistory = [
        ...updatedWeightHistory.filter(w => w.date !== today),
        { date: today, weight: newWeight }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setProfile({
        ...profile,
        weight: newWeight,
        weightHistory: updatedWeightHistory
      });
      setShowWeightModal(false);
      toast.success('Вес успешно записан!');
    }
  };

  const [editingMeal, setEditingMeal] = useState<Meal | null>(null);
  const [draftMeal, setDraftMeal] = useState<Meal | null>(null);
  const [dismissedReminders, setDismissedReminders] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('nutrisnap_dismissed_reminders');
    return saved ? JSON.parse(saved) : {};
  });

  const sentNotificationsRef = useRef<Record<string, boolean>>({});

  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const sendNotification = React.useCallback(async (title: string, body: string, id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${today}-${id}`;
    
    // Push notification
    if ("Notification" in window && Notification.permission === "granted" && !sentNotificationsRef.current[key]) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration) {
          await registration.showNotification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            // @ts-ignore
            vibrate: [200, 100, 200, 100, 200, 100, 200],
            tag: key,
            requireInteraction: true
          });
        } else {
          new Notification(title, { body, icon: '/favicon.ico' });
        }
      } catch (e) {
        new Notification(title, { body, icon: '/favicon.ico' });
      }
      sentNotificationsRef.current[key] = true;
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('nutrisnap_dismissed_reminders', JSON.stringify(dismissedReminders));
    } catch (e) {
      console.error('LocalStorage error:', e);
    }
  }, [dismissedReminders]);

  const [insight, setInsight] = useState<DailyInsight | null>(null);
  const [isGettingInsight, setIsGettingInsight] = useState(false);
  const [newAchievement, setNewAchievement] = useState<Achievement | null>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [maxZoom, setMaxZoom] = useState(1);
  const [supportsZoom, setSupportsZoom] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lastTriggeredRef = useRef<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!profile?.reminders) return;
      
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Only trigger once per minute
      if (lastTriggeredRef.current === currentTime) return;

      const triggered = profile.reminders.find(r => r.enabled && r.time === currentTime);
      
      if (triggered) {
        sendNotification(triggered.label, `Пора для: ${triggered.label}`, triggered.id);
        lastTriggeredRef.current = currentTime;
        
        // Play a subtle sound if possible or just rely on visual
        try {
          const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
          audio.volume = 0.3;
          audio.play().catch(() => {}); // Ignore errors if browser blocks autoplay
        } catch (e) {
          console.error('Audio play failed', e);
        }
      }
    }, 5000); // Check every 5 seconds for better responsiveness

    return () => clearInterval(interval);
  }, [profile?.reminders, sendNotification]);

  // Schedule notifications using Notification Triggers API if supported (for background delivery)
  useEffect(() => {
    if (!profile?.reminders || !('serviceWorker' in navigator)) return;

    const scheduleReminders = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (!registration) return;

        // Try to clear previously scheduled notifications if we can
        if ('getNotifications' in registration) {
          const notifications = await registration.getNotifications();
          notifications.forEach(n => {
            if (n.tag && n.tag.startsWith('scheduled-reminder-')) {
              n.close();
            }
          });
        }

        // Schedule new ones
        for (const reminder of profile.reminders) {
          if (!reminder.enabled) continue;
          
          const [hours, minutes] = reminder.time.split(':').map(Number);
          const now = new Date();
          const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes, 0);
          
          if (scheduledTime.getTime() <= now.getTime()) {
            scheduledTime.setDate(scheduledTime.getDate() + 1); // Schedule for tomorrow
          }

          // @ts-ignore - Notification Triggers API is experimental
          if ('showTrigger' in Notification.prototype && 'TimestampTrigger' in window) {
            // @ts-ignore
            const trigger = new window.TimestampTrigger(scheduledTime.getTime());
            await registration.showNotification(reminder.label, {
              body: `Пора для: ${reminder.label}`,
              icon: '/favicon.ico',
              badge: '/favicon.ico',
              // @ts-ignore
              vibrate: [200, 100, 200, 100, 200, 100, 200],
              tag: `scheduled-reminder-${reminder.id}`,
              requireInteraction: true,
              // @ts-ignore
              showTrigger: trigger
            });
          }
        }
      } catch (e) {
        console.log('Failed to schedule notifications', e);
      }
    };

    scheduleReminders();
  }, [profile?.reminders]);

  useEffect(() => {
    if (showGreeting && profile) {
      const timer = setTimeout(() => {
        setShowGreeting(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [showGreeting, profile]);

  useEffect(() => {
    const applyTheme = (theme: Theme) => {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');

      if (theme === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        root.classList.add(systemTheme);
      } else {
        root.classList.add(theme);
      }
    };

    if (profile?.theme) {
      applyTheme(profile.theme);
    } else {
      applyTheme('system');
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (profile?.theme === 'system' || !profile?.theme) {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [profile?.theme]);

  // Check achievements logic
  useEffect(() => {
    if (meals.length === 0 && workouts.length === 0) return;

    const checkAchievements = async () => {
      const earnedIds = new Set(userAchievements.map(ua => ua.achievementId));
      const toEarn: UserAchievement[] = [];

      ACHIEVEMENTS.forEach(achievement => {
        if (earnedIds.has(achievement.id)) return;

        let isMet = false;
        switch (achievement.type) {
          case 'meals':
            isMet = meals.length >= achievement.requirement;
            break;
          case 'workouts':
            isMet = workouts.length >= achievement.requirement;
            break;
          case 'custom_foods':
            isMet = customFoods.length >= achievement.requirement;
            break;
          case 'time': {
            // Check for early bird breakfast
            if (achievement.id === 'early_bird_logger') {
              isMet = meals.some(m => {
                const date = new Date(m.timestamp);
                const hour = date.getHours();
                return hour < 7;
              });
            }
            break;
          }
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
            isMet = maxStreak >= achievement.requirement;
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
            isMet = daysMet >= achievement.requirement;
            break;
          }
          case 'water': {
            const today = new Date().toISOString().split('T')[0];
            const currentWater = waterIntake[today] || 0;
            isMet = currentWater >= achievement.requirement;
            break;
          }
        }

        if (isMet) {
          toEarn.push({ achievementId: achievement.id, dateEarned: Date.now() });
        }
      });

      if (toEarn.length > 0) {
        const existingIds = new Set(userAchievements.map(ua => ua.achievementId));
        const uniqueNew = toEarn.filter(ua => !existingIds.has(ua.achievementId));
        if (uniqueNew.length > 0) {
          setUserAchievements(prev => [...prev, ...uniqueNew]);
          
          // Show toasts for each new achievement
          uniqueNew.forEach(ua => {
            const achievement = ACHIEVEMENTS.find(a => a.id === ua.achievementId);
            if (achievement) {
              toast.success(`Получено достижение: ${achievement.title}`, {
                description: achievement.description,
                icon: <span className="text-xl">{achievement.icon}</span>,
                duration: 5000,
              });
            }
          });

          setNewAchievement(ACHIEVEMENTS.find(a => a.id === uniqueNew[0].achievementId) || null);
          confetti({
            particleCount: 50,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#fbbf24', '#f59e0b', '#d97706'],
            disableForReducedMotion: true
          });
        }
      }
    };

    const timer = setTimeout(checkAchievements, 1000);
    return () => clearTimeout(timer);
  }, [meals, workouts, profile, userAchievements]);

  const handleApplyDiet = async (dietId: string | null) => {
    if (!profile) return;
    
    const updatedProfile = { ...profile, activeDietId: dietId || undefined };
    setProfile(updatedProfile);
    
    if (dietId) {
      const diet = DIETS.find(d => d.id === dietId);
      toast.success(`Диета "${diet?.name}" активирована!`);
      confetti({
        particleCount: 30,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#A3E635', '#ffffff'],
        disableForReducedMotion: true
      });
    } else {
      toast.info('Диета отменена');
    }
    setIsDietModalOpen(false);
  };

  const activeDiet = DIETS.find(d => d.id === profile?.activeDietId);
  const dietMultiplier = activeDiet?.caloriesMultiplier || 1;

  const todayWorkouts = useMemo(() => workouts.filter(workout => {
    const workoutDate = new Date(workout.timestamp);
    const today = new Date();
    return workoutDate.toDateString() === today.toDateString();
  }), [workouts]);

  const dailyGoal = useMemo(() => calculateDailyGoal(profile, todayWorkouts, dietMultiplier), [profile, todayWorkouts, dietMultiplier]);

  const todayMeals = useMemo(() => meals.filter(meal => {
    const mealDate = new Date(meal.timestamp);
    const today = new Date();
    return mealDate.toDateString() === today.toDateString();
  }), [meals]);

  const stats: DailyStats = useMemo(() => todayMeals.reduce((acc, meal) => {
    const isSnack = meal.type === 'snack';
    return {
      totalCalories: Math.round(acc.totalCalories + meal.calories),
      mainCalories: Math.round(acc.mainCalories + (isSnack ? 0 : meal.calories)),
      snackCalories: Math.round(acc.snackCalories + (isSnack ? meal.calories : 0)),
      totalProtein: Math.round(acc.totalProtein + (meal.protein || 0)),
      totalCarbs: Math.round(acc.totalCarbs + (meal.carbs || 0)),
      totalFat: Math.round(acc.totalFat + (meal.fat || 0)),
    };
  }, { totalCalories: 0, mainCalories: 0, snackCalories: 0, totalProtein: 0, totalCarbs: 0, totalFat: 0 }), [todayMeals]);

  const groupedMeals = useMemo(() => {
    const groups: Record<string, { meals: Meal[]; totalCalories: number }> = {
      'Завтрак': { meals: [], totalCalories: 0 },
      'Обед': { meals: [], totalCalories: 0 },
      'Ужин': { meals: [], totalCalories: 0 },
      'Перекус': { meals: [], totalCalories: 0 },
      'Другое': { meals: [], totalCalories: 0 },
    };

    todayMeals.forEach(meal => {
      let type = 'Другое';
      
      if (meal.type === 'snack') {
        type = 'Перекус';
      } else if (meal.type === 'breakfast') {
        type = 'Завтрак';
      } else if (meal.type === 'lunch') {
        type = 'Обед';
      } else if (meal.type === 'dinner') {
        type = 'Ужин';
      } else {
        // Fallback to time-based if no type is set
        const hour = new Date(meal.timestamp).getHours();
        if (hour >= 5 && hour < 12) type = 'Завтрак';
        else if (hour >= 12 && hour < 17) type = 'Обед';
        else if (hour >= 17 && hour < 23) type = 'Ужин';
        else type = 'Перекус';
      }
      
      if (!groups[type]) type = 'Другое';
      
      groups[type].meals.push(meal);
      groups[type].totalCalories = Math.round(groups[type].totalCalories + meal.calories);
    });

    return groups;
  }, [todayMeals]);

  const frequentFoods = useMemo(() => {
    const counts: Record<string, { count: number; calories: number; icon?: string }> = {};
    todayMeals.forEach(meal => {
      const key = meal.name;
      if (!counts[key]) {
        counts[key] = { count: 0, calories: 0, icon: meal.icon };
      }
      counts[key].count += 1;
      counts[key].calories = Math.round(counts[key].calories + meal.calories);
    });
    
    return Object.entries(counts)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [todayMeals]);

  const compressImage = (base64: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = base64;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 600; // Reduced from 800 for speed
        const MAX_HEIGHT = 600; // Reduced from 800 for speed
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6)); // Reduced quality from 0.7 to 0.6
      };
    });
  };

  const handleImage = async (file: File | string) => {
    console.log('handleImage started', typeof file === 'string' ? 'base64' : file.name);
    setIsAnalyzing(true);
    setShowCamera(false);
    let base64Image = '';
    try {
      if (typeof file === 'string') {
        base64Image = file;
      } else {
        base64Image = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      console.log('Image read successfully, compressing...');
      // Compress image before processing and storing
      const compressedImage = await compressImage(base64Image);
      console.log('Image compressed, starting AI analysis...');

      const result = await analyzeFoodImage(
        compressedImage, 
        undefined,
        undefined
      );
      console.log('AI analysis successful:', result.name);
      
      const newMeal: Meal = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: Date.now(),
        imageUrl: compressedImage,
        name: result.name,
        brand: result.brand,
        ingredients: result.ingredients,
        allergens: result.allergens,
        type: isAddingSnack ? 'snack' : undefined,
        calories: Math.round(result.calories),
        protein: Math.round(result.protein),
        carbs: Math.round(result.carbs),
        fat: Math.round(result.fat),
        analysis: result.description,
        vitamins: result.vitamins,
        minerals: result.minerals,
      };

      setDraftMeal(newMeal);
      setIsAddingSnack(false);

      // Check for diet restrictions
      const activeDiet = DIETS.find(d => d.id === profile?.activeDietId);
      if (activeDiet) {
        const forbiddenFoods = activeDiet.foodsToAvoid.map(f => f.toLowerCase());
        const foodName = (result.name || '').toLowerCase();
        const ingredients = result.ingredients?.map(i => (i || '').toLowerCase()) || [];
        
        const isForbidden = forbiddenFoods.some(forbidden => 
          foodName.includes(forbidden) || ingredients.some(ing => ing.includes(forbidden))
        );

        if (isForbidden) {
          setTimeout(() => {
            toast.warning(`Внимание! ${result.name || 'Это блюдо'} может не подходить для вашей диеты "${activeDiet.name}"`, {
              description: `Эта диета рекомендует избегать: ${activeDiet.foodsToAvoid.join(', ')}`,
              duration: 6000,
              icon: '⚠️'
            });
          }, 500);
        }
      }
    } catch (error: any) {
      console.error('Analysis failed:', error);
      if (error.isLimit) {
        toast.error(error.message, {
          duration: 5000,
          action: {
            label: 'В Telegram',
            onClick: () => window.open('https://t.me/NutriSnap_App', '_blank')
          }
        });
      } else {
        const errorMessage = error instanceof Error ? error.message : 'Не удалось проанализировать изображение. Попробуйте еще раз.';
        toast.error(errorMessage);
        
        // Fallback to manual entry with the captured image
        setManualAddImage(base64Image);
        setShowManualAdd(true);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const fetchInsight = async () => {
    if (todayMeals.length === 0 && todayWorkouts.length === 0) {
      toast.info('Сначала добавьте приемы пищи или тренировки за сегодня для анализа.');
      return;
    }
    setIsGettingInsight(true);
    try {
      console.log('Fetching daily insight for:', { meals: todayMeals.length, workouts: todayWorkouts.length });
      const result = await getDailyInsight(todayMeals, profile, todayWorkouts);
      setInsight(result);
    } catch (error: any) {
      console.error('Failed to get insight:', error);
      if (error.isLimit) {
        toast.error(error.message, {
          duration: 5000,
          action: {
            label: 'В Telegram',
            onClick: () => window.open('https://t.me/NutriSnap_App', '_blank')
          }
        });
      } else {
        const errorMessage = error.message || 'Не удалось получить AI-анализ. Попробуйте позже.';
        toast.error(errorMessage);
      }
    } finally {
      setIsGettingInsight(false);
    }
  };

  const onDrop = (acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImage(acceptedFiles[0]);
    }
  };

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    multiple: false
  } as any);

  useEffect(() => {
    if (showCamera) {
      // Small delay to ensure video element is rendered
      const timer = setTimeout(() => {
        startCamera();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      // Stop camera when closing
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [showCamera]);

  const startCamera = async (mode: 'user' | 'environment' = facingMode) => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (e) {
          console.warn('Video play failed', e);
        }
        
        // Get capabilities for zoom
        const track = stream.getVideoTracks()[0];
        const capabilities = (track as any).getCapabilities?.() || {};
        
        if (capabilities.zoom) {
          setSupportsZoom(true);
          setMaxZoom(capabilities.zoom.max);
          setZoom(1);
          try {
            await (track as any).applyConstraints({ advanced: [{ zoom: 1 }] });
          } catch (e) {
            console.warn('Initial zoom apply failed', e);
          }
        } else {
          setSupportsZoom(false);
        }
      }
    } catch (err) {
      console.error('Camera access denied or error:', err);
      toast.error('Не удалось получить доступ к камере. Убедитесь, что вы дали разрешение.');
      setShowCamera(false);
    }
  };

  const switchCamera = async () => {
    const newMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(newMode);
    
    // Stop current tracks
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
    }
    
    await startCamera(newMode);
  };

  const handleZoomChange = async (newZoom: number) => {
    setZoom(newZoom);
    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      const track = stream.getVideoTracks()[0];
      try {
        await track.applyConstraints({ advanced: [{ zoom: newZoom }] as any });
      } catch (e) {
        console.error('Zoom apply failed', e);
      }
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) {
      toast.error('Камера не готова. Попробуйте перезапустить.');
      return;
    }
    
    if (videoRef.current.videoWidth === 0 || videoRef.current.readyState < 2) {
      toast.error('Видео еще не загрузилось. Подождите секунду.');
      return;
    }

    try {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        const base64 = canvasRef.current.toDataURL('image/jpeg', 0.8);
        
        const stream = videoRef.current.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
        
        handleImage(base64);
      } else {
        toast.error('Ошибка создания снимка (context)');
      }
    } catch (err) {
      console.error('Capture failed:', err);
      toast.error('Ошибка при создании снимка. Попробуйте еще раз.');
    }
  };

  const deleteMeal = async (id: string) => {
    setMeals(prev => prev.filter(m => m.id !== id));
    toast.success('Прием пищи удален');
  };

  const addQuickMeal = async (food: CommonFood, type?: MealType, skipReview: boolean = false) => {
    const finalType = type || (isAddingSnack ? 'snack' : undefined);
    
    // Check for diet restrictions
    if (activeDiet) {
      const isRestricted = activeDiet.foodsToAvoid.some(avoidFood => 
        food.name.toLowerCase().includes(avoidFood.toLowerCase())
      );
      
      if (isRestricted) {
        toast.warning(`Внимание: ${food.name} может не подходить для вашей диеты "${activeDiet.name}"`, {
          duration: 8000,
          icon: <AlertTriangle className="text-orange-500" />
        });
      }
    }

    const newMeal: Meal = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
      imageUrl: food.imageUrl || '',
      name: food.name,
      type: finalType,
      calories: Math.round(food.calories),
      protein: Math.round(food.protein),
      carbs: Math.round(food.carbs),
      fat: Math.round(food.fat),
      analysis: `Добавлено: ${food.name}.`,
      icon: food.icon,
    };

    if (skipReview) {
      setMeals(prev => [newMeal, ...prev]);
      setIsAddingSnack(false);
      toast.success(`Добавлено: ${food.name} (${food.calories} ккал)`, {
        icon: food.icon || '🥗',
        duration: 3000
      });
    } else {
      setDraftMeal(newMeal);
      setIsAddingSnack(false);
    }
  };

  const updateMeal = async (updatedMeal: Meal) => {
    setMeals(prev => prev.map(m => m.id === updatedMeal.id ? updatedMeal : m));
    setEditingMeal(null);
    toast.success('Прием пищи обновлен');
  };

  useEffect(() => {
    if (showProfile) {
      setTempPhotoURL(profile?.photoURL);
    }
  }, [showProfile, profile?.photoURL]);

  const mealsByDate = useMemo(() => {
    const groups: Record<string, Meal[]> = {};
    
    const filteredMeals = meals.filter(meal => {
      if (!dateRange || !dateRange.from) return true;
      const mealDate = new Date(meal.timestamp);
      mealDate.setHours(0, 0, 0, 0);
      
      const from = new Date(dateRange.from);
      from.setHours(0, 0, 0, 0);
      
      if (!dateRange.to) {
        return mealDate.getTime() === from.getTime();
      }
      
      const to = new Date(dateRange.to);
      to.setHours(23, 59, 59, 999);
      
      return mealDate >= from && mealDate <= to;
    });

    filteredMeals.forEach(meal => {
      const date = new Date(meal.timestamp).toLocaleDateString('ru-RU', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'long' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(meal);
    });
    return Object.entries(groups).sort((a, b) => {
      const dateA = new Date(a[1][0].timestamp);
      const dateB = new Date(b[1][0].timestamp);
      return dateB.getTime() - dateA.getTime();
    });
  }, [meals, dateRange]);

  const [selectedGoal, setSelectedGoal] = useState<'lose' | 'maintain' | 'gain'>(profile?.goal || 'maintain');

  useEffect(() => {
    if (profile?.goal) setSelectedGoal(profile.goal);
  }, [profile?.goal]);

  const generateCalendarReminders = () => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//NutriSnap//Meal Reminders//RU
BEGIN:VEVENT
SUMMARY:Завтрак (NutriSnap)
DESCRIPTION:Время записать свой завтрак в NutriSnap!
RRULE:FREQ=DAILY
DTSTART:20240101T090000
DTEND:20240101T091500
END:VEVENT
BEGIN:VEVENT
SUMMARY:Обед (NutriSnap)
DESCRIPTION:Время записать свой обед в NutriSnap!
RRULE:FREQ=DAILY
DTSTART:20240101T130000
DTEND:20240101T131500
END:VEVENT
BEGIN:VEVENT
SUMMARY:Ужин (NutriSnap)
DESCRIPTION:Время записать свой ужин в NutriSnap!
RRULE:FREQ=DAILY
DTSTART:20240101T190000
DTEND:20240101T191500
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'nutrisnap_reminders.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Напоминания скачаны. Откройте файл, чтобы добавить их в календарь!');
  };

  const handleProfileSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const goal = formData.get('goal') as 'lose' | 'maintain' | 'gain';
    const newWeight = Number(formData.get('weight'));
    
    let updatedWeightHistory = profile?.weightHistory || [];
    const today = new Date().toISOString().split('T')[0];
    
    // If weight changed or no history for today, add to history
    if (!profile || profile.weight !== newWeight || !updatedWeightHistory.some(w => w.date === today)) {
      updatedWeightHistory = [
        ...updatedWeightHistory.filter(w => w.date !== today),
        { date: today, weight: newWeight }
      ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    }
    
    const newProfile: UserProfile = {
      name: formData.get('name') as string,
      age: Number(formData.get('age')),
      weight: newWeight,
      height: Number(formData.get('height')),
      gender: formData.get('gender') as 'male' | 'female',
      activityLevel: formData.get('activityLevel') as ActivityLevel,
      goal,
      targetWeight: goal !== 'maintain' ? Number(formData.get('targetWeight')) : undefined,
      weeklyGoal: goal !== 'maintain' ? Number(formData.get('weeklyGoal')) : undefined,
      weightHistory: updatedWeightHistory,
      subscriptionCode: profile?.subscriptionCode,
      isSubscriptionActive: profile?.isSubscriptionActive,
      reminders: profile?.reminders || [],
      theme: formData.get('theme') as Theme,
      integrations: profile?.integrations || [],
      photoURL: tempPhotoURL || profile?.photoURL,
      activeDietId: profile?.activeDietId,
      customDailyGoal: formData.get('customDailyGoal') ? Number(formData.get('customDailyGoal')) : undefined,
    };
    
    setProfile(newProfile);
    setShowProfile(false);
    setInsight(null); // Reset insight as profile changed
    toast.success('Профиль сохранен');
  };

  const checkSubscriptionCode = async (rawCode: string) => {
    if (!rawCode) return;
    const code = rawCode.trim();
    
    const userName = profile?.name;
    if (!userName) {
      toast.error('Пожалуйста, укажите ваше имя в профиле перед активацией кода');
      return;
    }

    const upperCode = code.toUpperCase();
    
    console.log('Checking subscription code:', code, 'Upper:', upperCode);
    
    // Re-enable demo mode for testing to avoid confusion with real keys
    const workingCodes = ['NUTRI2026', 'NUTRI-2026', 'NUTRI-PRO-2026', 'HEALTHY-LIFE-777', 'FIT-BODY-999', 'PREMIUM-2026'];
    if (workingCodes.includes(upperCode)) {
      setSubscriptionCheckStatus('success');
      const expiresAt = new Date();
      expiresAt.setFullYear(expiresAt.getFullYear() + 1); // 1 year for demo
      
      const updatedProfile = profile ? { 
        ...profile, 
        subscriptionCode: code, 
        isSubscriptionActive: true,
        subscriptionExpiresAt: expiresAt.toISOString()
      } : {
        name: profile?.name || 'Пользователь',
        age: 25,
        weight: 70,
        height: 175,
        gender: 'male' as const,
        activityLevel: 'moderate' as const,
        goal: 'maintain' as const,
        subscriptionCode: code,
        isSubscriptionActive: true,
        subscriptionExpiresAt: expiresAt.toISOString()
      };
      
      setProfile(updatedProfile);
      localStorage.setItem('nutrisnap_profile', JSON.stringify(updatedProfile));
      toast.success('Демо-код активирован! Подписка активна на 1 год.');
      return;
    }

    if (!supabase) {
      console.error('Supabase is not configured.');
      toast.error('Система проверки временно недоступна (не настроен Supabase). Пожалуйста, используйте демо-код или настройте ключи в настройках.');
      return;
    }

    setSubscriptionCheckStatus('checking');
    
    try {
      // Use 'subscription_keys' table and 'code' column
      // We use .ilike for case-insensitive matching
      const result = await supabase
        .from('subscription_keys')
        .select('*')
        .ilike('code', code.trim())
        .eq('is_active', true)
        .limit(1)
        .single();

      console.log('Supabase query result:', result);

      if (result.error) {
        if (result.error.code === 'PGRST116') {
          // No rows found
          console.warn('Code not found or inactive:', code);
          throw new Error('Invalid or inactive code');
        }
        console.error('Supabase error:', result.error);
        throw new Error(`Ошибка базы данных: ${result.error.message}`);
      }

      const data = result.data;

      // Mark the code as used and record who used it
      const userNameForDb = profile?.name || 'Web App';
      const { error: updateError } = await supabase
        .from('subscription_keys')
        .update({ 
          is_active: false,
          used_by: `Веб: ${userNameForDb}`
        })
        .eq('code', data.code);

      if (updateError) {
        console.error('Failed to update key status:', updateError);
      }

      setSubscriptionCheckStatus('success');
      const days = data.duration_days || 30;
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
      
      const updatedProfile = profile ? { 
        ...profile, 
        subscriptionCode: code, 
        isSubscriptionActive: true,
        subscriptionExpiresAt: expiresAt.toISOString()
      } : {
        name: 'Пользователь',
        age: 25,
        weight: 70,
        height: 175,
        gender: 'male' as const,
        activityLevel: 'moderate' as const,
        goal: 'maintain' as const,
        subscriptionCode: code,
        isSubscriptionActive: true,
        subscriptionExpiresAt: expiresAt.toISOString()
      };
      
      setProfile(updatedProfile);
      localStorage.setItem('nutrisnap_profile', JSON.stringify(updatedProfile));
      toast.success('Подписка активирована!');
    } catch (err: any) {
      console.error('Subscription check error:', err);
      setSubscriptionCheckStatus('error');
      const message = err.message === 'Invalid or inactive code' 
        ? 'Ключ неправильный или уже использован' 
        : `Ошибка: ${err.message}`;
      toast.error(message);
    }
  };

  const handleAddWater = async (amount: number) => {
    const today = new Date().toISOString().split('T')[0];
    const newAmount = Math.max(0, (waterIntake[today] || 0) + amount);
    
    setWaterIntake(prev => ({
      ...prev,
      [today]: newAmount
    }));
  };

  const testApiConnection = async () => {
    toast.info(`Проверка связи с ${API_BASE_URL}...`);
    try {
      const response = await axios.get(`${API_BASE_URL}/api/health`);
      if (response.data.status === 'ok') {
        toast.success('Связь с сервером ИИ установлена!');
      } else {
        toast.error('Сервер ответил с ошибкой');
      }
    } catch (err: any) {
      console.error('API Connection test failed:', err);
      toast.error(`Ошибка связи: ${err.message}. Проверьте VITE_API_BASE_URL.`);
    }
  };
  
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
      setImageToCrop(base64);
      setIsCropping(true);
      e.target.value = ''; // Reset input
    }
  };

  const onCropComplete = (croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleCropSave = async () => {
    try {
      if (imageToCrop && croppedAreaPixels) {
        const croppedImage = await getCroppedImg(imageToCrop, croppedAreaPixels, rotation);
        if (croppedImage) {
          const compressed = await compressImage(croppedImage);
          setTempPhotoURL(compressed);
          setIsCropping(false);
          setImageToCrop(null);
          setRotation(0);
          toast.success('Фото профиля обновлено!');
        }
      }
    } catch (e) {
      console.error('Error cropping image:', e);
      toast.error('Ошибка при обрезке изображения');
    }
  };

  const handleAddWorkout = async (workoutData: Omit<Workout, 'id' | 'timestamp'>) => {
    const newWorkout: Workout = {
      ...workoutData,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setWorkouts(prev => [newWorkout, ...prev]);
    toast.success('Тренировка добавлена');
  };

  const handleDeleteWorkout = async (id: string) => {
    setWorkouts(prev => prev.filter(w => w.id !== id));
    toast.success('Тренировка удалена');
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Доброе утро';
    if (hour >= 12 && hour < 18) return 'Добрый день';
    if (hour >= 18 && hour < 23) return 'Добрый вечер';
    return 'Доброй ночи';
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-[#1A1A1A] dark:text-[#F5F5F5] font-sans pb-32 transition-colors duration-300 overflow-x-hidden">
      <Toaster position="top-center" richColors />
      

      
      <AnimatePresence>
        {showOnboarding && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-[#F8F9FA] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center"
          >
            <div className="space-y-6">
              <div className="w-24 h-24 bg-lime-400 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-lime-400/40 mb-8">
                <Sparkles size={48} className="text-black" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] dark:text-[#F5F5F5] tracking-tight">
                Добро пожаловать в <span className="text-lime-500 dark:text-lime-400">NutriSnap</span>
              </h1>
              <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                Ваш личный помощник для отслеживания питания и тренировок.
              </p>
              <button
                onClick={() => {
                  setShowOnboarding(false);
                  setShowProfile(true);
                }}
                className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20"
              >
                Начать путь
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showGreeting && profile && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[200] bg-[#F8F9FA] dark:bg-[#0A0A0A] flex flex-col items-center justify-center p-8 text-center"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="space-y-6"
            >
              <div className="w-24 h-24 bg-lime-400 rounded-[32px] flex items-center justify-center mx-auto shadow-2xl shadow-lime-400/40 mb-8">
                <Sparkles size={48} className="text-black" />
              </div>
              <h1 className="text-4xl sm:text-5xl font-black text-[#1A1A1A] dark:text-[#F5F5F5] tracking-tight">
                {getGreeting()},<br/>
                <span className="text-lime-500 dark:text-lime-400">{profile.name || 'друг'}!</span>
              </h1>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-30 ios-blur border-b border-black/5 dark:border-white/5 px-4 sm:px-6 py-3 sm:py-4 safe-top">
        <div className="max-w-md mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-lime-400 rounded-xl flex items-center justify-center text-black shadow-lg shadow-lime-400/20">
              <Utensils size={18} strokeWidth={3} />
            </div>
            <h1 className="text-xl font-black tracking-tighter">NutriSnap</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowProfile(true)}
              className="w-10 h-10 bg-gray-100 dark:bg-white/10 rounded-full flex items-center justify-center hover:bg-lime-400 hover:text-black transition-all overflow-hidden border border-black/5 dark:border-white/5"
            >
              {profile?.photoURL ? (
                <img 
                  src={profile.photoURL} 
                  alt="Profile" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover" 
                />
              ) : (
                <UserIcon size={20} />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-md mx-auto px-4 sm:px-6 pt-6 sm:pt-8 space-y-6 sm:space-y-8">
        {/* Daily Progress */}
        <section className="bg-white dark:bg-[#141414] rounded-[32px] p-8 shadow-sm border border-black/5 dark:border-white/5 space-y-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-lime-400/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          
          <div className="flex justify-between items-start relative">
            <div>
              <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                {profile?.name ? `Привет, ${profile.name}!` : 'Дневной прогресс'}
              </p>
              <h2 className="text-5xl font-black mt-2 tracking-tighter dark:text-white">
                {Math.round(stats.totalCalories)}
                <span className="text-lg font-medium text-gray-300 dark:text-gray-600 ml-2 tracking-normal">/ {Math.round(dailyGoal)}</span>
              </h2>
            </div>
            <div className={cn(
              "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest",
              stats.totalCalories > dailyGoal ? "bg-red-100 text-red-600" : "bg-lime-100 text-lime-700"
            )}>
              {Math.round((stats.totalCalories / dailyGoal) * 100)}%
            </div>
          </div>

          <div className="space-y-3">
            <div className="h-4 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden p-1 border border-black/5 dark:border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min((stats.totalCalories / dailyGoal) * 100, 100)}%` }}
                className={cn(
                  "h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_15px_rgba(163,230,53,0.4)]",
                  stats.totalCalories > dailyGoal ? "bg-red-500" : "bg-lime-400"
                )}
              />
            </div>
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              <span>{stats.snackCalories > 0 ? `+${stats.snackCalories} перекус` : '0 ккал'}</span>
              <span>Цель: {Math.round(dailyGoal)} ккал</span>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-6 pt-4 border-t border-black/5 dark:border-white/5">
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-orange-500">
                <Zap size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-wider">Белки</span>
              </div>
              <p className="text-xl font-bold tracking-tight dark:text-white">{Math.round(stats.totalProtein)}<span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-0.5">г</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-blue-500">
                <Droplets size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-wider">Углеводы</span>
              </div>
              <p className="text-xl font-bold tracking-tight dark:text-white">{Math.round(stats.totalCarbs)}<span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-0.5">г</span></p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-purple-500">
                <Flame size={12} strokeWidth={3} />
                <span className="text-[10px] font-black uppercase tracking-wider">Жиры</span>
              </div>
              <p className="text-xl font-bold tracking-tight dark:text-white">{Math.round(stats.totalFat)}<span className="text-xs font-medium text-gray-400 dark:text-gray-500 ml-0.5">г</span></p>
            </div>
          </div>
        </section>

        {/* Water Tracker */}
        <section className="bg-white dark:bg-[#141414] rounded-[32px] p-6 shadow-sm border border-black/5 dark:border-white/5 space-y-6 relative overflow-hidden">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shadow-sm">
                <Droplets size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Вода</p>
                <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  {waterIntake[new Date().toISOString().split('T')[0]] || 0} <span className="text-sm font-medium text-gray-400">мл</span>
                </h3>
              </div>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={() => handleAddWater(-250)}
                className="px-4 py-2 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-red-100 dark:hover:bg-red-500/20 transition-all active:scale-95"
              >
                -250 мл
              </button>
              <button 
                onClick={() => handleAddWater(250)}
                className="px-4 py-2 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-all active:scale-95"
              >
                +250 мл
              </button>
            </div>
          </div>
          <div className="h-2 bg-gray-50 dark:bg-white/5 rounded-full overflow-hidden border border-black/5 dark:border-white/5">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(((waterIntake[new Date().toISOString().split('T')[0]] || 0) / 2000) * 100, 100)}%` }}
              className="h-full bg-blue-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
            />
          </div>
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>0 мл</span>
            <span>Цель: 2000 мл</span>
          </div>
        </section>

        {/* AI Insight Card */}
        <AnimatePresence>
          {(todayMeals.length > 0 || todayWorkouts.length > 0) && (
            <motion.section 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => !insight && !isGettingInsight ? fetchInsight() : null}
              className={cn(
                "bg-black text-white rounded-[32px] p-6 shadow-2xl relative overflow-hidden ring-1 ring-white/10 transition-all",
                !insight && !isGettingInsight ? "cursor-pointer hover:ring-lime-400/50" : ""
              )}
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-lime-400/20 rounded-full -mr-24 -mt-24 blur-3xl" />
              
              {!insight ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-lime-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-lime-400/20">
                      {isGettingInsight ? <Loader2 size={20} className="animate-spin" /> : <Sparkles size={20} className="text-black" />}
                    </div>
                    <div>
                      <h3 className="font-black tracking-tight">AI-анализ дня</h3>
                      <p className="text-[10px] text-white/50 uppercase tracking-widest font-bold">
                        {isGettingInsight ? 'Анализируем ваш рацион...' : 'Нажмите для анализа вашего рациона'}
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-white/10 rounded-full transition-all">
                    {isGettingInsight ? <Loader2 size={20} className="animate-spin" /> : <ChevronRight size={20} />}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Sparkles size={16} className="text-lime-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-lime-400">AI-анализ</span>
                    </div>
                    <div className="text-2xl font-black tracking-tighter">{Math.round(insight.score)}<span className="text-[10px] font-medium text-white/40 ml-1">/100</span></div>
                  </div>
                  <p className="text-sm leading-relaxed text-white/80 font-medium">{insight.summary}</p>
                  <div className="bg-white/10 p-4 rounded-2xl border border-white/5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Совет профи</p>
                    <p className="text-xs italic text-lime-300">"{insight.advice}"</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      fetchInsight();
                    }}
                    disabled={isGettingInsight}
                    className="flex items-center gap-2 text-[10px] font-black text-white/30 uppercase tracking-widest hover:text-lime-400 transition-colors disabled:opacity-50"
                  >
                    {isGettingInsight ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                    Обновить анализ
                  </button>
                </div>
              )}
            </motion.section>
          )}
        </AnimatePresence>

        {/* Content Area */}
        <section className="space-y-6 pb-24">
          {activeTab === 'today' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="px-1 space-y-6"
            >
              {showReminder && (!profile?.reminders || profile.reminders.length === 0) && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center justify-between p-3 bg-red-500/10 rounded-2xl border border-red-500/20 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-white dark:bg-black/20 rounded-xl flex items-center justify-center text-red-500 shadow-sm">
                      <Bell size={16} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-widest text-red-600 dark:text-red-400">Напоминания</p>
                      <p className="text-xs font-bold text-red-900 dark:text-red-100">Не забывайте о еде!</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowReminder(false)}
                    className="p-2 text-red-500 hover:bg-red-500/10 rounded-full transition-colors"
                  >
                    <X size={16} />
                  </button>
                </motion.div>
              )}
              <QuickAdd onSelect={(food) => addQuickMeal(food, 'snack', true)} />
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowManualAdd(true)}
                  className="flex-1 py-3 bg-white dark:bg-[#1C1C1C] rounded-2xl font-black text-xs uppercase tracking-widest border border-black/5 dark:border-white/5 shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  + Добавить перекус
                </button>
                <button 
                  onClick={() => setShowScanner(true)}
                  className="px-6 py-3 bg-white dark:bg-[#1C1C1C] rounded-2xl font-black text-xs uppercase tracking-widest border border-black/5 dark:border-white/5 shadow-sm hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center gap-2"
                >
                  <Smartphone size={16} className="text-lime-500" />
                  Скан
                </button>
              </div>
              <FoodSearch 
                customFoods={customFoods}
                meals={meals}
                onSelect={(food) => addQuickMeal(food)}
                onAddCustom={() => setShowAddCustomFood(true)}
                onAddFromAI={async (food) => {
                  try {
                    setCustomFoods(prev => [food, ...prev]);
                    addQuickMeal(food);
                  } catch (error) {
                    console.error('Error adding custom food', error);
                  }
                }}
                profile={profile}
              />
            </motion.div>
          )}

          {activeTab === 'today' && activeDiet && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between p-4 bg-lime-400/10 rounded-3xl border border-lime-400/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white dark:bg-black/20 rounded-2xl flex items-center justify-center text-xl shadow-sm">
                  {activeDiet.icon}
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 dark:text-lime-400">Активная диета</p>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{activeDiet.name}</p>
                </div>
              </div>
              <button 
                onClick={() => { setSelectedDiet(activeDiet); setIsDietModalOpen(true); }}
                className="px-4 py-2 bg-white dark:bg-black/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Детали
              </button>
            </motion.div>
          )}

          {activeTab === 'history' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8 pb-32"
            >
              <div className="bg-white dark:bg-[#141414] p-4 rounded-[32px] shadow-sm border border-black/5 dark:border-white/5">
                <DayPicker
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  locale={ru}
                  className="mx-auto"
                />
              </div>
              <div className="text-center font-black text-lg">
                {dateRange?.from && (
                  <>
                    {format(dateRange.from, 'd MMMM yyyy', { locale: ru })}
                    {dateRange.to && dateRange.to.getTime() !== dateRange.from.getTime() && (
                      <> — {format(dateRange.to, 'd MMMM yyyy', { locale: ru })}</>
                    )}
                  </>
                )}
              </div>
              <div className="flex justify-between items-end">
                <div>
                  <h2 className="text-4xl font-black tracking-tighter leading-none">История</h2>
                  <p className="text-gray-400 dark:text-gray-500 font-bold uppercase tracking-widest text-[10px] mt-2">Ваш путь к цели</p>
                </div>
                <div className="flex gap-2">
                  <div className="px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Всего</span>
                    <p className="text-lg font-black leading-none mt-1">{meals.length}</p>
                  </div>
                </div>
              </div>

              {meals.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-20 h-20 bg-gray-100 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto">
                    <History size={32} className="text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-gray-400 dark:text-gray-500 font-bold">История пока пуста</p>
                </div>
              ) : (
                <div className="space-y-10">
                  {mealsByDate.map(([date, dateMeals]) => (
                    <div key={date} className="space-y-4">
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-lime-600 dark:text-lime-400 sticky top-24 z-20 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-md py-2 inline-block px-4 rounded-full border border-lime-100 dark:border-lime-400/20 shadow-sm">
                        {date}
                      </h3>
                      <div className="grid gap-4">
                        {dateMeals.map(meal => (
                          <div 
                            key={meal.id} 
                            onClick={() => setEditingMeal(meal)}
                            className="bg-gray-50 dark:bg-white/5 rounded-[32px] p-4 border border-black/5 dark:border-white/5 flex gap-4 group hover:border-lime-400/30 transition-all cursor-pointer"
                          >
                            <div className="w-20 h-20 rounded-2xl overflow-hidden shrink-0 shadow-inner relative bg-gray-100 dark:bg-white/5">
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
                                <div className="hidden w-full h-full items-center justify-center text-4xl">
                                  {meal.icon || '🍽️'}
                                </div>
                              </div>
                            </div>
                            <div className="flex-1 flex flex-col justify-center">
                              <div className="flex justify-between items-start">
                                <div>
                                  <h4 className="font-bold text-lg leading-tight">{meal.name}</h4>
                                  {meal.brand && (
                                    <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{meal.brand}</p>
                                  )}
                                </div>
                                <span className="text-[10px] font-black text-gray-400 dark:text-gray-500">
                                  {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 mt-2">
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Б</span>
                                  <span className="text-sm font-black text-lime-600 dark:text-lime-400">{meal.protein || 0}г</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Ж</span>
                                  <span className="text-sm font-black text-lime-600 dark:text-lime-400">{meal.fat || 0}г</span>
                                </div>
                                <div className="flex flex-col">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">У</span>
                                  <span className="text-sm font-black text-lime-600 dark:text-lime-400">{meal.carbs || 0}г</span>
                                </div>
                                <div className="flex flex-col ml-auto">
                                  <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">ккал</span>
                                  <span className="text-sm font-black">{meal.calories}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col justify-center gap-2 transition-all">
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteMeal(meal.id); }}
                                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          ) : activeTab === 'analytics' ? (
            <div className="space-y-6">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowWeightModal(true)}
                  className="px-6 py-3 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20"
                >
                  Записать вес
                </button>
              </div>
              <ProgressCharts 
                meals={meals} 
                workouts={workouts} 
                profile={profile} 
                dietMultiplier={dietMultiplier}
              />
            </div>
          ) : activeTab === 'diets' ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Ваши диеты</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {DIETS.map((diet) => (
                  <div 
                    key={diet.id} 
                    onClick={() => { setSelectedDiet(diet); setIsDietModalOpen(true); }}
                    className={cn(
                      "bg-white dark:bg-[#141414] border rounded-[2rem] p-6 space-y-4 hover:border-lime-400/20 transition-all group cursor-pointer active:scale-[0.98]",
                      profile?.activeDietId === diet.id ? "border-lime-400" : "border-black/5 dark:border-white/5"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className="text-4xl">{diet.icon}</div>
                      <div>
                        <h3 className="font-black text-lg text-gray-900 dark:text-white">{diet.name}</h3>
                        {profile?.activeDietId === diet.id && (
                          <span className="text-[10px] font-black text-lime-500 uppercase tracking-widest">Активная</span>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{diet.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : activeTab === 'achievements' ? (
            <AchievementsGrid 
              userAchievements={userAchievements} 
              meals={meals}
              workouts={workouts}
              customFoods={customFoods}
              waterIntake={waterIntake}
              profile={profile}
            />
          ) : activeTab === 'explore' ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-10 pb-32"
            >
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Обзор</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Ваш путь к здоровью</p>
                  </div>
                </div>

                {/* Quick Access Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setActiveTab('recipes')}
                    className="flex flex-col items-start p-5 bg-white dark:bg-[#141414] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all group"
                  >
                    <div className="w-10 h-10 bg-orange-100 dark:bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 mb-4 group-hover:bg-orange-500 group-hover:text-white transition-all">
                      <BookOpen size={20} />
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white">Рецепты</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Здоровое питание</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('diets')}
                    className="flex flex-col items-start p-5 bg-white dark:bg-[#141414] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all group"
                  >
                    <div className="w-10 h-10 bg-lime-100 dark:bg-lime-500/10 rounded-xl flex items-center justify-center text-lime-600 mb-4 group-hover:bg-lime-500 group-hover:text-white transition-all">
                      <Flame size={20} />
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white">Диеты</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Планы питания</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('achievements')}
                    className="flex flex-col items-start p-5 bg-white dark:bg-[#141414] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all group"
                  >
                    <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-500/10 rounded-xl flex items-center justify-center text-yellow-600 mb-4 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                      <Zap size={20} />
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white">Награды</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Ваши успехи</span>
                  </button>
                  <button 
                    onClick={() => setActiveTab('analytics')}
                    className="flex flex-col items-start p-5 bg-white dark:bg-[#141414] rounded-[2rem] border border-black/5 dark:border-white/5 shadow-sm active:scale-95 transition-all group"
                  >
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-all">
                      <PieChart size={20} />
                    </div>
                    <span className="text-sm font-black text-gray-900 dark:text-white">Анализ</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Статистика</span>
                  </button>
                </div>

                <div className="pt-4">
                  <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500 mb-6">База знаний</h3>
                  
                  {/* Featured Post */}
                  {POSTS.length > 0 && (
                    <div 
                      onClick={() => setSelectedPost(POSTS[0])}
                      className="relative w-full h-[350px] rounded-[3rem] overflow-hidden cursor-pointer group active:scale-[0.98] transition-all mb-6"
                    >
                      <img 
                        src={POSTS[0].imageUrl} 
                        alt={POSTS[0].title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        referrerPolicy="no-referrer"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${POSTS[0].id}/1200/800`;
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-8">
                        <span className="px-3 py-1 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full mb-3 inline-block">
                          Главное
                        </span>
                        <h3 className="text-2xl font-serif font-medium text-white leading-tight mb-4">
                          {POSTS[0].title}
                        </h3>
                        <div className="flex items-center gap-4 text-[10px] font-bold text-white/60 uppercase tracking-widest">
                          <span className="flex items-center gap-2"><UserIcon size={12} /> {POSTS[0].author}</span>
                          <span className="flex items-center gap-2"><Clock size={12} /> {POSTS[0].readTime}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 gap-6">
                    {POSTS.slice(1).map((post) => (
                      <div 
                        key={post.id} 
                        onClick={() => setSelectedPost(post)}
                        className="flex gap-4 bg-white dark:bg-[#141414] border border-black/5 dark:border-white/5 rounded-[2rem] p-4 hover:border-lime-400/20 transition-all group cursor-pointer active:scale-[0.98]"
                      >
                        <div className="w-24 h-24 shrink-0 rounded-2xl overflow-hidden">
                          <img 
                            src={post.imageUrl} 
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/400/400`;
                            }}
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-center space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[8px] font-black uppercase tracking-widest text-lime-600 dark:text-lime-400">
                              {post.category === 'nutrition' ? 'Питание' : 
                               post.category === 'health' ? 'Здоровье' : 
                               post.category === 'fitness' ? 'Фитнес' : 'Советы'}
                            </span>
                          </div>
                          <h3 className="font-serif text-lg font-medium text-gray-900 dark:text-white leading-tight line-clamp-2">{post.title}</h3>
                          <div className="flex items-center gap-3 text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                            <span className="flex items-center gap-1"><Clock size={10} /> {post.readTime}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ) : activeTab === 'recipes' ? (
            <Recipes 
              userRecipes={recipes} 
              onAddRecipe={(recipe) => {
                setRecipes(prev => [recipe, ...prev]);
                toast.success('Рецепт добавлен!');
              }}
              onDeleteRecipe={(id) => {
                setRecipes(prev => prev.filter(r => r.id !== id));
                toast.success('Рецепт удален');
              }}
            />
          ) : (
            <>
              {activeTab === 'today' && frequentFoods.length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-8 p-6 bg-lime-400/5 dark:bg-lime-400/10 rounded-[32px] border border-lime-400/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles size={16} className="text-lime-500" />
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-lime-600 dark:text-lime-400">Популярное за сегодня</h3>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    {frequentFoods.map((food, idx) => (
                      <div key={idx} className="flex items-center gap-3 bg-white dark:bg-black/20 px-4 py-2 rounded-2xl border border-black/5 dark:border-white/5 shadow-sm">
                        <span className="text-lg">{food.icon || '🍽️'}</span>
                        <div>
                          <p className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{food.name}</p>
                          <p className="text-[10px] font-medium text-gray-400 dark:text-gray-500">
                            {food.count}x • {food.calories} ккал
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              <AnimatePresence mode="popLayout">
                {activeTab === 'today' ? (
                  Object.entries(groupedMeals).map(([type, group]) => {
                    const g = group as { meals: Meal[]; totalCalories: number };
                    return g.meals.length > 0 && (
                      <div key={type} className="mb-8 last:mb-0">
                        <div className="flex items-center justify-between mb-4 px-2">
                          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-gray-400 dark:text-gray-500">{type}</h3>
                          <div className="flex items-baseline gap-1">
                            <span className="text-lg font-black text-gray-900 dark:text-white tracking-tighter">{Math.round(g.totalCalories)}</span>
                            <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ккал</span>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {g.meals.map((meal) => (
                            <motion.div
                              key={meal.id}
                              layout
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95 }}
                              className="bg-white dark:bg-[#141414] rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-md transition-all relative z-10"
                            >
                              <div className="flex p-3">
                                <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-inner relative bg-gray-100 dark:bg-white/5">
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
                                    <div className="hidden w-full h-full items-center justify-center text-3xl">
                                      {meal.icon || '🍽️'}
                                    </div>
                                  </div>
                                </div>
                                <div className="p-3 flex-1 flex flex-col justify-between">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{meal.name}</h3>
                                      {meal.brand && (
                                        <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{meal.brand}</p>
                                      )}
                                      {meal.ingredients && meal.ingredients.length > 0 && (
                                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight line-clamp-2">
                                          {meal.ingredients.join(', ')}
                                        </p>
                                      )}
                                      {meal.allergens && meal.allergens.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {meal.allergens.map((allergen, idx) => (
                                            <span key={idx} className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-md border border-red-500/20">
                                              {allergen}
                                            </span>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex gap-1">
                                      <button 
                                        onClick={() => setEditingMeal(meal)}
                                        className="p-1.5 text-gray-400 hover:text-lime-500 hover:bg-lime-50 dark:hover:bg-lime-400/10 rounded-xl transition-all"
                                      >
                                        <Pencil size={16} />
                                      </button>
                                      <button 
                                        onClick={() => deleteMeal(meal.id)}
                                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                                      >
                                        <Trash2 size={16} />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-baseline gap-1">
                                      <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{meal.calories}</span>
                                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ккал</span>
                                    </div>
                                    <div className="flex gap-1">
                                      <div className="flex items-center gap-1 bg-orange-500/5 px-1.5 py-0.5 rounded-lg border border-orange-500/10">
                                        <span className="text-[8px] font-black text-orange-500 uppercase">Б</span>
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.protein}г</span>
                                      </div>
                                      <div className="flex items-center gap-1 bg-blue-500/5 px-1.5 py-0.5 rounded-lg border border-blue-500/10">
                                        <span className="text-[8px] font-black text-blue-500 uppercase">У</span>
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.carbs}г</span>
                                      </div>
                                      <div className="flex items-center gap-1 bg-yellow-500/5 px-1.5 py-0.5 rounded-lg border border-yellow-500/10">
                                        <span className="text-[8px] font-black text-yellow-500 uppercase">Ж</span>
                                        <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.fat}г</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ) : (
                  meals.map((meal) => (
                    <motion.div
                      key={meal.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="bg-white dark:bg-[#141414] rounded-[24px] border border-black/5 dark:border-white/5 shadow-sm group hover:shadow-md transition-all relative z-10"
                    >
                      <div className="flex p-3">
                        <div className="w-14 h-14 shrink-0 rounded-2xl overflow-hidden shadow-inner relative bg-gray-100 dark:bg-white/5">
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
                            <div className="hidden w-full h-full items-center justify-center text-3xl">
                              {meal.icon || '🍽️'}
                            </div>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-bold text-gray-900 dark:text-white text-base leading-tight">{meal.name}</h3>
                              {meal.brand && (
                                <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-0.5">{meal.brand}</p>
                              )}
                              {meal.ingredients && meal.ingredients.length > 0 && (
                                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 leading-tight line-clamp-2">
                                  {meal.ingredients.join(', ')}
                                </p>
                              )}
                              {meal.allergens && meal.allergens.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {meal.allergens.map((allergen, idx) => (
                                    <span key={idx} className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 bg-red-500/10 text-red-500 rounded-md border border-red-500/20">
                                      {allergen}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mt-1">
                                {new Date(meal.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                            <div className="flex gap-1">
                              <button 
                                onClick={() => setEditingMeal(meal)}
                                className="p-1.5 text-gray-400 hover:text-lime-500 hover:bg-lime-50 dark:hover:bg-lime-400/10 rounded-xl transition-all"
                              >
                                <Pencil size={16} />
                              </button>
                              <button 
                                onClick={() => deleteMeal(meal.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-baseline gap-1">
                              <span className="text-xl font-black text-gray-900 dark:text-white tracking-tighter">{meal.calories}</span>
                              <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">ккал</span>
                            </div>
                            <div className="flex gap-1">
                              <div className="flex items-center gap-1 bg-orange-500/5 px-1.5 py-0.5 rounded-lg border border-orange-500/10">
                                <span className="text-[8px] font-black text-orange-500 uppercase">Б</span>
                                <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.protein}г</span>
                              </div>
                              <div className="flex items-center gap-1 bg-blue-500/5 px-1.5 py-0.5 rounded-lg border border-blue-500/10">
                                <span className="text-[8px] font-black text-blue-500 uppercase">У</span>
                                <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.carbs}г</span>
                              </div>
                              <div className="flex items-center gap-1 bg-yellow-500/5 px-1.5 py-0.5 rounded-lg border border-yellow-500/10">
                                <span className="text-[8px] font-black text-yellow-500 uppercase">Ж</span>
                                <span className="text-[10px] font-bold text-gray-900 dark:text-white">{meal.fat}г</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {activeTab === 'today' && (
                <div className="pt-8 border-t border-black/5">
                  <WorkoutLog 
                    workouts={todayWorkouts}
                    onAdd={handleAddWorkout}
                    onDelete={handleDeleteWorkout}
                    weight={profile?.weight || 70}
                  />
                </div>
              )}

              {(activeTab === 'today' ? todayMeals : meals).length === 0 && todayWorkouts.length === 0 && (
                <div className="text-center py-20 space-y-4">
                  <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-[32px] flex items-center justify-center mx-auto text-gray-200 dark:text-gray-800 border border-black/5 dark:border-white/5">
                    <Utensils size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-gray-900 dark:text-white font-bold">Ваша тарелка пуста</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 max-w-[200px] mx-auto">Сфотографируйте следующий прием пищи, чтобы начать отслеживание.</p>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </main>

      {/* Action Bar */}
      <div className="fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-4 bg-black/90 backdrop-blur-2xl border border-white/10 px-4 sm:px-8 py-3 sm:py-5 rounded-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] z-40 w-[calc(100%-3rem)] max-w-xs sm:max-w-none justify-center">
        <input 
          ref={cameraInputRef}
          type="file" 
          accept="image/*" 
          capture="environment" 
          className="hidden" 
          onChange={handleNativeCamera}
        />
        <input 
          ref={galleryInputRef}
          type="file" 
          accept="image/*" 
          className="hidden" 
          onChange={handleNativeGallery}
        />
        <button 
          onClick={async () => {
            if (!localStorage.getItem('nutrisnap_permissions_seen')) {
              setPendingPermissionAction('camera');
              setShowPermissionModal(true);
            } else {
              let granted = cameraPermission === 'granted';
              if (!granted) {
                granted = await requestCameraPermission();
              }
              if (granted) {
                cameraInputRef.current?.click();
              }
            }
          }}
          className="flex items-center gap-2 sm:gap-3 px-4 sm:px-8 py-3 sm:py-4 bg-lime-400 text-black rounded-full font-black uppercase text-[10px] sm:text-[11px] tracking-[0.2em] hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20 whitespace-nowrap"
        >
          <Camera size={18} strokeWidth={3} />
          <span>Снять еду</span>
        </button>
        <div className="w-px h-6 sm:h-8 bg-white/10" />
        <button 
          onClick={() => {
            if (!localStorage.getItem('nutrisnap_permissions_seen')) {
              setPendingPermissionAction('gallery');
              setShowPermissionModal(true);
            } else {
              galleryInputRef.current?.click();
            }
          }}
          className="p-2.5 sm:p-4 text-white/60 hover:text-lime-400 hover:bg-white/5 rounded-full transition-all"
        >
          <Upload size={20} strokeWidth={2.5} />
        </button>
      </div>

      {/* Cart Mockup */}
      <AnimatePresence>
        {showProfile && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-[#141414] w-full max-w-md rounded-[32px] shadow-2xl relative flex flex-col max-h-[90vh]"
            >
              {profile && (
                <button 
                  onClick={() => setShowProfile(false)}
                  className="absolute top-6 right-6 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-full transition-all z-10 text-gray-400"
                >
                  <X size={20} />
                </button>
              )}
              
              <div className="p-8 overflow-y-auto no-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 bg-lime-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-lime-400/20">
                    <Settings size={24} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight dark:text-white">Настройки профиля</h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">Персонализируйте свои цели и данные</p>
                  </div>
                </div>

                <form onSubmit={handleProfileSave} className="space-y-6">
                  <div className="flex flex-col items-center gap-4 py-4 border-b border-black/5 dark:border-white/5">
                    <div className="relative group">
                      <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center overflow-hidden border-4 border-white dark:border-black shadow-xl ring-2 ring-lime-400/20">
                        {tempPhotoURL ? (
                          <img src={tempPhotoURL} alt="Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                        ) : (
                          <UserIcon size={40} className="text-gray-300 dark:text-gray-700" />
                        )}
                      </div>
                      <label className="absolute bottom-0 right-0 w-8 h-8 bg-lime-400 text-black rounded-full flex items-center justify-center cursor-pointer shadow-lg hover:bg-lime-300 transition-all active:scale-90">
                        <Camera size={16} />
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleProfilePictureChange} 
                          className="sr-only" 
                        />
                      </label>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Фото профиля</p>
                      <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 italic">Нажмите на иконку камеры, чтобы изменить и настроить фото</p>
                    </div>
                  </div>

                  {/* Permissions Section */}
                  {/* Permissions are now handled automatically on first use */}

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Ваше имя</label>
                    <input 
                      required 
                      name="name" 
                      type="text" 
                      defaultValue={profile?.name}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="Алексей"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Возраст</label>
                    <input 
                      required 
                      name="age" 
                      type="number" 
                      defaultValue={profile?.age}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="25"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Пол</label>
                    <select 
                      name="gender" 
                      defaultValue={profile?.gender || 'male'}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                    >
                      <option value="male" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Мужской</option>
                      <option value="female" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Женский</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Вес (кг)</label>
                    <input 
                      required 
                      name="weight" 
                      type="number" 
                      defaultValue={profile?.weight}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="70"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Рост (см)</label>
                    <input 
                      required 
                      name="height" 
                      type="number" 
                      defaultValue={profile?.height}
                      className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                      placeholder="175"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Уровень активности</label>
                  <select 
                    name="activityLevel" 
                    defaultValue={profile?.activityLevel || 'moderate'}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                  >
                    <option value="sedentary" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Сидячий (офисная работа)</option>
                    <option value="light" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Малоактивный (1-2 дня/нед)</option>
                    <option value="moderate" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Умеренно активный (3-5 дней/нед)</option>
                    <option value="active" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Активный (6-7 дней/нед)</option>
                    <option value="very_active" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">Очень активный (спортсмен)</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Своя цель калорий (необязательно)</label>
                  <input 
                    name="customDailyGoal" 
                    type="number" 
                    defaultValue={profile?.customDailyGoal}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                    placeholder="Например: 2500"
                  />
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 mt-1 italic">Если оставить пустым, цель будет рассчитана автоматически</p>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Цель</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'lose', label: 'Сбросить' },
                      { id: 'maintain', label: 'Поддержать' },
                      { id: 'gain', label: 'Набрать' }
                    ].map((g) => (
                      <label key={g.id} className="relative cursor-pointer">
                        <input 
                          type="radio" 
                          name="goal" 
                          value={g.id} 
                          defaultChecked={profile?.goal === g.id || (g.id === 'maintain' && !profile)}
                          onChange={() => setSelectedGoal(g.id as any)}
                          className="peer sr-only"
                        />
                        <div className="px-2 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest peer-checked:bg-lime-400 peer-checked:text-black peer-checked:border-lime-400 transition-all text-gray-900 dark:text-white">
                          {g.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {selectedGoal !== 'maintain' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Целевой вес (кг)</label>
                      <input 
                        type="number" 
                        name="targetWeight" 
                        defaultValue={profile?.targetWeight || profile?.weight}
                        step="0.1"
                        min="30"
                        max="300"
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Темп (кг/нед)</label>
                      <select 
                        name="weeklyGoal" 
                        defaultValue={profile?.weeklyGoal || 0.5}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
                      >
                        <option value="0.25" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">0.25 кг (Легкий)</option>
                        <option value="0.5" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">0.5 кг (Нормальный)</option>
                        <option value="0.75" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">0.75 кг (Интенсивный)</option>
                        <option value="1" className="bg-white dark:bg-[#141414] text-gray-900 dark:text-white">1 кг (Экстремальный)</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Интеграции со здоровьем</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                    <div className="flex flex-col gap-2">
                      <button 
                        type="button"
                        onClick={generateCalendarReminders}
                        className="flex items-center gap-3 p-4 rounded-2xl border bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-400 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-all text-left"
                      >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-200 dark:bg-white/10">
                          <Calendar size={20} className="text-lime-500" />
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase tracking-widest">Напоминания</p>
                          <p className="text-[10px] font-medium opacity-60">Добавить в календарь</p>
                        </div>
                      </button>
                    </div>

                    <div className="flex flex-col gap-2">

                    <label className="flex items-center gap-3 p-4 rounded-2xl border bg-gray-50 dark:bg-white/5 border-black/5 dark:border-white/5 text-gray-400 cursor-pointer hover:bg-black/5 dark:hover:bg-white/10 transition-all">
                      <input 
                        type="file" 
                        accept=".json" 
                        onChange={handleSamsungHealthImport} 
                        className="sr-only" 
                      />
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-200 dark:bg-white/10">
                        <Smartphone size={20} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-widest">Samsung Health</p>
                        <p className="text-[10px] font-medium opacity-60">Данные о здоровье</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-[9px] text-gray-400 dark:text-gray-500 italic mt-2">
                    * Samsung Health: импорт данных о здоровье (шаги, сон, активность) в формате <span className="font-bold">JSON</span>.
                  </p>

                  <button 
                    type="button"
                    onClick={testApiConnection}
                    className="mt-4 w-full flex items-center gap-3 p-4 rounded-2xl border bg-lime-400/5 dark:bg-lime-400/5 border-lime-400/20 text-lime-600 dark:text-lime-400 cursor-pointer hover:bg-lime-400/10 transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-lime-400/20">
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-widest">Проверить ИИ</p>
                      <p className="text-[10px] font-medium opacity-60">Тест связи с сервером (для APK)</p>
                    </div>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Тема оформления</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'light', label: 'Светлая', icon: <Sun size={14} /> },
                      { id: 'dark', label: 'Темная', icon: <Moon size={14} /> },
                      { id: 'system', label: 'Системная', icon: <Monitor size={14} /> }
                    ].map((t) => (
                      <label key={t.id} className="relative cursor-pointer">
                        <input 
                          type="radio" 
                          name="theme" 
                          value={t.id} 
                          checked={(profile?.theme || 'system') === t.id}
                          onChange={async () => {
                            if (!profile) return;
                            setProfile({
                              ...profile,
                              theme: t.id as Theme
                            });
                          }}
                          className="peer sr-only"
                        />
                        <div className="px-2 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl text-center text-[10px] font-black uppercase tracking-widest peer-checked:bg-lime-400 peer-checked:text-black peer-checked:border-lime-400 transition-all flex flex-col items-center gap-1 text-gray-900 dark:text-white">
                          {t.icon}
                          {t.label}
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Код активации (Подписка)</label>
                    {profile?.isSubscriptionActive ? (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-lime-400/10 rounded-full border border-lime-400/20">
                        <ShieldCheck size={8} className="text-lime-500" />
                        <span className="text-[8px] font-black text-lime-600 dark:text-lime-400 uppercase">Подписка активна</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 px-2 py-0.5 bg-red-400/10 rounded-full border border-red-400/20">
                        <ShieldAlert size={8} className="text-red-500" />
                        <span className="text-[8px] font-black text-red-600 dark:text-red-400 uppercase">Подписка неактивна</span>
                      </div>
                    )}
                  </div>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="text" 
                    value={subscriptionCodeInput}
                    onChange={(e) => setSubscriptionCodeInput(e.target.value)}
                    className="flex-1 px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white min-w-0"
                    placeholder="Введите код..."
                  />
                  <button
                    type="button"
                    onClick={() => checkSubscriptionCode(subscriptionCodeInput)}
                    disabled={subscriptionCheckStatus === 'checking'}
                    className="px-6 py-3 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-lime-300 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap shrink-0"
                  >
                    {subscriptionCheckStatus === 'checking' ? <Loader2 size={14} className="animate-spin" /> : 'Проверить'}
                  </button>
                </div>
                {subscriptionCheckStatus === 'error' && (
                  <p className="text-[9px] text-red-500 font-bold px-1">Ключ неправильный или уже использован</p>
                )}
                {subscriptionCheckStatus === 'success' && (
                  <p className="text-[9px] text-lime-500 font-bold px-1">Подписка активирована!</p>
                )}
                <p className="text-[9px] text-gray-400 dark:text-gray-500 italic mt-1">
                  Введите код, полученный после оплаты, чтобы активировать все функции ИИ.
                </p>
              </div>





                <div className="pt-4 border-t border-black/5">
                  <MealReminders 
                    reminders={profile?.reminders || []} 
                    onChange={async (reminders) => {
                      if (!profile) return;
                      setProfile({
                        ...profile,
                        reminders
                      });
                    }} 
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full py-4 bg-black dark:bg-white dark:text-black text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-gray-900 dark:hover:bg-gray-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Сохранить профиль
                </button>

                <div className="pt-4 border-t border-black/5 dark:border-white/5 space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-500/10 rounded-3xl p-6 border border-blue-100 dark:border-blue-500/20 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <svg viewBox="0 0 24 24" width="80" height="80" stroke="currentColor" strokeWidth="1" fill="none" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                    </div>
                    <div className="relative z-10 flex flex-col items-center text-center">
                      <h4 className="text-blue-900 dark:text-blue-100 font-black uppercase tracking-tighter text-lg mb-1">Присоединяйтесь к нам!</h4>
                      <p className="text-blue-600/80 dark:text-blue-400/80 text-sm font-medium mb-4">Следите за обновлениями и полезными советами в нашем канале</p>
                      <a 
                        href="https://t.me/NutriSnap_App" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-500/25"
                      >
                        <svg viewBox="0 0 24 24" width="18" height="18" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
                        @NutriSnap_App
                      </a>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.clear();
                      window.location.reload();
                    }}
                    className="w-full py-4 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 dark:hover:bg-red-500/20 transition-all"
                  >
                    <LogOut size={18} />
                    Сбросить данные
                  </button>
                </div>
              </form>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
      {/* AI Search Modal */}
      <AnimatePresence>
        {showAISearchModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white dark:bg-black flex flex-col"
          >
            <div className="p-6 flex justify-between items-center border-b border-black/5 dark:border-white/5">
              <div>
                <h2 className="text-2xl font-black uppercase tracking-tighter">Поиск через ИИ</h2>
                <p className="text-[10px] font-black text-lime-500 uppercase tracking-widest">GigaChat AI Search</p>
              </div>
              <button 
                onClick={() => setShowAISearchModal(false)}
                className="p-3 bg-gray-100 dark:bg-white/10 rounded-2xl"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <FoodSearch 
                customFoods={customFoods}
                meals={meals}
                onSelect={(food) => {
                  addQuickMeal(food, isAddingSnack ? 'snack' : undefined);
                  setShowAISearchModal(false);
                }}
                onAddCustom={() => {
                  setShowAISearchModal(false);
                  setShowAddCustomFood(true);
                }}
                onAddFromAI={(food) => {
                  addQuickMeal(food, isAddingSnack ? 'snack' : undefined);
                  setShowAISearchModal(false);
                }}
                profile={profile}
              />

              <div className="mt-8 p-6 bg-lime-400/5 rounded-[32px] border border-lime-400/10">
                <div className="flex items-center gap-3 mb-2">
                  <Sparkles size={16} className="text-lime-500" />
                  <p className="text-[10px] font-black uppercase tracking-widest text-lime-600 dark:text-lime-400">Как это работает?</p>
                </div>
                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                  Просто введите название блюда или продукта. Наш ИИ проанализирует его состав, калорийность и БЖУ, а затем добавит в ваш дневник.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Permission Modal */}
      <AnimatePresence>
        {showPermissionModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#0A0A0A] w-full max-w-sm rounded-[40px] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5"
            >
              <div className="p-8 text-center">
                <div className="w-20 h-20 bg-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-lime-400/20">
                  <Camera size={32} className="text-black" />
                </div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Разрешения</h2>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 leading-relaxed mb-8">
                  Для распознавания еды приложению нужен доступ к камере (чтобы делать снимки) и галерее (чтобы загружать готовые фото).
                </p>
                <button
                  onClick={async () => {
                    localStorage.setItem('nutrisnap_permissions_seen', 'true');
                    setShowPermissionModal(false);
                    
                    if (pendingPermissionAction === 'camera') {
                      let granted = cameraPermission === 'granted';
                      if (!granted) granted = await requestCameraPermission();
                      if (granted) {
                        if (isAddingSnack) {
                          setShowCamera(true);
                          setFacingMode('environment');
                        } else {
                          cameraInputRef.current?.click();
                        }
                      }
                    } else if (pendingPermissionAction === 'gallery') {
                      galleryInputRef.current?.click();
                    }
                    setPendingPermissionAction(null);
                  }}
                  className="w-full py-4 bg-lime-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20"
                >
                  Понятно, разрешить
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black flex flex-col"
          >
            <div className="absolute top-6 left-6 right-6 flex justify-between items-center z-10">
              <div className="px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                <p className="text-[9px] font-black text-white uppercase tracking-widest">
                  {facingMode === 'user' ? 'Селфи' : 'Еда'}
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => galleryInputRef.current?.click()}
                  className="p-2 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  <Upload size={18} />
                </button>
                <button 
                  onClick={switchCamera}
                  className="p-2 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  <RefreshCw size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (videoRef.current?.srcObject) {
                      const stream = videoRef.current.srcObject as MediaStream;
                      stream.getTracks().forEach(t => t.stop());
                    }
                    setShowCamera(false);
                    setIsAddingSnack(false);
                  }}
                  className="p-2 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            
            {cameraPermission !== 'granted' ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-8">
                <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center border border-white/10">
                  <Camera size={40} className="text-gray-400" />
                </div>
                <div className="text-center space-y-4 max-w-xs">
                  <h3 className="text-lg font-black text-white uppercase tracking-wider">Доступ к камере</h3>
                  <p className="text-sm text-gray-400 font-medium leading-relaxed">
                    Для работы ИИ-анализа и камеры требуется разрешение. Пожалуйста, нажмите кнопку ниже.
                  </p>
                </div>
                <button
                  onClick={requestCameraPermission}
                  className="px-8 py-4 bg-lime-400 text-black text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20"
                >
                  Разрешить доступ
                </button>
              </div>
            ) : (
              <video 
                ref={videoRef} 
                autoPlay 
                playsInline 
                muted
                className="flex-1 object-cover"
              />
            )}

            {supportsZoom && (
              <div className="absolute bottom-36 left-1/2 -translate-x-1/2 w-40 px-4 py-2 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col gap-1 z-10">
                <div className="flex justify-center items-center">
                  <span className="text-[9px] font-black text-white uppercase tracking-widest">{zoom.toFixed(1)}x</span>
                </div>
                <input 
                  type="range"
                  min="1"
                  max={maxZoom}
                  step="0.1"
                  value={zoom}
                  onChange={(e) => handleZoomChange(parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/20 rounded-full appearance-none cursor-pointer accent-lime-400"
                />
              </div>
            )}
            
            <div className="p-16 flex flex-col items-center gap-8 bg-black">
              <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Поместите еду в центр кадра</p>
              <div className="flex items-center gap-8">
                <button 
                  onClick={() => {
                    setManualAddImage(undefined);
                    setShowManualAdd(true);
                    setShowCamera(false);
                  }}
                  className="p-4 bg-white/10 text-white rounded-full backdrop-blur-md hover:bg-white/20 transition-all flex flex-col items-center gap-1"
                >
                  <Pencil size={20} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Вручную</span>
                </button>

                <button 
                  onClick={capturePhoto}
                  className="w-24 h-24 rounded-full border-[6px] border-white/20 flex items-center justify-center p-2 hover:border-white/40 transition-all"
                >
                  <div className="w-full h-full bg-white rounded-full active:scale-90 transition-transform shadow-xl" />
                </button>

                <div className="p-4 opacity-0 pointer-events-none">
                  <Pencil size={20} />
                </div>
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Achievement Unlock Modal */}
      <AnimatePresence>
        {newAchievement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
          >
            <div className="bg-white dark:bg-[#141414] rounded-[40px] p-8 max-w-sm w-full text-center shadow-2xl border border-amber-100 dark:border-amber-500/20">
              <div className="text-6xl mb-6">{newAchievement.icon}</div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">Новое достижение!</h2>
              <h3 className="text-xl font-bold text-amber-600 dark:text-amber-400 mb-4">{newAchievement.title}</h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8">{newAchievement.description}</p>
              <button
                onClick={() => setNewAchievement(null)}
                className="w-full py-4 bg-amber-500 text-white rounded-2xl font-bold shadow-lg shadow-amber-200 dark:shadow-amber-900/20 hover:bg-amber-600 transition-all"
              >
                Круто!
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {editingMeal && (
          <EditMealModal 
            meal={editingMeal} 
            onClose={() => setEditingMeal(null)} 
            onSave={updateMeal} 
          />
        )}

        {draftMeal && (
          <EditMealModal 
            meal={draftMeal} 
            onClose={() => setDraftMeal(null)} 
            onSave={(meal) => {
              setMeals(prev => [meal, ...prev]);
              setDraftMeal(null);
              toast.success(`Добавлено: ${meal.name}`);
            }} 
            isAdding={true}
          />
        )}

        {showScanner && (
          <BarcodeScanner 
            onScan={async (code) => {
              setShowScanner(false);
              setIsAnalyzing(true);
              try {
                const result = await analyzeFoodText(`Продукт со штрих-кодом ${code}`);
                const imageUrl = await fetchFoodImage(result.name);
                
                const newMeal: Meal = {
                  id: Math.random().toString(36).substr(2, 9),
                  timestamp: Date.now(),
                  imageUrl: imageUrl,
                  name: result.name,
                  brand: result.brand,
                  ingredients: result.ingredients,
                  allergens: result.allergens,
                  type: isAddingSnack ? 'snack' : undefined,
                  calories: Math.round(result.calories),
                  protein: Math.round(result.protein),
                  carbs: Math.round(result.carbs),
                  fat: Math.round(result.fat),
                  analysis: `Отсканированный продукт: ${result.name}`,
                  icon: '📦',
                };
                setDraftMeal(newMeal);
              } catch (error) {
                console.error('Barcode scan analysis failed', error);
                toast.error('Не удалось найти продукт по штрих-коду');
              } finally {
                setIsAnalyzing(false);
              }
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
        {showAddCustomFood && (
          <AddCustomFoodModal 
            onClose={() => setShowAddCustomFood(false)}
            onSave={async (food) => {
              try {
                setCustomFoods(prev => [food, ...prev]);
                setShowAddCustomFood(false);
                toast.success(`Продукт "${food.name}" добавлен в базу!`);
              } catch (error) {
                console.error('Error adding custom food', error);
              }
            }}
          />
        )}
        {showManualAdd && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white dark:bg-[#0A0A0A] w-full max-w-md rounded-[40px] overflow-hidden shadow-2xl border border-black/5 dark:border-white/5"
            >
              <div className="p-8">
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Добавить перекус</h2>
                  <button onClick={() => {
                    setShowManualAdd(false);
                    setIsAddingSnack(false);
                  }} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                    <X size={24} className="text-gray-400 dark:text-gray-500" />
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-8">
                  <button 
                    onClick={async () => {
                      if (!localStorage.getItem('nutrisnap_permissions_seen')) {
                        setPendingPermissionAction('camera');
                        setShowPermissionModal(true);
                        setIsAddingSnack(true);
                        setShowManualAdd(false);
                      } else {
                        let granted = cameraPermission === 'granted';
                        if (!granted) granted = await requestCameraPermission();
                        if (granted) {
                          setShowCamera(true);
                          setIsAddingSnack(true);
                          setFacingMode('environment');
                          setShowManualAdd(false);
                        }
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-lime-400/20 transition-all"
                  >
                    <Camera size={24} className="text-lime-500" />
                    <span className="text-[9px] font-black uppercase">Фото</span>
                  </button>
                  <button 
                    onClick={() => {
                      if (!localStorage.getItem('nutrisnap_permissions_seen')) {
                        setPendingPermissionAction('gallery');
                        setShowPermissionModal(true);
                        setIsAddingSnack(true);
                        setShowManualAdd(false);
                      } else {
                        galleryInputRef.current?.click();
                        setIsAddingSnack(true);
                        setShowManualAdd(false);
                      }
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-lime-400/20 transition-all"
                  >
                    <Upload size={24} className="text-lime-500" />
                    <span className="text-[9px] font-black uppercase">Галерея</span>
                  </button>
                  <button 
                    onClick={() => {
                      setShowManualAdd(false);
                      setIsAddingSnack(true);
                      setShowAISearchModal(true);
                    }}
                    className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl hover:bg-lime-400/20 transition-all"
                  >
                    <Search size={24} className="text-lime-500" />
                    <span className="text-[9px] font-black uppercase">Поиск</span>
                  </button>
                </div>

                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const name = formData.get('name') as string;

                  // Check for diet restrictions
                  if (activeDiet) {
                    const isRestricted = activeDiet.foodsToAvoid.some(food => 
                      name.toLowerCase().includes(food.toLowerCase())
                    );
                    
                    if (isRestricted) {
                      toast.warning(`Внимание: ${name} может не подходить для вашей диеты "${activeDiet.name}"`, {
                        duration: 8000,
                        icon: <AlertTriangle className="text-orange-500" />
                      });
                    }
                  }

                  const newMeal: Meal = {
                    id: Math.random().toString(36).substr(2, 9),
                    timestamp: Date.now(),
                    imageUrl: manualAddImage || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=500&q=80',
                    name: formData.get('name') as string,
                    brand: formData.get('brand') as string,
                    type: 'snack',
                    calories: Math.round(Number(formData.get('calories'))),
                    protein: Math.round(Number(formData.get('protein'))),
                    carbs: Math.round(Number(formData.get('carbs'))),
                    fat: Math.round(Number(formData.get('fat'))),
                    analysis: 'Добавлено вручную',
                  };
                  setDraftMeal(newMeal);
                  setShowManualAdd(false);
                }} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Название блюда</label>
                    <input
                      name="name"
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                      required
                      placeholder="Напр., Куриный салат"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Бренд / Производитель (необязательно)</label>
                    <input
                      name="brand"
                      type="text"
                      className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                      placeholder="Напр., Данон, ВкусВилл"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Калории</label>
                      <input
                        name="calories"
                        type="number"
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Белки (г)</label>
                      <input
                        name="protein"
                        type="number"
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Углеводы (г)</label>
                      <input
                        name="carbs"
                        type="number"
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">Жиры (г)</label>
                      <input
                        name="fat"
                        type="number"
                        className="w-full px-6 py-4 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-5 bg-lime-400 text-black rounded-3xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20 mt-4"
                  >
                    <Save size={18} strokeWidth={3} />
                    Сохранить
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}

        {isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-t-4 border-lime-400 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Utensils className="w-8 h-8 text-lime-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-black text-2xl text-white tracking-tight">Анализ питания</h3>
              <p className="text-sm text-white/40 uppercase tracking-widest font-bold">GigaChat AI обрабатывает пиксели</p>
            </div>
            
            <div className="max-w-[200px] w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-lime-400"
              />
            </div>
          </motion.div>
        )}

        {isGettingInsight && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center space-y-8"
          >
            <div className="relative">
              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-24 h-24 border-t-4 border-lime-400 rounded-full"
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Sparkles className="w-8 h-8 text-lime-400" />
              </div>
            </div>
            <div className="text-center space-y-2">
              <h3 className="font-black text-2xl text-white tracking-tight">Генерация инсайтов</h3>
              <p className="text-sm text-white/40 uppercase tracking-widest font-bold">GigaChat AI анализирует ваш день</p>
            </div>
            
            <div className="max-w-[200px] w-full bg-white/5 h-1 rounded-full overflow-hidden">
              <motion.div 
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                className="w-full h-full bg-lime-400"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <DietModal 
        diet={selectedDiet}
        isOpen={isDietModalOpen}
        onClose={() => setIsDietModalOpen(false)}
        isActive={profile?.activeDietId === selectedDiet?.id}
        onApply={handleApplyDiet}
      />



      <AnimatePresence>
        {showWeightModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowWeightModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-[#141414] rounded-[2.5rem] shadow-2xl overflow-hidden border border-black/5 dark:border-white/5 p-8"
            >
              <div className="absolute top-6 right-6 z-10">
                <button
                  onClick={() => setShowWeightModal(false)}
                  className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-6">Записать вес</h2>
              <form onSubmit={handleLogWeight} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 dark:text-gray-500">Ваш вес сегодня (кг)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="30"
                    max="300"
                    value={tempWeight}
                    onChange={(e) => setTempWeight(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white text-center text-2xl"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-lime-300 transition-all active:scale-95 shadow-xl shadow-lime-400/20"
                >
                  Сохранить
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isCropping && imageToCrop && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center p-4 sm:p-8"
          >
            <div className="w-full max-w-md aspect-square relative rounded-[32px] overflow-hidden border-4 border-white/10 shadow-2xl">
              <Cropper
                image={imageToCrop}
                crop={crop}
                zoom={zoom}
                rotation={rotation}
                aspect={1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                onRotationChange={setRotation}
                cropShape="round"
                showGrid={false}
              />
            </div>
            
            <div className="w-full max-w-md mt-8 space-y-8">
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Масштаб</span>
                  <span className="text-xs font-bold text-lime-400">{Math.round(zoom * 100)}%</span>
                </div>
                <input
                  type="range"
                  value={zoom}
                  min={1}
                  max={3}
                  step={0.1}
                  aria-labelledby="Zoom"
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lime-400"
                />
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Поворот</span>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { setZoom(1); setRotation(0); setCrop({ x: 0, y: 0 }); }}
                      className="text-[10px] font-black uppercase tracking-widest text-lime-400 hover:text-white transition-colors"
                    >
                      Сбросить
                    </button>
                    <span className="text-xs font-bold text-lime-400">{rotation}°</span>
                  </div>
                </div>
                <input
                  type="range"
                  value={rotation}
                  min={0}
                  max={360}
                  step={1}
                  aria-labelledby="Rotation"
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="w-full h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-lime-400"
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setIsCropping(false);
                    setImageToCrop(null);
                    setRotation(0);
                  }}
                  className="flex-1 px-6 py-4 bg-white/5 hover:bg-white/10 text-white rounded-[24px] text-xs font-black uppercase tracking-widest transition-all border border-white/5"
                >
                  Отмена
                </button>
                <button
                  onClick={handleCropSave}
                  className="flex-1 px-6 py-4 bg-lime-400 hover:bg-lime-300 text-black rounded-[24px] text-xs font-black uppercase tracking-widest transition-all shadow-xl shadow-lime-400/20"
                >
                  Применить
                </button>
              </div>
            </div>

            <p className="mt-8 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] animate-pulse">
              Перетащите для настройки
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAddMenu && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 safe-bottom">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddMenu(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="relative w-full max-w-md bg-white dark:bg-[#141414] rounded-t-[3rem] shadow-2xl overflow-hidden border-t border-black/5 dark:border-white/5 p-8 pb-12"
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">Добавить</h2>
                <button 
                  onClick={() => setShowAddMenu(false)}
                  className="p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-400"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => { setShowAddMenu(false); setShowCamera(true); }}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] active:scale-95 transition-all group"
                >
                  <div className="w-12 h-12 bg-lime-400 rounded-2xl flex items-center justify-center text-black shadow-lg shadow-lime-400/20 group-hover:scale-110 transition-transform">
                    <Camera size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Фото еды</span>
                </button>
                <button 
                  onClick={() => { setShowAddMenu(false); setShowAISearchModal(true); }}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] active:scale-95 transition-all group"
                >
                  <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                    <Search size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Поиск ИИ</span>
                </button>
                <button 
                  onClick={() => { setShowAddMenu(false); setShowScanner(true); }}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] active:scale-95 transition-all group"
                >
                  <div className="w-12 h-12 bg-purple-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-purple-500/20 group-hover:scale-110 transition-transform">
                    <Smartphone size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Сканер</span>
                </button>
                <button 
                  onClick={() => { setShowAddMenu(false); setShowManualAdd(true); }}
                  className="flex flex-col items-center gap-3 p-6 bg-gray-50 dark:bg-white/5 rounded-[2.5rem] active:scale-95 transition-all group"
                >
                  <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform">
                    <Plus size={24} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">Вручную</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <PostModal 
        post={selectedPost} 
        onClose={() => setSelectedPost(null)} 
      />

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 ios-blur border-t border-black/5 dark:border-white/5 safe-bottom">
        <div className="max-w-md mx-auto px-2 py-1 flex justify-between items-center h-16">
          <button 
            onClick={() => setActiveTab('today')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
              activeTab === 'today' ? "text-lime-500" : "text-gray-400 dark:text-gray-600"
            )}
          >
            <Utensils size={22} strokeWidth={activeTab === 'today' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Сегодня</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('history')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
              activeTab === 'history' ? "text-lime-500" : "text-gray-400 dark:text-gray-600"
            )}
          >
            <History size={22} strokeWidth={activeTab === 'history' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">История</span>
          </button>

          <div className="flex-1 flex justify-center -mt-8">
            <button 
              onClick={() => setShowAddMenu(true)}
              className="w-14 h-14 bg-lime-400 text-black rounded-full flex items-center justify-center shadow-lg shadow-lime-400/40 active:scale-90 transition-all border-4 border-[#F8F9FA] dark:border-[#0A0A0A]"
            >
              <Plus size={24} strokeWidth={3} />
            </button>
          </div>

          <button 
            onClick={() => setActiveTab('explore')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
              activeTab === 'explore' ? "text-lime-500" : "text-gray-400 dark:text-gray-600"
            )}
          >
            <Compass size={22} strokeWidth={activeTab === 'explore' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Обзор</span>
          </button>

          <button 
            onClick={() => setActiveTab('analytics')}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all",
              activeTab === 'analytics' ? "text-lime-500" : "text-gray-400 dark:text-gray-600"
            )}
          >
            <PieChart size={22} strokeWidth={activeTab === 'analytics' ? 2.5 : 2} />
            <span className="text-[10px] font-medium">Анализ</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
