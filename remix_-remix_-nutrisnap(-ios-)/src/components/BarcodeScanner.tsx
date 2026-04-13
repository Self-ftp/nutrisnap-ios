import React, { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, Result } from '@zxing/library';
import { X, Camera, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  onClose: () => void;
}

export const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onScan, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const codeReader = useRef(new BrowserMultiFormatReader());

  useEffect(() => {
    let isMounted = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await codeReader.current.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
          throw new Error('Камера не найдена');
        }

        // Prefer back camera
        const selectedDeviceId = videoInputDevices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('rear')
        )?.deviceId || videoInputDevices[0].deviceId;

        if (isMounted) {
          codeReader.current.decodeFromVideoDevice(
            selectedDeviceId,
            videoRef.current!,
            (result: Result | null, err: any) => {
              if (result && isMounted) {
                onScan(result.getText());
                codeReader.current.reset();
                onClose();
              }
            }
          );
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error('Scanner error:', err);
        if (isMounted) {
          setError(err.message || 'Ошибка доступа к камере');
          setIsLoading(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      codeReader.current.reset();
    };
  }, [onScan, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center p-6"
    >
      <div className="absolute top-6 right-6 z-10">
        <button
          onClick={onClose}
          className="p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X size={24} />
        </button>
      </div>

      <div className="relative w-full max-w-md aspect-[3/4] bg-gray-900 rounded-[40px] overflow-hidden shadow-2xl border border-white/10">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white">
            <Loader2 size={48} className="animate-spin text-lime-400" />
            <p className="font-bold uppercase tracking-widest text-xs">Запуск камеры...</p>
          </div>
        )}

        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 text-white p-8 text-center">
            <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500">
              <Camera size={32} />
            </div>
            <p className="font-bold text-lg">{error}</p>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs"
            >
              Закрыть
            </button>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-cover"
        />

        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-[40px] border-black/40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border-2 border-lime-400/50 rounded-3xl">
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-lime-400 rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-lime-400 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-lime-400 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-lime-400 rounded-br-xl" />
            
            {/* Scanning animation line */}
            <motion.div
              animate={{ top: ['0%', '100%'] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="absolute left-0 right-0 h-0.5 bg-lime-400 shadow-[0_0_15px_rgba(163,230,53,0.8)] z-10"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 text-center space-y-2">
        <p className="text-white font-bold text-lg">Сканирование штрих-кода</p>
        <p className="text-gray-400 text-sm">Наведите камеру на штрих-код продукта</p>
      </div>
    </motion.div>
  );
};
