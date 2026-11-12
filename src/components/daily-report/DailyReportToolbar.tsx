import React, { useRef, useEffect, useState, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, Search, Building2, ChevronDown, X, 
  AlertTriangle, Trash2, Copy, Download, Upload, RefreshCw,
  CheckCircle2, CheckSquare, Square
} from 'lucide-react';
import { Supplier, Product } from '../../types';
import { cn } from '../../lib/utils';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../../lib/searchHistory';
import { PreviousSearchSection } from '../PreviousSearchSection';

interface DailyReportToolbarProps {
  filterDate: string;
  setFilterDate: (val: string) => void;
  filterSupplier: string;
  setFilterSupplier: (val: string) => void;
  supplierFilterQuery: string;
  setSupplierFilterQuery: (val: string) => void;
  isSupplierDropdownOpen: boolean;
  setIsSupplierDropdownOpen: (val: boolean) => void;
  suppliers: Supplier[];
  filteredSuppliers: Supplier[];
  supplierSearchHistory: string[];
  setSupplierSearchHistory: (val: string[]) => void;
  productFilterQuery: string;
  setProductFilterQuery: (val: string) => void;
  products?: Product[];
  bottomStockFilter: 'all' | 'has' | 'none' | 'warning';
  setBottomStockFilter: (val: 'all' | 'has' | 'none' | 'warning') => void;
  arrivedFilter: 'all' | 'arrived' | 'not_arrived';
  setArrivedFilter: (val: 'all' | 'arrived' | 'not_arrived') => void;
  checkedFilter: 'all' | 'checked' | 'unchecked';
  setCheckedFilter: (val: 'all' | 'checked' | 'unchecked') => void;
  onToggleCheckAllFiltered?: () => void;
  allFilteredChecked?: boolean;
  checkedCountInFilter?: number;
  showDuplicatesOnly: boolean;
  setShowDuplicatesOnly: (val: boolean) => void;
  onDeleteAllDuplicates: () => void;
  onCopyKemarin: () => void;
  onBulkDelete: () => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportTxt: () => void;
  onDownloadTemplate: () => void;
  onImportClick: () => void;
  isImporting: boolean;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
  activePreset: 'all' | 'today' | 'yesterday' | 'custom';
  onSelectPreset: (preset: 'all' | 'today' | 'yesterday') => void;
  totalResults: number;
}

