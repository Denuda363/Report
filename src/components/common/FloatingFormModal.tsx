import React, { useEffect } from 'react';
import { Maximize2, Minimize2, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface FloatingFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
  disableEscapeClose?: boolean;
  maxWidthClass?: string;
  children: React.ReactNode;
}

export const FloatingFormModal: React.FC<FloatingFormModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  isFullscreen = false,
  onToggleFullscreen,
  disableEscapeClose = false,
  maxWidthClass = 'max-w-lg',
  children,
}) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !disableEscapeClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, disableEscapeClose, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-5 bg-neutral-950/55 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "bg-white border border-neutral-200/90 shadow-2xl overflow-y-auto animate-in zoom-in-95 duration-200 flex flex-col",
          isFullscreen
            ? "w-full h-full p-5 sm:p-6 md:p-8 rounded-none sm:rounded-3xl"
            : cn("w-full max-h-[90vh] rounded-3xl p-5 sm:p-6", maxWidthClass)
        )}
      >
        {/* Clean Header */}
        <div className="flex items-center justify-between gap-3 pb-3.5 mb-5 border-b border-neutral-200/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-theme-50 border border-theme-200/80 flex items-center justify-center text-theme-700 shrink-0">
              {icon}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-neutral-500 font-medium truncate mt-0.5">
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {onToggleFullscreen && (
              <button
                type="button"
                onClick={onToggleFullscreen}
                className="p-2 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors"
                title={isFullscreen ? 'Perkecil Modal' : 'Perbesar Layar Penuh'}
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
              title="Tutup Form Input"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
};
