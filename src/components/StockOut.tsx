import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays, startOfMonth } from 'date-fns';
import { Search, PackageMinus, Plus, ChevronDown, X, Check, Trash2, Edit2, Calendar as CalendarIcon, PackageOpen } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { StockOutEntry } from '../types';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';

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
  const [mobileTab, setMobileTab] = useState<'form' | 'history'>('form');

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
      alert("Qty pengeluaran tidak valid");
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
    setCurrentQty('');
    setCurrentNotes('');
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
    if (!selectedProduct) return;
    if (!currentQty || Number(currentQty) <= 0) {
      alert("Masukkan qty pengeluaran yang valid");
      return;
    }
    
    setPendingItems([...pendingItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      qty: Number(currentQty),
      notes: currentNotes,
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
  
  const handleCancelSelected = () => {
    setSelectedProduct(null);
    setSearchQuery('');
    setCurrentQty('');
    setCurrentNotes('');
  };

  const handleRemoveItem = (id: string) => {
    setPendingItems(pendingItems.filter(item => item.id !== id));
  };

  const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;
    
    const stockOutsToAdd: Omit<StockOutEntry, 'id'>[] = [];
    const productsToUpdateMap = new Map<string, typeof products[0]>();
    const lowStockReportsToAdd: any[] = [];

    for (const item of pendingItems) {
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
        
        // Auto add to daily report if stock is below bottomStock
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
    alert("Berhasil menyimpan data pengeluaran stok secara instan!");
    setMobileTab('history');
  };

  // Ctrl + S shortcut to save pending stock out items list
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (pendingItems.length > 0) {
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

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 lg:gap-8 pb-12 w-full max-w-[1600px] mx-auto">
      
      {/* Mobile Segmented Switcher */}
      <div className="lg:hidden flex items-center bg-white p-1 rounded-2xl border border-theme-200 shadow-sm shrink-0">
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'form'
              ? 'bg-theme-500 text-white shadow-md shadow-theme-500/20'
              : 'text-theme-600 hover:text-theme-900 hover:bg-theme-50'
          }`}
        >
          <PackageMinus className="w-4 h-4" />
          <span>Catat Pengeluaran</span>
          {pendingItems.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] px-2 py-0.2 rounded-full font-extrabold shadow-sm">
              {pendingItems.length}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('history')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
            mobileTab === 'history'
              ? 'bg-theme-500 text-white shadow-md shadow-theme-500/20'
              : 'text-theme-600 hover:text-theme-900 hover:bg-theme-50'
          }`}
        >
          <CalendarIcon className="w-4 h-4" />
          <span>Riwayat ({filteredStockOuts.length})</span>
        </button>
      </div>

      {/* Form Panel */}
      <div className={`w-full lg:w-[450px] flex-shrink-0 flex flex-col gap-6 ${
        mobileTab === 'form' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden flex flex-col relative z-20">
          <div className="bg-theme-500 p-6 text-white shrink-0 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <PackageMinus className="w-24 h-24 transform translate-x-4 -translate-y-4" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-1">
                <PackageMinus className="w-6 h-6" /> Form Pengeluaran
              </h2>
              <p className="text-white/80 text-sm">Catat stok keluar dari gudang</p>
            </div>
          </div>
          
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label className="block text-xs font-bold text-theme-900 mb-1">Tanggal Keluar</label>
              <input 
                type="date" 
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
              />
            </div>

            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-bold text-theme-900 mb-1">Pilih Produk</label>
              <div className="flex items-center w-full px-3 py-2 border border-theme-200 rounded-xl text-sm bg-white focus-within:border-theme-500 focus-within:ring-2 focus-within:ring-theme-100 transition-all">
                <Search className="w-4 h-4 text-theme-400 mr-2 shrink-0" />
                <input 
                  ref={productInputRef}
                  type="text" 
                  className="bg-transparent outline-none w-full text-theme-900"
                  placeholder="Ketik nama produk..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
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
                    className="w-4 h-4 text-theme-400 hover:text-rose-500 cursor-pointer mr-1 shrink-0" 
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedProduct(null);
                      setIsTypingNew(false);
                    }}
                  />
                )}
                <ChevronDown 
                  className={`w-4 h-4 text-theme-400 ml-1 transition-transform duration-200 cursor-pointer ${isProductDropdownOpen ? 'rotate-180' : ''}`}
                  onClick={() => {
                    setIsProductDropdownOpen(!isProductDropdownOpen);
                    setIsTypingNew(false);
                  }}
                />
              </div>

              {isProductDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-72 overflow-y-auto bg-white border border-theme-200 rounded-xl shadow-xl z-[60] py-1">
                  {/* Previous search results displayed when user clicks search bar without active typing */}
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
                      <div className="px-4 py-3 text-sm text-theme-500 text-center">
                        Tidak ada produk ditemukan untuk &quot;{searchQuery}&quot;
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
                            className={`px-3 py-2 rounded-lg cursor-pointer text-sm flex items-center justify-between transition-colors ${
                              idx === highlightedIndex ? 'bg-theme-100 text-theme-900 font-bold' : 'hover:bg-theme-50'
                            }`}
                            onClick={() => handleProductSelect(p.id, p.name, p.stock || 0)}
                          >
                            <div>
                              <span className="font-bold text-theme-900 block">{p.name}</span>
                              <span className="text-[10px] text-theme-600-text">{p.unit || 'pcs'}</span>
                            </div>
                            <span className="text-xs font-semibold text-theme-700 bg-theme-100 px-2 py-0.5 rounded-md">
                              Stok: {p.stock || 0}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    !lastSearchQuery && (
                      <div className="px-4 py-3 text-sm text-theme-500 text-center">
                        Ketik nama produk atau tekan panah bawah untuk memilih...
                      </div>
                    )
                  )}
                </div>
              )}
            </div>
            
            {selectedProduct && (
              <div className="bg-theme-50 border border-theme-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center border-b border-theme-100 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-theme-500 font-bold uppercase tracking-wider">Produk Terpilih</span>
                    <span className="font-bold text-theme-900">{selectedProduct.name}</span>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded-lg border border-theme-200 text-theme-600-text font-bold shadow-sm">
                    Stok: {selectedProduct.stock}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-500 uppercase mb-1">Qty Keluar</label>
                    <input 
                      ref={qtyInputRef}
                      type="number" 
                      min="1"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(e.target.value ? Number(e.target.value) : '')}
                      onKeyDown={handleFormInputKeyDown}
                      className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white font-bold text-rose-600"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-500 uppercase mb-1">Keterangan (Opsional)</label>
                    <input 
                      type="text" 
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      onKeyDown={handleFormInputKeyDown}
                      className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
                      placeholder="Rusak, dsb"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={handleAddPending}
                    className="flex-1 bg-theme-900 hover:bg-theme-800 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah ke Daftar
                  </button>
                  <button 
                    onClick={handleCancelSelected}
                    className="px-3 bg-white hover:bg-theme-100 border border-theme-200 text-theme-600-text py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            
            {pendingItems.length > 0 && (
              <div className="mt-2 bg-theme-50 p-3 rounded-2xl border border-theme-100">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-theme-900">Akan Dikeluarkan ({pendingItems.length})</span>
                </div>
                <div className="flex flex-col gap-2 max-h-40 overflow-y-auto pr-1">
                  {pendingItems.map((item) => (
                    <div key={item.id} className="p-2 bg-white border border-theme-200 rounded-xl flex items-center justify-between group">
                      <div className="flex flex-col">
                        <span className="font-bold text-theme-900 text-xs">{item.productName}</span>
                        <span className="text-[10px] text-rose-500">Keluarkan: {item.qty} {item.notes && `(${item.notes})`}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.id)}
                        className="p-1.5 text-neutral-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={handleSaveAll}
              disabled={pendingItems.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 text-sm shadow-lg shadow-rose-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengeluaran</span>
              <span className="text-[10px] bg-white/15 px-1.5 py-0.5 rounded font-medium ml-1">Ctrl+S</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* History Data Panel */}
      <div className={`flex-1 bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden flex flex-col min-w-0 ${
        mobileTab === 'history' ? 'flex' : 'hidden lg:flex'
      }`}>
        <div className="p-4 md:p-6 border-b border-theme-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-theme-50/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-sm border border-theme-100">
              <PackageMinus className="w-5 h-5 text-theme-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-theme-900">Riwayat Pengeluaran</h2>
              <p className="text-xs text-theme-600-text">Data stok yang telah dikeluarkan</p>
            </div>
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
            <div className="flex items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-theme-200 shadow-sm shrink-0">
              <div className="flex items-center gap-1.5 px-2 py-1 text-theme-700 text-xs sm:text-sm flex-1">
                <CalendarIcon className="w-3.5 h-3.5 text-theme-400 shrink-0" />
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent outline-none w-full text-xs sm:text-sm"
                />
              </div>
              <span className="text-theme-300 font-bold">-</span>
              <div className="flex items-center gap-1.5 px-2 py-1 text-theme-700 text-xs sm:text-sm flex-1">
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
        
        <div className="flex-1 overflow-auto p-4 md:p-6">
          {filteredStockOuts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <PackageMinus className="w-16 h-16 text-theme-200 mb-4" />
              <h3 className="text-lg font-bold text-theme-900 mb-1">Tidak ada data</h3>
              <p className="text-sm text-theme-600-text max-w-sm">Belum ada catatan pengeluaran stok pada rentang tanggal ini.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredStockOuts.map(s => {
                const product = products.find(p => p.id === s.productId);
                return (
                  <div key={s.id} className="bg-white border border-theme-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative group hover:border-theme-300 hover:shadow-md transition-all">
                    {editStockOutId === s.id ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-theme-500 bg-theme-50 px-2 py-0.5 rounded w-fit">{s.date}</span>
                          <span className="font-bold text-theme-900 text-sm line-clamp-1">{product?.name}</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-theme-500 uppercase">Qty Keluar</label>
                            <input 
                              type="number" 
                              min="1"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm font-bold text-rose-600 outline-none focus:border-theme-500 bg-white"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="text-[10px] font-bold text-theme-500 uppercase">Keterangan</label>
                            <input 
                              type="text" 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
                              placeholder="Keterangan..."
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleSaveStockOut(s, product)} className="flex-1 min-h-[40px] bg-theme-900 text-white rounded-xl py-2 text-xs font-bold hover:bg-theme-800 transition-colors flex justify-center items-center gap-1.5 shadow-sm">
                            <Check className="w-3.5 h-3.5" /> Simpan Perubahan
                          </button>
                          <button onClick={handleCancelEditStockOut} className="min-h-[40px] px-4 bg-white border border-theme-200 text-theme-700 rounded-xl py-2 text-xs font-bold hover:bg-theme-50 transition-colors flex justify-center items-center gap-1">
                            <X className="w-3.5 h-3.5" /> Batal
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
