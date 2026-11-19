import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Plus, Edit2, X, Check, Search, ChevronDown, Calendar as CalendarIcon, 
  Trash2, Building2, AlertTriangle, Maximize2, Minimize2, 
  Package, Hash, Sparkles, Layers, RotateCcw, ArrowRight, ArrowDown, PackageCheck
} from 'lucide-react';
import { format, subDays, parseISO } from 'date-fns';
import { id as idLocale } from 'date-fns/locale';
import { Product, Supplier, ReportEntry } from '../../types';
import { formatExcelDate } from '../../lib/excel';
import { cn } from '../../lib/utils';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, clearSearchHistory } from '../../lib/searchHistory';
import { PreviousSearchSection } from '../PreviousSearchSection';
import { FloatingFormModal } from '../common/FloatingFormModal';

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
  const [isTypingNew, setIsTypingNew] = useState(false);
  const [lastSearchQuery, setLastSearchQueryState] = useState(() => getLastSearchQuery('daily_report_product'));
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
    if (!q) return products.slice(0, 100);
    return products
      .filter((p) => {
        const prodName = (p.name || '').toLowerCase();
        const sup = suppliers.find((s) => s.id === p.supplierId);
        const supName = (sup?.name || '').toLowerCase();
        return prodName.includes(q) || supName.includes(q);
      })
      .slice(0, 100);
  }, [products, suppliers, searchQuery]);

  // Previous search products for dropdown
  const previousProducts = useMemo(() => {
    if (!lastSearchQuery) return [];
    const q = lastSearchQuery.toLowerCase();
    return products
      .filter((p) => {
        const prodName = (p.name || '').toLowerCase();
        const sup = suppliers.find((s) => s.id === p.supplierId);
        const supName = (sup?.name || '').toLowerCase();
        return prodName.includes(q) || supName.includes(q);
      })
      .slice(0, 50);
  }, [products, suppliers, lastSearchQuery]);

  // Auto-scroll highlighted product into view when navigating with arrow keys
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  // Ctrl + S shortcut to save pending items list
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (!isSavingAll && pendingItems.length > 0 && !editingReportId) {
          onSaveAll();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isSavingAll, pendingItems.length, editingReportId, onSaveAll]);

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
    // If user was actively typing a search keyword, save that keyword!
    // Otherwise keep the lastSearchQuery or prod.name
    const typed = searchQuery.trim();
    const queryToSave = (isTypingNew && typed) ? typed : (lastSearchQuery || prod.name).trim();
    if (queryToSave) {
      setLastSearchQuery('daily_report_product', queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory('daily_report_product', queryToSave);
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
    setIsTypingNew(false);
    setErrorMsg(null);

    // Auto-focus quantity input after selection
    setTimeout(() => {
      quantityInputRef.current?.focus();
      quantityInputRef.current?.select();
    }, 50);
  };

  // Keyboard navigation inside product search
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNew || !searchQuery.trim()) && !!lastSearchQuery && previousProducts.length > 0;
    const activeList = isShowingPrevious ? previousProducts : filteredProducts;

    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
        if (!lastSearchQuery) {
          setIsTypingNew(true);
        }
      } else if (e.key === 'Enter' && (productId || searchQuery.trim())) {
        e.preventDefault();
        quantityInputRef.current?.focus();
        quantityInputRef.current?.select();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isShowingPrevious && !isTypingNew) {
        setIsTypingNew(true);
        setHighlightedIndex(0);
        return;
      }
      setHighlightedIndex((prev) => Math.min(prev + 1, Math.max(0, activeList.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList.length > 0 && highlightedIndex >= 0 && highlightedIndex < activeList.length) {
        handleSelectProduct(activeList[highlightedIndex]);
      } else if (searchQuery.trim()) {
        // User typed a custom new product name
        setIsDropdownOpen(false);
        setIsTypingNew(false);
        setTimeout(() => {
          quantityInputRef.current?.focus();
          quantityInputRef.current?.select();
        }, 50);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsTypingNew(false);
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

  const handleCloseFloatingModal = () => {
    setIsFormFullscreen(false);
    setIsFormCollapsed(true);
    setMobileTab('list');
  };

  // Close floating form on Escape key (when product autocomplete dropdown is closed)
  useEffect(() => {
    if (isFormCollapsed) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isDropdownOpen) {
        handleCloseFloatingModal();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isFormCollapsed, isDropdownOpen]);

  return (
    <FloatingFormModal
      isOpen={!isFormCollapsed || isFormFullscreen}
      onClose={handleCloseFloatingModal}
      title={editingReportId ? 'Edit Data Sales' : 'Input Sales Baru'}
      subtitle={editingReportId ? 'Perbarui catatan penjualan harian' : 'Catat penjualan & barang keluar (Ctrl + S untuk simpan antrean)'}
      icon={editingReportId ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
      isFullscreen={isFormFullscreen}
      onToggleFullscreen={() => setIsFormFullscreen(!isFormFullscreen)}
      disableEscapeClose={isDropdownOpen}
      maxWidthClass="max-w-xl"
    >
      <form onSubmit={onAddReport} className="space-y-5">
        {/* Error & Duplicate Notices */}
        {errorMsg && (
          <div className="px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between gap-2 text-xs text-rose-800">
            <div className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            <button
              type="button"
              onClick={() => setErrorMsg(null)}
              className="text-rose-500 hover:text-rose-800 p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {existingReportInDate && existingReportInDate.isArrived && (existingReportInDate.quantity === 0 || existingReportInDate.isArrivedOnly) ? (
          <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2 text-xs text-emerald-800">
            <PackageCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Barang Datang terdeteksi:</strong> Produk ini sudah masuk di daftar Barang Datang tanggal ini. Status <strong>Sudah Datang</strong> otomatis dicentang.
            </div>
          </div>
        ) : existingReportInDate ? (
          <div className="px-3.5 py-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-snug">
              <strong>Data sudah tercatat pada tanggal ini</strong> (Qty saat ini: <strong className="tabular-nums">{existingReportInDate.quantity} {unit}</strong>). Menyimpan akan memperbarui kuantitas tersebut.
            </div>
          </div>
        ) : null}

        {/* SECTION 1: TANGGAL & PRODUK */}
        <div className="space-y-3.5">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              1. Tanggal &amp; Identitas Produk
            </span>
            {formattedDateLabel && (
              <span className="text-[11px] font-medium text-neutral-500 truncate max-w-[200px]">
                {formattedDateLabel}
              </span>
            )}
          </div>

          {/* Date Selection */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Tanggal Laporan <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={setToday}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors",
                    date === format(new Date(), 'yyyy-MM-dd')
                      ? "bg-theme-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  Hari Ini
                </button>
                <button
                  type="button"
                  onClick={setYesterday}
                  className={cn(
                    "px-2 py-0.5 rounded-md text-[10px] font-semibold transition-colors",
                    date === format(subDays(new Date(), 1), 'yyyy-MM-dd')
                      ? "bg-theme-600 text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  )}
                >
                  Kemarin
                </button>
              </div>
            </div>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setErrorMsg(null);
              }}
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm font-medium text-neutral-900 tabular-nums"
            />
          </div>

          {/* Product Search & Autocomplete */}
          <div className="relative" ref={dropdownRef}>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-neutral-700">
                Nama Produk <span className="text-rose-500">*</span>
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
                  className="text-[11px] text-neutral-500 hover:text-rose-600 font-medium inline-flex items-center gap-1"
                >
                  <X className="w-3 h-3" /> Ganti Produk
                </button>
              )}
            </div>

            <div className="relative flex items-center w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white focus-within:bg-white focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all">
              <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                required={!productId}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsTypingNew(true);
                  setHighlightedIndex(0);
                  setIsDropdownOpen(true);
                  setErrorMsg(null);
                }}
                onClick={() => {
                  setIsDropdownOpen(true);
                  setIsTypingNew(false);
                  setHighlightedIndex(0);
                  searchInputRef.current?.select();
                }}
                onFocus={() => {
                  setIsDropdownOpen(true);
                  setIsTypingNew(false);
                  setHighlightedIndex(0);
                  searchInputRef.current?.select();
                }}
                onKeyDown={handleSearchKeyDown}
                className="w-full outline-none bg-transparent text-sm font-medium text-neutral-900 placeholder:text-neutral-400"
                placeholder="Ketik atau pilih produk dari master data..."
              />
              {searchQuery && (
                <X
                  className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-rose-500 transition-colors"
                  onClick={() => {
                    setSearchQuery('');
                    setProductId('');
                    setIsTypingNew(false);
                    setShowBottomStockInput(false);
                    setErrorMsg(null);
                  }}
                />
              )}
              <ChevronDown
                className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-neutral-700 transition-colors"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsTypingNew(false);
                }}
              />
            </div>

            {/* Clean inline metadata strip when product is selected */}
            {selectedProduct && (
              <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-[11px] text-neutral-500">
                <span className="font-semibold text-emerald-700">Master Data</span>
                <span aria-hidden="true">·</span>
                <span>Supplier: <strong className="text-neutral-700">{selectedProductSupplier?.name || 'Tanpa Supplier'}</strong></span>
                <span aria-hidden="true">·</span>
                <span>Satuan: <strong className="text-neutral-700">{selectedProduct.unit || 'pcs'}</strong></span>
                {selectedProduct.bottomStock !== undefined && selectedProduct.bottomStock !== null && selectedProduct.bottomStock > 0 && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Batas Min: <strong className="text-amber-700 tabular-nums">{selectedProduct.bottomStock}</strong></span>
                  </>
                )}
              </div>
            )}

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto overflow-x-hidden animate-in fade-in slide-in-from-top-1 duration-150">
                {(!isTypingNew || !searchQuery.trim()) && lastSearchQuery && (
                  <PreviousSearchSection
                    lastQuery={lastSearchQuery}
                    results={previousProducts}
                    history={productSearchHistory}
                    highlightedIndex={highlightedIndex}
                    onHighlightIndex={setHighlightedIndex}
                    onSelectResult={(p) => handleSelectProduct(p)}
                    onSelectQuery={(term) => {
                      setSearchQuery(term);
                      setIsTypingNew(false);
                      setHighlightedIndex(0);
                      setIsDropdownOpen(true);
                    }}
                    onClearHistory={() => {
                      clearSearchHistory('daily_report_product');
                      setLastSearchQueryState('');
                      setProductSearchHistory([]);
                    }}
                    renderTitle={(p) => p.name}
                    renderSubtitle={(p) => {
                      const sup = suppliers.find((s) => s.id === p.supplierId);
                      return `${sup?.name || 'Tanpa Supplier'}${p.bottomStock ? ` • Min: ${p.bottomStock}` : ''}`;
                    }}
                    keyExtractor={(p) => `prev-dr-${p.id}`}
                  />
                )}

                {isTypingNew && (searchQuery.trim() || !lastSearchQuery) ? (
                  filteredProducts.length === 0 ? (
                    <div className="p-4 text-center">
                      <p className="text-xs font-semibold text-neutral-700">
                        Produk &quot;{searchQuery}&quot; tidak ditemukan.
                      </p>
                      <p className="text-[11px] text-neutral-500 mt-1">
                        Akan otomatis didaftarkan sebagai produk baru saat disimpan.
                      </p>
                      <div className="mt-3 pt-2 border-t border-neutral-100 text-left">
                        <label className="text-[11px] font-semibold text-neutral-600 block mb-1">
                          Pilih Supplier (Opsional)
                        </label>
                        <select
                          value={selectedSupplierForNew}
                          onChange={(e) => setSelectedSupplierForNew(e.target.value)}
                          className="w-full text-xs px-3 py-2 border border-neutral-300 rounded-xl outline-none bg-neutral-50 font-medium text-neutral-800"
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
                    <div className="p-1.5 space-y-0.5">
                      <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                        Hasil Pencarian ({filteredProducts.length})
                      </div>
                      {filteredProducts.map((p, idx) => {
                        const sup = suppliers.find((s) => s.id === p.supplierId);
                        const isHighlighted = idx === highlightedIndex;
                        return (
                          <div
                            key={p.id}
                            data-highlighted={isHighlighted ? 'true' : undefined}
                            onClick={() => handleSelectProduct(p)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={cn(
                              "px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 text-xs",
                              isHighlighted ? "bg-theme-100 text-theme-900 font-semibold" : "hover:bg-neutral-50 text-neutral-800"
                            )}
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-neutral-900 truncate">
                                {p.name}
                              </div>
                              <div className="text-[11px] text-neutral-500 flex items-center gap-1.5 mt-0.5">
                                <span className="truncate">{sup?.name || 'Tanpa Supplier'}</span>
                                {p.bottomStock !== undefined && p.bottomStock !== null && p.bottomStock > 0 && (
                                  <>
                                    <span>•</span>
                                    <span className="text-amber-700 font-medium tabular-nums">Min: {p.bottomStock}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-100 rounded text-neutral-600 shrink-0">
                              {p.unit || 'pcs'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )
                ) : (
                  !lastSearchQuery && (
                    <div className="p-4 text-center text-xs text-neutral-500">
                      Ketik nama produk atau tekan panah bawah untuk memilih...
                    </div>
                  )
                )}
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: KUANTITAS & STOK MINIMUM */}
        <div className="space-y-3.5 pt-1">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              2. Kuantitas &amp; Satuan
            </span>
            <div className="flex items-center gap-1">
              {QUICK_QTY_ADDITIONS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQty(val)}
                  className="px-1.5 py-0.5 text-[10px] font-semibold bg-neutral-100 hover:bg-theme-100 text-neutral-700 hover:text-theme-800 rounded transition-colors"
                  title={`Tambah ${val}`}
                >
                  +{val}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
            <div className="sm:col-span-7">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Jumlah (Qty) <span className="text-rose-500">*</span>
              </label>
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
                className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm font-semibold text-neutral-900 tabular-nums placeholder:text-neutral-400 placeholder:font-normal"
                placeholder="0"
              />
            </div>

            <div className="sm:col-span-5">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Satuan
              </label>
              {isCustomUnit ? (
                <div className="relative">
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    onKeyDown={handleQuantityKeyDown}
                    placeholder="Ketik satuan..."
                    className="w-full px-3.5 pr-8 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-sm font-medium text-neutral-900"
                  />
                  <button
                    type="button"
                    onClick={() => setIsCustomUnit(false)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-700 p-0.5"
                    title="Pilih dari daftar"
                  >
                    <X className="w-3.5 h-3.5" />
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
                  className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none text-sm font-medium text-neutral-900 cursor-pointer"
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

          {/* Bottom Stock Setup (inline, clean) */}
          {(showBottomStockInput || (selectedProduct && (selectedProduct.bottomStock === undefined || selectedProduct.bottomStock === null))) && (
            <div className="px-3.5 py-3 bg-amber-50/70 border border-amber-200 rounded-xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-amber-900">
                  Stok Minimum (Bottom Stock)
                </label>
                <span className="text-[11px] font-medium text-amber-700">Disarankan isi sekali</span>
              </div>
              <input
                type="number"
                min="0"
                value={bottomStock}
                onChange={(e) => setBottomStock(e.target.value ? Number(e.target.value) : '')}
                onKeyDown={handleQuantityKeyDown}
                className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none transition-all text-sm font-medium text-amber-950 tabular-nums placeholder:text-amber-400"
                placeholder="Batas minimum stok produk..."
              />
            </div>
          )}
        </div>

        {/* SECTION 3: KETERANGAN & PRIORITAS */}
        <div className="space-y-3 pt-1">
          <div className="border-b border-neutral-100 pb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              3. Keterangan &amp; Prioritas
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Keterangan (Opsional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onKeyDown={handleQuantityKeyDown}
              className="w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm font-medium text-neutral-900 placeholder:text-neutral-400"
              placeholder="Tambahkan catatan khusus..."
            />
            <div className="flex flex-wrap items-center gap-1 mt-1.5">
              {QUICK_NOTE_SUGGESTIONS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => {
                    setNotes(notes ? `${notes}, ${tag}` : tag);
                  }}
                  className="px-2 py-0.5 bg-neutral-50 hover:bg-neutral-100 border border-neutral-200 text-neutral-600 rounded-md text-[11px] font-medium transition-colors"
                >
                  +{tag}
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center justify-between px-3.5 py-2.5 border border-neutral-200 rounded-xl bg-neutral-50/60 hover:bg-neutral-100/70 transition-colors cursor-pointer">
            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={isWarningStock}
                onChange={(e) => setIsWarningStock(e.target.checked)}
                className="w-4 h-4 text-rose-600 bg-white border-neutral-300 rounded focus:ring-rose-500 cursor-pointer"
              />
              <span className="text-xs font-semibold text-neutral-800">Tandai Warning Stok</span>
            </div>
            <span className="text-[11px] text-rose-600 font-medium">Prioritas Tinggi</span>
          </label>
        </div>

        {/* STRUCTURED ACTION FOOTER */}
        <div className="pt-4 border-t border-neutral-200">
          {editingReportId ? (
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={onCancelEdit}
                className="px-4 py-2.5 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm shadow-sm active:scale-[0.98]"
              >
                <Check className="w-4 h-4" />
                <span>Simpan Perubahan</span>
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <button
                type="button"
                onClick={handleResetForm}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors self-start sm:self-auto"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Form</span>
              </button>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onAddToList}
                  className="inline-flex items-center justify-center gap-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 px-4 py-2.5 rounded-xl font-semibold transition-colors text-xs active:scale-[0.98] whitespace-nowrap"
                  title="Tambahkan ke antrean list (Enter di kolom Qty)"
                >
                  <Plus className="w-4 h-4 text-theme-600" />
                  <span>Tambah ke Antrean</span>
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center gap-1.5 bg-theme-600 hover:bg-theme-700 text-white px-5 py-2.5 rounded-xl font-bold transition-all text-xs shadow-sm active:scale-[0.98] whitespace-nowrap"
                  title="Simpan langsung ke database"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Sales</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      {/* Pending Items List (Batch Queue) */}
      {pendingItems.length > 0 && !editingReportId && (
        <div className="mt-5 pt-4 border-t border-neutral-200">
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-neutral-900">
                Antrean Input ({pendingItems.length} Item)
              </h4>
              <span className="text-xs font-medium text-neutral-500 tabular-nums">
                · Total Qty: {totalPendingQty}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setPendingItems([])}
              className="text-xs text-neutral-500 hover:text-rose-600 font-medium px-2 py-1 rounded-lg hover:bg-neutral-100 transition-colors"
              title="Hapus semua antrean"
            >
              Kosongkan
            </button>
          </div>

          <div className="bg-neutral-50 rounded-2xl border border-neutral-200 divide-y divide-neutral-200 mb-3 max-h-56 overflow-y-auto">
            {pendingItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between px-3.5 py-2.5 text-xs hover:bg-white transition-colors"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="font-semibold text-neutral-900 truncate">
                    {item.productName}
                  </div>
                  <div className="text-[11px] text-neutral-500 truncate flex items-center gap-1.5 mt-0.5 tabular-nums">
                    <span className="font-semibold text-theme-700">
                      {item.quantity} {item.unit}
                    </span>
                    {item.notes && (
                      <>
                        <span>·</span>
                        <span className="italic truncate">{item.notes}</span>
                      </>
                    )}
                    {item.isWarningStock && (
                      <>
                        <span>·</span>
                        <span className="text-rose-600 font-semibold">Warning Stok</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Inline Qty steppers & delete */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleUpdatePendingQty(item.id, -1)}
                    className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-100 font-bold text-xs active:scale-95"
                    title="Kurangi 1"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUpdatePendingQty(item.id, 1)}
                    className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded-md text-neutral-700 hover:bg-neutral-100 font-bold text-xs active:scale-95"
                    title="Tambah 1"
                  >
                    +
                  </button>
                  <button
                    type="button"
                    onClick={() => setPendingItems(pendingItems.filter((i) => i.id !== item.id))}
                    className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-0.5"
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
            className="w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-xl font-bold transition-all text-xs sm:text-sm shadow-sm active:scale-[0.98] disabled:opacity-50"
          >
            {isSavingAll ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Simpan Semua Antrean ({pendingItems.length} Item) · Ctrl+S</span>
              </>
            )}
          </button>
        </div>
      )}
    </FloatingFormModal>
  );
};
