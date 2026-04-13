import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-white dark:bg-[#0A0A0A] flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[32px] flex items-center justify-center mx-auto text-red-500">
              <AlertTriangle size={48} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Упс! Что-то пошло не так</h1>
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                Произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
              </p>
            </div>

            {this.state.error && (
              <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-2xl text-left overflow-auto max-h-32">
                <code className="text-[10px] font-mono text-gray-400 dark:text-gray-500">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <div className="flex flex-col gap-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-lime-400 text-black rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-lime-300 transition-all active:scale-95 shadow-lg shadow-lime-400/20"
              >
                <RefreshCw size={18} />
                Перезагрузить приложение
              </button>
              
              <button
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-gray-200 dark:hover:bg-white/10 transition-all active:scale-95"
              >
                <Home size={18} />
                На главную
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
