import React from 'react';
import { format } from 'date-fns';
import { 
  Calendar as CalendarIcon, Edit2, Trash2, CheckSquare, Square, 
  PackageCheck, Factory, AlertCircle, Building2 
} from 'lucide-react';
import { ReportEntry, Product, Supplier } from '../../types';
import { cn } from '../../lib/utils';

interface DailyReportCardsProps {
  reports: ReportEntry[];
  products: Product[];
  suppliers: Supplier[];
  onEdit: (r: ReportEntry) => void;
  onDelete: (id: string) => void;
  onUpdateReport: (r: ReportEntry) => void;
  onUpdateProduct: (p: Product) => void;
  onKosongPabrikChange: (r: ReportEntry, checked: boolean) => void;
  className?: string;
}

export const DailyReportCards: React.FC<DailyReportCardsProps> = ({
  reports,
  products,
  suppliers,
  onEdit,
  onDelete,
  onUpdateReport,
  onUpdateProduct,
  onKosongPabrikChange,
  className
}) => {
  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3", className)}>
      {reports.map((r) => {
        const product = products.find((p) => p.id === r.productId);
        const supplier = product ? suppliers.find((s) => s.id === product.supplierId) : null;

        return (
          <div
            key={r.id}
            className={cn(
              "bg-white rounded-2xl border p-3.5 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between gap-3",
              r.isWarningStock
                ? "border-amber-300 bg-amber-50/20 hover:border-amber-400"
                : "border-theme-200 hover:border-theme-300"
            )}
          >
            {/* Top Row: Date, Supplier, Product, Qty */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 text-[11px] text-theme-500 font-medium mb-1">
                  <CalendarIcon className="w-3 h-3 text-theme-400 shrink-0" />
                  <span>{format(new Date(r.date), 'dd MMM yyyy')}</span>
                  {supplier && (
                    <>
                      <span>•</span>
                      <span className="truncate uppercase font-bold text-theme-600-text max-w-[130px]" title={supplier.name}>
                        {supplier.name}
                      </span>
                    </>
                  )}
                </div>
                <h4 className="font-bold text-sm sm:text-base text-theme-900 leading-snug break-words">
                  {product?.name || 'Unknown Product'}
                </h4>
              </div>
              <div className="text-right shrink-0">
                <span className="inline-flex items-center px-2.5 py-1 rounded-xl bg-neutral-900 text-white font-extrabold text-xs sm:text-sm shadow-xs">
                  {r.quantity}{' '}
                  <span className="ml-1 text-[10px] font-normal opacity-80">{product?.unit || 'pcs'}</span>
                </span>
              </div>
            </div>

            {/* Notes if any */}
            {r.notes && (
              <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200/80 rounded-xl px-2.5 py-1.5">
                <span className="font-semibold">Catatan:</span> {r.notes}
              </div>
            )}

            {/* Bottom Stock Inline Quick Update */}
            <div className="flex items-center justify-between bg-theme-50/70 p-2 rounded-xl border border-theme-200 text-xs">
              <span className="text-theme-600-text font-medium">Bottom Stock:</span>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  defaultValue={product?.bottomStock ?? ''}
                  onBlur={(e) => {
                    if (product) {
                      const val = e.target.value === '' ? undefined : Number(e.target.value);
                      if (val !== product.bottomStock) {
                        onUpdateProduct({ ...product, bottomStock: val });
                      }
                    }
                  }}
                  className="w-16 px-2 py-1 text-xs border border-theme-300 rounded-lg bg-white focus:ring-2 focus:ring-theme-500 outline-none text-center font-bold text-theme-900"
                  placeholder="0"
                />
                <span className="text-[11px] text-theme-500">{product?.unit || 'pcs'}</span>
              </div>
            </div>

            {/* Status Toggles Grid */}
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {/* Sudah Order */}
              <button
                type="button"
                onClick={() => onUpdateReport({ ...r, isOrdered: !r.isOrdered })}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95",
                  r.isOrdered
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                {r.isOrdered ? (
                  <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                )}
                <span className="truncate">Sudah Order</span>
              </button>

              {/* Sudah Datang */}
              <button
                type="button"
                onClick={() =>
                  onUpdateReport({
                    ...r,
                    isArrived: !r.isArrived,
                    arrivedAt: !r.isArrived ? Date.now() : r.arrivedAt
                  })
                }
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95",
                  r.isArrived
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <PackageCheck
                  className={cn('w-3.5 h-3.5 shrink-0', r.isArrived ? 'text-emerald-600' : 'text-neutral-400')}
                />
                <span className="truncate">Sudah Datang</span>
              </button>

              {/* Kosong Pabrik */}
              <button
                type="button"
                onClick={() => onKosongPabrikChange(r, !r.isKosongPabrik)}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95",
                  r.isKosongPabrik
                    ? "bg-rose-50 border-rose-200 text-rose-700 font-bold shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <Factory
                  className={cn('w-3.5 h-3.5 shrink-0', r.isKosongPabrik ? 'text-rose-600' : 'text-neutral-400')}
                />
                <span className="truncate">Kosong Pabrik</span>
              </button>

              {/* Warning Stok */}
              <button
                type="button"
                onClick={() => onUpdateReport({ ...r, isWarningStock: !r.isWarningStock })}
                className={cn(
                  "flex items-center justify-center gap-1.5 py-2 px-2 rounded-xl text-xs font-semibold border transition-all active:scale-95",
                  r.isWarningStock
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-bold shadow-2xs"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <AlertCircle
                  className={cn('w-3.5 h-3.5 shrink-0', r.isWarningStock ? 'text-amber-600' : 'text-neutral-400')}
                />
                <span className="truncate">Warning Stok</span>
              </button>
            </div>

            {/* Order Ulang Section */}
            {r.isArrived && (
              <div className="bg-amber-50/60 p-2.5 rounded-xl border border-amber-200 flex flex-col gap-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={!!r.isReorder}
                    onChange={(e) => onUpdateReport({ ...r, isReorder: e.target.checked })}
                    className="w-4 h-4 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Minta Order Ulang (Reorder)</span>
                </label>
                {r.isReorder && (
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      min="1"
                      value={r.reorderQty || ''}
                      onChange={(e) => onUpdateReport({ ...r, reorderQty: parseInt(e.target.value) || 0 })}
                      className="w-20 px-2 py-1 text-xs border border-amber-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-center font-bold"
                      placeholder="Qty"
                    />
                    <input
                      type="text"
                      value={r.reorderReason || ''}
                      onChange={(e) => onUpdateReport({ ...r, reorderReason: e.target.value })}
                      className="flex-1 px-2 py-1 text-xs border border-amber-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                      placeholder="Alasan order ulang..."
                    />
                  </div>
                )}
              </div>
            )}

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-theme-100">
              <button
                type="button"
                onClick={() => onEdit(r)}
                className="flex-1 sm:flex-none min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Edit2 className="w-3.5 h-3.5 text-neutral-500" />
                <span>Edit</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus catatan laporan untuk ${product?.name || 'item ini'}?`)) {
                    onDelete(r.id);
                  }
                }}
                className="flex-1 sm:flex-none min-h-[40px] px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
