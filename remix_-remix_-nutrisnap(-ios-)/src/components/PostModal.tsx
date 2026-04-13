import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Clock, User, Calendar, Tag } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import { Post } from '../types';

interface PostModalProps {
  post: Post | null;
  onClose: () => void;
}

export function PostModal({ post, onClose }: PostModalProps) {
  if (!post) return null;

  const categoryLabels: Record<string, string> = {
    nutrition: 'Питание',
    training: 'Тренировки',
    lifestyle: 'Образ жизни',
    health: 'Здоровье',
    tips: 'Советы',
    fitness: 'Фитнес'
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl"
        />
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          className="relative w-full h-full sm:h-auto sm:max-h-[90vh] sm:max-w-3xl bg-white dark:bg-[#0A0A0A] sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col"
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-6 right-6 z-10 p-3 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-full transition-all backdrop-blur-md group"
          >
            <X className="w-6 h-6 text-gray-900 dark:text-white group-hover:rotate-90 transition-transform duration-300" />
          </button>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {/* Hero Image */}
            {post.imageUrl && (
              <div className="relative w-full h-[40vh] sm:h-[50vh] overflow-hidden">
                <img 
                  src={post.imageUrl} 
                  alt={post.title}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://picsum.photos/seed/${post.id}/1200/800`;
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#0A0A0A] via-transparent to-transparent opacity-60" />
              </div>
            )}

            <div className="px-6 sm:px-16 py-12 max-w-2xl mx-auto">
              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 mb-8">
                <span className="px-3 py-1 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                  {categoryLabels[post.category] || post.category}
                </span>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <Clock className="w-3 h-3" />
                  {post.readTime}
                </div>
                <div className="flex items-center gap-2 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                  <Calendar className="w-3 h-3" />
                  {post.date}
                </div>
              </div>

              {/* Title */}
              <h1 className="font-serif text-4xl sm:text-6xl font-medium text-gray-900 dark:text-white leading-[1.1] mb-10 tracking-tight">
                {post.title}
              </h1>

              {/* Author */}
              <div className="flex items-center gap-4 mb-12 py-6 border-y border-black/5 dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 dark:text-gray-500 border border-black/5 dark:border-white/5 overflow-hidden">
                  <User className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-900 dark:text-white">{post.author}</p>
                  <p className="text-[10px] font-medium text-gray-500 dark:text-gray-400">Автор статьи</p>
                </div>
              </div>

              {/* Body */}
              <div className="font-serif text-xl sm:text-2xl text-gray-700 dark:text-gray-300 leading-relaxed">
                <div className="markdown-content">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkBreaks]}
                    components={{
                      h1: ({ children }) => <h1 className="text-3xl sm:text-4xl font-medium text-gray-900 dark:text-white mt-12 mb-6">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-2xl sm:text-3xl font-medium text-gray-900 dark:text-white mt-10 mb-4">{children}</h2>,
                      p: ({ children }) => <p className="mb-8">{children}</p>,
                      ul: ({ children }) => <ul className="space-y-4 my-8 list-none">{children}</ul>,
                      ol: ({ children }) => <ol className="space-y-4 my-8 list-none">{children}</ol>,
                      li: ({ children }) => (
                        <li className="flex items-start gap-4">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-700 mt-3 shrink-0" />
                          <div className="flex-1 text-gray-700 dark:text-gray-300">{children}</div>
                        </li>
                      ),
                      strong: ({ children }) => <strong className="font-black text-gray-900 dark:text-white">{children}</strong>,
                      em: ({ children }) => <em className="italic">{children}</em>,
                    }}
                  >
                    {post.fullContent}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-20 pt-12 border-t border-black/5 dark:border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400 dark:text-gray-600 mb-8">Конец статьи</p>
                <button 
                  onClick={onClose}
                  className="px-8 py-4 bg-gray-900 dark:bg-white text-white dark:text-black text-[10px] font-black uppercase tracking-widest rounded-full hover:scale-105 transition-transform active:scale-95"
                >
                  Вернуться к списку
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
