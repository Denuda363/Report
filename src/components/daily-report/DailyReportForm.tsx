import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, X, Check, Search, ChevronDown, Calendar as CalendarIcon, 
  Trash2, Building2, AlertTriangle, Maximize2, Minimize2, 
  Package, Hash, Sparkles, Layers, RotateCcw, ArrowRight, ArrowDown, PackageCheck
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Product, Supplier, ReportEntry } from '../../types';
import { SearchHistoryChips } from '../SearchHistoryChips';
import { addSearchHistory, clearSearchHistory } from '../../lib/searchHistory';
import { formatExcelDate } from '../../lib/excel';
import { cn } from '../../lib/utils';

export interface PendingReportItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number | '';
  bottomStock: number | '';
  showBottomStockInput: boolean;
  notes: string;
  isWarningStock: boolean;
  supplierName?: string;
}

interface DailyReportFormProps {
  editingReportId: string | null;
  date: string;
  setDate: (d: string) => void;
  productId: string;
  setProductId: (id: string) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  quantity: string;
  setQuantity: (q: string) => void;
  unit: string;
  setUnit: (u: string) => void;
  bottomStock: number | '';
  setBottomStock: (b: number | '') => void;
  showBottomStockInput: boolean;
  setShowBottomStockInput: (show: boolean) => void;
  notes: string;
  setNotes: (n: string) => void;
  isWarningStock: boolean;
  setIsWarningStock: (w: boolean) => void;
  errorMsg: string | null;
  setErrorMsg: (msg: string | null) => void;
  products: Product[];
  suppliers: Supplier[];
  reports: ReportEntry[];
  pendingItems: PendingReportItem[];
  setPendingItems: React.Dispatch<React.SetStateAction<PendingReportItem[]>>;
  isSavingAll: boolean;
  onSaveAll: () => Promise<void>;
  onAddReport: (e: React.FormEvent) => Promise<void>;
  onAddToList: (e: React.FormEvent) => void;
  onCancelEdit: () => void;
  isFormCollapsed: boolean;
  setIsFormCollapsed: (collapsed: boolean) => void;
  isFormFullscreen: boolean;
  setIsFormFullscreen: (fullscreen: boolean) => void;
  mobileTab: 'list' | 'form';
  setMobileTab: (tab: 'list' | 'form') => void;
  productSearchHistory: string[];
  setProductSearchHistory: (h: string[]) => void;
  newProductSupplierId?: string;
  setNewProductSupplierId?: (id: string) => void;
}

const COMMON_UNITS = ['pcs', 'box', 'karton', 'pack', 'kg', 'lusin', 'btg', 'btl'];
const QUICK_QTY_ADDITIONS = [1, 5, 10, 25, 50, 100];
const QUICK_NOTE_SUGGESTIONS = [
  'Promo Toko',
  'Pesanan Khusus',
  'Stok Menipis',
  'Titipan Toko',
  'Kirim Cepat'
];

