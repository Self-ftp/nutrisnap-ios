import React, { useState, useMemo, useCallback, memo, useDeferredValue, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Search, Clock, Utensils, ChevronRight, X, Save, Trash2, ChefHat, CookingPot, Flame as Fire, Upload } from 'lucide-react';
import { List } from 'react-window';
import { Recipe, RecipeCategory } from '../types';
import { RECIPES as INITIAL_RECIPES, RECIPES_VERSION } from '../constants';
import { cn } from '../utils';

interface RecipesProps {
  userRecipes: Recipe[];
  onAddRecipe: (recipe: Recipe) => void;
  onDeleteRecipe: (id: string) => void;
}

const RecipeCard = memo(({ 
  recipe, 
  onClick, 
  categoryLabel 
}: { 
  recipe: Recipe; 
  onClick: () => void; 
  categoryLabel?: string 
}) => (
  <motion.div
    layout
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    onClick={onClick}
    className="group relative bg-white dark:bg-white/5 rounded-[2rem] border border-black/5 dark:border-white/5 overflow-hidden cursor-pointer hover:shadow-xl transition-all h-full"
  >
    <div className="aspect-[4/3] relative overflow-hidden bg-gray-100 dark:bg-white/5 flex items-center justify-center">
      <img
        src={recipe.imageUrl || 'https://images.unsplash.com/photo-1495195134817-a1a280e01170?w=600&q=80'}
        alt={recipe.name}
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        onError={(e) => {
          e.currentTarget.style.display = 'none';
          e.currentTarget.nextElementSibling?.classList.remove('hidden');
          e.currentTarget.nextElementSibling?.classList.add('flex');
        }}
      />
      <div className="hidden w-full h-full items-center justify-center text-4xl">
        <Utensils size={48} className="text-gray-300 dark:text-gray-700" />
      </div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      <div className="absolute bottom-4 left-4 right-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-0.5 bg-lime-400 text-black text-[8px] font-black uppercase tracking-widest rounded-full">
            {categoryLabel}
          </span>
          <span className="flex items-center gap-1 text-white/80 text-[10px] font-bold">
            <Clock size={10} />
            {recipe.prepTime} мин
          </span>
        </div>
        <h3 className="text-white font-black uppercase tracking-tight leading-tight">{recipe.name}</h3>
      </div>
    </div>
    <div className="p-4 flex items-center justify-between">
      <div className="flex gap-3">
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Ккал</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{recipe.calories}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[8px] font-black uppercase tracking-widest text-gray-400">Белки</span>
          <span className="text-xs font-bold text-gray-900 dark:text-white">{recipe.protein}г</span>
        </div>
      </div>
      <ChevronRight size={18} className="text-gray-300 group-hover:text-lime-400 transition-colors" />
    </div>
  </motion.div>
));

RecipeCard.displayName = 'RecipeCard';

