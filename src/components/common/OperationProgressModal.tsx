import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Save, FileSpreadsheet, Copy, Clock, CheckCircle2, Sparkles, Database } from 'lucide-react';

export interface OperationProgressModalProps {
  isOpen: boolean;
  type?: 'save' | 'import' | 'copy';
  title: string;
  subtitle?: string;
  current: number;
  total: number;
  currentItemName?: string;
  startTime?: number;
}

export const OperationProgressModal: React.FC<OperationProgressModalProps> = ({
  isOpen,
  type = 'save',
  title,
  subtitle,
  current,
  total,
  currentItemName,
  startTime
}) => {
  const [now, setNow] = useState(Date.now());

  // Tick timer every 500ms to update the countdown smoothly
  useEffect(() => {
    if (!isOpen) return;
    setNow(Date.now());
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 500);
    return () => clearInterval(interval);
  }, [isOpen]);

  if (!isOpen) return null;

  const validTotal = Math.max(1, total);
  const safeCurrent = Math.min(validTotal, Math.max(0, current));
  const percentage = Math.min(100, Math.max(0, Math.round((safeCurrent / validTotal) * 100)));

  // Calculate remaining time
  const getRemainingTimeText = () => {
    if (!startTime || safeCurrent === 0) {
      return 'Menghitung estimasi waktu...';
    }

    if (safeCurrent >= validTotal) {
      return 'Menyelesaikan proses...';
    }

    const elapsedMs = Math.max(100, now - startTime);
    const msPerItem = elapsedMs / safeCurrent;
    const remainingItems = validTotal - safeCurrent;
    const remainingSeconds = Math.max(1, Math.round((remainingItems * msPerItem) / 1000));

    if (remainingSeconds >= 60) {
      const minutes = Math.floor(remainingSeconds / 60);
      const seconds = remainingSeconds % 60;
      if (seconds === 0) {
        return `${minutes} menit lagi`;
      }
      return `${minutes} menit ${seconds} detik lagi`;
    }

    return `${remainingSeconds} detik lagi`;
  };

  // Theme configuration based on operation type
  const themeConfig = {
    save: {
      barColor: 'bg-emerald-500',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
      borderColor: 'border-emerald-200',
      glowColor: 'bg-emerald-400',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      Icon: Save
    },
    import: {
      barColor: 'bg-indigo-600',
      bgColor: 'bg-indigo-50',
      textColor: 'text-indigo-600',
      borderColor: 'border-indigo-200',
      glowColor: 'bg-indigo-400',
      badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      Icon: FileSpreadsheet
    },
    copy: {
      barColor: 'bg-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      borderColor: 'border-blue-200',
      glowColor: 'bg-blue-400',
      badgeBg: 'bg-blue-50 text-blue-700 border-blue-200',
      Icon: Copy
    }
  }[type];

  const { Icon } = themeConfig;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-neutral-900/65 backdrop-blur-md"
      >
        <motion.div
          initial={{ scale: 0.92, y: 15, opacity: 0 }}
          animate={{ scale: 1, y: 0, opacity: 1 }}
          exit={{ scale: 0.92, y: 15, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 w-full max-w-sm flex flex-col items-center justify-center text-center overflow-hidden relative border border-neutral-100"
        >
          {/* Top Progress Indicator Bar */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-neutral-100 overflow-hidden">
            <motion.div
              className={`h-full ${themeConfig.barColor}`}
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
            />
          </div>

          {/* Animated Central Icon */}
          <div className="relative mb-4 mt-1">
            <motion.div
              animate={{
                scale: [1, 1.15, 1],
                opacity: [0.35, 0.65, 0.35]
              }}
              transition={{ repeat: Infinity, duration: 2.2, ease: 'easeInOut' }}
              className={`absolute inset-0 rounded-full blur-xl scale-150 ${themeConfig.glowColor}`}
            />
            <motion.div
              animate={
                type === 'copy'
                  ? { rotate: 360 }
                  : type === 'import'
                  ? { y: [0, -4, 0] }
                  : { scale: [1, 1.05, 1] }
              }
              transition={
                type === 'copy'
                  ? { repeat: Infinity, duration: 4.5, ease: 'linear' }
                  : { repeat: Infinity, duration: 2, ease: 'easeInOut' }
              }
              className={`w-16 h-16 ${themeConfig.bgColor} ${themeConfig.textColor} rounded-2xl flex items-center justify-center shadow-sm relative z-10 border ${themeConfig.borderColor}`}
            >
              <Icon className="w-8 h-8" />
            </motion.div>
          </div>

          {/* Title & Subtitle */}
          <h3 className="font-bold text-xl text-neutral-900 mb-1 tracking-tight">{title}</h3>
          <p className="text-xs text-neutral-500 mb-4 max-w-[260px] truncate">
            {currentItemName ? (
              <span className="font-medium text-neutral-700">
                Memproses: <span className="text-neutral-900 font-semibold">{currentItemName}</span>
              </span>
            ) : (
              subtitle || 'Mohon tunggu, proses sedang berlangsung...'
            )}
          </p>

          {/* Large Percentage Badge */}
          <div className="mb-4">
            <span className={`text-4xl font-extrabold tracking-tight ${themeConfig.textColor}`}>
              {percentage}%
            </span>
          </div>

          {/* Main Progress Bar */}
          <div className="w-full bg-neutral-100 rounded-full h-3 mb-3 overflow-hidden p-0.5 border border-neutral-200/60 shadow-inner">
            <motion.div
              className={`h-full rounded-full ${themeConfig.barColor}`}
              initial={{ width: '0%' }}
              animate={{ width: `${percentage}%` }}
              transition={{ ease: 'easeOut', duration: 0.25 }}
            />
          </div>

          {/* Remaining Time & Item Count */}
          <div className="flex items-center justify-between w-full text-xs font-medium text-neutral-500 mb-4">
            <span className="text-neutral-600 font-semibold">
              {safeCurrent} <span className="font-normal text-neutral-400">/</span> {total} data
            </span>
            <span className="text-neutral-500 text-[11px]">
              {percentage === 100 ? 'Selesai' : `${total - safeCurrent} tersisa`}
            </span>
          </div>

          {/* Estimated Time Badge */}
          <div
            className={`w-full py-2 px-3 rounded-2xl border flex items-center justify-center gap-2 text-xs font-semibold ${themeConfig.badgeBg}`}
          >
            <Clock className="w-3.5 h-3.5 shrink-0 animate-spin" style={{ animationDuration: '3s' }} />
            <span>Sisa waktu: {getRemainingTimeText()}</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
