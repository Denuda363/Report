import React from 'react';
import { format } from 'date-fns';
import { Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { ReportEntry, Product, Supplier } from '../../types';
import { cn } from '../../lib/utils';

interface DailyReportTableProps {
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

export const DailyReportTable: React.FC<DailyReportTableProps> = ({
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
    <div className={cn("overflow-x-auto w-full", className)}>
      <table className="w-full text-left border-collapse min-w-[900px]">
        <thead className="sticky top-0 bg-theme-100/90 backdrop-blur-xs z-10">
          <tr className="border-b border-theme-200">
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider rounded-tl-xl whitespace-nowrap">
              Tanggal
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider">
              Produk
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider">
              Supplier
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-right">
              Qty
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Bottom Stock
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Sudah Order
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Sudah Datang
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Kosong Pabrik
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Warning Stok
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center">
              Order Ulang
            </th>
            <th className="py-3 px-4 text-xs font-bold text-theme-600 uppercase tracking-wider text-center rounded-tr-xl w-24">
              Aksi
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-theme-100 bg-white">
          {reports.map((r) => {
            const product = products.find((p) => p.id === r.productId);
            const supplier = product ? suppliers.find((s) => s.id === product.supplierId) : null;

            return (
              <tr
                key={r.id}
                className={cn(
                  "hover:bg-theme-50/70 transition-colors",
                  r.isWarningStock && "bg-amber-50/30"
                )}
              >
                {/* Tanggal */}
                <td className="py-3.5 px-4 text-xs text-theme-700 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 font-medium">
                    <CalendarIcon className="w-3.5 h-3.5 text-theme-400" />
                    <span>{format(new Date(r.date), 'dd MMM yyyy')}</span>
                  </div>
                </td>

                {/* Produk */}
                <td className="py-3.5 px-4 text-sm font-bold text-theme-900">
                  <div className="max-w-[220px] break-words">
                    {product?.name || 'Unknown'}
                  </div>
                  {r.notes && (
                    <div className="text-[11px] text-amber-800 mt-1 font-normal bg-amber-50 border border-amber-200/60 inline-block px-2 py-0.5 rounded-md">
                      {r.notes}
                    </div>
                  )}
                </td>

                {/* Supplier */}
                <td className="py-3.5 px-4 text-xs text-theme-600 uppercase font-semibold">
                  <span className="truncate block max-w-[140px]" title={supplier?.name || 'Tanpa Supplier'}>
                    {supplier?.name || 'Tanpa Supplier'}
                  </span>
                </td>

                {/* Qty */}
                <td className="py-3.5 px-4 text-sm text-theme-900 text-right font-extrabold whitespace-nowrap">
                  <span className="px-2 py-1 rounded-lg bg-neutral-100 text-neutral-900 border border-neutral-200">
                    {r.quantity} <span className="text-xs font-normal text-neutral-500">{product?.unit || 'pcs'}</span>
                  </span>
                </td>

                {/* Bottom Stock */}
                <td className="py-3.5 px-4 text-center">
                  <div className="inline-flex items-center justify-center gap-1">
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
                  </div>
                </td>

                {/* Sudah Order */}
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={!!r.isOrdered}
                    onChange={(e) => onUpdateReport({ ...r, isOrdered: e.target.checked })}
                    className="w-4 h-4 text-theme-600 bg-gray-100 border-gray-300 rounded focus:ring-theme-500 cursor-pointer"
                  />
                </td>

                {/* Sudah Datang */}
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={!!r.isArrived}
                    onChange={(e) =>
                      onUpdateReport({
                        ...r,
                        isArrived: e.target.checked,
                        arrivedAt: e.target.checked ? Date.now() : r.arrivedAt
                      })
                    }
                    className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 cursor-pointer"
                  />
                </td>

                {/* Kosong Pabrik */}
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={!!r.isKosongPabrik}
                    onChange={(e) => onKosongPabrikChange(r, e.target.checked)}
                    className="w-4 h-4 text-rose-600 bg-gray-100 border-gray-300 rounded focus:ring-rose-500 cursor-pointer"
                  />
                </td>

                {/* Warning Stok */}
                <td className="py-3.5 px-4 text-center">
                  <input
                    type="checkbox"
                    checked={!!r.isWarningStock}
                    onChange={(e) => onUpdateReport({ ...r, isWarningStock: e.target.checked })}
                    className="w-4 h-4 text-amber-500 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 cursor-pointer"
                  />
                </td>

                {/* Order Ulang */}
                <td className="py-3.5 px-4 text-center">
                  {r.isArrived ? (
                    <div className="flex flex-col items-center gap-1.5">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!r.isReorder}
                          onChange={(e) => onUpdateReport({ ...r, isReorder: e.target.checked })}
                          className="w-4 h-4 text-amber-500 rounded border-amber-300 focus:ring-amber-500 cursor-pointer"
                        />
                        <span className="text-[11px] text-theme-600 font-medium whitespace-nowrap">Reorder</span>
                      </label>
                      {r.isReorder && (
                        <div className="flex flex-col gap-1 w-28">
                          <input
                            type="number"
                            min="1"
                            value={r.reorderQty || ''}
                            onChange={(e) => onUpdateReport({ ...r, reorderQty: parseInt(e.target.value) || 0 })}
                            className="w-full px-2 py-1 text-xs border border-theme-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-center"
                            placeholder="Qty"
                          />
                          <input
                            type="text"
                            value={r.reorderReason || ''}
                            onChange={(e) => onUpdateReport({ ...r, reorderReason: e.target.value })}
                            className="w-full px-2 py-1 text-xs border border-theme-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none"
                            placeholder="Alasan"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-neutral-300 text-xs">-</span>
                  )}
                </td>

                {/* Aksi */}
                <td className="py-3.5 px-4 text-center whitespace-nowrap">
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onEdit(r)}
                      className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors active:scale-95"
                      title="Edit baris ini"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Hapus catatan laporan untuk ${product?.name || 'item ini'}?`)) {
                          onDelete(r.id);
                        }
                      }}
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
                      title="Hapus baris ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
