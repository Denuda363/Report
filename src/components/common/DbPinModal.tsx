import React, { useState, useEffect, useRef } from 'react';
import { Lock, Eye, EyeOff, ShieldAlert, X, ArrowRightLeft } from 'lucide-react';
import { verifyDatabasePin } from '../../lib/pinSecurity';

interface DbPinModalProps {
  isOpen: boolean;
  targetProviderName: string;
  storedPinHash?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export const DbPinModal: React.FC<DbPinModalProps> = ({
  isOpen,
  targetProviderName,
  storedPinHash,
  onSuccess,
  onCancel
}) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPin('');
      setShowPin(false);
      setError(null);
      setAttempts(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin.trim()) {
      setError('Masukkan PIN keamanan terlebih dahulu.');
      inputRef.current?.focus();
      return;
    }

    const result = verifyDatabasePin(pin, storedPinHash);
    if (result.valid) {
      setError(null);
      setPin('');
      onSuccess();
    } else {
      setAttempts((prev) => prev + 1);
      setError('PIN salah. Perpindahan database dibatalkan.');
      setPin('');
      inputRef.current?.focus();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[220] flex items-center justify-center bg-neutral-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md bg-white rounded-3xl border border-neutral-200/90 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-5 sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pb-3.5 mb-5 border-b border-neutral-200/80 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-theme-50 border border-theme-200/80 text-theme-700 flex items-center justify-center shrink-0">
              <Lock className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 leading-tight truncate">
                Verifikasi PIN Database
              </h3>
              <p className="text-xs font-medium text-neutral-500 mt-0.5 truncate">
                Otorisasi diperlukan sebelum berpindah sumber data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-neutral-500 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200 flex items-center gap-3">
            <ArrowRightLeft className="w-4 h-4 text-theme-600 shrink-0" />
            <div className="text-xs text-neutral-700 font-medium leading-relaxed">
              Target database baru: <strong className="font-semibold text-neutral-900">{targetProviderName}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Masukkan PIN Keamanan <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                type={showPin ? 'text' : 'password'}
                inputMode="numeric"
                autoComplete="off"
                maxLength={10}
                value={pin}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPin(val);
                  if (error) setError(null);
                }}
                placeholder="••••••"
                className={`w-full px-4 py-2.5 pr-11 text-center text-lg font-mono font-bold tracking-[0.35em] tabular-nums rounded-xl border bg-neutral-50 focus:bg-white outline-none transition-all ${
                  error
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900'
                    : 'border-neutral-300 focus:border-theme-500 focus:ring-2 focus:ring-theme-500 text-neutral-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
                tabIndex={-1}
                title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {error}
                  {attempts >= 3 ? ' Hubungi administrator jika lupa PIN.' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-semibold transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-theme-600 hover:bg-theme-700 active:scale-[0.99] text-white text-sm font-semibold transition-all shadow-sm whitespace-nowrap"
            >
              Verifikasi &amp; Pindah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
