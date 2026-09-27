import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, X, Factory, Trash2, Maximize2, Minimize2, Edit2, Save, Plus } from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { format } from 'date-fns';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { SearchHistoryChips } from './SearchHistoryChips';

export const KosongPabrikRecap = () => {
  const { products, suppliers, updateProduct, addProduct, reports, updateReport } = useAppContext();

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory('kosong_product'));
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [listSearchQuery, setListSearchQuery] = useState('');
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
    if (!searchQuery) return [];
    const lowerQuery = searchQuery.toLowerCase();
    return products.filter(p => 
      (p.name || '').toLowerCase().includes(lowerQuery) && !p.isKosongPabrik
    ).slice(0, 50);
  }, [products, searchQuery]);

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectProduct = async (product: any) => {
    if (searchQuery.trim()) {
      const updated = addSearchHistory('kosong_product', searchQuery.trim());
      setSearchHistory(updated);
    }
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
      const updated = addSearchHistory('kosong_product', name.trim());
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
    await updateProduct(editingProduct.id, {
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
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-theme-800"
                placeholder="Cari nama produk..."
              />
              {searchQuery && (
                <X 
                  className="w-4 h-4 text-theme-600-text ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => setSearchQuery('')} 
                />
              )}
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-theme-200 rounded-2xl shadow-xl max-h-60 overflow-y-auto py-2">
                <SearchHistoryChips
                  history={searchHistory}
                  onSelect={(term) => {
                    setSearchQuery(term);
                    setIsDropdownOpen(true);
                  }}
                  onClear={() => {
                    clearSearchHistory('kosong_product');
                    setSearchHistory([]);
                  }}
                />
                {searchQuery ? (
                  <>
                    {filteredProductsForSearch.length > 0 ? (
                      filteredProductsForSearch.map(p => {
                        const s = suppliers.find(sup => sup.id === p.supplierId);
                        return (
                          <div 
                            key={p.id}
                            className="px-4 py-3 hover:bg-theme-100 cursor-pointer border-b border-theme-50 last:border-0"
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
                  searchHistory.length === 0 && (
                    <div className="px-4 py-3 text-sm text-theme-500 text-center">
                      Ketik nama produk untuk mencari...
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
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-theme-600-text absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Cari di daftar..."
                value={listSearchQuery}
                onChange={(e) => setListSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-white border border-theme-200 rounded-xl text-sm focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all"
              />
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