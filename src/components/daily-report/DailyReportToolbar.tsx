import React, { useRef, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, Search, Building2, ChevronDown, X, 
  AlertTriangle, Trash2, Copy, Download, Upload, RefreshCw 
} from 'lucide-react';
import { Supplier } from '../../types';
import { SearchHistoryChips } from '../SearchHistoryChips';
import { clearSearchHistory, addSearchHistory } from '../../lib/searchHistory';
import { cn } from '../../lib/utils';

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
  bottomStockFilter: 'all' | 'has' | 'none' | 'warning';
  setBottomStockFilter: (val: 'all' | 'has' | 'none' | 'warning') => void;
  arrivedFilter: 'all' | 'arrived' | 'not_arrived';
  setArrivedFilter: (val: 'all' | 'arrived' | 'not_arrived') => void;
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
  bottomStockFilter,
  setBottomStockFilter,
  arrivedFilter,
  setArrivedFilter,
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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setIsSupplierDropdownOpen]);

  const handleSupplierSelect = (id: string, name: string) => {
    setFilterSupplier(id);
    setSupplierFilterQuery(name);
    if (name.trim()) {
      const updated = addSearchHistory('supplier', name.trim());
      setSupplierSearchHistory(updated);
    }
    setIsSupplierDropdownOpen(false);
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
              type="text"
              value={supplierFilterQuery}
              onChange={(e) => {
                setSupplierFilterQuery(e.target.value);
                setFilterSupplier('');
                setIsSupplierDropdownOpen(true);
              }}
              onFocus={() => setIsSupplierDropdownOpen(true)}
              placeholder="Semua Supplier"
              className="outline-none bg-transparent text-neutral-700 text-xs w-full placeholder:text-neutral-400"
            />
            {supplierFilterQuery && (
              <button
                type="button"
                onClick={() => {
                  setSupplierFilterQuery('');
                  setFilterSupplier('');
                }}
                className="text-neutral-400 hover:text-rose-500"
              >
                <X className="w-3 h-3" />
              </button>
            )}
            <ChevronDown
              className="w-3.5 h-3.5 text-neutral-400 cursor-pointer shrink-0"
              onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)}
            />
          </div>

          {isSupplierDropdownOpen && (
            <div className="absolute z-50 left-0 mt-1 w-64 bg-white border border-theme-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
              <SearchHistoryChips
                history={supplierSearchHistory}
                onSelect={(term) => {
                  setSupplierFilterQuery(term);
                  setFilterSupplier('');
                  setIsSupplierDropdownOpen(true);
                }}
                onClear={() => {
                  clearSearchHistory('supplier');
                  setSupplierSearchHistory([]);
                }}
              />
              <div
                onClick={() => {
                  setFilterSupplier('');
                  setSupplierFilterQuery('');
                  setIsSupplierDropdownOpen(false);
                }}
                className="p-2.5 hover:bg-theme-50 cursor-pointer text-xs font-semibold text-theme-600 border-b border-theme-100"
              >
                Semua Supplier
              </div>
              {filteredSuppliers.length === 0 ? (
                <div className="p-3 text-xs text-neutral-400 text-center">Tidak ditemukan supplier</div>
              ) : (
                filteredSuppliers.map((s) => (
                  <div
                    key={s.id}
                    onClick={() => handleSupplierSelect(s.id, s.name)}
                    className={cn(
                      "p-2.5 hover:bg-theme-50 cursor-pointer text-xs transition-colors border-b border-theme-50 last:border-0",
                      filterSupplier === s.id ? "bg-theme-100 font-bold text-theme-900" : "text-neutral-700"
                    )}
                  >
                    {s.name}
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Product Search */}
        <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-theme-500 focus-within:ring-1 focus-within:ring-theme-500 transition-all flex-1 min-w-[160px] text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            value={productFilterQuery}
            onChange={(e) => setProductFilterQuery(e.target.value)}
            placeholder="Cari nama produk..."
            className="outline-none bg-transparent text-neutral-700 text-xs w-full placeholder:text-neutral-400"
          />
          {productFilterQuery && (
            <X
              className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-500 cursor-pointer shrink-0"
              onClick={() => setProductFilterQuery('')}
            />
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
