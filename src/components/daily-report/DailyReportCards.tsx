import React from 'react';
import { format } from 'date-fns';
import { 
  Edit2, Trash2, CheckSquare, Square, 
  PackageCheck, Factory, AlertCircle, CheckCircle2 
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
    <div className={cn("grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3", className)}>
      {reports.map((r) => {
        const product = products.find((p) => p.id === r.productId);
        const supplier = product ? suppliers.find((s) => s.id === product.supplierId) : null;

        return (
          <div
            key={r.id}
            className={cn(
              "bg-white rounded-2xl border p-3 sm:p-4 shadow-2xs transition-all duration-200 flex flex-col justify-between gap-2 sm:gap-2.5 relative",
              r.isWarningStock && "border-amber-300 bg-amber-50/20 hover:border-amber-400",
              r.isChecked && "border-emerald-400 bg-emerald-50/25 hover:border-emerald-500 shadow-xs",
              !r.isWarningStock && !r.isChecked && "border-theme-200 hover:border-theme-300"
            )}
          >
            {/* Top Row: Product Title + Unboxed Metadata | Qty & Quick Crosscheck */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-[13px] sm:text-base text-theme-900 leading-snug break-words">
                  {product?.name || 'Unknown Product'}
                </h4>
                <div className="flex items-center flex-wrap gap-x-1.5 gap-y-0.5 text-[11px] text-theme-500 font-medium mt-0.5">
                  <span className="tabular-nums">
                    {(() => {
                      const d = r.date ? new Date(r.date) : null;
                      return d && !isNaN(d.getTime()) ? format(d, 'dd MMM yyyy') : (r.date || '-');
                    })()}
                  </span>
                  {supplier && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="truncate font-semibold text-theme-600-text max-w-[160px]" title={supplier.name}>
                        {supplier.name}
                      </span>
                    </>
                  )}
                  {r.isChecked && r.checkedAt && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span className="text-emerald-700 font-semibold tabular-nums">
                        Cek {format(new Date(r.checkedAt), 'HH:mm')}
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <span className="inline-flex items-center px-2 py-1 rounded-lg bg-neutral-900 text-white font-extrabold text-xs sm:text-sm tabular-nums">
                  {r.quantity}
                  <span className="ml-1 text-[10px] font-normal opacity-80">{product?.unit || 'pcs'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onUpdateReport({
                    ...r,
                    isChecked: !r.isChecked,
                    checkedAt: !r.isChecked ? Date.now() : null
                  })}
                  className={cn(
                    "min-w-[36px] min-h-[34px] px-2 py-1 rounded-lg text-[11px] font-bold border transition-all flex items-center justify-center gap-1 active:scale-95 cursor-pointer",
                    r.isChecked
                      ? "bg-emerald-600 hover:bg-emerald-700 border-emerald-700 text-white"
                      : "bg-white border-neutral-300 text-neutral-600 hover:border-emerald-400 hover:text-emerald-700"
                  )}
                  title={r.isChecked ? 'Sudah Dicek (Klik untuk batal)' : 'Tandai Sudah Dicek'}
                  aria-label={r.isChecked ? 'Sudah Dicek' : 'Tandai Sudah Dicek'}
                >
                  {r.isChecked ? (
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  ) : (
                    <Square className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  )}
                  <span className="hidden sm:inline">{r.isChecked ? 'Dicek' : 'Cek'}</span>
                </button>
              </div>
            </div>

            {/* Notes if any */}
            {r.notes && (
              <div className="text-[11px] sm:text-xs text-amber-800 bg-amber-50/80 border border-amber-200/70 rounded-lg px-2.5 py-1">
                <span className="font-semibold">Catatan:</span> {r.notes}
              </div>
            )}

            {/* Compact Single-Row Status Toggles */}
            <div className="grid grid-cols-4 gap-1 sm:gap-1.5">
              {/* Sudah Order */}
              <button
                type="button"
                onClick={() => onUpdateReport({ ...r, isOrdered: !r.isOrdered })}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all active:scale-95 whitespace-nowrap",
                  r.isOrdered
                    ? "bg-blue-50 border-blue-200 text-blue-700 font-bold"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                {r.isOrdered ? (
                  <CheckSquare className="w-3 h-3 text-blue-600 shrink-0" />
                ) : (
                  <Square className="w-3 h-3 text-neutral-400 shrink-0" />
                )}
                <span className="sm:hidden">Order</span>
                <span className="hidden sm:inline truncate">Sudah Order</span>
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
                  "flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all active:scale-95 whitespace-nowrap",
                  r.isArrived
                    ? "bg-emerald-50 border-emerald-200 text-emerald-700 font-bold"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <PackageCheck
                  className={cn('w-3 h-3 shrink-0', r.isArrived ? 'text-emerald-600' : 'text-neutral-400')}
                />
                <span className="sm:hidden">Datang</span>
                <span className="hidden sm:inline truncate">Sudah Datang</span>
              </button>

              {/* Kosong Pabrik */}
              <button
                type="button"
                onClick={() => onKosongPabrikChange(r, !r.isKosongPabrik)}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all active:scale-95 whitespace-nowrap",
                  r.isKosongPabrik
                    ? "bg-rose-50 border-rose-200 text-rose-700 font-bold"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <Factory
                  className={cn('w-3 h-3 shrink-0', r.isKosongPabrik ? 'text-rose-600' : 'text-neutral-400')}
                />
                <span className="sm:hidden">Kosong</span>
                <span className="hidden sm:inline truncate">Kosong Pabrik</span>
              </button>

              {/* Warning Stok */}
              <button
                type="button"
                onClick={() => onUpdateReport({ ...r, isWarningStock: !r.isWarningStock })}
                className={cn(
                  "flex items-center justify-center gap-1 py-1.5 px-1 sm:px-2 rounded-lg text-[10px] sm:text-xs font-semibold border transition-all active:scale-95 whitespace-nowrap",
                  r.isWarningStock
                    ? "bg-amber-50 border-amber-200 text-amber-700 font-bold"
                    : "bg-white border-neutral-200 text-neutral-500 hover:bg-neutral-50"
                )}
              >
                <AlertCircle
                  className={cn('w-3 h-3 shrink-0', r.isWarningStock ? 'text-amber-600' : 'text-neutral-400')}
                />
                <span className="sm:hidden">Warn</span>
                <span className="hidden sm:inline truncate">Warning Stok</span>
              </button>
            </div>

            {/* Order Ulang Section */}
            {r.isArrived && (
              <div className="bg-amber-50/60 p-2 rounded-xl border border-amber-200 flex flex-col gap-1.5">
                <label className="flex items-center gap-2 cursor-pointer text-[11px] sm:text-xs font-semibold text-amber-900">
                  <input
                    type="checkbox"
                    checked={!!r.isReorder}
                    onChange={(e) => onUpdateReport({ ...r, isReorder: e.target.checked })}
                    className="w-3.5 h-3.5 text-amber-600 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                  />
                  <span>Minta Order Ulang (Reorder)</span>
                </label>
                {r.isReorder && (
                  <div className="flex gap-1.5 items-center">
                    <input
                      type="number"
                      min="1"
                      value={r.reorderQty || ''}
                      onChange={(e) => onUpdateReport({ ...r, reorderQty: parseInt(e.target.value) || 0 })}
                      className="w-16 px-2 py-1 text-xs border border-amber-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-center font-bold tabular-nums"
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

            {/* Compact Footer: Bottom Stock Quick Input + Edit/Delete */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-theme-100 text-xs">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="text-[11px] text-theme-500 font-medium whitespace-nowrap">B. Stok:</span>
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
                  className="w-12 sm:w-14 px-1.5 py-0.5 text-xs border border-theme-200 rounded-lg bg-theme-50/40 focus:bg-white focus:ring-2 focus:ring-theme-500 outline-none text-center font-bold text-theme-900 tabular-nums"
                  placeholder="0"
                />
                <span className="text-[11px] text-theme-400 truncate">{product?.unit || 'pcs'}</span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={() => onEdit(r)}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-neutral-700 bg-neutral-100 hover:bg-neutral-200 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Edit2 className="w-3 h-3 text-neutral-500" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm(`Hapus catatan laporan untuk ${product?.name || 'item ini'}?`)) {
                      onDelete(r.id);
                    }
                  }}
                  className="min-h-[34px] px-2.5 py-1 rounded-lg text-[11px] sm:text-xs font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200/70 active:scale-95 transition-all flex items-center gap-1"
                >
                  <Trash2 className="w-3 h-3" />
                  <span className="hidden sm:inline">Hapus</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
