import React from 'react';

interface DailyReportStatsProps {
  totalCount: number;
  totalVolume: number;
  arrivedCount: number;
  kosongPabrikCount: number;
  warningCount: number;
}

export const DailyReportStats: React.FC<DailyReportStatsProps> = ({
  totalCount,
  totalVolume,
  arrivedCount,
  kosongPabrikCount,
  warningCount
}) => {
  const arrivedPercentage = totalCount > 0 ? Math.round((arrivedCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 p-3 bg-theme-50/60 border-b border-theme-200 text-xs">
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

      <div className="bg-white p-2.5 rounded-xl border border-theme-200 flex flex-col justify-center col-span-2 sm:col-span-1">
        <span className="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Warning Stok</span>
        <span className="text-base font-extrabold text-amber-700 mt-0.5">
          {warningCount} <span className="text-[11px] font-normal text-amber-500">item</span>
        </span>
      </div>
    </div>
  );
};
