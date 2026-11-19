import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Factory, Trash2, Maximize2, Minimize2, Edit2, Plus, Check, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { format } from 'date-fns';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';
import { FloatingFormModal } from './common/FloatingFormModal';
import { cn } from '../lib/utils';

export const KosongPabrikRecap = () => {
  const { products, suppliers, updateProduct, addProduct, reports, updateReport } = useAppContext();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isTypingNew, setIsTypingNew] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSearchQuery, setLastSearchQueryState] = useState(() => getLastSearchQuery('kosong_product'));
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory('kosong_product'));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [listSearchQuery, setListSearchQuery] = useState('');
  const [isListDropdownOpen, setIsListDropdownOpen] = useState(false);
  const [highlightedListIndex, setHighlightedListIndex] = useState(0);
  const listSearchRef = useRef<HTMLDivElement>(null);
  const listSearchInputRef = useRef<HTMLInputElement>(null);
  const [isListFullscreen, setIsListFullscreen] = useState(false);

  // Floating Input Modal State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isFormFullscreen, setIsFormFullscreen] = useState(false);
  const [inputFormError, setInputFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);
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
    setIsDropdownOpen(false);
    setInputFormError(null);
  };

  // Edit State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');

  // Derived Data
  const kosongProducts = useMemo(() => {
    return products
      .filter(p => p.isKosongPabrik)
      .sort((a, b) => (b.kosongPabrikDate || 0) - (a.kosongPabrikDate || 0));
  }, [products]);

  const filteredKosongProducts = useMemo(() => {
    if (!listSearchQuery) return kosongProducts;
    const lowerQuery = listSearchQuery.toLowerCase();
    return kosongProducts.filter(p => (p.name || '').toLowerCase().includes(lowerQuery));
  }, [kosongProducts, listSearchQuery]);

  const filteredProductsForSearch = useMemo(() => {
    const lowerQuery = searchQuery.trim().toLowerCase();
    if (!lowerQuery) {
      return products.filter(p => !p.isKosongPabrik).slice(0, 50);
    }
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(lowerQuery) && !p.isKosongPabrik
    ).slice(0, 50);
  }, [products, searchQuery]);

  // Previous search products for Kosong Pabrik
  const previousProducts = useMemo(() => {
    if (!lastSearchQuery) return [];
    const q = lastSearchQuery.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q) && !p.isKosongPabrik).slice(0, 50);
  }, [products, lastSearchQuery]);

  // Auto-scroll highlighted item into view
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  useEffect(() => {
    if (isListDropdownOpen && listSearchRef.current) {
      const activeEl = listSearchRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedListIndex, isListDropdownOpen]);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (listSearchRef.current && !listSearchRef.current.contains(event.target as Node)) {
        setIsListDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNew || !searchQuery.trim()) && !!lastSearchQuery && previousProducts.length > 0;
    const activeList = isShowingPrevious ? previousProducts : filteredProductsForSearch;

    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
        if (!lastSearchQuery) {
          setIsTypingNew(true);
        }
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
        handleAddManualProduct(searchQuery.trim());
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsTypingNew(false);
    }
  };

  const handleSelectProduct = async (product: any) => {
    const typed = searchQuery.trim();
    const queryToSave = (isTypingNew && typed) ? typed : (lastSearchQuery || product.name).trim();
    if (queryToSave) {
      setLastSearchQuery('kosong_product', queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory('kosong_product', queryToSave);
      setSearchHistory(updated);
    }

    setIsDropdownOpen(false);
    setIsTypingNew(false);
    setSearchQuery('');

    await updateProduct({ 
      ...product,
      isKosongPabrik: true,
      kosongPabrikDate: Date.now()
    });

    // Automatically check existing reports for today
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingReportsToday = reports.filter(r => r.date === today && r.productId === product.id);
    for (const r of existingReportsToday) {
      if (!r.isKosongPabrik) {
        await updateReport({ ...r, isKosongPabrik: true });
      }
    }

    setIsDropdownOpen(false);
    handleCloseForm();
    showToast('success', `${product.name} ditandai sebagai Kosong Pabrik.`);
  };

  const handleAddManualProduct = async (name: string) => {
    if (!name.trim()) {
      setInputFormError('Masukkan nama produk terlebih dahulu.');
      return;
    }
    try {
      const cleanName = name.trim();
      const matchedExisting = products.find(p => (p.name || '').trim().toLowerCase() === cleanName.toLowerCase());
      if (matchedExisting) {
        if (matchedExisting.isKosongPabrik) {
          setInputFormError(`Produk "${matchedExisting.name}" sudah ada di daftar Kosong Pabrik.`);
          return;
        }
        await handleSelectProduct(matchedExisting);
        return;
      }

      setLastSearchQuery('kosong_product', cleanName);
      setLastSearchQueryState(cleanName);
      const updated = addSearchHistory('kosong_product', cleanName);
      setSearchHistory(updated);

      await addProduct({
        name: cleanName,
        unit: 'Pcs',
        supplierId: '',
        isKosongPabrik: true,
        kosongPabrikDate: Date.now()
      });
      setSearchQuery('');
      setIsDropdownOpen(false);
      handleCloseForm();
      showToast('success', `${cleanName} ditambahkan ke daftar Kosong Pabrik.`);
    } catch (e: any) {
      console.error('Failed to add manual product:', e);
      setInputFormError(e?.message || 'Gagal menambahkan produk.');
    }
  };


  const handleRemoveKosong = async (product: any) => {
    if (!window.confirm(`Hapus ${product.name} dari daftar Kosong Pabrik?`)) return;
    await updateProduct({ 
      ...product,
      isKosongPabrik: false,
      kosongPabrikDate: undefined
    });
    showToast('success', `${product.name} dihapus dari daftar Kosong Pabrik.`);
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditSupplierId(product.supplierId);
    setEditFormError(null);
  };

  const handleSaveEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!editingProduct) return;
    if (!editName.trim()) {
      setEditFormError('Nama produk wajib diisi.');
      return;
    }
    await updateProduct({
      ...editingProduct,
      name: editName.trim(),
      supplierId: editSupplierId
    });
    setEditingProduct(null);
    setEditFormError(null);
    showToast('success', 'Perubahan produk berhasil disimpan.');
  };

  return (
    <div className={`flex flex-col gap-6 h-full relative ${isListFullscreen ? 'fixed inset-0 z-50 bg-theme-50 p-4 md:p-8' : ''}`}>
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
      {/* Floating Input Kosong Pabrik Modal */}
      <FloatingFormModal
        isOpen={isFormOpen || isFormFullscreen}
        onClose={handleCloseForm}
        title="Input Kosong Pabrik"
        subtitle="Tandai produk yang sedang kosong dari pabrik"
        icon={<Factory className="w-5 h-5 text-rose-600" />}
        isFullscreen={isFormFullscreen}
        onToggleFullscreen={() => setIsFormFullscreen(!isFormFullscreen)}
        disableEscapeClose={isDropdownOpen}
        maxWidthClass="max-w-lg"
      >
        <div className="space-y-4">
          {inputFormError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{inputFormError}</span>
              </div>
              <button type="button" onClick={() => setInputFormError(null)} className="text-rose-600 hover:text-rose-800 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Cari Produk atau Ketik Nama Baru <span className="text-rose-500">*</span>
            </label>
            <div className="relative w-full" ref={dropdownRef}>
              <div className="relative flex items-center w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all">
                <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setIsTypingNew(true);
                    setHighlightedIndex(0);
                    setIsDropdownOpen(true);
                    if (inputFormError) setInputFormError(null);
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
                  placeholder="Ketik nama produk..."
                />
                {searchQuery && (
                  <X
                    className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-rose-500 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setIsTypingNew(false);
                    }}
                  />
                )}
              </div>

              {isDropdownOpen && (
                <div className="mt-1.5 w-full bg-white border border-neutral-200 rounded-xl shadow-lg max-h-60 overflow-y-auto py-1">
                  {(!isTypingNew || !searchQuery.trim()) && lastSearchQuery && (
                    <PreviousSearchSection
                      lastQuery={lastSearchQuery}
                      results={previousProducts}
                      history={searchHistory}
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
                        clearSearchHistory('kosong_product');
                        setLastSearchQueryState('');
                        setSearchHistory([]);
                      }}
                      renderTitle={(p) => p.name}
                      renderSubtitle={(p) => {
                        const s = suppliers.find(sup => sup.id === p.supplierId);
                        return s?.name || 'Tanpa Supplier';
                      }}
                      keyExtractor={(p) => `prev-kp-${p.id}`}
                    />
                  )}

                  {isTypingNew && (searchQuery.trim() || !lastSearchQuery) ? (
                    <>
                      {filteredProductsForSearch.length > 0 ? (
                        filteredProductsForSearch.map((p, idx) => {
                          const s = suppliers.find(sup => sup.id === p.supplierId);
                          return (
                            <div
                              key={p.id}
                              data-highlighted={idx === highlightedIndex ? 'true' : undefined}
                              onMouseEnter={() => setHighlightedIndex(idx)}
                              className={cn(
                                "px-3.5 py-2.5 cursor-pointer border-b border-neutral-100 last:border-0 transition-colors",
                                idx === highlightedIndex ? "bg-theme-50 text-theme-900" : "hover:bg-neutral-50"
                              )}
                              onClick={() => handleSelectProduct(p)}
                            >
                              <div className="font-semibold text-sm text-neutral-900">{p.name}</div>
                              <div className="text-[11px] text-neutral-500 mt-0.5">{s?.name || 'Tanpa Supplier'}</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="px-4 py-3 text-xs text-neutral-500 text-center">
                          Tidak ada produk ditemukan.
                        </div>
                      )}

                      {searchQuery.trim().length > 0 && (
                        <div
                          className="px-3.5 py-2.5 hover:bg-theme-50 cursor-pointer border-t border-neutral-200 flex items-center gap-2 text-theme-700"
                          onClick={() => handleAddManualProduct(searchQuery.trim())}
                        >
                          <Plus className="w-4 h-4 shrink-0" />
                          <div className="flex-1 text-left">
                            <div className="font-semibold text-xs">Tambah &quot;{searchQuery.trim()}&quot;</div>
                            <div className="text-[11px] text-neutral-500">Input manual ke daftar kosong pabrik</div>
                          </div>
                        </div>
                      )}
                    </>
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
            <p className="text-[11px] text-neutral-500 mt-2">
              Pilih produk dari hasil pencarian atau ketik nama produk baru lalu klik tombol simpan di bawah.
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={handleCloseForm}
              className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => handleAddManualProduct(searchQuery)}
              disabled={!searchQuery.trim()}
              className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center gap-1.5 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
            >
              <Plus className="w-4 h-4" />
              <span>Tandai Kosong Pabrik</span>
            </button>
          </div>
        </div>
      </FloatingFormModal>

      {/* List */}
      <div className={
        isListFullscreen
          ? "flex-1 bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden flex flex-col min-h-0"
          : "flex-1 bg-white rounded-3xl border border-theme-200 shadow-sm overflow-x-clip sm:overflow-hidden flex flex-col min-w-0"
      }>
        <div className={`p-4 sm:p-5 lg:p-6 border-b border-theme-200 bg-theme-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 shrink-0 ${
          isListFullscreen ? '' : 'sticky top-0 sm:static z-20 rounded-t-3xl sm:rounded-none'
        }`}>
          <div className="flex items-center justify-between w-full sm:w-auto gap-3">
            <div className="flex items-center gap-3">
              <h3 className="font-bold text-lg text-theme-900">Daftar Kosong Pabrik</h3>
              <span className="px-2.5 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">
                {kosongProducts.length} Produk
              </span>
            </div>
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 80);
              }}
              className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kosong</span>
            </button>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                setIsFormOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 80);
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 text-white transition-all shadow-sm active:scale-95 whitespace-nowrap shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Input Kosong</span>
            </button>
            <div className="relative w-full sm:w-64" ref={listSearchRef}>
              <Search className="w-4 h-4 text-theme-600-text absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input 
                ref={listSearchInputRef}
                type="text" 
                placeholder="Cari di daftar..."
                value={listSearchQuery}
                onChange={(e) => {
                  setListSearchQuery(e.target.value);
                  setHighlightedListIndex(0);
                  setIsListDropdownOpen(true);
                }}
                onFocus={() => {
                  setIsListDropdownOpen(true);
                  setHighlightedListIndex(0);
                }}
                onKeyDown={(e) => {
                  if (!isListDropdownOpen) {
                    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
                      e.preventDefault();
                      setIsListDropdownOpen(true);
                      setHighlightedListIndex(0);
                    }
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setHighlightedListIndex((prev) => Math.min(prev + 1, Math.max(0, filteredKosongProducts.length - 1)));
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setHighlightedListIndex((prev) => Math.max(prev - 1, 0));
                  } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredKosongProducts.length > 0 && highlightedListIndex >= 0 && highlightedListIndex < filteredKosongProducts.length) {
                      setListSearchQuery(filteredKosongProducts[highlightedListIndex].name);
                    }
                    setIsListDropdownOpen(false);
                  } else if (e.key === 'Escape') {
                    setIsListDropdownOpen(false);
                  }
                }}
                className="w-full pl-9 pr-8 py-2 bg-white border border-theme-200 rounded-xl text-sm focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all"
              />
              {listSearchQuery && (
                <X 
                  className="w-4 h-4 text-neutral-400 hover:text-rose-500 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                  onClick={() => setListSearchQuery('')}
                />
              )}
              {isListDropdownOpen && filteredKosongProducts.length > 0 && (
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-theme-200 rounded-xl shadow-xl max-h-56 overflow-y-auto p-1">
                  {filteredKosongProducts.map((p, idx) => (
                    <div
                      key={`kp-list-${p.id}`}
                      data-highlighted={idx === highlightedListIndex ? 'true' : undefined}
                      onMouseEnter={() => setHighlightedListIndex(idx)}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        setListSearchQuery(p.name);
                        setIsListDropdownOpen(false);
                      }}
                      className={`px-3 py-2 rounded-lg cursor-pointer text-xs font-semibold truncate transition-colors ${
                        idx === highlightedListIndex ? 'bg-theme-100 text-theme-900 font-bold' : 'hover:bg-theme-50 text-theme-800'
                      }`}
                    >
                      {p.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={() => setIsListFullscreen(!isListFullscreen)}
              className="p-2 text-neutral-500 hover:text-theme-700 hover:bg-theme-200 rounded-xl transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm shrink-0"
              title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
            >
              {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-5 lg:p-6">
          {filteredKosongProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8 min-h-[260px]">
              <Factory className="w-16 h-16 mb-4 text-theme-300" />
              <p className="font-medium text-theme-600-text">Tidak ada produk kosong pabrik</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredKosongProducts.map(p => {
                const s = suppliers.find(sup => sup.id === p.supplierId);
                return (
                  <div key={p.id} className="bg-white border border-theme-200 rounded-2xl p-4 flex flex-col relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2 gap-2">
                      <h4 className="font-bold text-theme-900 line-clamp-2 pr-2 leading-tight">{p.name}</h4>
                      <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="text-theme-600-text hover:text-theme-700 hover:bg-theme-100 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveKosong(p)}
                          className="text-theme-600-text hover:text-rose-500 hover:bg-rose-50 p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-lg transition-colors"
                          title="Hapus dari daftar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="text-sm text-theme-600-text mb-3 pl-2">
                      {s?.name || 'Unknown Supplier'}
                    </div>
                    
                    <div className="mt-auto pt-3 border-t border-theme-100 pl-2 flex justify-between items-center text-xs">
                      <span className="text-theme-500 font-medium">Kosong sejak:</span>
                      <span className="text-theme-900 font-bold">
                        {p.kosongPabrikDate ? format(p.kosongPabrikDate, 'dd MMM yyyy') : '-'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal using FloatingFormModal */}
      <FloatingFormModal
        isOpen={Boolean(editingProduct)}
        onClose={() => {
          setEditingProduct(null);
          setEditFormError(null);
        }}
        title="Edit Produk Kosong Pabrik"
        subtitle="Perbarui nama produk atau pemasok utama"
        icon={<Edit2 className="w-4 h-4" />}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveEdit} className="space-y-4">
          {editFormError && (
            <div className="bg-rose-50 border border-rose-200 text-rose-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{editFormError}</span>
              </div>
              <button type="button" onClick={() => setEditFormError(null)} className="text-rose-600 hover:text-rose-800 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Nama Produk <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (editFormError) setEditFormError(null);
              }}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all"
              placeholder="Nama produk..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Pemasok / Supplier
            </label>
            <select
              value={editSupplierId}
              onChange={(e) => setEditSupplierId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all"
            >
              <option value="">Tanpa Supplier</option>
              {suppliers.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                setEditingProduct(null);
                setEditFormError(null);
              }}
              className="px-4 py-2.5 rounded-xl font-semibold text-sm bg-white border border-neutral-300 text-neutral-700 hover:bg-neutral-50 transition-colors whitespace-nowrap"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl font-semibold text-sm bg-theme-600 hover:bg-theme-700 text-white transition-colors shadow-xs flex items-center gap-1.5 whitespace-nowrap active:scale-[0.99]"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>
      </FloatingFormModal>
    </div>
  );
};