export const DailyReportForm: React.FC<DailyReportFormProps> = ({
  editingReportId,
  date,
  setDate,
  productId,
  setProductId,
  searchQuery,
  setSearchQuery,
  quantity,
  setQuantity,
  unit,
  setUnit,
  bottomStock,
  setBottomStock,
  showBottomStockInput,
  setShowBottomStockInput,
  notes,
  setNotes,
  isWarningStock,
  setIsWarningStock,
  errorMsg,
  setErrorMsg,
  products,
  suppliers,
  reports,
  pendingItems,
  setPendingItems,
  isSavingAll,
  onSaveAll,
  onAddReport,
  onAddToList,
  onCancelEdit,
  isFormCollapsed,
  setIsFormCollapsed,
  isFormFullscreen,
  setIsFormFullscreen,
  mobileTab,
  setMobileTab,
  productSearchHistory,
  setProductSearchHistory,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [selectedSupplierForNew, setSelectedSupplierForNew] = useState('');
  const [isCustomUnit, setIsCustomUnit] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);

  // Selected product object
  const selectedProduct = useMemo(
    () => products.find((p) => p.id === productId),
    [products, productId]
  );

  const selectedProductSupplier = useMemo(() => {
    if (!selectedProduct) return null;
    return suppliers.find((s) => s.id === selectedProduct.supplierId);
  }, [selectedProduct, suppliers]);

  // Check if current product already exists in today's report
  const existingReportInDate = useMemo(() => {
    if (!date) return null;
    const normalizedDate = formatExcelDate(date) || date;
    const checkMatch = (targetId: string) => {
      return reports.find(
        (r) => (formatExcelDate(r.date) || r.date) === normalizedDate && r.productId === targetId && r.id !== editingReportId
      );
    };

    if (productId) {
      return checkMatch(productId);
    }
    if (searchQuery.trim()) {
      const match = products.find(
        (p) => p.name.toLowerCase() === searchQuery.trim().toLowerCase()
      );
      if (match) {
        return checkMatch(match.id);
      }
    }
    return null;
  }, [date, productId, searchQuery, products, reports, editingReportId]);

  // Filter products for dropdown
  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 30);
    return products
      .filter((p) => {
        const prodName = (p.name || '').toLowerCase();
        const sup = suppliers.find((s) => s.id === p.supplierId);
        const supName = (sup?.name || '').toLowerCase();
        return prodName.includes(q) || supName.includes(q);
      })
      .slice(0, 30);
  }, [products, suppliers, searchQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle product selection
  const handleSelectProduct = (prod: Product) => {
    if (searchQuery.trim()) {
      const updated = addSearchHistory('report_product', prod.name);
      setProductSearchHistory(updated);
    }
    setProductId(prod.id);
    setSearchQuery(prod.name);
    setUnit(prod.unit || 'pcs');

    if (prod.bottomStock === undefined || prod.bottomStock === null || prod.bottomStock === 0) {
      setShowBottomStockInput(true);
      setBottomStock('');
    } else {
      setShowBottomStockInput(false);
      setBottomStock(prod.bottomStock);
    }

    setIsDropdownOpen(false);
    setErrorMsg(null);

    // Auto-focus quantity input after selection
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  // Keyboard navigation inside product search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown') {
        setIsDropdownOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.min(prev + 1, filteredProducts.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredProducts.length > 0 && highlightedIndex >= 0 && highlightedIndex < filteredProducts.length) {
        handleSelectProduct(filteredProducts[highlightedIndex]);
      } else if (searchQuery.trim()) {
        // User typed a custom new product name
        setIsDropdownOpen(false);
        setTimeout(() => {
          quantityInputRef.current?.focus();
        }, 50);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
    }
  };

  // Keyboard shortcut in Qty field: Pressing Enter triggers Add To List (or submit)
  const handleQuantityKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (editingReportId) {
        onAddReport(e);
      } else {
        onAddToList(e);
        // Focus back to search input for rapid batch entry
        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }
    }
  };

  // Quick Qty adder
  const handleAddQty = (amount: number) => {
    const current = Number(quantity) || 0;
    setQuantity((current + amount).toString());
    setErrorMsg(null);
  };

  // Date helpers
  const setToday = () => {
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setErrorMsg(null);
  };

  const setYesterday = () => {
    setDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    setErrorMsg(null);
  };

  const formattedDateLabel = useMemo(() => {
    try {
      if (!date) return '';
      const parsed = parseISO(date);
      return format(parsed, 'EEEE, d MMMM yyyy', { locale: idLocale });
    } catch {
      return date;
    }
  }, [date]);

  // Clear form
  const handleResetForm = () => {
    setProductId('');
    setSearchQuery('');
    setQuantity('');
    setUnit('pcs');
    setNotes('');
    setBottomStock('');
    setShowBottomStockInput(false);
    setIsWarningStock(false);
    setErrorMsg(null);
    searchInputRef.current?.focus();
  };

  // Update pending item quantity inline
  const handleUpdatePendingQty = (id: string, delta: number) => {
    setPendingItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const currentQty = Number(item.quantity) || 0;
          const nextQty = Math.max(1, currentQty + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const totalPendingQty = useMemo(() => {
    return pendingItems.reduce((acc, item) => acc + (Number(item.quantity) || 0), 0);
  }, [pendingItems]);

  // If collapsed on desktop
  if (isFormCollapsed && !isFormFullscreen) {
    return (
      <div className={cn(
        "bg-white rounded-3xl border border-theme-200 shadow-xs transition-all duration-300 h-fit",
        mobileTab === 'form' ? "w-full block p-4 sm:p-5" : "hidden lg:block lg:w-16 lg:p-3 overflow-hidden"
      )}>
        <div className="hidden lg:flex flex-col items-center gap-4 py-2">
          <button 
            type="button"
            onClick={() => setIsFormCollapsed(false)}
            className="p-3 text-white bg-neutral-900 hover:bg-neutral-800 rounded-2xl transition-all duration-300 shadow-sm active:scale-95 group"
            title="Buka Form Input Sales"
          >
            <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          </button>
          <div className="[writing-mode:vertical-lr] text-xs font-bold text-theme-500 tracking-wider uppercase select-none cursor-pointer" onClick={() => setIsFormCollapsed(false)}>
            + Input Sales
          </div>
          {pendingItems.length > 0 && (
            <span className="w-6 h-6 rounded-full bg-theme-500 text-white text-[10px] font-bold flex items-center justify-center shadow-xs">
              {pendingItems.length}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={
        isFormFullscreen
          ? "fixed inset-0 z-[100] bg-white p-4 sm:p-6 md:p-8 overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col"
          : cn(
              "bg-white rounded-3xl border border-theme-200 shadow-xs transition-all duration-300 h-fit",
              mobileTab === 'form' ? "w-full block p-4 sm:p-5" : "hidden lg:block",
              "lg:w-84 xl:w-96 lg:p-5 shrink-0"
            )
      }
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-theme-100">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-2xl bg-theme-500/10 border border-theme-500/20 flex items-center justify-center text-theme-700 shadow-2xs">
            {editingReportId ? <Edit2 className="w-4 h-4 text-theme-600" /> : <Plus className="w-4 h-4 text-theme-600" />}
          </div>
          <div>
            <h3 className="font-bold text-neutral-900 text-sm sm:text-base leading-tight">
              {editingReportId ? 'Edit Data Sales' : 'Input Sales Baru'}
            </h3>
            <p className="text-[11px] text-theme-500 font-medium">
              {editingReportId ? 'Perbarui rekaman harian' : 'Catat penjualan & barang keluar'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsFormFullscreen(!isFormFullscreen)}
            className="p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-theme-100 rounded-xl transition-colors"
            title={isFormFullscreen ? "Keluar Layar Penuh" : "Layar Penuh"}
          >
            {isFormFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          {!isFormFullscreen && (
            <button
              type="button"
              onClick={() => setIsFormCollapsed(true)}
              className="hidden lg:flex p-1.5 text-neutral-500 hover:text-neutral-900 hover:bg-theme-100 rounded-xl transition-colors"
              title="Ciutkan Form"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <form onSubmit={onAddReport} className="space-y-4">
        {/* 1. Date Selection with Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <CalendarIcon className="w-3.5 h-3.5 text-theme-500" /> Tanggal
            </label>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={setToday}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors",
                  date === format(new Date(), 'yyyy-MM-dd')
                    ? "bg-theme-500 text-white"
                    : "bg-theme-50 text-neutral-600 hover:bg-theme-100"
                )}
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={setYesterday}
                className={cn(
                  "px-2 py-0.5 rounded-md text-[10px] font-bold transition-colors",
                  date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                    ? "bg-theme-500 text-white"
                    : "bg-theme-50 text-neutral-600 hover:bg-theme-100"
                )}
              >
                Kemarin
              </button>
            </div>
          </div>

          <div className="relative">
            <input
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs sm:text-sm font-semibold text-neutral-800 shadow-2xs"
            />
          </div>
          {formattedDateLabel && (
            <p className="text-[11px] text-theme-600 font-medium mt-1 px-1">
              {formattedDateLabel}
            </p>
          )}
        </div>

        {/* 2. Product Search & Autocomplete */}
        <div className="relative" ref={dropdownRef}>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-theme-500" /> Produk
            </label>
            {productId && (
              <button
                type="button"
                onClick={() => {
                  setProductId('');
                  setSearchQuery('');
                  setShowBottomStockInput(false);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold flex items-center gap-0.5"
              >
                <X className="w-3 h-3" /> Ganti Produk
              </button>
            )}
          </div>

          {/* If a product is already selected, show an elegant product card */}
          {selectedProduct ? (
            <div className="p-3 bg-theme-50/70 border border-theme-300/80 rounded-2xl flex items-start justify-between gap-2 shadow-2xs">
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-theme-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                  <Package className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-bold text-neutral-900 text-sm truncate leading-snug">
                    {selectedProduct.name}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5 text-[11px] text-neutral-500">
                    <span className="flex items-center gap-1 text-theme-700 font-medium">
                      <Building2 className="w-3 h-3" />
                      {selectedProductSupplier?.name || 'Tanpa Supplier'}
                    </span>
                    <span>•</span>
                    <span className="bg-white border border-theme-200 px-1.5 py-0.2 rounded font-bold text-neutral-700">
                      {selectedProduct.unit || 'pcs'}
                    </span>
                    {selectedProduct.bottomStock !== undefined && selectedProduct.bottomStock !== null && selectedProduct.bottomStock > 0 && (
                      <span className="text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded font-semibold text-[10px]">
                        Min: {selectedProduct.bottomStock}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProductId('');
                  setSearchQuery('');
                  setShowBottomStockInput(false);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="p-1 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                title="Batalkan pilihan produk"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            /* Search Input Field */
            <div className="relative">
              <div className="relative flex items-center w-full px-3.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all shadow-2xs">
                <Search className="w-4 h-4 text-theme-500 mr-2 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  required={!productId}
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setProductId('');
                    setHighlightedIndex(0);
                    setIsDropdownOpen(true);
                    setErrorMsg(null);
                  }}
                  onFocus={() => setIsDropdownOpen(true)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full outline-none bg-transparent text-xs sm:text-sm font-medium text-neutral-800 placeholder:text-neutral-400"
                  placeholder="Ketik nama produk..."
                />
                {searchQuery && (
                  <X
                    className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setProductId('');
                      setShowBottomStockInput(false);
                      setErrorMsg(null);
                    }}
                  />
                )}
                <ChevronDown
                  className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-neutral-700 transition-colors"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                />
              </div>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1.5 bg-white border border-theme-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                  {/* Search History Chips */}
                  <SearchHistoryChips
                    history={productSearchHistory}
                    onSelect={(term) => {
                      setSearchQuery(term);
                      setIsDropdownOpen(true);
                      const exact = products.find((p) => p.name.toLowerCase() === term.toLowerCase());
                      if (exact) {
                        handleSelectProduct(exact);
                      }
                    }}
                    onClear={() => {
                      clearSearchHistory('report_product');
                      setProductSearchHistory([]);
                    }}
                  />

                  {filteredProducts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs font-semibold text-neutral-700">
                        Produk &quot;{searchQuery}&quot; tidak ditemukan.
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Akan otomatis didaftarkan sebagai produk baru saat disimpan.
                      </p>
                      {/* Optional supplier selection for new product */}
                      <div className="mt-3 pt-2 border-t border-theme-100 text-left">
                        <label className="text-[10px] font-bold text-neutral-500 uppercase">
                          Pilih Supplier (Opsional):
                        </label>
                        <select
                          value={selectedSupplierForNew}
                          onChange={(e) => setSelectedSupplierForNew(e.target.value)}
                          className="mt-1 w-full text-xs p-1.5 border border-theme-200 rounded-lg outline-none bg-white font-medium text-neutral-800"
                        >
                          <option value="">Tanpa Supplier (Default)</option>
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  ) : (
                    <div className="p-1 space-y-0.5">
                      <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Daftar Produk ({filteredProducts.length})
                      </div>
                      {filteredProducts.map((p, idx) => {
                        const sup = suppliers.find((s) => s.id === p.supplierId);
                        const isHighlighted = idx === highlightedIndex;
                        return (
                          <div
                            key={p.id}
                            onClick={() => handleSelectProduct(p)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={cn(
                              "px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs",
                              isHighlighted ? "bg-theme-100 text-theme-900 font-bold" : "hover:bg-theme-50 text-neutral-800"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-bold text-neutral-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[10px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                <span className="truncate">{sup?.name || 'Tanpa Supplier'}</span>
                                {p.bottomStock !== undefined && p.bottomStock !== null && p.bottomStock > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-600 font-semibold">Min: {p.bottomStock}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-bold px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 shrink-0">
                              {p.unit || 'pcs'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. Quantity & Unit */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3.5 h-3.5 text-theme-500" /> Jumlah (Qty) & Satuan
            </label>
            <div className="flex items-center gap-1">
              {QUICK_QTY_ADDITIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQty(val)}
                  className="px-1.5 py-0.5 text-[10px] font-bold bg-theme-50 hover:bg-theme-200/80 text-theme-800 rounded-md transition-colors active:scale-95"
                  title={`Tambah ${val}`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={quantityInputRef}
                type="number"
                min="0"
                required
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setErrorMsg(null);
                }}
                onKeyDown={handleQuantityKeyDown}
                onFocus={(e) => e.target.select()}
                className="w-full px-3.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm font-bold text-neutral-900 shadow-2xs placeholder:text-neutral-400 placeholder:font-normal"
                placeholder="0"
              />
            </div>

            {/* Unit selector */}
            <div className="w-28 shrink-0">
              {isCustomUnit ? (
                <div className="relative">
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Satuan"
                    className="w-full px-2.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 focus:bg-white focus:ring-2 focus:ring-theme-500 outline-none text-xs font-semibold text-neutral-800 shadow-2xs"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomUnit(false)}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700"
                    title="Pilih dari daftar"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <select
                  value={COMMON_UNITS.includes(unit) ? unit : 'other'}
                  onChange={(e) => {
                    if (e.target.value === 'other') {
                      setIsCustomUnit(true);
                      setUnit('');
                    } else {
                      setUnit(e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 outline-none text-xs font-bold text-neutral-800 shadow-2xs cursor-pointer"
                >
                  {COMMON_UNITS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                  <option value="other">+ Lainnya...</option>
                </select>
              )}
            </div>
          </div>
        </div>

        {/* 4. Bottom Stock Setup (when not set or new product) */}
        {(showBottomStockInput || (selectedProduct && (selectedProduct.bottomStock === undefined || selectedProduct.bottomStock === null))) && (
          <div className="p-3 bg-amber-50/80 border border-amber-200/80 rounded-2xl animate-in fade-in slide-in-from-top-1 duration-200 shadow-2xs">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Stok Minimum (Bottom Stock)
              </label>
              <span className="text-[10px] font-bold text-amber-700 bg-amber-100/70 px-1.5 py-0.2 rounded">
                Wajib diisi sekali
              </span>
            </div>
            <input
              type="number"
              min="0"
              value={bottomStock}
              onChange={(e) => setBottomStock(e.target.value ? Number(e.target.value) : '')}
              className="w-full px-3 py-2 border border-amber-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-xs font-semibold text-amber-900 placeholder:text-amber-400"
              placeholder="Masukkan batas minimum stok produk..."
            />
            <p className="text-[10px] text-amber-700 mt-1 leading-tight">
              Sistem akan otomatis memicu peringatan saat sisa stok berada di bawah batas ini.
            </p>
          </div>
        )}

        {/* 5. Notes / Keterangan with Quick Chips */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
              Keterangan (Opsional)
            </label>
          </div>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3.5 py-2.5 border border-theme-200 rounded-xl bg-theme-50/50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs sm:text-sm font-medium text-neutral-800 shadow-2xs placeholder:text-neutral-400"
            placeholder="Tambahkan catatan khusus..."
          />
          {/* Quick Note Chips */}
          <div className="flex flex-wrap items-center gap-1 mt-1.5">
            {QUICK_NOTE_SUGGESTIONS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => {
                  setNotes(notes ? `${notes}, ${tag}` : tag);
                }}
                className="px-2 py-0.5 bg-theme-50 hover:bg-theme-100 text-theme-700 rounded-md text-[10px] font-semibold transition-colors"
              >
                +{tag}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Warning Stok Switch */}
        <div>
          <label className="flex items-center justify-between p-2.5 border border-theme-200 rounded-xl bg-theme-50/40 hover:bg-theme-50 transition-colors cursor-pointer shadow-2xs">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isWarningStock}
                onChange={(e) => setIsWarningStock(e.target.checked)}
                className="w-4 h-4 text-rose-500 bg-white border-neutral-300 rounded focus:ring-rose-500 focus:ring-2 cursor-pointer"
              />
              <span className="text-xs font-bold text-rose-700">Tandai Warning Stok</span>
            </div>
            <span className="text-[10px] text-neutral-400 font-medium">Prioritas Tinggi</span>
          </label>
        </div>

        {/* Duplicate or Arrived Notice Alert */}
        {existingReportInDate && existingReportInDate.isArrived && (existingReportInDate.quantity === 0 || existingReportInDate.isArrivedOnly) ? (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800 animate-in fade-in duration-200">
            <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold">Barang Datang terdeteksi:</span> Produk ini sudah masuk di daftar Barang Datang pada tanggal ini. Status <span className="font-bold text-emerald-900">Sudah Datang</span> akan otomatis terceklis.
            </div>
          </div>
        ) : existingReportInDate ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-tight">
              <span className="font-bold">Data sudah ada pada tanggal ini:</span> Qty saat ini:{' '}
              <span className="font-bold text-amber-900">{existingReportInDate.quantity} {unit}</span>.
              Menyimpan akan memperbarui kuantitas tersebut.
            </div>
          </div>
        ) : null}

        {/* Error Alert */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-in fade-in duration-200">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div className="font-medium leading-relaxed">{errorMsg}</div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 space-y-2">
          {editingReportId ? (
            <div className="space-y-2">
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-3 rounded-xl font-bold transition-all duration-200 text-xs sm:text-sm shadow-sm active:scale-[0.98]"
              >
                <Check className="w-4 h-4" /> Simpan Perubahan
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                className="w-full flex items-center justify-center gap-2 bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 px-4 py-2.5 rounded-xl font-semibold transition-all duration-200 text-xs sm:text-sm"
              >
                <X className="w-4 h-4" /> Batalkan Edit
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={onAddToList}
                  className="flex items-center justify-center gap-1.5 bg-white border-2 border-theme-500 text-theme-700 hover:bg-theme-50 px-3 py-2.5 rounded-xl font-bold transition-all duration-200 text-xs sm:text-sm active:scale-[0.98] shadow-2xs"
                  title="Tambahkan ke antrean list input (bisa input banyak sekaligus)"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Ke List</span>
                </button>
                <button
                  type="submit"
                  className="flex items-center justify-center gap-1.5 bg-theme-500 hover:bg-theme-600 text-white px-3 py-2.5 rounded-xl font-bold transition-all duration-200 text-xs sm:text-sm active:scale-[0.98] shadow-md shadow-theme-500/20"
                  title="Simpan langsung ke database"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan</span>
                </button>
              </div>

              <div className="flex items-center justify-between px-1">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="text-[11px] text-neutral-500 hover:text-neutral-800 font-medium flex items-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" /> Bersihkan Form
                </button>
                <span className="text-[10px] text-neutral-400 font-medium">
                  Enter di Qty = Tambah ke List
                </span>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Pending Items List (Batch Queue) */}
      {pendingItems.length > 0 && !editingReportId && (
        <div className="mt-5 pt-4 border-t border-theme-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-theme-500" />
              <h4 className="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Antrean Input
              </h4>
              <span className="px-1.5 py-0.5 rounded-full bg-theme-500 text-white font-bold text-[10px]">
                {pendingItems.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-neutral-600">
                Total: {totalPendingQty}
              </span>
              <button
                type="button"
                onClick={() => setPendingItems([])}
                className="text-[10px] text-rose-500 hover:text-rose-700 font-bold"
                title="Hapus semua antrean"
              >
                Kosongkan
              </button>
            </div>
          </div>

          <div className="space-y-1.5 mb-3 max-h-56 overflow-y-auto pr-1">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-theme-50/70 p-2.5 rounded-xl border border-theme-200/80 text-xs hover:bg-theme-50 transition-colors"
              >
                <div className="flex-1 truncate pr-2">
                  <div className="font-bold text-neutral-900 truncate">
                    {item.productName}
                  </div>
                  <div className="text-[10px] text-neutral-500 truncate flex items-center gap-1.5 mt-0.5">
                    <span className="font-bold text-theme-700">
                      {item.quantity} {item.unit}
                    </span>
                    {item.notes && (
                      <>
                        <span>•</span>
                        <span className="italic truncate">{item.notes}</span>
                      </>
                    )}
                    {item.isWarningStock && (
                      <span className="text-rose-600 font-bold bg-rose-50 px-1 rounded">
                        Warning
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Qty steppers & delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePendingQty(item.id, -1)}
                    className="w-5 h-5 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-100 font-bold text-xs active:scale-95"
                    title="Kurangi 1"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePendingQty(item.id, 1)}
                    className="w-5 h-5 flex items-center justify-center bg-white border border-neutral-200 rounded text-neutral-700 hover:bg-neutral-100 font-bold text-xs active:scale-95"
                    title="Tambah 1"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingItems(pendingItems.filter((i) => i.id !== item.id))}
                    className="p-1 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
                    title="Hapus dari antrean"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={onSaveAll}
            disabled={isSavingAll}
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all duration-200 text-xs sm:text-sm shadow-md active:scale-[0.98] disabled:opacity-50"
          >
            {isSavingAll ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Semua ({pendingItems.length} Item)</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
