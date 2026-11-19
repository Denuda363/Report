import React, { useState } from 'react';
import { cn } from '../../lib/utils';
import { CheckCircle2, ChevronDown, ChevronUp } from 'lucide-react';

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
  const [isMobileExpanded, setIsMobileExpanded] = useState(false);
  const arrivedPercentage = totalCount > 0 ? Math.round((arrivedCount / totalCount) * 100) : 0;
  const checkedPercentage = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;

  return (
    <div className="bg-theme-50/50 border-b border-theme-200 text-xs">
      {/* Mobile Minimalist Compact Bar (< sm) */}
      <div className="sm:hidden px-3 py-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          <span className="font-bold text-theme-900 tabular-nums whitespace-nowrap">
            {totalCount} item
          </span>
          <span className="text-theme-300" aria-hidden="true">·</span>
          <span className="text-theme-700 font-semibold tabular-nums whitespace-nowrap">
            Qty {totalVolume.toLocaleString('id-ID')}
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {onToggleCheckedFilter && (
            <button
              type="button"
              onClick={onToggleCheckedFilter}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors tabular-nums flex items-center gap-1",
                checkedFilter !== 'all'
                  ? "bg-teal-600 text-white border-teal-600"
                  : "bg-white text-teal-700 border-teal-200"
              )}
              title="Filter status crosscheck"
            >
              <CheckCircle2 className="w-3 h-3 shrink-0" />
              <span>{checkedCount}/{totalCount}</span>
            </button>
          )}

          {onToggleZeroStockFilter && (
            <button
              type="button"
              onClick={onToggleZeroStockFilter}
              className={cn(
                "px-2 py-1 rounded-lg text-[11px] font-bold border transition-colors tabular-nums",
                isZeroStockFilterActive
                  ? "bg-purple-600 text-white border-purple-600"
                  : "bg-white text-purple-700 border-purple-200"
              )}
              title="Filter produk stok 0"
            >
              0: {zeroStockCount}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsMobileExpanded(prev => !prev)}
            className="p-1.5 rounded-lg bg-white border border-theme-200 text-theme-600 hover:text-theme-900 transition-colors"
            title={isMobileExpanded ? "Sembunyikan ringkasan" : "Lihat ringkasan lengkap"}
            aria-label={isMobileExpanded ? "Sembunyikan ringkasan" : "Lihat ringkasan lengkap"}
          >
            {isMobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Full Stats Grid: Always visible on sm+, expandable on mobile */}
      <div className={cn(
        "grid-cols-2 sm:grid-cols-12 xl:grid-cols-7 gap-2 p-2.5 sm:p-3",
        isMobileExpanded ? "grid pt-0.5" : "hidden sm:grid"
      )}>
        <div className="col-span-2 sm:col-span-3 xl:col-span-1 bg-white p-2 sm:p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
          <span className="text-[10px] text-theme-500 font-bold uppercase tracking-wider">Total Item</span>
          <span className="text-sm sm:text-base font-extrabold text-theme-900 mt-0.5 tabular-nums">
            {totalCount} <span className="text-[11px] font-normal text-theme-500">baris</span>
          </span>
        </div>

        <div className="col-span-1 sm:col-span-3 xl:col-span-1 bg-white p-2 sm:p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
          <span className="text-[10px] text-theme-500 font-bold uppercase tracking-wider">Total Qty Sales</span>
          <span className="text-sm sm:text-base font-extrabold text-theme-900 mt-0.5 tabular-nums">
            {totalVolume.toLocaleString('id-ID')}
          </span>
        </div>

        {/* Crosscheck / Sudah Dicek Card */}
        <button
          type="button"
          onClick={onToggleCheckedFilter}
          className={cn(
            "col-span-1 sm:col-span-3 xl:col-span-1 p-2 sm:p-2.5 rounded-xl border flex flex-col justify-center text-left transition-all cursor-pointer relative",
            checkedFilter !== 'all'
              ? "bg-teal-100 border-teal-400 ring-2 ring-teal-400/50 shadow-xs"
              : "bg-white border-theme-200 hover:border-teal-300 hover:bg-teal-50/40"
          )}
          title="Klik untuk memfilter status crosscheck (Semua / Belum Dicek / Sudah Dicek)"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-teal-700 font-bold uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-teal-600 shrink-0" />
              Crosscheck
            </span>
            {checkedFilter !== 'all' && (
              <span className="text-[9px] bg-teal-700 text-white px-1.5 py-0.5 rounded-full font-bold leading-none shrink-0">
                {checkedFilter === 'checked' ? 'Sudah Cek' : 'Belum Cek'}
              </span>
            )}
          </div>
          <span className="text-sm sm:text-base font-extrabold text-teal-800 mt-0.5 tabular-nums">
            {checkedCount}/{totalCount}{' '}
            <span className="text-[11px] font-semibold text-teal-600/90">({checkedPercentage}%)</span>
          </span>
        </button>

        <div className="col-span-1 sm:col-span-3 xl:col-span-1 bg-white p-2 sm:p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
          <span className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Sudah Datang</span>
          <span className="text-sm sm:text-base font-extrabold text-emerald-700 mt-0.5 tabular-nums">
            {arrivedCount}{' '}
            <span className="text-[11px] font-semibold text-emerald-600/80">({arrivedPercentage}%)</span>
          </span>
        </div>

        <div className="col-span-1 sm:col-span-4 xl:col-span-1 bg-white p-2 sm:p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
          <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Kosong Pabrik</span>
          <span className="text-sm sm:text-base font-extrabold text-rose-700 mt-0.5 tabular-nums">
            {kosongPabrikCount} <span className="text-[11px] font-normal text-rose-500">item</span>
          </span>
        </div>

        <div className="col-span-1 sm:col-span-4 xl:col-span-1 bg-white p-2 sm:p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center">
          <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Warning Stok</span>
          <span className="text-sm sm:text-base font-extrabold text-amber-700 mt-0.5 tabular-nums">
            {warningCount} <span className="text-[11px] font-normal text-amber-500">item</span>
          </span>
        </div>

        <button
          type="button"
          onClick={onToggleZeroStockFilter}
          className={cn(
            "col-span-1 sm:col-span-4 xl:col-span-1 p-2 sm:p-2.5 rounded-xl border flex flex-col justify-center text-left transition-all cursor-pointer",
            isZeroStockFilterActive
              ? "bg-purple-100 border-purple-400 ring-2 ring-purple-400/50 shadow-xs"
              : "bg-white border-theme-200 hover:border-purple-300 hover:bg-purple-50/40"
          )}
          title={isZeroStockFilterActive ? "Klik untuk membatalkan filter stok kosong" : "Klik untuk memfilter daftar stok 0"}
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10px] text-purple-600 font-bold uppercase tracking-wider">Produk Stok 0</span>
            {isZeroStockFilterActive && (
              <span className="text-[9px] bg-purple-600 text-white px-1.5 py-0.5 rounded-full font-bold leading-none shrink-0">
                Filter
              </span>
            )}
          </div>
          <span className="text-sm sm:text-base font-extrabold text-purple-700 mt-0.5 tabular-nums">
            {zeroStockCount} <span className="text-[11px] font-normal text-purple-500">item</span>
          </span>
        </button>
      </div>
    </div>
  );
};
