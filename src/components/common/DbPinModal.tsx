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
        className="w-full max-w-md bg-white rounded-[2rem] border border-theme-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 pb-4 border-b border-neutral-100 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-theme-100 border border-theme-200 text-theme-700 flex items-center justify-center shrink-0 shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-black text-theme-900 tracking-tight">
                Verifikasi PIN Database
              </h3>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">
                Otorisasi diperlukan sebelum berpindah sumber data
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
            title="Tutup"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="p-3.5 rounded-2xl bg-theme-50/70 border border-theme-200/80 flex items-center gap-3">
            <ArrowRightLeft className="w-4 h-4 text-theme-600 shrink-0" />
            <div className="text-xs text-theme-900 font-medium leading-relaxed">
              Target database baru: <strong className="font-bold text-theme-950">{targetProviderName}</strong>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 mb-2">
              Masukkan PIN Keamanan
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
                className={`w-full px-4 py-3 pr-11 text-center text-lg font-black tracking-[0.35em] rounded-2xl border-2 bg-neutral-50 focus:bg-white outline-none transition-all ${
                  error
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 text-rose-900'
                    : 'border-neutral-200 focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 text-neutral-900'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors"
                tabIndex={-1}
                title={showPin ? 'Sembunyikan PIN' : 'Lihat PIN'}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="mt-2.5 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                <span>
                  {error}
                  {attempts >= 3 ? ' Hubungi administrator jika lupa PIN.' : ''}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3 pt-1">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 rounded-xl bg-theme-600 hover:bg-theme-700 active:scale-[0.98] text-white text-xs font-bold transition-all shadow-sm"
            >
              Verifikasi & Pindah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
