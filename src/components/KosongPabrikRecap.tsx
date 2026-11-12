import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Factory, Trash2, Maximize2, Minimize2, Edit2, Save, Plus } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { format } from 'date-fns';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';

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
  };

  const handleAddManualProduct = async (name: string) => {
    if (!name.trim()) return;
    try {
      const queryToSave = name.trim();
      setLastSearchQuery('kosong_product', queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory('kosong_product', queryToSave);
      setSearchHistory(updated);

      await addProduct({
        name: name.trim(),
        unit: 'Pcs',
        supplierId: '',
        isKosongPabrik: true,
        kosongPabrikDate: Date.now()
      });
      setIsDropdownOpen(false);
    } catch (e) {
      console.error('Failed to add manual product:', e);
    }
  };


  const handleRemoveKosong = async (product: any) => {
    if (!window.confirm(`Hapus ${product.name} dari daftar Kosong Pabrik?`)) return;
    await updateProduct({ 
      ...product,
      isKosongPabrik: false,
      kosongPabrikDate: undefined
    });
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditSupplierId(product.supplierId);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    await updateProduct({
      ...editingProduct,
      name: editName,
      supplierId: editSupplierId
    });
    setEditingProduct(null);
  };

  return (
    <div className={`flex flex-col gap-6 h-full ${isListFullscreen ? 'fixed inset-0 z-50 bg-theme-50 p-4 md:p-8' : ''}`}>
      {!isListFullscreen && (
        <div className="flex-none bg-white rounded-3xl border border-rose-200 shadow-sm p-4 lg:p-6 transition-all duration-300">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-theme-900">Input Kosong Pabrik</h3>
              <p className="text-xs text-theme-600-text">Tandai produk yang sedang kosong di pabrik</p>
            </div>
          </div>
          
          <div className="relative max-w-lg" ref={dropdownRef}>
            <div className="relative flex items-center w-full px-4 py-3 border border-rose-200 rounded-2xl bg-theme-50 focus-within:ring-2 focus-within:ring-rose-500 focus-within:border-rose-500 transition-all">
              <Search className="w-4 h-4 text-rose-400 mr-2 shrink-0" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsTypingNew(true);
                  setHighlightedIndex(0);
                  setIsDropdownOpen(true);
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
                className="w-full outline-none bg-transparent text-sm text-theme-800"
                placeholder="Cari nama produk..."
              />
              {searchQuery && (
                <X 
                  className="w-4 h-4 text-theme-600-text ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => {
                    setSearchQuery('');
                    setIsTypingNew(false);
                  }} 
                />
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-theme-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto py-1">
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
                            className={`px-4 py-3 cursor-pointer border-b border-theme-50 last:border-0 transition-colors ${
                              idx === highlightedIndex ? 'bg-theme-100 text-theme-900' : 'hover:bg-theme-100'
                            }`}
                            onClick={() => handleSelectProduct(p)}
                          >
                            <div className="font-bold text-sm text-theme-900">{p.name}</div>
                            <div className="text-xs text-theme-600-text mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-4 py-4 text-sm text-theme-600-text text-center">
                        Tidak ada produk ditemukan.
                      </div>
                    )}
                    
                    {searchQuery.trim().length > 0 && (
                      <div
                        className="px-4 py-3 hover:bg-theme-100 cursor-pointer border-t border-theme-200 flex items-center gap-2 text-theme-700"
                        onClick={() => handleAddManualProduct(searchQuery.trim())}
                      >
                        <Plus className="w-4 h-4" />
                        <div className="flex-1 text-left">
                          <div className="font-bold text-sm">Tambah "{searchQuery.trim()}"</div>
                          <div className="text-xs opacity-80 mt-0.5">Input manual ke daftar kosong pabrik</div>
                        </div>
                      </div>
                    )}
                  </>
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
        </div>
      )}

      {/* List */}
      <div className={
        isListFullscreen
          ? "flex-1 bg-white rounded-3xl border border-rose-200 shadow-xl overflow-hidden flex flex-col min-h-0"
          : "flex-1 bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden flex flex-col min-w-0"
      }>
        <div className="p-4 md:p-6 border-b border-theme-200 bg-theme-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-lg text-theme-900">Daftar Kosong Pabrik</h3>
            <span className="px-2.5 py-1 bg-rose-100 text-rose-600 text-xs font-bold rounded-lg">
              {kosongProducts.length} Produk
            </span>
          </div>
          
          <div className="flex items-center gap-2 w-full sm:w-auto">
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

        <div className="flex-1 overflow-auto p-4 md:p-6">
          {filteredKosongProducts.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8 min-h-[300px]">
              <Factory className="w-16 h-16 mb-4 text-theme-300" />
              <p className="font-medium text-theme-600-text">Tidak ada produk kosong pabrik</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredKosongProducts.map(p => {
                const s = suppliers.find(sup => sup.id === p.supplierId);
                return (
                  <div key={p.id} className="bg-white border border-theme-200 rounded-2xl p-4 flex flex-col relative overflow-hidden group hover:border-rose-300 hover:shadow-md transition-all">
                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400"></div>
                    
                    <div className="flex justify-between items-start mb-2 pl-2">
                      <h4 className="font-bold text-theme-900 line-clamp-2 pr-6 leading-tight">{p.name}</h4>
                      <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="text-theme-600-text hover:text-theme-700 hover:bg-theme-100 p-1.5 rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveKosong(p)}
                          className="text-theme-600-text hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
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

      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-theme-200 shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-theme-900">Edit Produk</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-theme-600-text hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Supplier</label>
                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingProduct(null)}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};