import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Download, Upload, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, X, Filter, Check, Maximize2, Minimize2, Building2, Package, SlidersHorizontal, FileText, AlertCircle, CheckCircle2, RefreshCw } from 'lucide-react';
import { Supplier, Product } from '../types';
import { downloadMasterDataTemplate, parseMasterDataImport, exportProductsToTxt } from '../lib/excel';
import { OperationProgressModal } from './common/OperationProgressModal';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';
import { FloatingFormModal } from './common/FloatingFormModal';
import { cn } from '../lib/utils';

export const MasterData = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addProduct, updateProduct, updateProductsBatch, deleteProduct, importMasterData, resetAllProductStocks } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'suppliers' | 'products'>(() => {
    try {
      const saved = localStorage.getItem('dailyreportpro_master_tab');
      return saved === 'products' ? 'products' : 'suppliers';
    } catch {
      return 'suppliers';
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('dailyreportpro_master_tab', activeTab);
    } catch {
      // Ignore storage errors
    }
  }, [activeTab]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    currentItemName?: string;
    startTime?: number;
  }>({ current: 0, total: 0 });
  
  // Supplier Form & Edit
  const [supplierName, setSupplierName] = useState('');
  const [editingSupplierId, setEditingSupplierId] = useState<string | null>(null);
  
  // List Search States
  const [supplierListSearch, setSupplierListSearch] = useState('');
  const [productListSearch, setProductListSearch] = useState('');
  
  // Product List Supplier Filter State
  const [listSupplierFilter, setListSupplierFilter] = useState('');
  const [listSupplierFilterQuery, setListSupplierFilterQuery] = useState('');
  const [listBottomStockFilter, setListBottomStockFilter] = useState<'all' | 'has' | 'none'>('all');
  const [listCategoryFilter, setListCategoryFilter] = useState('');
  const [listLocationFilter, setListLocationFilter] = useState('');
  const [isListSupplierDropdownOpen, setIsListSupplierDropdownOpen] = useState(false);
  const listSupplierDropdownRef = useRef<HTMLDivElement>(null);
  
  // Product Form
  const [productName, setProductName] = useState('');
  const [productSupplierId, setProductSupplierId] = useState('');
  const [productAlternativeSupplierIds, setProductAlternativeSupplierIds] = useState<string[]>([]);
  const [productUnit, setProductUnit] = useState('pcs');
  const [productBottomStock, setProductBottomStock] = useState<number | ''>('');
  const [productStock, setProductStock] = useState<number | ''>('');
  const [productLocation, setProductLocation] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [isListFullscreen, setIsListFullscreen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isFormFullscreen, setIsFormFullscreen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSavingForm, setIsSavingForm] = useState(false);
  const [toastBanner, setToastBanner] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastBanner({ type, text });
    setTimeout(() => {
      setToastBanner((prev) => (prev?.text === text ? null : prev));
    }, 4000);
  };

  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Product Edit & Search State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [inlineEditProductId, setInlineEditProductId] = useState<string | null>(null);
  const [inlineDraft, setInlineDraft] = useState<{
    name: string;
    unit: string;
    supplierId: string;
    alternativeSupplierIds: string[];
    bottomStock: string;
    stock: string;
    location: string;
    category: string;
  }>({
    name: '',
    unit: 'pcs',
    supplierId: '',
    alternativeSupplierIds: [],
    bottomStock: '',
    stock: '',
    location: '',
    category: ''
  });
  const [isSavingInlineId, setIsSavingInlineId] = useState<string | null>(null);

  // Bulk Bottom Stock Modal State
  const [isBulkBottomStockModalOpen, setIsBulkBottomStockModalOpen] = useState(false);
  const [bulkBottomStockScope, setBulkBottomStockScope] = useState<'none' | 'filtered' | 'all'>('none');
  const [bulkBottomStockValue, setBulkBottomStockValue] = useState<string>('5');
  const [isSavingBulkBottomStock, setIsSavingBulkBottomStock] = useState(false);

  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isTypingNewSupplier, setIsTypingNewSupplier] = useState(false);
  const [highlightedSupplierIndex, setHighlightedSupplierIndex] = useState(0);
  const [highlightedAltSupplierIndex, setHighlightedAltSupplierIndex] = useState(0);
  const productNameInputRef = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const [lastSupplierQuery, setLastSupplierQueryState] = useState(() => getLastSearchQuery('master_supplier'));
  const [supplierSearchHistory, setSupplierSearchHistory] = useState<string[]>(() => getSearchHistory('master_supplier'));
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // List Search Dropdown & Memory
  const [isListSearchDropdownOpen, setIsListSearchDropdownOpen] = useState(false);
  const [isTypingNewListSearch, setIsTypingNewListSearch] = useState(false);
  const [highlightedListSearchIndex, setHighlightedListSearchIndex] = useState(0);
  const [highlightedListSupplierIndex, setHighlightedListSupplierIndex] = useState(0);
  const listSearchRef = useRef<HTMLDivElement>(null);
  const listSearchInputRef = useRef<HTMLInputElement>(null);
  const [lastProductListQuery, setLastProductListQueryState] = useState(() => getLastSearchQuery('master_product_list'));
  const [productListSearchHistory, setProductListSearchHistory] = useState<string[]>(() => getSearchHistory('master_product_list'));
  const [lastSupplierListQuery, setLastSupplierListQueryState] = useState(() => getLastSearchQuery('master_supplier_list'));
  const [supplierListSearchHistory, setSupplierListSearchHistory] = useState<string[]>(() => getSearchHistory('master_supplier_list'));

  const [altSupplierSearchQuery, setAltSupplierSearchQuery] = useState('');
  const [isAltSupplierDropdownOpen, setIsAltSupplierDropdownOpen] = useState(false);
  const altSupplierDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, supplierListSearch, productListSearch, listSupplierFilter, listBottomStockFilter, listCategoryFilter, listLocationFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (listSupplierDropdownRef.current && !listSupplierDropdownRef.current.contains(event.target as Node)) {
        setIsListSupplierDropdownOpen(false);
      }
      if (listSearchRef.current && !listSearchRef.current.contains(event.target as Node)) {
        setIsListSearchDropdownOpen(false);
      }
      if (altSupplierDropdownRef.current && !altSupplierDropdownRef.current.contains(event.target as Node)) {
        setIsAltSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const previousSuppliersForSelect = useMemo(() => {
    if (!lastSupplierQuery) return [];
    const q = lastSupplierQuery.toLowerCase();
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [suppliers, lastSupplierQuery]);

  const previousProductsForListSearch = useMemo(() => {
    if (!lastProductListQuery) return [];
    const q = lastProductListQuery.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [products, lastProductListQuery]);

  const previousSuppliersForListSearch = useMemo(() => {
    if (!lastSupplierListQuery) return [];
    const q = lastSupplierListQuery.toLowerCase();
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [suppliers, lastSupplierListQuery]);

  // Auto-scroll highlighted items into view across all MasterData dropdowns
  useEffect(() => {
    if (isSupplierDropdownOpen && supplierDropdownRef.current) {
      const activeEl = supplierDropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedSupplierIndex, isSupplierDropdownOpen]);

  useEffect(() => {
    if (isAltSupplierDropdownOpen && altSupplierDropdownRef.current) {
      const activeEl = altSupplierDropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedAltSupplierIndex, isAltSupplierDropdownOpen]);

  useEffect(() => {
    if (isListSearchDropdownOpen && listSearchRef.current) {
      const activeEl = listSearchRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedListSearchIndex, isListSearchDropdownOpen]);

  useEffect(() => {
    if (isListSupplierDropdownOpen && listSupplierDropdownRef.current) {
      const activeEl = listSupplierDropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedListSupplierIndex, isListSupplierDropdownOpen]);

  const filteredSuppliersForSelect = useMemo(() => {
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(supplierSearchQuery.toLowerCase()));
  }, [suppliers, supplierSearchQuery]);

  const filteredAltSuppliersForSelect = useMemo(() => {
    return suppliers.filter(s => 
      s.id !== productSupplierId && 
      !(productAlternativeSupplierIds || []).includes(s.id) &&
      (s.name || '').toLowerCase().includes(altSupplierSearchQuery.toLowerCase())
    );
  }, [suppliers, altSupplierSearchQuery, productSupplierId, productAlternativeSupplierIds]);

  const filteredSuppliersForListFilter = useMemo(() => {
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(listSupplierFilterQuery.toLowerCase()));
  }, [suppliers, listSupplierFilterQuery]);

  const handleSelectSupplierForProduct = (s: Supplier) => {
    const typed = supplierSearchQuery.trim();
    const queryToSave = (isTypingNewSupplier && typed) ? typed : (lastSupplierQuery || s.name);
    setProductSupplierId(s.id);
    setSupplierSearchQuery(s.name);
    if (queryToSave) {
      setLastSearchQuery('master_supplier', queryToSave);
      setLastSupplierQueryState(queryToSave);
      const updated = addSearchHistory('master_supplier', queryToSave);
      setSupplierSearchHistory(updated);
    }
    setIsSupplierDropdownOpen(false);
    setIsTypingNewSupplier(false);
  };

  const handleSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNewSupplier || !supplierSearchQuery.trim()) && !!lastSupplierQuery && previousSuppliersForSelect.length > 0;
    const activeList = isShowingPrevious ? previousSuppliersForSelect : filteredSuppliersForSelect;

    if (!isSupplierDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsSupplierDropdownOpen(true);
        setHighlightedSupplierIndex(0);
        if (!lastSupplierQuery) {
          setIsTypingNewSupplier(true);
        }
      }
      // Note: if Enter is pressed while dropdown is closed and supplier is already selected, let form submit naturally
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isShowingPrevious && !isTypingNewSupplier) {
        setIsTypingNewSupplier(true);
        setHighlightedSupplierIndex(0);
        return;
      }
      setHighlightedSupplierIndex((prev) => Math.min(prev + 1, Math.max(0, activeList.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedSupplierIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList.length > 0 && highlightedSupplierIndex >= 0 && highlightedSupplierIndex < activeList.length) {
        handleSelectSupplierForProduct(activeList[highlightedSupplierIndex]);
      } else {
        setIsSupplierDropdownOpen(false);
        setIsTypingNewSupplier(false);
      }
    } else if (e.key === 'Escape') {
      setIsSupplierDropdownOpen(false);
      setIsTypingNewSupplier(false);
    }
  };

  const handleAltSupplierKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isAltSupplierDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsAltSupplierDropdownOpen(true);
        setHighlightedAltSupplierIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedAltSupplierIndex((prev) => Math.min(prev + 1, Math.max(0, filteredAltSuppliersForSelect.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedAltSupplierIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      if (filteredAltSuppliersForSelect.length > 0 && highlightedAltSupplierIndex >= 0 && highlightedAltSupplierIndex < filteredAltSuppliersForSelect.length) {
        e.preventDefault();
        const s = filteredAltSuppliersForSelect[highlightedAltSupplierIndex];
        setProductAlternativeSupplierIds((prev) => [...prev, s.id]);
        setAltSupplierSearchQuery('');
        setIsAltSupplierDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsAltSupplierDropdownOpen(false);
    }
  };

  const handleSubmitSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!supplierName.trim()) {
      setFormError("Nama supplier wajib diisi.");
      return;
    }
    
    setIsSavingForm(true);
    try {
      const wasEditing = Boolean(editingSupplierId);
      if (editingSupplierId) {
        await updateSupplier({ id: editingSupplierId, name: supplierName.trim() });
        setEditingSupplierId(null);
      } else {
        await addSupplier({ name: supplierName.trim() });
      }
      setSupplierName('');
      setIsFormModalOpen(false);
      setIsFormFullscreen(false);
      showToast('success', wasEditing ? 'Data supplier berhasil diperbarui.' : 'Supplier baru berhasil ditambahkan.');
    } catch (err: any) {
      console.error("Gagal menyimpan supplier:", err);
      setFormError(`Gagal menyimpan supplier: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingForm(false);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierName(supplier.name);
    setFormError(null);
    setActiveTab('suppliers');
    setIsFormModalOpen(true);
  };

  const handleCancelEditSupplier = () => {
    setEditingSupplierId(null);
    setSupplierName('');
    setFormError(null);
    setIsFormModalOpen(false);
    setIsFormFullscreen(false);
  };

  const filteredSuppliersList = useMemo(() => {
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(supplierListSearch.toLowerCase()));
  }, [suppliers, supplierListSearch]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.category && p.category.trim()) {
        set.add(p.category.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [products]);

  const locations = useMemo(() => {
    const set = new Set<string>();
    products.forEach(p => {
      if (p.location && p.location.trim()) {
        set.add(p.location.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
  }, [products]);

  const filteredProductsList = useMemo(() => {
    return products.filter(p => {
      const sName = suppliers.find(s => s.id === p.supplierId)?.name.toLowerCase() || '';
      const pName = (p.name || "").toLowerCase();
      const pCat = (p.category || "").toLowerCase();
      const pLoc = (p.location || "").toLowerCase();
      const q = (productListSearch || "").toLowerCase();
      
      const matchSearch = (pName && pName.includes(q)) || 
        (sName && sName.includes(q)) || 
        (pCat && pCat.includes(q)) || 
        (pLoc && pLoc.includes(q));
      const matchSupplier = listSupplierFilter ? p.supplierId === listSupplierFilter : true;
      
      let matchBottomStock = true;
      if (listBottomStockFilter === 'has') {
        matchBottomStock = p.bottomStock !== undefined && p.bottomStock !== null && p.bottomStock > 0;
      } else if (listBottomStockFilter === 'none') {
        matchBottomStock = p.bottomStock === undefined || p.bottomStock === null || p.bottomStock === 0;
      }

      let matchCategory = true;
      if (listCategoryFilter === '__none__') {
        matchCategory = !p.category || !p.category.trim();
      } else if (listCategoryFilter) {
        matchCategory = (p.category || '').trim().toLowerCase() === listCategoryFilter.trim().toLowerCase();
      }

      let matchLocation = true;
      if (listLocationFilter === '__none__') {
        matchLocation = !p.location || !p.location.trim();
      } else if (listLocationFilter) {
        matchLocation = (p.location || '').trim().toLowerCase() === listLocationFilter.trim().toLowerCase();
      }
      
      return matchSearch && matchSupplier && matchBottomStock && matchCategory && matchLocation;
    });
  }, [products, suppliers, productListSearch, listSupplierFilter, listBottomStockFilter, listCategoryFilter, listLocationFilter]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (listSupplierFilter || listSupplierFilterQuery) count++;
    if (listCategoryFilter) count++;
    if (listLocationFilter) count++;
    if (listBottomStockFilter !== 'all') count++;
    return count;
  }, [listSupplierFilter, listSupplierFilterQuery, listCategoryFilter, listLocationFilter, listBottomStockFilter]);

  const paginatedSuppliersList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredSuppliersList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredSuppliersList, currentPage, itemsPerPage]);

  const paginatedProductsList = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredProductsList.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredProductsList, currentPage, itemsPerPage]);

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!productName.trim()) {
      setFormError("Nama produk wajib diisi.");
      productNameInputRef.current?.focus();
      return;
    }
    if (!productSupplierId) {
      setFormError("Supplier utama produk wajib dipilih.");
      supplierInputRef.current?.focus();
      return;
    }
    if (!productUnit.trim()) {
      setFormError("Satuan produk wajib diisi.");
      return;
    }
    
    setIsSavingForm(true);
    try {
      const wasEditing = Boolean(editingProductId);
      if (editingProductId) {
        const existingProduct = products.find(p => p.id === editingProductId);
        await updateProduct({
          ...(existingProduct || {}),
          id: editingProductId,
          name: productName.trim(),
          supplierId: productSupplierId,
          alternativeSupplierIds: productAlternativeSupplierIds || [],
          unit: productUnit.trim(),
          bottomStock: productBottomStock === '' ? (null as any) : Number(productBottomStock),
          stock: productStock === '' ? 0 : Number(productStock),
          location: productLocation.trim() ? productLocation.trim() : (null as any),
          category: productCategory.trim() ? productCategory.trim() : (null as any)
        });
        setEditingProductId(null);
      } else {
        await addProduct({
          name: productName.trim(),
          supplierId: productSupplierId,
          alternativeSupplierIds: productAlternativeSupplierIds || [],
          unit: productUnit.trim(),
          bottomStock: productBottomStock === '' ? undefined : Number(productBottomStock),
          stock: productStock === '' ? 0 : Number(productStock),
          location: productLocation.trim() || undefined,
          category: productCategory.trim() || undefined
        });
      }
      
      setProductName('');
      setProductSupplierId('');
      setProductAlternativeSupplierIds([]);
      setProductUnit('pcs');
      setProductBottomStock('');
      setProductStock('');
      setProductLocation('');
      setProductCategory('');
      setSupplierSearchQuery('');
      setAltSupplierSearchQuery('');
      setIsFormModalOpen(false);
      setIsFormFullscreen(false);
      showToast('success', wasEditing ? 'Data produk berhasil diperbarui.' : 'Produk baru berhasil ditambahkan.');
    } catch (err: any) {
      console.error("Gagal menyimpan produk:", err);
      setFormError(`Gagal menyimpan produk: ${err.message || 'Terjadi kesalahan sistem'}`);
    } finally {
      setIsSavingForm(false);
    }
  };

  // Ctrl + S shortcut to save active Supplier or Product form when modal is open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (!(isFormModalOpen || isFormFullscreen)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (activeTab === 'suppliers' && supplierName.trim()) {
          handleSubmitSupplier(e as any);
        } else if (activeTab === 'products' && productName.trim() && productSupplierId) {
          handleSubmitProduct(e as any);
        }
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  });

  const handleSelectListSearchItem = (name: string) => {
    const key = activeTab === 'suppliers' ? 'master_supplier_list' : 'master_product_list';
    const curVal = (activeTab === 'suppliers' ? supplierListSearch : productListSearch).trim();
    const lastQ = activeTab === 'suppliers' ? lastSupplierListQuery : lastProductListQuery;
    const queryToSave = (isTypingNewListSearch && curVal) ? curVal : (lastQ || name).trim();
    if (queryToSave) {
      setLastSearchQuery(key, queryToSave);
      if (activeTab === 'suppliers') {
        setLastSupplierListQueryState(queryToSave);
        setSupplierListSearchHistory(addSearchHistory(key, queryToSave));
      } else {
        setLastProductListQueryState(queryToSave);
        setProductListSearchHistory(addSearchHistory(key, queryToSave));
      }
    }
    if (activeTab === 'suppliers') {
      setSupplierListSearch(name);
    } else {
      setProductListSearch(name);
    }
    setIsListSearchDropdownOpen(false);
    setIsTypingNewListSearch(false);
  };

  const handleListSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const curVal = (activeTab === 'suppliers' ? supplierListSearch : productListSearch).trim();
    const lastQ = activeTab === 'suppliers' ? lastSupplierListQuery : lastProductListQuery;
    const prevList = activeTab === 'suppliers' ? previousSuppliersForListSearch : previousProductsForListSearch;
    const liveList = activeTab === 'suppliers' ? filteredSuppliersList.slice(0, 50) : filteredProductsList.slice(0, 50);
    const isShowingPrevious = (!isTypingNewListSearch || !curVal) && !!lastQ && prevList.length > 0;
    const activeList = isShowingPrevious ? prevList : liveList;

    if (!isListSearchDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsListSearchDropdownOpen(true);
        setHighlightedListSearchIndex(0);
        if (!lastQ) {
          setIsTypingNewListSearch(true);
        }
      } else if (e.key === 'Enter' && curVal) {
        handleSelectListSearchItem(curVal);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isShowingPrevious && !isTypingNewListSearch) {
        setIsTypingNewListSearch(true);
        setHighlightedListSearchIndex(0);
        return;
      }
      setHighlightedListSearchIndex((prev) => Math.min(prev + 1, Math.max(0, activeList.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedListSearchIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (activeList.length > 0 && highlightedListSearchIndex >= 0 && highlightedListSearchIndex < activeList.length) {
        handleSelectListSearchItem(activeList[highlightedListSearchIndex].name);
      } else if (curVal) {
        handleSelectListSearchItem(curVal);
      }
    } else if (e.key === 'Escape') {
      setIsListSearchDropdownOpen(false);
      setIsTypingNewListSearch(false);
    }
  };

  const handleListSupplierFilterKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isListSupplierDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsListSupplierDropdownOpen(true);
        setHighlightedListSupplierIndex(0);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedListSupplierIndex((prev) => Math.min(prev + 1, Math.max(0, filteredSuppliersForListFilter.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedListSupplierIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredSuppliersForListFilter.length > 0 && highlightedListSupplierIndex >= 0 && highlightedListSupplierIndex < filteredSuppliersForListFilter.length) {
        const s = filteredSuppliersForListFilter[highlightedListSupplierIndex];
        setListSupplierFilter(s.id);
        setListSupplierFilterQuery(s.name);
        setIsListSupplierDropdownOpen(false);
      } else {
        setIsListSupplierDropdownOpen(false);
      }
    } else if (e.key === 'Escape') {
      setIsListSupplierDropdownOpen(false);
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product.id);
    setProductName(product.name || '');
    setProductSupplierId(product.supplierId || '');
    setProductAlternativeSupplierIds(product.alternativeSupplierIds || []);
    setProductUnit(product.unit || 'pcs');
    setProductBottomStock(product.bottomStock ?? '');
    setProductStock(product.stock ?? '');
    setProductLocation(product.location || '');
    setProductCategory(product.category || '');
    setFormError(null);
    
    const sName = suppliers.find(s => s.id === product.supplierId)?.name || '';
    setSupplierSearchQuery(sName);
    setAltSupplierSearchQuery('');
    setActiveTab('products');
    setIsFormModalOpen(true);
    setTimeout(() => {
      productNameInputRef.current?.focus();
    }, 80);
  };

  const handleStartInlineEdit = (product: Product) => {
    setInlineEditProductId(product.id);
    setInlineDraft({
      name: product.name || '',
      unit: product.unit || 'pcs',
      supplierId: product.supplierId || '',
      alternativeSupplierIds: product.alternativeSupplierIds || [],
      bottomStock: product.bottomStock !== undefined && product.bottomStock !== null ? String(product.bottomStock) : '',
      stock: product.stock !== undefined && product.stock !== null ? String(product.stock) : '0',
      location: product.location || '',
      category: product.category || ''
    });
  };

  const handleCancelInlineEdit = () => {
    setInlineEditProductId(null);
  };

  const handleSaveInlineEdit = async (product: Product) => {
    if (!inlineDraft.name.trim()) {
      showToast('error', 'Nama produk wajib diisi.');
      return;
    }
    if (!inlineDraft.supplierId) {
      showToast('error', 'Supplier utama wajib dipilih.');
      return;
    }
    if (!inlineDraft.unit.trim()) {
      showToast('error', 'Satuan produk wajib diisi.');
      return;
    }

    setIsSavingInlineId(product.id);
    try {
      const parsedBottom = inlineDraft.bottomStock.trim() === ''
        ? (null as any)
        : Math.max(0, Number(inlineDraft.bottomStock));
      const parsedStock = inlineDraft.stock.trim() === ''
        ? 0
        : Math.max(0, Number(inlineDraft.stock));

      await updateProduct({
        ...product,
        name: inlineDraft.name.trim(),
        unit: inlineDraft.unit.trim(),
        supplierId: inlineDraft.supplierId,
        alternativeSupplierIds: (inlineDraft.alternativeSupplierIds || []).filter(id => id !== inlineDraft.supplierId),
        bottomStock: isNaN(parsedBottom) ? (null as any) : parsedBottom,
        stock: isNaN(parsedStock) ? 0 : parsedStock,
        location: inlineDraft.location.trim() ? inlineDraft.location.trim() : (null as any),
        category: inlineDraft.category.trim() ? inlineDraft.category.trim() : (null as any)
      });
      setInlineEditProductId(null);
      showToast('success', `Produk "${inlineDraft.name.trim()}" berhasil diperbarui.`);
    } catch (err: any) {
      console.error('Gagal menyimpan perubahan produk:', err);
      showToast('error', `Gagal menyimpan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingInlineId(null);
    }
  };

  const handleInlineQuickBottomStock = async (product: Product, rawValue: string) => {
    const trimmed = rawValue.trim();
    const parsedVal = trimmed === '' ? null : Math.max(0, Number(trimmed));
    if (parsedVal !== null && isNaN(parsedVal)) return;

    const currentVal = product.bottomStock === undefined ? null : product.bottomStock;
    if (parsedVal === currentVal) return;

    try {
      await updateProduct({
        ...product,
        bottomStock: parsedVal === null ? (null as any) : parsedVal
      });
      showToast('success', `Butom stok "${product.name}" disimpan (${parsedVal === null ? 'kosong' : parsedVal}).`);
    } catch (err: any) {
      console.error('Gagal update butom stok:', err);
      showToast('error', `Gagal menyimpan butom stok: ${err?.message || 'Terjadi kesalahan'}`);
    }
  };

  const handleApplyBulkBottomStock = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = bulkBottomStockValue.trim();
    const numVal = trimmed === '' ? null : Math.max(0, Number(trimmed));
    if (trimmed !== '' && (numVal === null || isNaN(numVal))) {
      showToast('error', 'Masukkan angka butom stok yang valid.');
      return;
    }

    let targets: Product[] = [];
    if (bulkBottomStockScope === 'none') {
      targets = products.filter(p => p.bottomStock === undefined || p.bottomStock === null || p.bottomStock === 0);
    } else if (bulkBottomStockScope === 'filtered') {
      targets = filteredProductsList;
    } else {
      targets = products;
    }

    if (targets.length === 0) {
      showToast('error', 'Tidak ada produk pada target yang dipilih.');
      return;
    }

    setIsSavingBulkBottomStock(true);
    try {
      const updated = targets.map(p => ({
        ...p,
        bottomStock: numVal === null ? (null as any) : numVal
      }));
      await updateProductsBatch(updated);
      setIsBulkBottomStockModalOpen(false);
      showToast('success', `Butom stok (${numVal === null ? 'dikosongkan' : numVal}) berhasil diterapkan ke ${targets.length} produk.`);
    } catch (err: any) {
      console.error('Gagal menerapkan butom stok massal:', err);
      showToast('error', `Gagal menyimpan: ${err?.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSavingBulkBottomStock(false);
    }
  };

  const handleResetProductFields = () => {
    setProductName('');
    setProductSupplierId('');
    setProductAlternativeSupplierIds([]);
    setProductUnit('pcs');
    setProductBottomStock('');
    setProductStock('');
    setProductLocation('');
    setProductCategory('');
    setSupplierSearchQuery('');
    setAltSupplierSearchQuery('');
    setFormError(null);
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    handleResetProductFields();
    setIsFormModalOpen(false);
    setIsFormFullscreen(false);
  };

  const handleCloseFormModal = () => {
    setIsSupplierDropdownOpen(false);
    setIsAltSupplierDropdownOpen(false);
    setFormError(null);
    if (editingSupplierId) {
      handleCancelEditSupplier();
      return;
    }
    if (editingProductId) {
      handleCancelEditProduct();
      return;
    }
    setIsFormModalOpen(false);
    setIsFormFullscreen(false);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { suppliers: newSuppliers, products: newProducts, errors: parseErrors } = await parseMasterDataImport(file);
      
      const totalItems = newSuppliers.length + newProducts.length;
      if (totalItems === 0 && parseErrors.length === 0) {
        showToast('error', "Tidak ada data valid di file template.");
        return;
      }

      let dbErrors: string[] = [];
      if (totalItems > 0) {
        setIsImporting(true);
        const startTime = Date.now();
        setImportProgress({
          current: 0,
          total: totalItems,
          currentItemName: 'Mempersiapkan data...',
          startTime
        });

        const importRes = await importMasterData(newSuppliers, newProducts, (current, total, itemName) => {
          setImportProgress({
            current,
            total,
            currentItemName: itemName,
            startTime
          });
        });
        dbErrors = importRes.errors;

        await new Promise(resolve => setTimeout(resolve, 400));
        setIsImporting(false);
        showToast(
          'success',
          `Impor selesai: ${importRes.addedSuppliers} supplier, ${importRes.addedProducts} item baru, ${importRes.updatedProducts} diperbarui.`
        );
      }

      const allErrors = [...parseErrors, ...dbErrors];
      if (allErrors.length > 0) {
        setImportErrors(allErrors);
      }
    } catch (err: any) {
      console.error(err);
      showToast('error', "Gagal membaca file: " + (err?.message || "Format tidak sesuai."));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleExportProductsTxt = () => {
    if (filteredProductsList.length === 0) return;

    const filterParts: string[] = [];
    if (productListSearch.trim()) {
      filterParts.push(`Pencarian: "${productListSearch.trim()}"`);
    }
    if (listSupplierFilter) {
      const supName = suppliers.find(s => s.id === listSupplierFilter)?.name || listSupplierFilter;
      filterParts.push(`Supplier: ${supName}`);
    }
    if (listCategoryFilter) {
      filterParts.push(`Kategori: ${listCategoryFilter === '__none__' ? 'Tanpa Kategori' : listCategoryFilter}`);
    }
    if (listLocationFilter) {
      filterParts.push(`Lokasi: ${listLocationFilter === '__none__' ? 'Tanpa Lokasi' : listLocationFilter}`);
    }
    if (listBottomStockFilter !== 'all') {
      filterParts.push(`Butom Stok: ${listBottomStockFilter === 'has' ? 'Punya Butom' : 'Tanpa Butom'}`);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const filename = filterParts.length > 0
      ? `Master_Data_Produk_Filter_${todayStr}`
      : `Master_Data_Produk_${todayStr}`;

    exportProductsToTxt(
      filteredProductsList,
      suppliers,
      filename,
      filterParts.length > 0 ? filterParts.join(' | ') : undefined
    );
  };

  const totalItems = activeTab === 'suppliers' ? filteredSuppliersList.length : filteredProductsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-x-clip sm:overflow-hidden flex flex-col min-h-0 sm:h-full sm:min-h-[500px]">
      {/* Tabs & Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-theme-200 gap-2.5 sm:gap-2 p-3 sm:px-4 sm:py-0 lg:px-0 shrink-0">
        <div className="flex bg-theme-100/70 sm:bg-transparent p-1 sm:p-0 rounded-2xl sm:rounded-none">
          <button
            onClick={() => {
              setActiveTab('suppliers');
              setIsFormModalOpen(false);
              setIsFormFullscreen(false);
            }}
            className={`flex-1 sm:flex-none px-3.5 sm:px-5 lg:px-8 py-2.5 sm:py-3.5 lg:py-4 text-xs sm:text-sm font-bold sm:font-medium text-center transition-all rounded-xl sm:rounded-none flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'suppliers' 
                ? 'bg-white sm:bg-neutral-50 text-neutral-900 shadow-sm sm:shadow-none sm:border-b-2 sm:border-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Building2 className="w-4 h-4 lg:hidden text-theme-500 shrink-0" />
            <span>Suppliers</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-theme-200/70 text-theme-800">
              {suppliers.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              setIsFormModalOpen(false);
              setIsFormFullscreen(false);
            }}
            className={`flex-1 sm:flex-none px-3.5 sm:px-5 lg:px-8 py-2.5 sm:py-3.5 lg:py-4 text-xs sm:text-sm font-bold sm:font-medium text-center transition-all rounded-xl sm:rounded-none flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap ${
              activeTab === 'products' 
                ? 'bg-white sm:bg-neutral-50 text-neutral-900 shadow-sm sm:shadow-none sm:border-b-2 sm:border-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Package className="w-4 h-4 lg:hidden text-theme-500 shrink-0" />
            <span>Products</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-theme-200/70 text-theme-800">
              {products.length}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 px-0.5 sm:px-0 lg:pr-6 justify-end shrink-0">
          <button 
            onClick={() => downloadMasterDataTemplate(suppliers, products)}
            className="group flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm active:scale-[0.98] whitespace-nowrap"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform shrink-0" /> 
            <span>Template</span>
          </button>
          <label className="group flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm cursor-pointer active:scale-[0.98] whitespace-nowrap">
            <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform shrink-0" /> 
            <span>Import</span>
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImport}
            />
          </label>
        </div>
      </div>

      <div className="flex-1 min-h-0 p-3 sm:p-4 lg:p-6 flex flex-col gap-4 sm:overflow-hidden relative">
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
          isOpen={isFormModalOpen || isFormFullscreen}
          onClose={handleCloseFormModal}
          title={
            activeTab === 'suppliers'
              ? (editingSupplierId ? 'Edit Supplier' : 'Tambah Supplier Baru')
              : (editingProductId ? 'Edit Produk' : 'Tambah Produk Baru')
          }
          subtitle={
            activeTab === 'suppliers'
              ? 'Kelola identitas pemasok atau distributor resmi'
              : 'Lengkapi rincian produk, stok awal, batas minimum, dan pemasok'
          }
          icon={activeTab === 'suppliers' ? <Building2 className="w-5 h-5" /> : <Package className="w-5 h-5" />}
          isFullscreen={isFormFullscreen}
          onToggleFullscreen={() => setIsFormFullscreen(!isFormFullscreen)}
          disableEscapeClose={isSupplierDropdownOpen || isAltSupplierDropdownOpen}
          maxWidthClass={activeTab === 'suppliers' ? 'max-w-md' : 'max-w-2xl'}
        >
          {activeTab === 'suppliers' ? (
            <form onSubmit={handleSubmitSupplier} className="space-y-5">
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

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Nama Pemasok / Supplier <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={supplierName}
                  onChange={(e) => {
                    setSupplierName(e.target.value);
                    if (formError) setFormError(null);
                  }}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                  placeholder="Contoh: PT Maju Bersama"
                />
              </div>

              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={handleCloseFormModal}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingForm}
                  className="px-5 py-2.5 bg-theme-600 hover:bg-theme-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-60 active:scale-[0.99]"
                >
                  {isSavingForm ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : editingSupplierId ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Simpan Perubahan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Simpan Supplier</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitProduct} className="space-y-5">
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

              {/* Section 1: Informasi Utama Produk */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  1. Informasi Utama Produk
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Nama Produk <span className="text-rose-500">*</span>
                  </label>
                  <input
                    ref={productNameInputRef}
                    type="text"
                    required
                    value={productName}
                    onChange={(e) => {
                      setProductName(e.target.value);
                      if (formError) setFormError(null);
                    }}
                    className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                    placeholder="Contoh: Paracetamol 500mg Strip"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Satuan <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      list="master-product-units"
                      value={productUnit}
                      onChange={(e) => setProductUnit(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                      placeholder="Contoh: pcs, box, strip, fls"
                    />
                    <datalist id="master-product-units">
                      <option value="pcs" />
                      <option value="box" />
                      <option value="strip" />
                      <option value="botol" />
                      <option value="fls" />
                      <option value="tube" />
                      <option value="sachet" />
                      <option value="pack" />
                      <option value="dus" />
                      <option value="kg" />
                      <option value="liter" />
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Kategori
                    </label>
                    <input
                      type="text"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                      placeholder="Contoh: Obat Bebas (opsional)"
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Inventori & Lokasi */}
              <div className="pt-4 border-t border-neutral-200/80 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  2. Inventori &amp; Lokasi Penyimpanan
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Stok Awal
                    </label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={productStock}
                      onChange={(e) => setProductStock(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold text-neutral-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:font-normal placeholder:text-neutral-400"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Butom Stok (Batas Min)
                    </label>
                    <input
                      type="number"
                      min="0"
                      inputMode="numeric"
                      value={productBottomStock}
                      onChange={(e) => setProductBottomStock(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                      className="w-full px-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-semibold text-amber-950 tabular-nums focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:font-normal placeholder:text-amber-500/70"
                      placeholder="Isi batas minimum..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Lokasi Rak
                    </label>
                    <input
                      type="text"
                      value={productLocation}
                      onChange={(e) => setProductLocation(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all placeholder:text-neutral-400"
                      placeholder="Contoh: Rak A1"
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Pemasok */}
              <div className="pt-4 border-t border-neutral-200/80 space-y-3">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                  3. Pemasok (Supplier)
                </h4>

                <div>
                  <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                    Supplier Utama <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative" ref={supplierDropdownRef}>
                    <div
                      className={cn(
                        "flex items-center w-full px-3.5 py-2.5 border rounded-xl bg-neutral-50 transition-all cursor-text",
                        isSupplierDropdownOpen
                          ? "bg-white border-theme-500 ring-2 ring-theme-500"
                          : "border-neutral-300 focus-within:bg-white focus-within:border-theme-500 focus-within:ring-2 focus-within:ring-theme-500"
                      )}
                      onClick={() => {
                        setIsSupplierDropdownOpen(true);
                        setIsTypingNewSupplier(false);
                        setHighlightedSupplierIndex(0);
                        supplierInputRef.current?.select();
                      }}
                    >
                      <Search className="w-4 h-4 text-neutral-400 mr-2.5 shrink-0" />
                      <input
                        ref={supplierInputRef}
                        type="text"
                        className="bg-transparent outline-none w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400"
                        placeholder="Cari dan pilih supplier utama..."
                        value={supplierSearchQuery}
                        onChange={(e) => {
                          setSupplierSearchQuery(e.target.value);
                          setProductSupplierId('');
                          setIsTypingNewSupplier(true);
                          setHighlightedSupplierIndex(0);
                          setIsSupplierDropdownOpen(true);
                        }}
                        onFocus={() => {
                          setIsSupplierDropdownOpen(true);
                          setIsTypingNewSupplier(false);
                          setHighlightedSupplierIndex(0);
                          supplierInputRef.current?.select();
                        }}
                        onKeyDown={handleSupplierKeyDown}
                      />
                      {supplierSearchQuery && (
                        <X
                          className="w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer hover:text-rose-500 transition-colors"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSupplierSearchQuery('');
                            setProductSupplierId('');
                            setIsTypingNewSupplier(false);
                          }}
                        />
                      )}
                      <ChevronDown
                        className={cn(
                          "w-4 h-4 text-neutral-400 ml-1.5 shrink-0 cursor-pointer transition-transform",
                          isSupplierDropdownOpen && "rotate-180 text-theme-600"
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                          setIsTypingNewSupplier(false);
                        }}
                      />
                    </div>

                    {isSupplierDropdownOpen && (
                      <div className="absolute z-50 w-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                        {(!isTypingNewSupplier || !supplierSearchQuery.trim()) && lastSupplierQuery && (
                          <PreviousSearchSection
                            lastQuery={lastSupplierQuery}
                            results={previousSuppliersForSelect}
                            history={supplierSearchHistory}
                            highlightedIndex={highlightedSupplierIndex}
                            onHighlightIndex={setHighlightedSupplierIndex}
                            onSelectResult={(s) => handleSelectSupplierForProduct(s)}
                            onSelectQuery={(term) => {
                              setSupplierSearchQuery(term);
                              setIsTypingNewSupplier(false);
                              setHighlightedSupplierIndex(0);
                              setIsSupplierDropdownOpen(true);
                            }}
                            onClearHistory={() => {
                              clearSearchHistory('master_supplier');
                              setLastSupplierQueryState('');
                              setSupplierSearchHistory([]);
                            }}
                            renderTitle={(s) => s.name}
                            keyExtractor={(s) => `prev-ms-${s.id}`}
                          />
                        )}

                        {isTypingNewSupplier && (supplierSearchQuery.trim() || !lastSupplierQuery) ? (
                          filteredSuppliersForSelect.length > 0 ? (
                            filteredSuppliersForSelect.map((s, idx) => (
                              <div
                                key={s.id}
                                data-highlighted={idx === highlightedSupplierIndex ? 'true' : undefined}
                                onMouseEnter={() => setHighlightedSupplierIndex(idx)}
                                className={cn(
                                  "px-3.5 py-2.5 cursor-pointer text-sm font-medium transition-colors border-b border-neutral-100 last:border-0",
                                  idx === highlightedSupplierIndex ? "bg-theme-50 text-theme-900 font-semibold" : "hover:bg-neutral-50 text-neutral-800"
                                )}
                                onClick={() => handleSelectSupplierForProduct(s)}
                              >
                                {s.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-xs text-neutral-500">
                              Supplier tidak ditemukan.
                            </div>
                          )
                        ) : (
                          !lastSupplierQuery && (
                            <div className="px-4 py-3 text-center text-xs text-neutral-500">
                              Ketik nama supplier atau tekan panah bawah untuk memilih.
                            </div>
                          )
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {productSupplierId && (
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                      Supplier Alternatif (Opsional)
                    </label>
                    {productAlternativeSupplierIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {productAlternativeSupplierIds.map(id => {
                          const sName = suppliers.find(s => s.id === id)?.name || id;
                          return (
                            <span
                              key={id}
                              className="inline-flex items-center gap-1.5 bg-theme-50 border border-theme-200 text-theme-800 px-2.5 py-1 rounded-lg text-xs font-medium"
                            >
                              <span>{sName}</span>
                              <button
                                type="button"
                                onClick={() => setProductAlternativeSupplierIds(prev => prev.filter(x => x !== id))}
                                className="text-theme-500 hover:text-rose-600 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}
                    <div className="relative" ref={altSupplierDropdownRef}>
                      <div className="flex items-center w-full px-3.5 py-2.5 border border-neutral-300 rounded-xl bg-neutral-50 focus-within:bg-white focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all">
                        <input
                          type="text"
                          className="bg-transparent outline-none w-full text-sm font-medium text-neutral-900 placeholder:text-neutral-400"
                          placeholder="Cari supplier alternatif untuk ditambahkan..."
                          value={altSupplierSearchQuery}
                          onChange={(e) => {
                            setAltSupplierSearchQuery(e.target.value);
                            setHighlightedAltSupplierIndex(0);
                            setIsAltSupplierDropdownOpen(true);
                          }}
                          onFocus={() => {
                            setIsAltSupplierDropdownOpen(true);
                            setHighlightedAltSupplierIndex(0);
                          }}
                          onKeyDown={handleAltSupplierKeyDown}
                        />
                        <ChevronDown className={cn("w-4 h-4 text-neutral-400 ml-1.5 shrink-0 transition-transform", isAltSupplierDropdownOpen && "rotate-180")} />
                      </div>
                      {isAltSupplierDropdownOpen && (
                        <div className="absolute z-50 w-full mt-1.5 bg-white border border-neutral-200 rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                          {filteredAltSuppliersForSelect.length > 0 ? (
                            filteredAltSuppliersForSelect.map((s, idx) => (
                              <div
                                key={s.id}
                                data-highlighted={idx === highlightedAltSupplierIndex ? 'true' : undefined}
                                onMouseEnter={() => setHighlightedAltSupplierIndex(idx)}
                                className={cn(
                                  "px-3.5 py-2.5 cursor-pointer text-sm font-medium transition-colors border-b border-neutral-100 last:border-0",
                                  idx === highlightedAltSupplierIndex ? "bg-theme-50 text-theme-900 font-semibold" : "hover:bg-neutral-50 text-neutral-800"
                                )}
                                onClick={() => {
                                  setProductAlternativeSupplierIds(prev => [...prev, s.id]);
                                  setAltSupplierSearchQuery('');
                                  setIsAltSupplierDropdownOpen(false);
                                }}
                              >
                                {s.name}
                              </div>
                            ))
                          ) : (
                            <div className="px-4 py-3 text-center text-xs text-neutral-500">
                              Tidak ada supplier lain tersedia.
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {suppliers.length === 0 && (
                  <p className="text-xs text-rose-600 font-medium">
                    Belum ada data supplier. Tambahkan supplier terlebih dahulu pada tab Suppliers.
                  </p>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-neutral-200 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5">
                {!editingProductId ? (
                  <button
                    type="button"
                    onClick={handleResetProductFields}
                    className="px-3.5 py-2.5 text-xs font-semibold text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-xl transition-colors flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Reset Form</span>
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleCloseFormModal}
                    className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl font-semibold text-sm transition-colors whitespace-nowrap"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingForm || suppliers.length === 0}
                    className="px-5 py-2.5 bg-theme-600 hover:bg-theme-700 text-white rounded-xl font-semibold text-sm shadow-sm transition-all flex items-center justify-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]"
                  >
                    {isSavingForm ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : editingProductId ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Simpan Perubahan</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Simpan Produk</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </FloatingFormModal>

        {/* List Section (Always Full Width) */}
        <div className={
          isListFullscreen && activeTab === 'products'
            ? "fixed inset-0 z-[100] bg-theme-50 p-3 sm:p-6 md:p-8 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden"
            : "flex-1 flex flex-col min-w-0 sm:min-h-0 sm:overflow-hidden"
        }>
          <div className={`flex flex-col gap-3 mb-4 shrink-0 ${
            isListFullscreen && activeTab === 'products'
              ? ''
              : 'sticky top-0 sm:static z-20 bg-white/95 sm:bg-transparent backdrop-blur-xs sm:backdrop-blur-none py-2 sm:py-0 -mx-3 px-3 sm:mx-0 sm:px-0 border-b border-theme-100 sm:border-b-0'
          }`}>
            {/* Header: Title & Quick Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-theme-900 text-sm sm:text-base">
                  {activeTab === 'suppliers' ? 'Daftar Supplier' : 'Daftar Produk'}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-100 text-theme-700">
                  {totalItems}
                </span>
              </div>
              
              <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    if (activeTab === 'suppliers') {
                      setEditingSupplierId(null);
                      setSupplierName('');
                    } else {
                      setEditingProductId(null);
                      handleResetProductFields();
                      setTimeout(() => productNameInputRef.current?.focus(), 80);
                    }
                    setIsFormModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 text-white transition-all shadow-sm active:scale-95 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah {activeTab === 'suppliers' ? 'Supplier' : 'Produk'}</span>
                </button>

                {activeTab === 'products' && (
                  <>
                    <button
                      onClick={() => setIsListFullscreen(!isListFullscreen)}
                      className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-200 rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm"
                      title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
                    >
                      {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const hasNoBottomCount = products.filter(p => p.bottomStock === undefined || p.bottomStock === null || p.bottomStock === 0).length;
                        setBulkBottomStockScope(hasNoBottomCount > 0 ? 'none' : 'filtered');
                        setIsBulkBottomStockModalOpen(true);
                      }}
                      disabled={products.length === 0}
                      className="px-2.5 py-1.5 text-theme-700 hover:bg-theme-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                      title="Setting Butom Stok Massal"
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Set Butom Stok</span>
                      <span className="sm:hidden">Butom</span>
                    </button>
                    <button
                      onClick={handleExportProductsTxt}
                      disabled={filteredProductsList.length === 0}
                      className="px-2.5 py-1.5 text-emerald-700 hover:bg-emerald-50 disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors active:scale-95 bg-white border border-emerald-200 shadow-sm flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                      title={filteredProductsList.length === 0 ? "Tidak ada data produk untuk diexport" : `Export ${filteredProductsList.length} nama item produk ke file .txt`}
                    >
                      <FileText className="w-3.5 h-3.5 shrink-0" />
                      <span className="hidden sm:inline">Export TXT</span>
                      <span className="sm:hidden">TXT</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm("AWAS: Apakah Anda yakin ingin mengatur SEMUA stok produk menjadi 0? Tindakan ini tidak dapat dibatalkan!")) {
                          await resetAllProductStocks();
                          alert("Semua stok produk berhasil di-nol-kan.");
                        }
                      }}
                      className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95 bg-white border border-rose-200 shadow-sm flex items-center gap-1.5 text-xs font-bold whitespace-nowrap"
                      title="Jadikan Semua Stok 0"
                    >
                      <Trash2 className="w-3.5 h-3.5 shrink-0" /> 
                      <span className="hidden sm:inline">Reset Semua Stok</span>
                      <span className="sm:hidden">Reset Stok</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Search & Mobile Filter Toggle Row */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search Bar */}
              <div className="relative flex-1" ref={listSearchRef}>
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  ref={listSearchInputRef}
                  type="text"
                  placeholder={activeTab === 'suppliers' ? "Cari nama supplier atau ID..." : "Cari produk, kategori, lokasi, supplier..."}
                  value={activeTab === 'suppliers' ? supplierListSearch : productListSearch}
                  onChange={(e) => {
                    if (activeTab === 'suppliers') {
                      setSupplierListSearch(e.target.value);
                    } else {
                      setProductListSearch(e.target.value);
                    }
                    setIsTypingNewListSearch(true);
                    setHighlightedListSearchIndex(0);
                    setIsListSearchDropdownOpen(true);
                  }}
                  onClick={() => {
                    setIsListSearchDropdownOpen(true);
                    setIsTypingNewListSearch(false);
                    setHighlightedListSearchIndex(0);
                    listSearchInputRef.current?.select();
                  }}
                  onFocus={() => {
                    setIsListSearchDropdownOpen(true);
                    setIsTypingNewListSearch(false);
                    setHighlightedListSearchIndex(0);
                    listSearchInputRef.current?.select();
                  }}
                  onKeyDown={handleListSearchKeyDown}
                  className="w-full pl-9 pr-8 py-2 border border-neutral-200 rounded-xl bg-white focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-xs sm:text-sm text-neutral-800"
                />
                {(activeTab === 'suppliers' ? supplierListSearch : productListSearch) && (
                  <button 
                    onClick={() => {
                      if (activeTab === 'suppliers') {
                        setSupplierListSearch('');
                      } else {
                        setProductListSearch('');
                      }
                      setIsTypingNewListSearch(false);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Dropdown for Previous & Live Search Results */}
                {isListSearchDropdownOpen && (
                  <div className="absolute left-0 z-50 mt-1 w-full sm:w-80 max-w-[calc(100vw-2rem)] bg-white border border-theme-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
                    {(!isTypingNewListSearch || !(activeTab === 'suppliers' ? supplierListSearch : productListSearch).trim()) && (
                      <>
                        {activeTab === 'products' && lastProductListQuery && (
                          <PreviousSearchSection
                            lastQuery={lastProductListQuery}
                            results={previousProductsForListSearch}
                            history={productListSearchHistory}
                            highlightedIndex={highlightedListSearchIndex}
                            onHighlightIndex={setHighlightedListSearchIndex}
                            onSelectResult={(p) => handleSelectListSearchItem(p.name)}
                            onSelectQuery={(term) => {
                              setProductListSearch(term);
                              setIsTypingNewListSearch(false);
                              setHighlightedListSearchIndex(0);
                              setIsListSearchDropdownOpen(true);
                            }}
                            onClearHistory={() => {
                              clearSearchHistory('master_product_list');
                              setLastProductListQueryState('');
                              setProductListSearchHistory([]);
                            }}
                            renderTitle={(p) => p.name}
                            keyExtractor={(p) => `prev-mpl-${p.id}`}
                          />
                        )}

                        {activeTab === 'suppliers' && lastSupplierListQuery && (
                          <PreviousSearchSection
                            lastQuery={lastSupplierListQuery}
                            results={previousSuppliersForListSearch}
                            history={supplierListSearchHistory}
                            highlightedIndex={highlightedListSearchIndex}
                            onHighlightIndex={setHighlightedListSearchIndex}
                            onSelectResult={(s) => handleSelectListSearchItem(s.name)}
                            onSelectQuery={(term) => {
                              setSupplierListSearch(term);
                              setIsTypingNewListSearch(false);
                              setHighlightedListSearchIndex(0);
                              setIsListSearchDropdownOpen(true);
                            }}
                            onClearHistory={() => {
                              clearSearchHistory('master_supplier_list');
                              setLastSupplierListQueryState('');
                              setSupplierListSearchHistory([]);
                            }}
                            renderTitle={(s) => s.name}
                            keyExtractor={(s) => `prev-msl-${s.id}`}
                          />
                        )}
                      </>
                    )}

                    {isTypingNewListSearch && ((activeTab === 'suppliers' ? supplierListSearch : productListSearch).trim() || !(activeTab === 'suppliers' ? lastSupplierListQuery : lastProductListQuery)) && (
                      <div>
                        <div className="px-2.5 py-1 text-[10px] font-bold text-neutral-400 uppercase">
                          Hasil Pencarian ({activeTab === 'suppliers' ? filteredSuppliersList.slice(0, 50).length : filteredProductsList.slice(0, 50).length})
                        </div>
                        {(activeTab === 'suppliers' ? filteredSuppliersList : filteredProductsList).length === 0 ? (
                          <div className="p-3 text-xs text-neutral-400 text-center">
                            Tidak ditemukan hasil
                          </div>
                        ) : (
                          (activeTab === 'suppliers' ? filteredSuppliersList.slice(0, 50) : filteredProductsList.slice(0, 50)).map((item: any, idx: number) => (
                            <div
                              key={`mls-live-${item.id}`}
                              data-highlighted={idx === highlightedListSearchIndex ? 'true' : undefined}
                              onMouseEnter={() => setHighlightedListSearchIndex(idx)}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleSelectListSearchItem(item.name);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg cursor-pointer text-xs font-semibold truncate transition-colors ${
                                idx === highlightedListSearchIndex ? 'bg-theme-100 text-theme-900 font-bold' : 'hover:bg-theme-50 text-neutral-800'
                              }`}
                            >
                              {item.name}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Mobile Filter Button (Products tab only) */}
              {activeTab === 'products' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsMobileFilterOpen(!isMobileFilterOpen)}
                    className={`sm:hidden flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border transition-colors ${
                      activeFilterCount > 0 || isMobileFilterOpen
                        ? 'bg-theme-100 border-theme-300 text-theme-800'
                        : 'bg-white border-neutral-200 text-neutral-700'
                    }`}
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5 text-theme-600" />
                    <span>Filter</span>
                    {activeFilterCount > 0 && (
                      <span className="bg-theme-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {activeFilterCount}
                      </span>
                    )}
                  </button>

                  {(listSupplierFilter || listSupplierFilterQuery || listBottomStockFilter !== 'all' || listCategoryFilter || listLocationFilter || productListSearch) && (
                    <button 
                      onClick={() => { 
                        setListSupplierFilter(''); 
                        setListSupplierFilterQuery(''); 
                        setListBottomStockFilter('all'); 
                        setListCategoryFilter('');
                        setListLocationFilter('');
                        setProductListSearch('');
                      }}
                      className="text-xs flex items-center gap-1 text-rose-500 hover:text-rose-700 font-bold whitespace-nowrap px-2 py-2"
                    >
                      <X className="w-3.5 h-3.5" /> Reset
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Filter Dropdowns: Collapsible on Mobile, 2x2 grid on Tablet (sm-md), inline flex on lg+ */}
            {activeTab === 'products' && (
              <div className={`${isMobileFilterOpen ? 'grid' : 'hidden'} sm:grid sm:grid-cols-2 lg:flex lg:flex-wrap items-center gap-2 grid-cols-2 pt-2 border-t border-neutral-100 sm:border-0 sm:pt-0`}>
                {/* Supplier Filter */}
                <div className="relative col-span-2 sm:col-span-1 lg:w-36 xl:w-40" ref={listSupplierDropdownRef}>
                  <div className="flex items-center gap-1.5 bg-white border border-neutral-200 rounded-xl px-2.5 py-1.5 focus-within:border-neutral-400 focus-within:ring-1 focus-within:ring-neutral-400 transition-all">
                    <Filter className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <input 
                      type="text"
                      value={listSupplierFilterQuery}
                      onChange={(e) => {
                        setListSupplierFilterQuery(e.target.value);
                        setListSupplierFilter('');
                        setHighlightedListSupplierIndex(0);
                        setIsListSupplierDropdownOpen(true);
                      }}
                      onFocus={() => {
                        setIsListSupplierDropdownOpen(true);
                        setHighlightedListSupplierIndex(0);
                      }}
                      onKeyDown={handleListSupplierFilterKeyDown}
                      placeholder="Semua Supplier"
                      className="text-xs outline-none bg-transparent text-neutral-700 w-full"
                    />
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-400 cursor-pointer shrink-0" onClick={() => setIsListSupplierDropdownOpen(!isListSupplierDropdownOpen)} />
                  </div>
                  
                  {isListSupplierDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-neutral-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {filteredSuppliersForListFilter.length === 0 ? (
                        <div className="p-3 text-xs text-neutral-500 text-center">Tidak ada supplier</div>
                      ) : (
                        <ul className="p-1 space-y-0.5">
                          {filteredSuppliersForListFilter.map((s, idx) => (
                            <li 
                              key={s.id}
                              data-highlighted={idx === highlightedListSupplierIndex ? 'true' : undefined}
                              onMouseEnter={() => setHighlightedListSupplierIndex(idx)}
                              className={`px-3 py-1.5 text-xs rounded-lg cursor-pointer font-medium whitespace-nowrap overflow-hidden text-ellipsis transition-colors ${
                                idx === highlightedListSupplierIndex ? 'bg-theme-100 text-theme-900 font-bold' : 'text-neutral-700 hover:bg-neutral-100'
                              }`}
                              onClick={() => {
                                setListSupplierFilter(s.id);
                                setListSupplierFilterQuery(s.name);
                                setIsListSupplierDropdownOpen(false);
                              }}
                            >
                              {s.name}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>

                {/* Category Filter */}
                <div className="relative lg:w-36">
                  <select
                    value={listCategoryFilter}
                    onChange={(e) => setListCategoryFilter(e.target.value)}
                    className="w-full pl-2.5 pr-7 py-1.5 border border-neutral-200 rounded-xl bg-white focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-xs appearance-none text-neutral-700 truncate"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__none__">Tanpa Kategori</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Location Filter */}
                <div className="relative lg:w-36">
                  <select
                    value={listLocationFilter}
                    onChange={(e) => setListLocationFilter(e.target.value)}
                    className="w-full pl-2.5 pr-7 py-1.5 border border-neutral-200 rounded-xl bg-white focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-xs appearance-none text-neutral-700 truncate"
                  >
                    <option value="">Semua Lokasi</option>
                    {locations.map(loc => (
                      <option key={loc} value={loc}>{loc}</option>
                    ))}
                    <option value="__none__">Tanpa Lokasi</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>

                {/* Bottom Stock Filter */}
                <div className="relative lg:w-36">
                  <select
                    value={listBottomStockFilter}
                    onChange={(e) => setListBottomStockFilter(e.target.value as any)}
                    className="w-full pl-2.5 pr-7 py-1.5 border border-neutral-200 rounded-xl bg-white focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 outline-none transition-all text-xs appearance-none text-neutral-700 truncate"
                  >
                    <option value="all">Status Stok</option>
                    <option value="has">Punya Butom</option>
                    <option value="none">Tanpa Butom</option>
                  </select>
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>
            )}
          </div>
          
          {/* Main List Container: Desktop Table vs Mobile/Tablet Cards */}
          <div className={
            isListFullscreen && activeTab === 'products'
              ? "flex-1 overflow-auto bg-white rounded-2xl border border-theme-200 shadow-sm min-h-0" 
              : "sm:flex-1 sm:overflow-auto sm:min-h-0 lg:min-h-[300px]"
          }>
            {activeTab === 'suppliers' ? (
              <>
                {/* Mobile & Tablet Cards for Suppliers */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {filteredSuppliersList.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-theme-600-text bg-white rounded-2xl border border-theme-200">
                      <Building2 className="w-10 h-10 mx-auto text-theme-300 mb-2" />
                      <p className="font-bold text-theme-800">Tidak ada supplier ditemukan</p>
                    </div>
                  ) : (
                    paginatedSuppliersList.map(s => {
                      const productCount = products.filter(p => p.supplierId === s.id).length;
                      return (
                        <div 
                          key={s.id}
                          className={`bg-white rounded-2xl border p-4 shadow-sm transition-all flex flex-col justify-between ${
                            editingSupplierId === s.id 
                              ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/40' 
                              : 'border-theme-200 hover:border-theme-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-theme-950 text-sm sm:text-base leading-snug break-words">
                                {s.name}
                              </h4>
                              <span className="text-xs text-theme-500 font-mono mt-0.5 block truncate">
                                ID: {s.id}
                              </span>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-theme-100 text-theme-800 rounded-lg shrink-0 whitespace-nowrap">
                              {productCount} Produk
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-theme-100 mt-2">
                            <button
                              onClick={() => {
                                handleEditSupplier(s);
                              }}
                              className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold text-xs rounded-xl py-2 px-2.5 transition-colors active:scale-[0.98] whitespace-nowrap"
                            >
                              <Edit2 className="w-3.5 h-3.5 shrink-0" />
                              Edit Supplier
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus supplier "${s.name}"?`)) {
                                  deleteSupplier(s.id);
                                }
                              }}
                              className="min-h-[40px] flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl py-2 px-2.5 border border-rose-200 transition-colors active:scale-[0.98] whitespace-nowrap"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table for Suppliers */}
                <div className="hidden lg:block">
                  <table className="w-full min-w-[520px] text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-theme-100 shadow-xs">
                      <tr className="border-b border-theme-200">
                        <th className="sticky top-0 z-20 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">ID</th>
                        <th className="sticky top-0 z-20 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Nama Supplier</th>
                        <th className="sticky top-0 z-20 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Jumlah Produk</th>
                        <th className="sticky top-0 z-20 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-24 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-100">
                      {filteredSuppliersList.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-theme-600-text text-sm">Tidak ada supplier ditemukan.</td></tr>
                      ) : (
                        paginatedSuppliersList.map(s => {
                          const count = products.filter(p => p.supplierId === s.id).length;
                          return (
                            <tr key={s.id} className="hover:bg-theme-50 transition-colors">
                              <td className="py-3 px-4 text-sm text-theme-600-text font-mono">{s.id}</td>
                              <td className="py-3 px-4 text-sm font-bold text-theme-900">{s.name}</td>
                              <td className="py-3 px-4 text-sm text-theme-700 text-center font-medium">{count}</td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleEditSupplier(s)} className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" title="Edit">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm(`Hapus supplier "${s.name}"?`)) {
                                        deleteSupplier(s.id);
                                      }
                                    }} 
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" 
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <>
                <datalist id="master-inline-units">
                  <option value="pcs" />
                  <option value="box" />
                  <option value="strip" />
                  <option value="botol" />
                  <option value="fls" />
                  <option value="tube" />
                  <option value="sachet" />
                  <option value="pack" />
                  <option value="dus" />
                  <option value="kg" />
                  <option value="liter" />
                </datalist>
                <datalist id="master-inline-categories">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
                <datalist id="master-inline-locations">
                  {locations.map(loc => <option key={loc} value={loc} />)}
                </datalist>

                {/* Mobile & Tablet Cards for Products */}
                <div className="lg:hidden grid grid-cols-1 sm:grid-cols-2 gap-3 pb-2">
                  {filteredProductsList.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-theme-600-text bg-white rounded-2xl border border-theme-200">
                      <Package className="w-10 h-10 mx-auto text-theme-300 mb-2" />
                      <p className="font-bold text-theme-800">Tidak ada produk ditemukan</p>
                      <p className="text-xs text-theme-500 mt-1">Coba sesuaikan kata kunci atau filter</p>
                    </div>
                  ) : (
                    paginatedProductsList.map(p => {
                      const supplier = suppliers.find(s => s.id === p.supplierId);
                      const isLow = p.bottomStock !== undefined && p.bottomStock !== null && (p.stock || 0) <= p.bottomStock;
                      const isInlineEditing = inlineEditProductId === p.id;
                      const isSavingRow = isSavingInlineId === p.id;
                      
                      if (isInlineEditing) {
                        const availableAltSuppliers = suppliers.filter(
                          s => s.id !== inlineDraft.supplierId && !inlineDraft.alternativeSupplierIds.includes(s.id)
                        );
                        return (
                          <div
                            key={p.id}
                            className="bg-amber-50/50 rounded-2xl border-2 border-amber-400 p-4 shadow-sm flex flex-col gap-3"
                            onKeyDown={(e) => {
                              if (e.key === 'Escape') handleCancelInlineEdit();
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-800">
                                Edit Langsung Produk
                              </span>
                              <button
                                type="button"
                                onClick={handleCancelInlineEdit}
                                className="p-1 text-neutral-500 hover:text-neutral-800 rounded-lg hover:bg-white/70"
                                title="Batal"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="space-y-2.5">
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Nama Produk *</label>
                                <input
                                  type="text"
                                  autoFocus
                                  value={inlineDraft.name}
                                  onChange={(e) => setInlineDraft(prev => ({ ...prev, name: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                  className="w-full px-2.5 py-2 text-xs font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none"
                                  placeholder="Nama produk"
                                />
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Satuan *</label>
                                  <input
                                    type="text"
                                    list="master-inline-units"
                                    value={inlineDraft.unit}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, unit: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="pcs / box"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Kategori</label>
                                  <input
                                    type="text"
                                    list="master-inline-categories"
                                    value={inlineDraft.category}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, category: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-full px-2.5 py-2 text-xs font-medium bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="Kategori"
                                  />
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Sisa Stok</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={inlineDraft.stock}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, stock: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-full px-2.5 py-2 text-xs font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none tabular-nums"
                                    placeholder="0"
                                  />
                                </div>
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Butom Stok</label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={inlineDraft.bottomStock}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, bottomStock: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-full px-2.5 py-2 text-xs font-bold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none tabular-nums"
                                    placeholder="Kosong"
                                  />
                                </div>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Lokasi Rak</label>
                                <input
                                  type="text"
                                  list="master-inline-locations"
                                  value={inlineDraft.location}
                                  onChange={(e) => setInlineDraft(prev => ({ ...prev, location: e.target.value }))}
                                  onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                  className="w-full px-2.5 py-2 text-xs font-medium bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none"
                                  placeholder="Contoh: Rak A1"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Supplier Utama *</label>
                                <select
                                  value={inlineDraft.supplierId}
                                  onChange={(e) => setInlineDraft(prev => ({
                                    ...prev,
                                    supplierId: e.target.value,
                                    alternativeSupplierIds: prev.alternativeSupplierIds.filter(id => id !== e.target.value)
                                  }))}
                                  className="w-full px-2.5 py-2 text-xs font-semibold bg-white border border-amber-300 rounded-xl focus:ring-2 focus:ring-theme-500 outline-none"
                                >
                                  <option value="">-- Pilih Supplier --</option>
                                  {suppliers.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-bold uppercase text-neutral-600 mb-1">Supplier Alternatif</label>
                                {inlineDraft.alternativeSupplierIds.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mb-1.5">
                                    {inlineDraft.alternativeSupplierIds.map(altId => (
                                      <span key={altId} className="inline-flex items-center gap-1 bg-white border border-amber-300 text-neutral-800 px-2 py-0.5 rounded-lg text-[10px] font-semibold">
                                        {suppliers.find(s => s.id === altId)?.name || altId}
                                        <button
                                          type="button"
                                          onClick={() => setInlineDraft(prev => ({
                                            ...prev,
                                            alternativeSupplierIds: prev.alternativeSupplierIds.filter(x => x !== altId)
                                          }))}
                                          className="text-neutral-400 hover:text-rose-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </span>
                                    ))}
                                  </div>
                                )}
                                {availableAltSuppliers.length > 0 && (
                                  <select
                                    value=""
                                    onChange={(e) => {
                                      if (!e.target.value) return;
                                      setInlineDraft(prev => ({
                                        ...prev,
                                        alternativeSupplierIds: [...prev.alternativeSupplierIds, e.target.value]
                                      }));
                                    }}
                                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-200 rounded-xl outline-none text-neutral-600"
                                  >
                                    <option value="">+ Tambah supplier alternatif...</option>
                                    {availableAltSuppliers.map(s => (
                                      <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                  </select>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-amber-200">
                              <button
                                type="button"
                                onClick={() => handleSaveInlineEdit(p)}
                                disabled={isSavingRow}
                                className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl py-2 px-3 transition-colors disabled:opacity-60"
                              >
                                {isSavingRow ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                <span>{isSavingRow ? 'Menyimpan...' : 'Simpan'}</span>
                              </button>
                              <button
                                type="button"
                                onClick={handleCancelInlineEdit}
                                disabled={isSavingRow}
                                className="min-h-[40px] flex items-center justify-center gap-1 bg-white hover:bg-neutral-100 text-neutral-700 font-bold text-xs rounded-xl py-2 px-3 border border-neutral-300 transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                                <span>Batal</span>
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={p.id}
                          className="bg-white rounded-2xl border border-theme-200 hover:border-theme-300 p-4 shadow-sm transition-all flex flex-col justify-between"
                        >
                          <div>
                            {/* Card Top: Title & Unit */}
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <div className="min-w-0 flex-1">
                                <h4 className="font-bold text-theme-950 text-sm sm:text-base leading-snug break-words">
                                  {p.name}
                                </h4>
                                <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                  <span className="inline-flex items-center gap-1 bg-theme-100 text-theme-800 font-medium px-2 py-0.5 rounded-md">
                                    <Building2 className="w-3 h-3 text-theme-500 shrink-0" />
                                    {supplier?.name || 'Unknown Supplier'}
                                  </span>
                                  {p.category && (
                                    <span className="bg-neutral-100 text-neutral-700 font-medium px-2 py-0.5 rounded-md">
                                      {p.category}
                                    </span>
                                  )}
                                  {p.location && (
                                    <span className="bg-indigo-50 text-indigo-700 font-medium px-2 py-0.5 rounded-md">
                                      📍 {p.location}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <span className="text-xs font-semibold px-2 py-1 bg-theme-50 text-theme-700 rounded-lg border border-theme-200 shrink-0 whitespace-nowrap">
                                {p.unit || 'pcs'}
                              </span>
                            </div>

                            {/* Alternative Suppliers */}
                            {p.alternativeSupplierIds && p.alternativeSupplierIds.length > 0 && (
                              <div className="mb-2 flex flex-wrap items-center gap-1 text-[11px] text-theme-500">
                                <span className="font-medium text-theme-400">Alt:</span>
                                {p.alternativeSupplierIds.map(altId => (
                                  <span key={altId} className="bg-theme-50 text-theme-600 px-1.5 py-0.5 rounded border border-theme-100 text-[10px]">
                                    {suppliers.find(s => s.id === altId)?.name || altId}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>

                          <div>
                            {/* Stock Metrics Grid */}
                            <div className="grid grid-cols-2 gap-2 my-2.5 py-2.5 px-3 bg-theme-50/80 rounded-xl border border-theme-100 text-xs">
                              <div className="flex flex-col">
                                <span className="text-[10px] uppercase font-bold text-theme-500 tracking-wider">Sisa Stok</span>
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  <span className={`text-base font-extrabold ${isLow ? 'text-rose-600' : 'text-theme-900'}`}>
                                    {p.stock !== undefined && p.stock !== null ? p.stock : 0}
                                  </span>
                                  <span className="text-theme-500 text-[11px]">{p.unit || 'pcs'}</span>
                                  {isLow && (
                                    <span className="text-[10px] font-bold bg-rose-100 text-rose-700 px-1.5 py-0.5 rounded">
                                      Menipis
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex flex-col border-l border-theme-200/60 pl-3">
                                <span className="text-[10px] uppercase font-bold text-theme-500 tracking-wider">Butom Stok</span>
                                <div className="flex items-center gap-1 mt-0.5">
                                  <input
                                    key={`${p.id}-card-bs-${p.bottomStock ?? 'empty'}`}
                                    type="number"
                                    min="0"
                                    defaultValue={p.bottomStock ?? ''}
                                    onBlur={(e) => handleInlineQuickBottomStock(p, e.target.value)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        (e.target as HTMLInputElement).blur();
                                      }
                                    }}
                                    className="w-16 px-1.5 py-0.5 text-xs border border-theme-300 rounded-lg bg-white focus:ring-2 focus:ring-theme-500 outline-none text-center font-bold text-theme-900 tabular-nums"
                                    placeholder="-"
                                    title="Isi langsung Butom Stok lalu tekan Enter"
                                  />
                                  <span className="text-theme-500 text-[11px] truncate">{p.unit || 'pcs'}</span>
                                </div>
                              </div>
                            </div>

                            {/* Card Action Buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-theme-100">
                              <button
                                onClick={() => handleStartInlineEdit(p)}
                                className="flex-1 min-h-[40px] flex items-center justify-center gap-1.5 bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold text-xs rounded-xl py-2 px-2.5 transition-colors active:scale-[0.98] whitespace-nowrap"
                              >
                                <Edit2 className="w-3.5 h-3.5 shrink-0" />
                                Edit Produk
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus produk "${p.name}"?`)) {
                                    deleteProduct(p.id);
                                  }
                                }}
                                className="min-h-[40px] flex items-center justify-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl py-2 px-2.5 border border-rose-200 transition-colors active:scale-[0.98] whitespace-nowrap"
                              >
                                <Trash2 className="w-3.5 h-3.5 shrink-0" />
                                Hapus
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table for Products */}
                <div className="hidden lg:block">
                  <table className="w-full min-w-[820px] text-left border-collapse">
                    <thead className="sticky top-0 z-20 bg-theme-100 shadow-xs">
                      <tr className="border-b border-theme-200">
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">Nama Produk</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Satuan</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Supplier</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Butom Stok</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Kategori</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Stok</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Lokasi</th>
                        <th className="sticky top-0 z-20 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-24 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-100">
                      {filteredProductsList.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-theme-600-text text-sm">Tidak ada produk ditemukan.</td></tr>
                      ) : (
                        paginatedProductsList.map(p => {
                          const isLow = p.bottomStock !== undefined && p.bottomStock !== null && (p.stock || 0) <= p.bottomStock;
                          const isInlineEditing = inlineEditProductId === p.id;
                          const isSavingRow = isSavingInlineId === p.id;

                          if (isInlineEditing) {
                            const availableAltSuppliers = suppliers.filter(
                              s => s.id !== inlineDraft.supplierId && !inlineDraft.alternativeSupplierIds.includes(s.id)
                            );
                            return (
                              <tr
                                key={p.id}
                                className="bg-amber-50/70 ring-1 ring-inset ring-amber-300"
                                onKeyDown={(e) => {
                                  if (e.key === 'Escape') handleCancelInlineEdit();
                                }}
                              >
                                <td className="py-2.5 px-2.5 align-top">
                                  <input
                                    type="text"
                                    autoFocus
                                    value={inlineDraft.name}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-full min-w-[150px] px-2.5 py-1.5 text-xs font-bold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="Nama produk *"
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-top">
                                  <input
                                    type="text"
                                    list="master-inline-units"
                                    value={inlineDraft.unit}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, unit: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-20 px-2 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="Satuan *"
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-top">
                                  <div className="space-y-1 min-w-[150px]">
                                    <select
                                      value={inlineDraft.supplierId}
                                      onChange={(e) => setInlineDraft(prev => ({
                                        ...prev,
                                        supplierId: e.target.value,
                                        alternativeSupplierIds: prev.alternativeSupplierIds.filter(id => id !== e.target.value)
                                      }))}
                                      className="w-full px-2 py-1.5 text-xs font-semibold bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none"
                                    >
                                      <option value="">-- Supplier --</option>
                                      {suppliers.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                      ))}
                                    </select>
                                    {inlineDraft.alternativeSupplierIds.length > 0 && (
                                      <div className="flex flex-wrap gap-1">
                                        {inlineDraft.alternativeSupplierIds.map(altId => (
                                          <span key={altId} className="inline-flex items-center gap-0.5 bg-white border border-amber-300 text-neutral-700 px-1.5 py-0.5 rounded text-[10px]">
                                            {suppliers.find(s => s.id === altId)?.name || altId}
                                            <button
                                              type="button"
                                              onClick={() => setInlineDraft(prev => ({
                                                ...prev,
                                                alternativeSupplierIds: prev.alternativeSupplierIds.filter(x => x !== altId)
                                              }))}
                                              className="text-neutral-400 hover:text-rose-600"
                                            >
                                              <X className="w-2.5 h-2.5" />
                                            </button>
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {availableAltSuppliers.length > 0 && (
                                      <select
                                        value=""
                                        onChange={(e) => {
                                          if (!e.target.value) return;
                                          setInlineDraft(prev => ({
                                            ...prev,
                                            alternativeSupplierIds: [...prev.alternativeSupplierIds, e.target.value]
                                          }));
                                        }}
                                        className="w-full px-1.5 py-1 text-[11px] bg-white/90 border border-amber-200 rounded-lg outline-none text-neutral-600"
                                      >
                                        <option value="">+ Alt supplier...</option>
                                        {availableAltSuppliers.map(s => (
                                          <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                      </select>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2.5 px-2 text-center align-top">
                                  <input
                                    type="number"
                                    min="0"
                                    value={inlineDraft.bottomStock}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, bottomStock: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-16 px-2 py-1.5 text-xs font-bold text-center bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none tabular-nums"
                                    placeholder="-"
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-top">
                                  <input
                                    type="text"
                                    list="master-inline-categories"
                                    value={inlineDraft.category}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, category: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-24 px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="Kategori"
                                  />
                                </td>
                                <td className="py-2.5 px-2 text-center align-top">
                                  <input
                                    type="number"
                                    min="0"
                                    value={inlineDraft.stock}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, stock: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-16 px-2 py-1.5 text-xs font-bold text-center bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none tabular-nums"
                                    placeholder="0"
                                  />
                                </td>
                                <td className="py-2.5 px-2 align-top">
                                  <input
                                    type="text"
                                    list="master-inline-locations"
                                    value={inlineDraft.location}
                                    onChange={(e) => setInlineDraft(prev => ({ ...prev, location: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleSaveInlineEdit(p); }}
                                    className="w-24 px-2 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:ring-2 focus:ring-theme-500 outline-none"
                                    placeholder="Lokasi"
                                  />
                                </td>
                                <td className="py-2.5 px-2.5 text-right align-top">
                                  <div className="flex items-center justify-end gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleSaveInlineEdit(p)}
                                      disabled={isSavingRow}
                                      className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shadow-xs disabled:opacity-60"
                                      title="Simpan Perubahan (Enter)"
                                    >
                                      {isSavingRow ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={handleCancelInlineEdit}
                                      disabled={isSavingRow}
                                      className="p-1.5 bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-300 rounded-lg transition-colors"
                                      title="Batal (Esc)"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr key={p.id} className="hover:bg-theme-50 transition-colors">
                              <td className="py-3 px-3 text-sm font-bold text-theme-900">{p.name}</td>
                              <td className="py-3 px-3 text-sm text-theme-600-text">{p.unit || '-'}</td>
                              <td className="py-3 px-3 text-xs text-theme-700">
                                <div className="font-medium">{suppliers.find(s => s.id === p.supplierId)?.name || 'Unknown'}</div>
                                {p.alternativeSupplierIds && p.alternativeSupplierIds.length > 0 && (
                                  <div className="mt-0.5 flex flex-wrap gap-1">
                                    {p.alternativeSupplierIds.map(altId => (
                                      <span key={altId} className="bg-neutral-100 text-neutral-600 px-1 py-0.2 rounded text-[10px]">
                                        {suppliers.find(s => s.id === altId)?.name || altId}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-sm text-center">
                                <input
                                  key={`${p.id}-bs-${p.bottomStock ?? 'empty'}`}
                                  type="number"
                                  min="0"
                                  defaultValue={p.bottomStock ?? ''}
                                  onBlur={(e) => handleInlineQuickBottomStock(p, e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      (e.target as HTMLInputElement).blur();
                                    }
                                  }}
                                  className="w-16 px-2 py-1 text-xs border border-theme-200 hover:border-theme-300 rounded-lg bg-white focus:ring-2 focus:ring-theme-500 outline-none text-center font-bold text-theme-900 tabular-nums transition-colors"
                                  placeholder="-"
                                  title="Isi langsung Butom Stok lalu tekan Enter"
                                />
                              </td>
                              <td className="py-3 px-3 text-sm text-theme-900">{p.category || '-'}</td>
                              <td className="py-3 px-3 text-sm text-center">
                                <span className={`font-bold ${isLow ? 'text-rose-600' : 'text-theme-900'}`}>
                                  {p.stock !== undefined && p.stock !== null ? p.stock : '-'}
                                </span>
                                {isLow && (
                                  <span className="block text-[10px] text-rose-500 font-semibold">Menipis</span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-sm text-theme-900">{p.location || '-'}</td>
                              <td className="py-3 px-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <button onClick={() => handleStartInlineEdit(p)} className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" title="Edit langsung di baris">
                                    <Edit2 className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      if (window.confirm(`Hapus produk "${p.name}"?`)) {
                                        deleteProduct(p.id);
                                      }
                                    }} 
                                    className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors" 
                                    title="Hapus"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
          
          {/* Responsive Pagination Bar */}
          <div className="flex flex-col sm:flex-row flex-wrap items-center justify-between p-3 sm:px-4 lg:px-6 sm:py-3.5 border-t border-theme-200 bg-white gap-2.5 sm:gap-3 shrink-0">
            <div className="flex items-center justify-between w-full sm:w-auto gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-theme-600-text">Baris:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                  className="border border-theme-200 rounded-lg text-xs p-1 outline-none text-theme-800 bg-theme-50 focus:border-theme-500"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={9999}>Semua</option>
                </select>
              </div>
              <span className="text-xs text-theme-600-text whitespace-nowrap">
                {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems}
              </span>
            </div>
            
            <div className="flex items-center justify-center w-full sm:w-auto gap-1.5 sm:gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 sm:p-1.5 rounded-xl sm:rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-theme-800 transition-colors border sm:border-0 border-theme-200"
                title="Sebelumnya"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <span className="text-xs font-bold text-theme-800 px-2 sm:hidden">
                Hal {currentPage} / {totalPages}
              </span>

              <div className="hidden sm:flex items-center gap-1 mx-1 lg:mx-2">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5 && currentPage > 3) {
                     pageNum = currentPage - 2 + i;
                     if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg text-xs font-medium transition-colors ${currentPage === pageNum ? 'bg-neutral-900 text-white' : 'hover:bg-neutral-200 text-neutral-700'}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-2 sm:p-1.5 rounded-xl sm:rounded-lg hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed text-theme-800 transition-colors border sm:border-0 border-theme-200"
                title="Berikutnya"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-3xl p-6 w-full max-w-lg max-h-[80vh] flex flex-col shadow-xl border border-theme-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-rose-500">Import Notifications</h3>
              <button 
                onClick={() => setImportErrors([])}
                className="p-2 text-theme-600-text hover:text-theme-900 hover:bg-theme-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm text-theme-600-text mb-4">
              Some items encountered issues during the import process:
            </p>
            <div className="flex-1 overflow-y-auto bg-theme-50 rounded-xl border border-theme-200 p-4 space-y-2">
              {importErrors.map((err, idx) => (
                <div key={idx} className="text-sm text-theme-800 flex items-start gap-2">
                  <span className="text-rose-400 mt-0.5">•</span>
                  <span>{err}</span>
                </div>
              ))}
            </div>
            <div className="mt-6">
              <button 
                onClick={() => setImportErrors([])}
                className="w-full py-2.5 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Set Bottom Stock Modal */}
      {isBulkBottomStockModalOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl border border-theme-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-theme-100 text-theme-700 flex items-center justify-center">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-theme-950">Setting Butom Stok</h3>
                  <p className="text-xs text-theme-500">Atur batas minimum stok produk sekaligus</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsBulkBottomStockModalOpen(false)}
                className="p-1.5 text-neutral-500 hover:text-neutral-800 hover:bg-neutral-100 rounded-xl transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyBulkBottomStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-2">Pilih Target Produk</label>
                <div className="space-y-2">
                  {[
                    {
                      id: 'none' as const,
                      label: 'Produk yang belum punya Butom Stok',
                      count: products.filter(p => p.bottomStock === undefined || p.bottomStock === null || p.bottomStock === 0).length
                    },
                    {
                      id: 'filtered' as const,
                      label: 'Produk sesuai filter / pencarian saat ini',
                      count: filteredProductsList.length
                    },
                    {
                      id: 'all' as const,
                      label: 'Semua produk di Master Data',
                      count: products.length
                    }
                  ].map(opt => (
                    <label
                      key={opt.id}
                      className={cn(
                        'flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all text-xs',
                        bulkBottomStockScope === opt.id
                          ? 'border-theme-500 bg-theme-50 text-theme-900 font-bold'
                          : 'border-neutral-200 hover:border-neutral-300 text-neutral-700 font-medium'
                      )}
                    >
                      <div className="flex items-center gap-2.5">
                        <input
                          type="radio"
                          name="bulkBottomStockScope"
                          checked={bulkBottomStockScope === opt.id}
                          onChange={() => setBulkBottomStockScope(opt.id)}
                          className="accent-theme-600"
                        />
                        <span>{opt.label}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white border border-neutral-200 text-[11px] font-bold tabular-nums">
                        {opt.count}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Nilai Butom Stok (Kosongkan untuk menghapus batas)
                </label>
                <input
                  type="number"
                  min="0"
                  autoFocus
                  value={bulkBottomStockValue}
                  onChange={(e) => setBulkBottomStockValue(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-bold text-neutral-900 tabular-nums focus:bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none"
                  placeholder="Contoh: 5"
                />
              </div>

              <div className="pt-3 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBulkBottomStockModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-300 rounded-xl font-semibold text-xs transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingBulkBottomStock}
                  className="px-4 py-2 bg-theme-600 hover:bg-theme-700 text-white rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSavingBulkBottomStock ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Menerapkan...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Terapkan Butom Stok</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import Progress Modal */}
      <OperationProgressModal
        isOpen={isImporting}
        type="import"
        title="Mengimpor Master Data..."
        subtitle="Memproses data Supplier dan Produk ke database"
        current={importProgress.current}
        total={importProgress.total}
        currentItemName={importProgress.currentItemName}
        startTime={importProgress.startTime}
      />
    </div>
  );
};
