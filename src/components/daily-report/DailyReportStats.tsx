import React from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2 } from 'lucide-react';

interface DailyReportStatsProps {
  totalCount: number;
  totalVolume: number;
  arrivedCount: number;
  kosongPabrikCount: number;
  warningCount: number;
  zeroStockCount: number;
  checkedCount: number;
  checkedFilter?: 'all' | 'checked' | 'unchecked';
  onToggleCheckedFilter?: () => void;
  isZeroStockFilterActive?: boolean;
  onToggleZeroStockFilter?: () => void;
}

export const DailyReportStats: React.FC<DailyReportStatsProps> = ({
  totalCount,
  totalVolume,
  arrivedCount,
  kosongPabrikCount,
  warningCount,
  zeroStockCount,
  checkedCount,
  checkedFilter = 'all',
  onToggleCheckedFilter,
  isZeroStockFilterActive = false,
  onToggleZeroStockFilter
}) => {
  const arrivedPercentage = totalCount > 0 ? Math.round((arrivedCount / totalCount) * 100) : 0;
  const checkedPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2 p-3 bg-theme-50/60 border-b border-theme-200 text-xs">
      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
        <span className="text-[10px] text-theme-500 font-bold uppercase tracking-wider">Total Item</span>
        <span className="text-base font-extrabold text-theme-900 mt-0.5">
          {totalCount} <span className="text-[11px] font-normal text-theme-500">baris</span>
        </span>
      </div>

      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
        <span className="text-[10px] text-theme-500 font-bold uppercase tracking-wider">Total Qty Sales</span>
        <span className="text-base font-extrabold text-theme-900 mt-0.5">
          {totalVolume.toLocaleString('id-ID')}
        </span>
      </div>

      {/* Crosscheck / Sudah Dicek Card */}
      <button
        type="button"
        onClick={onToggleCheckedFilter}
        className={cn(
          "p-2.5 rounded-xl border flex flex-col justify-center text-left transition-all cursor-pointer relative",
          checkedFilter !== 'all'
            ? "bg-teal-100 border-teal-400 ring-2 ring-teal-400/50 shadow-xs"
            : "bg-white border-theme-200 hover:border-teal-300 hover:bg-teal-50/40"
        )}
        title="Klik untuk memfilter status crosscheck (Semua / Belum Dicek / Sudah Dicek)"
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-teal-600" />
            Crosscheck
          </span>
          {checkedFilter !== 'all' && (
            <span className="text-[9px] bg-teal-700 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
              {checkedFilter === 'checked' ? 'Sudah Cek' : 'Belum Cek'}
            </span>
          )}
        </div>
        <span className="text-base font-extrabold text-teal-800 mt-0.5">
          {checkedCount}/{totalCount}{' '}
          <span className="text-[11px] font-semibold text-teal-600/90">({checkedPercentage}%)</span>
        </span>
      </button>

      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
        <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Sudah Datang</span>
        <span className="text-base font-extrabold text-emerald-700 mt-0.5">
          {arrivedCount}{' '}
          <span className="text-[11px] font-semibold text-emerald-600/80">({arrivedPercentage}%)</span>
        </span>
      </div>

      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Kosong Pabrik</span>
        <span className="text-base font-extrabold text-rose-700 mt-0.5">
          {kosongPabrikCount} <span className="text-[11px] font-normal text-rose-500">item</span>
        </span>
      </div>

      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Warning Stok</span>
        <span className="text-base font-extrabold text-amber-700 mt-0.5">
          {warningCount} <span className="text-[11px] font-normal text-amber-500">item</span>
        </span>
      </div>

      <button
        type="button"
        onClick={onToggleZeroStockFilter}
        className={cn(
          "p-2.5 rounded-xl border flex flex-col justify-center text-left transition-all cursor-pointer",
          isZeroStockFilterActive
            ? "bg-purple-100 border-purple-400 ring-2 ring-purple-400/50 shadow-xs"
            : "bg-white border-theme-200 hover:border-purple-300 hover:bg-purple-50/40"
        )}
        title={isZeroStockFilterActive ? "Klik untuk membatalkan filter stok kosong" : "Klik untuk memfilter daftar stok 0"}
      >
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Produk Stok 0</span>
          {isZeroStockFilterActive && (
            <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold leading-none">
              Filter
            </span>
          )}
        </div>
        <span className="text-base font-extrabold text-purple-700 mt-0.5">
          {zeroStockCount} <span className="text-[11px] font-normal text-purple-500">item</span>
        </span>
      </button>
    </div>
  );
};