export function Recipes({ userRecipes, onAddRecipe, onDeleteRecipe }: RecipesProps) {
  const [activeCategory, setActiveCategory] = useState<RecipeCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);
  const [recipeImageUrl, setRecipeImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setRecipeImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  useEffect(() => {
    if (!showAddModal) {
      setRecipeImageUrl('');
    }
  }, [showAddModal]);

  const allRecipes = useMemo(() => [...INITIAL_RECIPES, ...userRecipes], [userRecipes]);

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter(recipe => {
      const matchesCategory = activeCategory === 'all' || recipe.category === activeCategory;
      const matchesSearch = recipe.name.toLowerCase().includes(deferredSearchQuery.toLowerCase()) ||
                           recipe.ingredients.some(i => i.toLowerCase().includes(deferredSearchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [allRecipes, activeCategory, deferredSearchQuery]);

  const categories: { id: RecipeCategory | 'all'; label: string; icon: React.ReactNode }[] = useMemo(() => [
    { id: 'all', label: 'Все', icon: <ChefHat size={16} /> },
    { id: 'oven', label: 'Духовка', icon: <Fire size={16} /> },
    { id: 'multicooker', label: 'Мультиварка', icon: <CookingPot size={16} /> },
    { id: 'pan', label: 'Сковородка', icon: <Utensils size={16} /> },
  ], []);

  const handleAddRecipe = useCallback((recipe: Recipe) => {
    onAddRecipe(recipe);
    setShowAddModal(false);
  }, [onAddRecipe]);

  const handleDeleteRecipe = useCallback((id: string) => {
    onDeleteRecipe(id);
    setSelectedRecipe(null);
  }, [onDeleteRecipe]);

  // Virtualization logic
  const [columnCount, setColumnCount] = useState(1);
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        setContainerWidth(width);
        setColumnCount(width > 640 ? 2 : 1);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const rows = useMemo(() => {
    const r = [];
    for (let i = 0; i < filteredRecipes.length; i += columnCount) {
      r.push(filteredRecipes.slice(i, i + columnCount));
    }
    return r;
  }, [filteredRecipes, columnCount]);

  const Row = useCallback(({ index, style, ariaAttributes }: { index: number; style: React.CSSProperties; ariaAttributes: any }) => {
    const rowItems = rows[index];
    if (!rowItems) return null;
    return (
      <div 
        style={{ ...style, display: 'flex', gap: '1rem', paddingBottom: '1rem' }}
        {...ariaAttributes}
      >
        {rowItems.map((recipe) => (
          <div key={recipe.id} style={{ flex: 1 }}>
            <RecipeCard
              recipe={recipe}
              onClick={() => setSelectedRecipe(recipe)}
              categoryLabel={categories.find(c => c.id === recipe.category)?.label}
            />
          </div>
        ))}
        {rowItems.length < columnCount && <div style={{ flex: 1 }} />}
      </div>
    );
  }, [rows, categories, columnCount]);

  return (
    <div className="space-y-6" ref={containerRef}>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black uppercase tracking-tighter text-gray-900 dark:text-white flex items-center gap-2">
            Рецепты
          </h2>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3 bg-lime-400 text-black rounded-2xl hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20 font-black uppercase tracking-widest text-xs"
          >
            <Plus size={18} />
            Добавить рецепт
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Поиск рецептов или ингредиентов..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-white dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-3xl focus:outline-none focus:ring-2 focus:ring-lime-400/20 focus:border-lime-400 transition-all font-bold text-gray-900 dark:text-white"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border",
                activeCategory === cat.id
                  ? "bg-lime-400 text-black border-lime-400 shadow-lg shadow-lime-400/20"
                  : "bg-white dark:bg-white/5 text-gray-500 dark:text-gray-400 border-black/5 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/10"
              )}
            >
              {cat.icon}
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div className="h-[600px]">
        {filteredRecipes.length > 0 ? (
          <List<any>
            rowCount={rows.length}
            rowHeight={320}
            className="no-scrollbar"
            style={{ height: 600, width: containerWidth || '100%' }}
            rowComponent={Row}
            rowProps={{}}
          />
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-3xl flex items-center justify-center mx-auto mb-4">
              <Search size={24} className="text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-bold">Рецептов не найдено</p>
          </div>
        )}
      </div>

      {/* Recipe Detail Modal */}
      <AnimatePresence>
        {selectedRecipe && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedRecipe(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-[#141414] rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="relative h-64 shrink-0 bg-gray-100 dark:bg-white/5 flex items-center justify-center">
                <img
                  src={selectedRecipe.imageUrl || 'https://images.unsplash.com/photo-1495195134817-a1a280e01170?w=600&q=80'}
                  alt={selectedRecipe.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    e.currentTarget.nextElementSibling?.classList.add('flex');
                  }}
                />
                <div className="hidden w-full h-full items-center justify-center text-6xl">
                  <Utensils size={64} className="text-gray-300 dark:text-gray-700" />
                </div>
                <button
                  onClick={() => setSelectedRecipe(null)}
                  className="absolute top-6 right-6 p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md text-white rounded-full transition-all z-10"
                >
                  <X size={20} />
                </button>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-8">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="px-3 py-1 bg-lime-400 text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                      {categories.find(c => c.id === selectedRecipe.category)?.label}
                    </span>
                    <span className="flex items-center gap-1.5 text-white font-bold text-xs">
                      <Clock size={14} />
                      {selectedRecipe.prepTime} минут
                    </span>
                  </div>
                  <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{selectedRecipe.name}</h2>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: 'Ккал', value: selectedRecipe.calories, color: 'text-orange-500' },
                    { label: 'Белки', value: `${selectedRecipe.protein}г`, color: 'text-blue-500' },
                    { label: 'Жиры', value: `${selectedRecipe.fat}г`, color: 'text-yellow-500' },
                    { label: 'Углеводы', value: `${selectedRecipe.carbs}г`, color: 'text-green-500' },
                  ].map((stat) => (
                    <div key={stat.label} className="p-4 bg-gray-50 dark:bg-white/5 rounded-3xl text-center">
                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                      <p className={cn("text-sm font-black", stat.color)}>{stat.value}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <Utensils size={14} /> Ингредиенты
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {selectedRecipe.ingredients.map((ing, i) => (
                      <li key={i} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-white/5 rounded-2xl text-sm font-bold text-gray-700 dark:text-gray-300">
                        <div className="w-1.5 h-1.5 rounded-full bg-lime-400" />
                        {ing}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                    <ChefHat size={14} /> Инструкции
                  </h4>
                  <div className="space-y-4">
                    {selectedRecipe.instructions.map((step, i) => (
                      <div key={i} className="flex gap-4">
                        <div className="w-8 h-8 rounded-xl bg-lime-400/10 text-lime-600 dark:text-lime-400 flex items-center justify-center font-black text-xs shrink-0">
                          {i + 1}
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-gray-600 dark:text-gray-400 pt-1">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {userRecipes.some(r => r.id === selectedRecipe.id) && (
                  <button
                    onClick={() => handleDeleteRecipe(selectedRecipe.id)}
                    className="w-full py-4 bg-red-500/10 text-red-500 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-red-500/20 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={16} />
                    Удалить рецепт
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add Recipe Modal */}
      <AnimatePresence>
        {showAddModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-xl bg-white dark:bg-[#141414] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-8 border-b border-black/5 dark:border-white/5 flex items-center justify-between shrink-0">
                <h2 className="text-xl font-black uppercase tracking-tighter text-gray-900 dark:text-white">Новый рецепт</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const newRecipe: Recipe = {
                    id: Date.now().toString(),
                    name: formData.get('name') as string,
                    category: formData.get('category') as RecipeCategory,
                    ingredients: (formData.get('ingredients') as string).split('\n').filter(i => i.trim()),
                    instructions: (formData.get('instructions') as string).split('\n').filter(i => i.trim()),
                    prepTime: parseInt(formData.get('prepTime') as string),
                    calories: parseInt(formData.get('calories') as string),
                    protein: parseInt(formData.get('protein') as string),
                    carbs: parseInt(formData.get('carbs') as string),
                    fat: parseInt(formData.get('fat') as string),
                    imageUrl: formData.get('imageUrl') as string || undefined,
                  };
                  handleAddRecipe(newRecipe);
                }}
                className="flex-1 overflow-y-auto p-8 space-y-6 no-scrollbar"
              >
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Название</label>
                  <input name="name" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Категория</label>
                    <select name="category" className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white">
                      <option value="oven">Духовка</option>
                      <option value="multicooker">Мультиварка</option>
                      <option value="pan">Сковородка</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Время (мин)</label>
                    <input name="prepTime" type="number" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ингредиенты (каждый с новой строки)</label>
                  <textarea name="ingredients" required rows={4} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white resize-none" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Инструкции (каждый шаг с новой строки)</label>
                  <textarea name="instructions" required rows={4} className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white resize-none" />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Ккал</label>
                    <input name="calories" type="number" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Белки</label>
                    <input name="protein" type="number" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Жиры</label>
                    <input name="fat" type="number" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Углеводы</label>
                    <input name="carbs" type="number" required className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Фото рецепта</label>
                  <div className="flex gap-4 items-start">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-24 h-24 bg-gray-50 dark:bg-white/5 border-2 border-dashed border-black/10 dark:border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-lime-400/50 transition-all overflow-hidden group shrink-0"
                    >
                      {recipeImageUrl ? (
                        <img src={recipeImageUrl} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <Upload size={20} className="text-gray-400 group-hover:text-lime-400 transition-colors" />
                          <span className="text-[8px] font-bold text-gray-400 mt-1">Загрузить</span>
                        </>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <input 
                        name="imageUrl" 
                        placeholder="Или вставьте ссылку на фото..."
                        value={recipeImageUrl}
                        onChange={(e) => setRecipeImageUrl(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-2xl font-bold text-gray-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-lime-400/20 transition-all" 
                      />
                      <p className="text-[9px] text-gray-400 italic">Вы можете загрузить файл из галереи или вставить прямую ссылку на изображение</p>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleImageUpload} 
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-lime-300 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Сохранить рецепт
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