export const DailyReportToolbar: React.FC<DailyReportToolbarProps> = ({
  filterDate,
  setFilterDate,
  filterSupplier,
  setFilterSupplier,
  supplierFilterQuery,
  setSupplierFilterQuery,
  isSupplierDropdownOpen,
  setIsSupplierDropdownOpen,
  suppliers,
  filteredSuppliers,
  supplierSearchHistory,
  setSupplierSearchHistory,
  productFilterQuery,
  setProductFilterQuery,
  products = [],
  bottomStockFilter,
  setBottomStockFilter,
  arrivedFilter,
  setArrivedFilter,
  checkedFilter,
  setCheckedFilter,
  onToggleCheckAllFiltered,
  allFilteredChecked,
  checkedCountInFilter,
  showDuplicatesOnly,
  setShowDuplicatesOnly,
  onDeleteAllDuplicates,
  onCopyKemarin,
  onBulkDelete,
  onExportExcel,
  onExportPdf,
  onExportTxt,
  onDownloadTemplate,
  onImportClick,
  isImporting,
  hasActiveFilters,
  onResetFilters,
  activePreset,
  onSelectPreset,
  totalResults
}) => {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  
  // Product Search Memory
  const [lastProductQuery, setLastProductQuery] = useState(() => getLastSearchQuery('toolbar_product'));
  const [isTypingNewProduct, setIsTypingNewProduct] = useState(false);
  const [highlightedProductIndex, setHighlightedProductIndex] = useState(0);
  const [productSearchHistory, setProductSearchHistory] = useState<string[]>(() => getSearchHistory('toolbar_product'));

  // Supplier Search Memory
  const [lastSupplierQuery, setLastSupplierQuery] = useState(() => getLastSearchQuery('toolbar_supplier'));
  const [isTypingNewSupplier, setIsTypingNewSupplier] = useState(false);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSupplierDropdownOpen]);

  // Autocomplete suggestions for typing product
  const matchingProducts = useMemo(() => {
    const q = productFilterQuery.trim().toLowerCase();
    if (!q) return (products || []).slice(0, 100);
    return (products || []).filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 100);
  }, [productFilterQuery, products]);

  // Previous search products
  const previousProducts = useMemo(() => {
    if (!lastProductQuery) return [];
    const q = lastProductQuery.toLowerCase();
    return (products || []).filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [products, lastProductQuery]);

  // Previous search suppliers
  const previousSuppliers = useMemo(() => {
    if (!lastSupplierQuery) return [];
    const q = lastSupplierQuery.toLowerCase();
    return (suppliers || []).filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [suppliers, lastSupplierQuery]);

  // Auto-scroll highlighted supplier item into view
  useEffect(() => {
    if (isSupplierDropdownOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedSupplierIndex, isSupplierDropdownOpen]);

  // Auto-scroll highlighted product item into view
  useEffect(() => {
    if (isProductDropdownOpen && productDropdownRef.current) {
      const activeEl = productDropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedProductIndex, isProductDropdownOpen]);

  const handleSupplierSelect = (id: string, name: string) => {
    const typed = supplierFilterQuery.trim();
    const queryToSave = (isTypingNewSupplier && typed) ? typed : (lastSupplierQuery || name).trim();
    if (queryToSave) {
      setLastSearchQuery('toolbar_supplier', queryToSave);
      setLastSupplierQuery(queryToSave);
      const updated = addSearchHistory('toolbar_supplier', queryToSave);
      setSupplierSearchHistory(updated);
    }
    setFilterSupplier(id);
    setSupplierFilterQuery(name);
    setIsSupplierDropdownOpen(false);
    setIsTypingNewSupplier(false);
  };

  const handleProductFilterSelect = (name: string) => {
    const typed = productFilterQuery.trim();
    const queryToSave = (isTypingNewProduct && typed) ? typed : (lastProductQuery || name).trim();
    if (queryToSave) {
      setLastSearchQuery('toolbar_product', queryToSave);
      setLastProductQuery(queryToSave);
      const updated = addSearchHistory('toolbar_product', queryToSave);
      setProductSearchHistory(updated);
    }
    setProductFilterQuery(name);
    setIsProductDropdownOpen(false);
    setIsTypingNewProduct(false);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNewSupplier || !supplierFilterQuery.trim()) && !!lastSupplierQuery && previousSuppliers.length > 0;
    const activeList = isShowingPrevious ? previousSuppliers : filteredSuppliers;

    if (!isSupplierDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsSupplierDropdownOpen(true);
        setHighlightedSupplierIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedSupplierIndex((prev) => Math.min(prev + 1, Math.max(0, activeList.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSupplierIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList.length > 0 && highlightedSupplierIndex >= 0 && highlightedSupplierIndex < activeList.length) {
        const s = activeList[highlightedSupplierIndex];
        handleSupplierSelect(s.id, s.name);
      } else {
        setIsSupplierDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsSupplierDropdownOpen(false);
      setIsTypingNewSupplier(false);
    }
  };

  const handleProductKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNewProduct || !productFilterQuery.trim()) && !!lastProductQuery && previousProducts.length > 0;
    const activeList = isShowingPrevious ? previousProducts : matchingProducts;

    if (!isProductDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsProductDropdownOpen(true);
        setHighlightedProductIndex(0);
        if (!lastProductQuery) {
          setIsTypingNewProduct(true);
        }
      } else if (e.key === 'Enter' && productFilterQuery.trim()) {
        handleProductFilterSelect(productFilterQuery.trim());
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isShowingPrevious && !isTypingNewProduct) {
        setIsTypingNewProduct(true);
        setHighlightedProductIndex(0);
        return;
      }
      setHighlightedProductIndex((prev) => Math.min(prev + 1, Math.max(0, activeList.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedProductIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList.length > 0 && highlightedProductIndex >= 0 && highlightedProductIndex < activeList.length) {
        handleProductFilterSelect(activeList[highlightedProductIndex].name);
      } else if (productFilterQuery.trim()) {
        handleProductFilterSelect(productFilterQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsProductDropdownOpen(false);
      setIsTypingNewProduct(false);
    }
  };

  return (
    <div className="p-3 sm:p-4 border-b border-theme-200 bg-white flex flex-col gap-3">
      {/* Row 1: Quick Presets, Custom Date, Supplier Filter, Product Search */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Date Presets */}
        <div className="flex items-center bg-theme-100/70 p-1 rounded-xl border border-theme-200 text-xs">
          <button
            type="button"
            onClick={() => onSelectPreset('all')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-semibold transition-all",
              activePreset === 'all'
                ? "bg-white text-theme-900 shadow-2xs font-bold"
                : "text-theme-600-text hover:text-theme-900"
            )}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('today')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-semibold transition-all",
              activePreset === 'today'
                ? "bg-white text-theme-900 shadow-2xs font-bold"
                : "text-theme-600-text hover:text-theme-900"
            )}
          >
            Hari Ini
          </button>
          <button
            type="button"
            onClick={() => onSelectPreset('yesterday')}
            className={cn(
              "px-2.5 py-1 rounded-lg font-semibold transition-all",
              activePreset === 'yesterday'
                ? "bg-white text-theme-900 shadow-2xs font-bold"
                : "text-theme-600-text hover:text-theme-900"
            )}
          >
            Kemarin
          </button>
        </div>

        {/* Date Picker */}
        <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-theme-500 focus-within:ring-1 focus-within:ring-theme-500 transition-all text-xs">
          <CalendarIcon className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="outline-none bg-transparent text-neutral-700 text-xs w-28 sm:w-32"
          />
          {filterDate && (
            <button onClick={() => setFilterDate('')} className="text-neutral-400 hover:text-rose-500">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Supplier Dropdown */}
        <div className="relative flex-1 min-w-[140px] sm:max-w-[200px]" ref={dropdownRef}>
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-theme-500 focus-within:ring-1 focus-within:ring-theme-500 transition-all text-xs w-full">
            <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              ref={supplierInputRef}
              type="text"
              value={supplierFilterQuery}
              onChange={(e) => {
                setSupplierFilterQuery(e.target.value);
                setFilterSupplier('');
                setIsTypingNewSupplier(true);
                setHighlightedSupplierIndex(0);
                setIsSupplierDropdownOpen(true);
              }}
              onClick={() => {
                setIsSupplierDropdownOpen(true);
                setIsTypingNewSupplier(false);
                setHighlightedSupplierIndex(0);
                supplierInputRef.current?.select();
              }}
              onFocus={() => {
                setIsSupplierDropdownOpen(true);
                setIsTypingNewSupplier(false);
                setHighlightedSupplierIndex(0);
                supplierInputRef.current?.select();
              }}
              onKeyDown={handleSupplierKeyDown}
              placeholder="Semua Supplier"
              className="outline-none bg-transparent text-neutral-700 text-xs w-full placeholder:text-neutral-400"
            />
            {supplierFilterQuery && (
              <button
                type="button"
                onClick={() => {
                  setSupplierFilterQuery('');
                  setFilterSupplier('');
                  setIsTypingNewSupplier(false);
                }}
                className="text-neutral-400 hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className="w-3.5 h-3.5 text-neutral-400 cursor-pointer shrink-0"
              onClick={() => {
                setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                setIsTypingNewSupplier(false);
              }}
            />
          </div>

          {isSupplierDropdownOpen && (
            <div className="absolute z-50 left-0 mt-1 w-64 bg-white border border-theme-200 rounded-xl shadow-lg max-h-64 overflow-y-auto">
              {/* Previous search suppliers when clicking bar without active typing */}
              {(!isTypingNewSupplier || !supplierFilterQuery.trim()) && lastSupplierQuery && previousSuppliers.length > 0 && (
                <div className="border-b border-theme-200 bg-theme-50/60 pb-1">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-theme-800 uppercase flex items-center justify-between">
                    <span>Hasil Pencarian Sebelumnya ("{lastSupplierQuery}")</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSearchHistory('toolbar_supplier');
                        setLastSupplierQuery('');
                      }}
                      className="text-[9px] text-theme-600 hover:text-rose-600 font-medium"
                    >
                      Hapus
                    </button>
                  </div>
                  {previousSuppliers.map((s, idx) => (
                    <div
                      key={`prev-sup-${s.id}`}
                      data-highlighted={idx === highlightedSupplierIndex ? 'true' : undefined}
                      onClick={() => handleSupplierSelect(s.id, s.name)}
                      onMouseEnter={() => setHighlightedSupplierIndex(idx)}
                      className={cn(
                        "px-2.5 py-1.5 hover:bg-theme-100 cursor-pointer text-xs transition-colors flex items-center justify-between",
                        filterSupplier === s.id || idx === highlightedSupplierIndex ? "bg-theme-100 font-bold text-theme-900" : "text-neutral-700"
                      )}
                    >
                      <span>{s.name}</span>
                    </div>
                  ))}
                </div>
              )}

              <div
                onClick={() => {
                  setFilterSupplier('');
                  setSupplierFilterQuery('');
                  setIsSupplierDropdownOpen(false);
                  setIsTypingNewSupplier(false);
                }}
                className="p-2.5 hover:bg-theme-50 cursor-pointer text-xs font-semibold text-theme-600 border-b border-theme-100"
              >
                Semua Supplier
              </div>
              {filteredSuppliers.length === 0 ? (
                <div className="p-3 text-xs text-neutral-400 text-center">Tidak ditemukan supplier</div>
              ) : (
                filteredSuppliers.map((s, idx) => {
                  const isHighlighted = (isTypingNewSupplier || !lastSupplierQuery || previousSuppliers.length === 0) && idx === highlightedSupplierIndex;
                  return (
                    <div
                      key={s.id}
                      data-highlighted={isHighlighted ? 'true' : undefined}
                      onClick={() => handleSupplierSelect(s.id, s.name)}
                      onMouseEnter={() => setHighlightedSupplierIndex(idx)}
                      className={cn(
                        "p-2.5 hover:bg-theme-50 cursor-pointer text-xs transition-colors border-b border-theme-50 last:border-0",
                        filterSupplier === s.id || isHighlighted
                          ? "bg-theme-100 font-bold text-theme-900"
                          : "text-neutral-700"
                      )}
                    >
                      {s.name}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Product Search with Dropdown */}
        <div className="relative flex-1 min-w-[160px]" ref={productDropdownRef}>
          <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-theme-500 focus-within:ring-1 focus-within:ring-theme-500 transition-all text-xs w-full">
            <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <input
              ref={productInputRef}
              type="text"
              value={productFilterQuery}
              onChange={(e) => {
                setProductFilterQuery(e.target.value);
                setIsTypingNewProduct(true);
                setHighlightedProductIndex(0);
                setIsProductDropdownOpen(true);
              }}
              onClick={() => {
                setIsProductDropdownOpen(true);
                setIsTypingNewProduct(false);
                setHighlightedProductIndex(0);
                productInputRef.current?.select();
              }}
              onFocus={() => {
                setIsProductDropdownOpen(true);
                setIsTypingNewProduct(false);
                setHighlightedProductIndex(0);
                productInputRef.current?.select();
              }}
              onKeyDown={handleProductKeyDown}
              placeholder="Cari nama produk..."
              className="outline-none bg-transparent text-neutral-700 text-xs w-full placeholder:text-neutral-400"
            />
            {productFilterQuery && (
              <X
                className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-500 cursor-pointer shrink-0"
                onClick={() => {
                  setProductFilterQuery('');
                  setIsTypingNewProduct(false);
                }}
              />
            )}
            <ChevronDown
              className="w-3.5 h-3.5 text-neutral-400 cursor-pointer shrink-0"
              onClick={() => {
                setIsProductDropdownOpen(!isProductDropdownOpen);
                setIsTypingNewProduct(false);
              }}
            />
          </div>

          {isProductDropdownOpen && (
            <div className="absolute z-50 left-0 mt-1 w-72 bg-white border border-theme-200 rounded-xl shadow-xl max-h-72 overflow-y-auto p-1">
              {/* Previous search results when clicking search bar without active new typing */}
              {(!isTypingNewProduct || !productFilterQuery.trim()) && lastProductQuery && (
                <PreviousSearchSection
                  lastQuery={lastProductQuery}
                  results={previousProducts}
                  history={productSearchHistory}
                  highlightedIndex={highlightedProductIndex}
                  onHighlightIndex={setHighlightedProductIndex}
                  onSelectResult={(p) => handleProductFilterSelect(p.name)}
                  onSelectQuery={(term) => {
                    setProductFilterQuery(term);
                    setIsTypingNewProduct(false);
                    setHighlightedProductIndex(0);
                    setIsProductDropdownOpen(true);
                  }}
                  onClearHistory={() => {
                    clearSearchHistory('toolbar_product');
                    setLastProductQuery('');
                    setProductSearchHistory([]);
                  }}
                  renderTitle={(p) => p.name}
                  renderSubtitle={(p) => {
                    const sup = suppliers.find((s) => s.id === p.supplierId);
                    return sup?.name || 'Tanpa Supplier';
                  }}
                  keyExtractor={(p) => `prev-tb-${p.id}`}
                />
              )}

              {isTypingNewProduct && (productFilterQuery.trim() || !lastProductQuery) && (
                <div>
                  <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase">
                    Hasil Pencarian Produk ({matchingProducts.length})
                  </div>
                  {matchingProducts.length === 0 ? (
                    <div className="p-3 text-xs text-neutral-400 text-center">
                      Tidak ada produk ditemukan
                    </div>
                  ) : (
                    matchingProducts.map((p, idx) => (
                      <div
                        key={`match-pf-${p.id}`}
                        data-highlighted={idx === highlightedProductIndex ? 'true' : undefined}
                        onMouseEnter={() => setHighlightedProductIndex(idx)}
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleProductFilterSelect(p.name);
                        }}
                        className={cn(
                          "px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold truncate",
                          idx === highlightedProductIndex
                            ? "bg-theme-100 text-theme-900 font-bold"
                            : "hover:bg-theme-50 text-neutral-800"
                        )}
                      >
                        {p.name}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Secondary Dropdowns & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-theme-100">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Bottom Stock Filter */}
          <div className="relative">
            <select
              value={bottomStockFilter}
              onChange={(e) => setBottomStockFilter(e.target.value as any)}
              className="pl-2.5 pr-7 py-1.5 border border-neutral-200 rounded-xl bg-white focus:border-theme-500 focus:ring-1 focus:ring-theme-500 outline-none text-xs appearance-none text-neutral-700 font-medium"
            >
              <option value="all">Semua Status Stok</option>
              <option value="has">Punya Bottom Stock</option>
              <option value="none">Belum Ada Bottom Stock</option>
              <option value="warning">Warning Stok Saja</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Arrived Filter */}
          <div className="relative">
            <select
              value={arrivedFilter}
              onChange={(e) => setArrivedFilter(e.target.value as any)}
              className="pl-2.5 pr-7 py-1.5 border border-neutral-200 rounded-xl bg-white focus:border-theme-500 focus:ring-1 focus:ring-theme-500 outline-none text-xs appearance-none text-neutral-700 font-medium"
            >
              <option value="all">Semua Status Datang</option>
              <option value="arrived">Sudah Datang</option>
              <option value="not_arrived">Belum Datang</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Checked / Crosscheck Filter */}
          <div className="relative">
            <select
              value={checkedFilter}
              onChange={(e) => setCheckedFilter(e.target.value as any)}
              className={cn(
                "pl-2.5 pr-7 py-1.5 border rounded-xl outline-none text-xs appearance-none font-medium transition-colors",
                checkedFilter !== 'all'
                  ? "border-emerald-400 bg-emerald-50/50 text-emerald-800 font-bold"
                  : "border-neutral-200 bg-white text-neutral-700 focus:border-theme-500 focus:ring-1 focus:ring-theme-500"
              )}
            >
              <option value="all">Semua Status Ceklis</option>
              <option value="checked">✓ Sudah Dicek</option>
              <option value="unchecked">⏳ Belum Dicek</option>
            </select>
            <ChevronDown className="w-3 h-3 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Filters */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="text-xs flex items-center gap-1 text-rose-600 hover:text-rose-700 font-bold px-2 py-1 bg-rose-50 rounded-lg hover:bg-rose-100 transition-colors"
            >
              <X className="w-3 h-3" />
              <span>Reset Filter</span>
            </button>
          )}
        </div>

        {/* Action Buttons Group */}
        <div className="flex flex-wrap items-center gap-1.5 ml-auto">
          {/* Ceklis Semua / Batal Ceklis Semua */}
          {onToggleCheckAllFiltered && (
            <button
              type="button"
              onClick={onToggleCheckAllFiltered}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs border transition-all active:scale-95 shadow-2xs",
                allFilteredChecked
                  ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                  : "bg-white text-emerald-700 border-emerald-300 hover:bg-emerald-50"
              )}
              title={allFilteredChecked ? "Batal ceklis semua data yang tampil" : "Ceklis semua data yang tampil"}
            >
              {allFilteredChecked ? (
                <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Square className="w-3.5 h-3.5 shrink-0" />
              )}
              <span>{allFilteredChecked ? 'Batal Ceklis Semua' : 'Ceklis Semua'}</span>
              {typeof checkedCountInFilter === 'number' && (
                <span className={cn(
                  "ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold leading-none",
                  allFilteredChecked ? "bg-emerald-700 text-white" : "bg-emerald-100 text-emerald-800"
                )}>
                  {checkedCountInFilter}
                </span>
              )}
            </button>
          )}
          {/* Cek Data Ganda */}
          <button
            type="button"
            onClick={() => setShowDuplicatesOnly(!showDuplicatesOnly)}
            className={cn(
              "flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-semibold text-xs border transition-all active:scale-95",
              showDuplicatesOnly
                ? "bg-amber-500 text-white border-amber-500 shadow-xs font-bold"
                : "bg-white text-amber-600 border-amber-200 hover:bg-amber-50"
            )}
          >
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{showDuplicatesOnly ? 'Tutup Ganda' : 'Cek Ganda'}</span>
          </button>

          {showDuplicatesOnly && (
            <button
              type="button"
              onClick={onDeleteAllDuplicates}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl font-bold text-xs border border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all active:scale-95"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Hapus Ganda</span>
            </button>
          )}

          {/* Copy Kemarin */}
          <button
            type="button"
            onClick={onCopyKemarin}
            className="flex items-center gap-1.5 bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
            title="Salin catatan kemarin yang belum ada di hari ini"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Salin Kemarin</span>
            <span className="sm:hidden">Salin</span>
          </button>

          {/* Bulk Delete */}
          <button
            type="button"
            onClick={onBulkDelete}
            className="flex items-center gap-1.5 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
            title="Hapus massal data rentang tanggal"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span className="hidden sm:inline">Hapus Massal</span>
          </button>

          {/* Export Excel */}
          <button
            type="button"
            onClick={onExportExcel}
            disabled={totalResults === 0}
            className="flex items-center gap-1 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-xs"
            title="Download Excel"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Excel</span>
          </button>

          {/* Export PDF */}
          <button
            type="button"
            onClick={onExportPdf}
            disabled={totalResults === 0}
            className="hidden sm:flex items-center gap-1 bg-white text-rose-600 border border-rose-200 hover:bg-rose-50 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
            title="Download PDF"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>PDF</span>
          </button>

          {/* Export TXT */}
          <button
            type="button"
            onClick={onExportTxt}
            disabled={totalResults === 0}
            className="hidden md:flex items-center gap-1 bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
            title="Download TXT"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>TXT</span>
          </button>

          {/* Template Import */}
          <button
            type="button"
            onClick={onDownloadTemplate}
            className="hidden sm:flex items-center gap-1 bg-white text-emerald-600 border border-emerald-200 hover:bg-emerald-50 px-2 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95"
            title="Download Template Format Excel"
          >
            <Download className="w-3.5 h-3.5 shrink-0" />
            <span>Template</span>
          </button>

          {/* Import Excel */}
          <button
            type="button"
            onClick={onImportClick}
            disabled={isImporting}
            className="flex items-center gap-1 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-semibold text-xs transition-all active:scale-95 shadow-xs"
            title="Import Excel"
          >
            {isImporting ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0" />
            ) : (
              <Upload className="w-3.5 h-3.5 shrink-0" />
            )}
            <span>{isImporting ? 'Importing...' : 'Import'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
