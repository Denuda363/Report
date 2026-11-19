import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { Search, PackageMinus, Plus, ChevronDown, X, Check, Trash2, Edit2, Calendar as CalendarIcon, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { StockOutEntry } from '../types';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';
import { FloatingFormModal } from './common/FloatingFormModal';
import { cn } from '../lib/utils';

export const StockOut = () => {
  const { stockOuts, products, addStockOut, updateStockOut, deleteStockOut, updateProduct, userId, addReport, reports, addStockOutsBatch } = useAppContext();
  
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypingNew, setIsTypingNew] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const productInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);
  const [lastSearchQuery, setLastSearchQueryState] = useState(() => getLastSearchQuery('stockout_product'));
  const [productSearchHistory, setProductSearchHistory] = useState<string[]>(() => getSearchHistory('stockout_product'));
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  
  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string, stock: number} | null>(null);
  const [currentQty, setCurrentQty] = useState<number | ''>('');
  const [currentNotes, setCurrentNotes] = useState('');
  
  interface PendingOutItem {
    id: string;
    productId: string;
    productName: string;
    qty: number;
    notes: string;
    stock: number;
  }
  
  const [pendingItems, setPendingItems] = useState<PendingOutItem[]>(() => {
    try {
      const saved = localStorage.getItem('stockout_pending_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('stockout_pending_items', JSON.stringify(pendingItems));
    } catch (e) {
      console.error("Error saving stockout pending items to localStorage:", e);
    }
  }, [pendingItems]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormFullscreen, setIsFormFullscreen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastBanner({ type, text });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setIsFormFullscreen(false);
    setIsProductDropdownOpen(false);
    setFormError(null);
  };

  const [editStockOutId, setEditStockOutId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number | ''>('');
  const [editNotes, setEditNotes] = useState('');
  
  const handleEditStockOut = (s: StockOutEntry) => {
    setEditStockOutId(s.id);
    setEditQty(s.quantity);
    setEditNotes(s.notes || '');
  };
  
  const handleCancelEditStockOut = () => {
    setEditStockOutId(null);
    setEditQty('');
    setEditNotes('');
  };
  
  const handleSaveStockOut = async (s: StockOutEntry, product: any) => {
    if (!editQty || Number(editQty) <= 0) {
      showToast('error', "Masukkan jumlah pengeluaran (Qty) minimal 1.");
      return;
    }
    
    // Calculate stock diff
    if (product && product.stock !== undefined) {
      const diff = s.quantity - Number(editQty);
      if (diff !== 0) {
        const newStock = product.stock + diff;
        await updateProduct({ ...product, stock: newStock });
        
        // Auto add to daily report if stock is below bottomStock
        if (product.bottomStock !== undefined && newStock < product.bottomStock) {
          const existsToday = reports.some(r => r.date === s.date && r.productId === product.id);
          if (!existsToday) {
            await addReport({
              date: s.date,
              productId: product.id,
              quantity: 0,
              notes: 'Otomatis: Stok menipis (Edit)',
              isWarningStock: true,
              isKosongPabrik: product.isKosongPabrik || false
            });
          }
        }
      }
    }
    
    await updateStockOut(s.id, {
      quantity: Number(editQty),
      notes: editNotes
    });
    
    setEditStockOutId(null);
    showToast('success', "Perubahan pengeluaran stok berhasil disimpan.");
  };
  
  const handleDeleteStockOut = async (s: StockOutEntry, product: any) => {
    if (window.confirm("Hapus catatan ini? Stok akan dikembalikan sesuai qty yang dihapus.")) {
      if (product && product.stock !== undefined) {
        await updateProduct({ ...product, stock: product.stock + s.quantity });
      }
      await deleteStockOut(s.id);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  // Previous search results for StockOut
  const previousProducts = useMemo(() => {
    if (!lastSearchQuery) return [];
    const q = lastSearchQuery.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [products, lastSearchQuery]);

  // Auto-scroll highlighted product into view when navigating with arrow keys
  useEffect(() => {
    if (isProductDropdownOpen && productDropdownRef.current) {
      const activeEl = productDropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isProductDropdownOpen]);

  const handleProductSelect = (id: string, name: string, stock: number) => {
    const typed = searchQuery.trim();
    const queryToSave = (isTypingNew && typed) ? typed : (lastSearchQuery || name).trim();
    if (queryToSave) {
      setLastSearchQuery('stockout_product', queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory('stockout_product', queryToSave);
      setProductSearchHistory(updated);
    }
    setSelectedProduct({ id, name, stock });
    setSearchQuery(name);
    setIsProductDropdownOpen(false);
    setIsTypingNew(false);
    setFormError(null);
    setTimeout(() => {
      qtyInputRef.current?.focus();
    }, 50);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNew || !searchQuery.trim()) && !!lastSearchQuery && previousProducts.length > 0;
    const activeList = isShowingPrevious ? previousProducts : filteredProducts;

    if (!isProductDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsProductDropdownOpen(true);
        setHighlightedIndex(0);
        if (!lastSearchQuery) {
          setIsTypingNew(true);
        }
      } else if (e.key === 'Enter' && selectedProduct) {
        e.preventDefault();
        qtyInputRef.current?.focus();
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
        const p = activeList[highlightedIndex];
        handleProductSelect(p.id, p.name, p.stock || 0);
      }
    } else if (e.key === 'Escape') {
      setIsProductDropdownOpen(false);
      setIsTypingNew(false);
    }
  };

  const handleAddPending = () => {
    setFormError(null);
    if (!selectedProduct) {
      setFormError("Pilih produk dari daftar terlebih dahulu.");
      productInputRef.current?.focus();
      return;
    }
    if (!currentQty || Number(currentQty) <= 0) {
      setFormError("Masukkan jumlah pengeluaran (Qty) minimal 1.");
      qtyInputRef.current?.focus();
      return;
    }
    
    setPendingItems([...pendingItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      qty: Number(currentQty),
      notes: currentNotes.trim(),
      stock: selectedProduct.stock
    }]);
    
    setSelectedProduct(null);
    setSearchQuery('');
    setCurrentQty('');
    setCurrentNotes('');
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 50);
  };

  const handleFormInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddPending();
    }
  };
  
  const handleResetForm = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setCurrentQty('');
    setCurrentNotes('');
    setFormError(null);
    setTimeout(() => productInputRef.current?.focus(), 60);
  };

  const handleRemoveItem = (id: string) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
  };

  const handleSaveAll = async () => {
    setFormError(null);
    if (!date) {
      setFormError("Tanggal keluar wajib diisi.");
      return;
    }

    const itemsToProcess: PendingOutItem[] = [...pendingItems];
    if (selectedProduct && currentQty && Number(currentQty) > 0) {
      itemsToProcess.push({
        id: Math.random().toString(36).substr(2, 9),
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        qty: Number(currentQty),
        notes: currentNotes.trim(),
        stock: selectedProduct.stock
      });
    }

    if (itemsToProcess.length === 0) {
      setFormError("Pilih produk dan masukkan Qty keluar sebelum menyimpan.");
      return;
    }

    setIsSaving(true);
    try {
      const stockOutsToAdd: Omit<StockOutEntry, 'id'>[] = [];
      const productsToUpdateMap = new Map<string, typeof products[0]>();
      const lowStockReportsToAdd: any[] = [];

      for (const item of itemsToProcess) {
        const product = productsToUpdateMap.get(item.productId) || products.find(p => p.id === item.productId);
        
        if (product) {
          stockOutsToAdd.push({
            date,
            productId: item.productId,
            quantity: item.qty,
            notes: item.notes,
            createdAt: Date.now(),
            userId: userId || ''
          });
          
          const newStock = Math.max(0, (product.stock || 0) - item.qty);
          const updatedProd = {
            ...product,
            stock: newStock
          };
          productsToUpdateMap.set(item.productId, updatedProd);
          
          if (product.bottomStock !== undefined && newStock < product.bottomStock) {
            const existsToday = reports.some(r => r.date === date && r.productId === product.id) ||
                                lowStockReportsToAdd.some(r => r.date === date && r.productId === product.id);
            if (!existsToday) {
              lowStockReportsToAdd.push({
                date,
                productId: product.id,
                quantity: 0,
                notes: 'Otomatis: Stok menipis',
                isWarningStock: true,
                isKosongPabrik: product.isKosongPabrik || false
              });
            }
          }
        }
      }

      if (stockOutsToAdd.length > 0) {
        await addStockOutsBatch(stockOutsToAdd, Array.from(productsToUpdateMap.values()), lowStockReportsToAdd);
      }
      
      setPendingItems([]);
      setSelectedProduct(null);
      setSearchQuery('');
      setCurrentQty('');
      setCurrentNotes('');
      handleCloseForm();
      showToast('success', `Berhasil menyimpan ${stockOutsToAdd.length} data pengeluaran stok.`);
    } catch (err: any) {
      console.error("Error saving stock outs:", err);
      setFormError("Gagal menyimpan pengeluaran stok: " + (err?.message || "Terjadi kesalahan sistem."));
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl + S shortcut to save pending or active stock out items when modal is open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!(isFormOpen || isFormFullscreen)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        const hasPending = pendingItems.length > 0 || (selectedProduct && currentQty && Number(currentQty) > 0);
        if (!isSaving && hasPending) {
          handleSaveAll();
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  const setDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    if (preset === 'today') {
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      setStartDate(format(subDays(today, 6), 'yyyy-MM-dd'));
      setEndDate(todayStr);
    } else if (preset === '30days') {
      setStartDate(format(subDays(today, 29), 'yyyy-MM-dd'));
      setEndDate(todayStr);
    } else if (preset === 'thisMonth') {
      setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
      setEndDate(todayStr);
    }
  };

  const filteredStockOuts = useMemo(() => {
    return stockOuts
      .filter(s => s.date >= startDate && s.date <= endDate)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [stockOuts, startDate, endDate]);

  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const yesterdayStr = format(subDays(new Date(), 1), 'yyyy-MM-dd');
  const selectedProductObj = useMemo(() => {
    if (!selectedProduct) return null;
    return products.find(p => p.id === selectedProduct.id) || null;
  }, [selectedProduct, products]);
  const totalSaveCount = pendingItems.length + (selectedProduct && currentQty && Number(currentQty) > 0 ? 1 : 0);

  return (
    <div className="sm:h-full flex flex-col gap-4 pb-4 w-full max-w-[1600px] mx-auto relative">
      {/* Floating Toast Notification */}
      {toastBanner && (
        <div
          className={cn(
            "fixed bottom-5 right-5 z-[230] max-w-sm px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold animate-in slide-in-from-bottom-3 fade-in duration-200",
            toastBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          )}
        >
          {toastBanner.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="flex-1">{toastBanner.text}</span>
          <button type="button" onClick={() => setToastBanner(null)} className="opacity-70 hover:opacity-100 p-0.5">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Floating Input Modal */}
      <FloatingFormModal
        isOpen={isFormOpen || isFormFullscreen}
        onClose={handleCloseForm}
        title="Input Pengeluaran Stok"
        subtitle="Catat barang keluar atau pengurangan stok gudang"
        icon={<PackageMinus className="w-5 h-5" />}
        isFullscreen={isFormFullscreen}
        onToggleFullscreen={() => setIsFormFullscreen(!isFormFullscreen)}
        disableEscapeClose={isProductDropdownOpen}
        maxWidthClass="max-w-xl"
      >
        <div className="space-y-5">
          {formError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{formError}</span>
              </div>
              <button type="button" onClick={() => setFormError(null)} className="text-rose-600 hover:text-rose-800 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Section 1: Tanggal & Produk */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              1. Tanggal &amp; Identitas Produk
            </h4>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Tanggal Keluar <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setDate(todayStr)}
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors",
                      date === todayStr
                        ? "bg-theme-100 border-theme-300 text-theme-800"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setDate(yesterdayStr)}
                    className={cn(
                      "text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-colors",
                      date === yesterdayStr
                        ? "bg-theme-100 border-theme-300 text-theme-800"
                        : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                    )}
                  >
                    Kemarin
                  </button>
                </div>
              </div>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all"
              />
            </div>

            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Produk <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus-within:bg-white focus-within:border-theme-500 focus-within:ring-2 focus-within:ring-theme-500 transition-all">
                <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0" />
                <input
                  ref={productInputRef}
                  type="text"
                  className="bg-transparent outline-none w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400"
                  placeholder="Ketik untuk mencari produk..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedProduct(null);
                    setIsTypingNew(true);
                    setHighlightedIndex(0);
                    setIsProductDropdownOpen(true);
                  }}
                  onClick={() => {
                    setIsProductDropdownOpen(true);
                    setIsTypingNew(false);
                    setHighlightedIndex(0);
                    productInputRef.current?.select();
                  }}
                  onFocus={() => {
                    setIsProductDropdownOpen(true);
                    setIsTypingNew(false);
                    setHighlightedIndex(0);
                    productInputRef.current?.select();
                  }}
                  onKeyDown={handleSearchKeyDown}
                />
                {searchQuery && (
                  <X
                    className="w-4 h-4 text-neutral-400 hover:text-rose-500 cursor-pointer ml-1.5 shrink-0"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProduct(null);
                      setIsTypingNew(false);
                    }}
                  />
                )}
                <ChevronDown
                  className={cn(
                    "w-4 h-4 text-neutral-400 ml-1.5 transition-transform duration-200 cursor-pointer shrink-0",
                    isProductDropdownOpen && "rotate-180 text-theme-600"
                  )}
                  onClick={() => {
                    setIsProductDropdownOpen(!isProductDropdownOpen);
                    setIsTypingNew(false);
                  }}
                />
              </div>

              {selectedProduct && (
                <div className="mt-1.5 px-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-neutral-500">
                  <span className="text-emerald-700 font-semibold">Master Data</span>
                  <span>·</span>
                  <span>Sisa Stok: <strong className="font-medium text-neutral-800 tabular-nums">{selectedProduct.stock} {selectedProductObj?.unit || 'pcs'}</strong></span>
                </div>
              )}

              {isProductDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 max-h-64 overflow-y-auto bg-white border border-neutral-200 rounded-xl shadow-xl z-[60] py-1">
                  {(!isTypingNew || !searchQuery.trim()) && lastSearchQuery && (
                    <PreviousSearchSection
                      lastQuery={lastSearchQuery}
                      results={previousProducts}
                      history={productSearchHistory}
                      highlightedIndex={highlightedIndex}
                      onHighlightIndex={setHighlightedIndex}
                      onSelectResult={(p) => handleProductSelect(p.id, p.name, p.stock || 0)}
                      onSelectQuery={(term) => {
                        setSearchQuery(term);
                        setIsTypingNew(false);
                        setHighlightedIndex(0);
                        setIsProductDropdownOpen(true);
                      }}
                      onClearHistory={() => {
                        clearSearchHistory('stockout_product');
                        setLastSearchQueryState('');
                        setProductSearchHistory([]);
                      }}
                      renderTitle={(p) => p.name}
                      renderSubtitle={(p) => `Sisa Stok: ${p.stock || 0} ${p.unit || 'pcs'}`}
                      keyExtractor={(p) => `prev-so-${p.id}`}
                    />
                  )}

                  {isTypingNew && (searchQuery.trim() || !lastSearchQuery) ? (
                    filteredProducts.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-neutral-500 text-center">
                        Tidak ada produk ditemukan untuk &quot;{searchQuery}&quot;.
                      </div>
                    ) : (
                      <div className="p-1 space-y-0.5">
                        <div className="px-3 py-1 text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                          Hasil Pencarian ({filteredProducts.length})
                        </div>
                        {filteredProducts.map((p, idx) => (
                          <div
                            key={p.id}
                            data-highlighted={idx === highlightedIndex ? 'true' : undefined}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={cn(
                              "px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition-colors",
                              idx === highlightedIndex ? "bg-theme-50 text-theme-900 font-semibold" : "hover:bg-neutral-50"
                            )}
                            onClick={() => handleProductSelect(p.id, p.name, p.stock || 0)}
                          >
                            <div className="min-w-0 pr-2">
                              <span className="font-semibold text-neutral-900 block truncate">{p.name}</span>
                              <span className="text-[11px] text-neutral-500">{p.unit || 'pcs'}</span>
                            </div>
                            <span className="text-xs font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded-md tabular-nums shrink-0">
                              Stok: {p.stock || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    !lastSearchQuery && (
                      <div className="px-4 py-3 text-xs text-neutral-500 text-center">
                        Ketik nama produk atau tekan panah bawah untuk memilih.
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Kuantitas & Keterangan */}
          <div className="pt-4 border-t border-neutral-200/80 space-y-3">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              2. Kuantitas Keluar &amp; Keterangan
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Qty Keluar <span className="text-rose-500">*</span>
                </label>
                <input
                  ref={qtyInputRef}
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(e.target.value ? Number(e.target.value) : '')}
                  onKeyDown={handleFormInputKeyDown}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:font-normal placeholder:text-neutral-400"
                  placeholder="0"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Keterangan
                </label>
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  onKeyDown={handleFormInputKeyDown}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                  placeholder="Contoh: Rusak, kadaluarsa, atau penjualan..."
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-neutral-500 mr-1">Cepat:</span>
              {['Penjualan', 'Rusak / Pecah', 'Kadaluarsa', 'Sampel'].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCurrentNotes(preset)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors",
                    currentNotes === preset
                      ? "bg-theme-50 border-theme-300 text-theme-800 font-semibold"
                      : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                  )}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Pending Queue */}
          {pendingItems.length > 0 && (
            <div className="pt-4 border-t border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  Antrean Pengeluaran ({pendingItems.length})
                </h4>
                <button
                  type="button"
                  onClick={() => setPendingItems([])}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 transition-colors"
                >
                  Kosongkan Antrean
                </button>
              </div>

              <div className="flex flex-col gap-2 max-h-44 overflow-y-auto pr-1">
                {pendingItems.map((item) => (
                  <div key={item.id} className="px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <span className="font-semibold text-neutral-900 text-xs block truncate">{item.productName}</span>
                      <span className="text-[11px] text-rose-600 font-medium tabular-nums">
                        Keluar: {item.qty} {item.notes ? `· ${item.notes}` : ''}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors shrink-0"
                      title="Hapus dari antrean"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Footer */}
          <div className="pt-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
            <button
              type="button"
              onClick={handleResetForm}
              className="px-3.5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
            >
              <X className="w-3.5 h-3.5" />
              <span>Reset Input</span>
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <button
                type="button"
                onClick={handleAddPending}
                className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah ke Antrean</span>
              </button>

              <button
                type="button"
                onClick={handleSaveAll}
                disabled={isSaving || totalSaveCount === 0}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>
                      {totalSaveCount > 0 ? `Simpan Pengeluaran (${totalSaveCount})` : 'Simpan Pengeluaran'}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </FloatingFormModal>
      
      {/* History Data Panel (Full Width) */}
      <div className="flex-1 bg-white rounded-3xl border border-theme-200 shadow-sm overflow-x-clip sm:overflow-hidden flex flex-col min-w-0">
        <div className="p-4 md:p-6 border-b border-theme-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 sm:static z-20 bg-theme-50/95 sm:bg-theme-50/50 backdrop-blur-xs sm:backdrop-blur-none rounded-t-3xl sm:rounded-none shrink-0">
          <div className="flex items-center justify-between sm:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white rounded-xl shadow-sm border border-theme-100">
                <PackageMinus className="w-5 h-5 text-theme-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-theme-900">Riwayat Pengeluaran</h2>
                <p className="text-xs text-theme-600-text">Data stok yang telah dikeluarkan</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                setTimeout(() => productInputRef.current?.focus(), 80);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Input Pengeluaran</span>
              {pendingItems.length > 0 && (
                <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                  {pendingItems.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            {/* Quick Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              <button
                type="button"
                onClick={() => setDatePreset('today')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-theme-200 bg-white hover:bg-theme-100 text-theme-700 whitespace-nowrap transition-colors"
              >
                Hari Ini
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('7days')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-theme-200 bg-white hover:bg-theme-100 text-theme-700 whitespace-nowrap transition-colors"
              >
                7 Hari
              </button>
              <button
                type="button"
                onClick={() => setDatePreset('30days')}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg border border-theme-200 bg-white hover:bg-theme-100 text-theme-700 whitespace-nowrap transition-colors"
              >
                30 Hari
              </button>
            </div>

            {/* Date Range Inputs */}
            <div className="flex flex-wrap xs:flex-nowrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-theme-200 shadow-sm w-full sm:w-auto shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 text-theme-700 text-xs sm:text-sm flex-1 min-w-[120px]">
                <CalendarIcon className="w-3.5 h-3.5 text-theme-400 shrink-0" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent outline-none w-full text-xs sm:text-sm"
                />
              </div>
              <span className="text-theme-300 font-bold hidden xs:inline">-</span>
              <div className="flex items-center gap-1.5 px-2 py-1 text-theme-700 text-xs sm:text-sm flex-1 min-w-[120px]">
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent outline-none w-full text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-auto p-4 md:p-5 lg:p-6">
          {filteredStockOuts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <PackageMinus className="w-16 h-16 text-theme-200 mb-4" />
              <h3 className="text-lg font-bold text-theme-900 mb-1">Tidak ada data</h3>
              <p className="text-sm text-theme-600-text max-w-sm">Belum ada catatan pengeluaran stok pada rentang tanggal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 2xl:grid-cols-3 gap-3.5">
              {filteredStockOuts.map(s => {
                const product = products.find(p => p.id === s.productId);
                return (
                  <div key={s.id} className="bg-white border border-theme-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative group hover:border-theme-300 hover:shadow-md transition-all">
                    {editStockOutId === s.id ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center pb-2 border-b border-neutral-200">
                          <span className="text-xs font-semibold text-neutral-500 tabular-nums">{s.date}</span>
                          <span className="font-semibold text-neutral-900 text-xs truncate ml-2">{product?.name}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Qty Keluar</label>
                            <input 
                              type="number" 
                              min="1"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold tabular-nums text-neutral-900 outline-none focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-neutral-700 mb-1">Keterangan</label>
                            <input 
                              type="text" 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 outline-none focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500"
                              placeholder="Keterangan..."
                            />
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2 border-t border-neutral-100">
                          <button type="button" onClick={handleCancelEditStockOut} className="min-h-[38px] px-3.5 bg-white border border-neutral-300 text-neutral-700 rounded-xl py-2 text-xs font-semibold hover:bg-neutral-50 transition-colors flex justify-center items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Batal
                          </button>
                          <button type="button" onClick={() => handleSaveStockOut(s, product)} className="flex-1 sm:flex-none min-h-[38px] px-4 bg-theme-600 text-white rounded-xl py-2 text-xs font-semibold hover:bg-theme-700 transition-colors flex justify-center items-center gap-1.5 shadow-xs">
                            <Check className="w-3.5 h-3.5" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-2">
                            <span className="text-xs font-bold text-theme-500 bg-theme-50 px-2 py-0.5 rounded w-fit mb-1">{s.date}</span>
                            <span className="font-bold text-theme-900 line-clamp-2">{product?.name || 'Produk dihapus'}</span>
                          </div>
                          <div className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-sm shrink-0 shadow-sm border border-rose-200">
                            - {s.quantity}
                          </div>
                        </div>
                        {s.notes && (
                          <div className="text-sm text-theme-600-text bg-theme-50 p-2 rounded-xl mt-1 border border-theme-100/50">
                            <span className="font-bold text-theme-700">Ket:</span> {s.notes}
                          </div>
                        )}
                        
                        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-theme-100">
                          <button
                            onClick={() => handleEditStockOut(s)}
                            className="flex-1 sm:flex-none min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white text-theme-700 rounded-xl hover:bg-theme-50 hover:text-theme-900 transition-all border border-theme-200 shadow-sm text-xs font-bold active:scale-95"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStockOut(s, product)}
                            className="flex-1 sm:flex-none min-h-[38px] flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-white text-rose-500 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all border border-rose-200 shadow-sm text-xs font-bold active:scale-95"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
