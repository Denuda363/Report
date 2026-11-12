import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Download, Upload, Search, ChevronDown, ChevronLeft, ChevronRight, Edit2, X, Filter, Check, Maximize2, Minimize2, Building2, Package, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { Supplier, Product } from '../types';
import { downloadMasterDataTemplate, parseMasterDataImport } from '../lib/excel';
import { OperationProgressModal } from './common/OperationProgressModal';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';

export const MasterData = () => {
  const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addProduct, updateProduct, deleteProduct, importMasterData, resetAllProductStocks } = useAppContext();
  
  const [activeTab, setActiveTab] = useState<'suppliers' | 'products'>('suppliers');
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
  const [isMobileFormOpen, setIsMobileFormOpen] = useState(false);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [importErrors, setImportErrors] = useState<string[]>([]);

  // Product Edit & Search State
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
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
  const formRef = useRef<HTMLDivElement>(null);

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
    if (!supplierName.trim()) {
      alert("Nama supplier wajib diisi.");
      return;
    }
    
    try {
      if (editingSupplierId) {
        await updateSupplier({ id: editingSupplierId, name: supplierName.trim() });
        setEditingSupplierId(null);
      } else {
        await addSupplier({ name: supplierName.trim() });
      }
      setSupplierName('');
    } catch (err: any) {
      console.error("Gagal menyimpan supplier:", err);
      alert(`Gagal menyimpan supplier: ${err.message || 'Terjadi kesalahan'}`);
    }
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplierId(supplier.id);
    setSupplierName(supplier.name);
    setActiveTab('suppliers');
    setIsMobileFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleCancelEditSupplier = () => {
    setEditingSupplierId(null);
    setSupplierName('');
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
    if (!productName.trim()) {
      alert("Nama produk wajib diisi.");
      return;
    }
    if (!productSupplierId) {
      alert("Supplier produk wajib dipilih.");
      return;
    }
    if (!productUnit.trim()) {
      alert("Satuan produk wajib diisi.");
      return;
    }
    
    try {
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
      setTimeout(() => {
        productNameInputRef.current?.focus();
      }, 50);
    } catch (err: any) {
      console.error("Gagal menyimpan produk:", err);
      alert(`Gagal menyimpan produk: ${err.message || 'Terjadi kesalahan sistem'}`);
    }
  };

  // Ctrl + S shortcut to save active Supplier or Product form
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
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
    
    const sName = suppliers.find(s => s.id === product.supplierId)?.name || '';
    setSupplierSearchQuery(sName);
    setActiveTab('products');
    setIsMobileFormOpen(true);
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }, 50);
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setProductName('');
    setProductSupplierId('');
    setProductAlternativeSupplierIds([]);
    setProductUnit('pcs');
    setProductBottomStock('');
    setProductStock('');
    setProductLocation('');
    setProductCategory('');
    setSupplierSearchQuery('');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const { suppliers: newSuppliers, products: newProducts, errors: parseErrors } = await parseMasterDataImport(file);
      
      const totalItems = newSuppliers.length + newProducts.length;
      if (totalItems === 0 && parseErrors.length === 0) {
        alert("No valid data found in template.");
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

        dbErrors = await importMasterData(newSuppliers, newProducts, (current, total, itemName) => {
          setImportProgress({
            current,
            total,
            currentItemName: itemName,
            startTime
          });
        });

        await new Promise(resolve => setTimeout(resolve, 400));
        setIsImporting(false);
        alert(`Successfully imported ${newSuppliers.length} suppliers and ${newProducts.length} products.`);
      }

      const allErrors = [...parseErrors, ...dbErrors];
      if (allErrors.length > 0) {
        setImportErrors(allErrors);
      }
    } catch (err: any) {
      console.error(err);
      alert("Failed to parse the file: " + (err?.message || "Format tidak sesuai."));
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const totalItems = activeTab === 'suppliers' ? filteredSuppliersList.length : filteredProductsList.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  return (
    <div className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden flex flex-col h-full min-h-[600px]">
      {/* Tabs & Top Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center border-b border-theme-200 gap-3 sm:gap-0 p-3 sm:p-0">
        <div className="flex bg-theme-100/70 sm:bg-transparent p-1 sm:p-0 rounded-2xl sm:rounded-none">
          <button
            onClick={() => {
              setActiveTab('suppliers');
              setIsMobileFormOpen(false);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-4 text-xs sm:text-sm font-bold sm:font-medium text-center transition-all rounded-xl sm:rounded-none flex items-center justify-center gap-2 ${
              activeTab === 'suppliers' 
                ? 'bg-white sm:bg-neutral-50 text-neutral-900 shadow-sm sm:shadow-none sm:border-b-2 sm:border-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Building2 className="w-4 h-4 sm:hidden text-theme-500" />
            <span>Suppliers</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-theme-200/70 text-theme-800">
              {suppliers.length}
            </span>
          </button>
          <button
            onClick={() => {
              setActiveTab('products');
              setIsMobileFormOpen(false);
            }}
            className={`flex-1 sm:flex-none px-4 sm:px-8 py-2.5 sm:py-4 text-xs sm:text-sm font-bold sm:font-medium text-center transition-all rounded-xl sm:rounded-none flex items-center justify-center gap-2 ${
              activeTab === 'products' 
                ? 'bg-white sm:bg-neutral-50 text-neutral-900 shadow-sm sm:shadow-none sm:border-b-2 sm:border-neutral-900' 
                : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60'
            }`}
          >
            <Package className="w-4 h-4 sm:hidden text-theme-500" />
            <span>Products</span>
            <span className="text-[10px] sm:text-xs px-1.5 py-0.5 rounded-full bg-theme-200/70 text-theme-800">
              {products.length}
            </span>
          </button>
        </div>
        <div className="flex items-center gap-2 px-1 sm:pr-6 justify-end">
          <button 
            onClick={() => downloadMasterDataTemplate(suppliers, products)}
            className="group flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm active:scale-[0.98]"
            title="Download Excel Template"
          >
            <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" /> 
            <span>Template</span>
          </button>
          <label className="group flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 px-3 py-2 rounded-xl font-medium transition-all text-xs sm:text-sm cursor-pointer active:scale-[0.98]">
            <Upload className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" /> 
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

      <div className="flex-1 overflow-auto p-3 sm:p-6 flex flex-col lg:flex-row gap-4 lg:gap-8">
        {/* Mobile Toggle Button for Adding Data */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMobileFormOpen(!isMobileFormOpen)}
            className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl font-bold text-sm transition-all shadow-sm active:scale-[0.98] ${
              isMobileFormOpen
                ? 'bg-theme-100 text-theme-800 border border-theme-300'
                : 'bg-theme-500 hover:bg-theme-600 text-white shadow-theme-500/25'
            }`}
          >
            {isMobileFormOpen ? (
              <>
                <ChevronUp className="w-4 h-4" /> 
                <span>Tutup Form {activeTab === 'suppliers' ? 'Supplier' : 'Produk'}</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> 
                <span>+ Tambah {activeTab === 'suppliers' ? 'Supplier Baru' : 'Produk Baru'}</span>
              </>
            )}
          </button>
        </div>

        {/* Form Section */}
        <div 
          ref={formRef} 
          className={`w-full lg:w-1/4 shrink-0 transition-all ${
            isMobileFormOpen ? 'block' : 'hidden lg:block'
          }`}
        >
          <div className="bg-theme-50/70 p-4 rounded-2xl border border-theme-200 lg:bg-transparent lg:p-0 lg:border-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-theme-900 text-base">
                {activeTab === 'suppliers' 
                  ? (editingSupplierId ? 'Edit Supplier' : 'Tambah Supplier') 
                  : (editingProductId ? 'Edit Produk' : 'Tambah Produk')}
              </h3>
              {isMobileFormOpen && (
                <button
                  onClick={() => setIsMobileFormOpen(false)}
                  className="lg:hidden p-1 text-theme-500 hover:text-theme-800 rounded-lg"
                  title="Tutup Form"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          
          {activeTab === 'suppliers' ? (
            <form onSubmit={handleSubmitSupplier} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Supplier Name</label>
                <input
                  type="text"
                  required
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. PT Maju Bersama"
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="group flex-1 flex items-center justify-center gap-2 bg-theme-500 hover:bg-theme-600 text-white px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm hover:shadow-lg hover:shadow-theme-500/20 active:scale-[0.98]"
                >
                  {editingSupplierId ? <><Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" /> Update</> : <><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Add</>} Supplier
                </button>
                {editingSupplierId && (
                  <button
                    type="button"
                    onClick={handleCancelEditSupplier}
                    className="group flex-none flex items-center justify-center gap-2 bg-theme-100 hover:bg-theme-200 text-theme-600-text px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm active:scale-[0.98]"
                  >
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Cancel
                  </button>
                )}
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmitProduct} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Product Name</label>
                <input
                  ref={productNameInputRef}
                  type="text"
                  required
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. Indomie Goreng"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Unit</label>
                <input
                  type="text"
                  required
                  value={productUnit}
                  onChange={(e) => setProductUnit(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. pcs, Box, fls"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Butom Stok</label>
                <input
                  type="number"
                  min="0"
                  value={productBottomStock}
                  onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. 30 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. 100 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Lokasi Rak</label>
                <input
                  type="text"
                  value={productLocation}
                  onChange={(e) => setProductLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. Rak A1 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Kategori</label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. Minuman (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Supplier</label>
                <div className="relative" ref={supplierDropdownRef}>
                  <div 
                    className={`flex items-center w-full px-4 py-3 border rounded-2xl bg-theme-50 transition-all cursor-text ${isSupplierDropdownOpen ? 'border-theme-500 ring-2 ring-theme-500' : 'border-theme-200'}`}
                    onClick={() => {
                      setIsSupplierDropdownOpen(true);
                      setIsTypingNewSupplier(false);
                      setHighlightedSupplierIndex(0);
                      supplierInputRef.current?.select();
                    }}
                  >
                    <Search className="w-4 h-4 text-theme-600-text mr-2 shrink-0" />
                    <input
                      ref={supplierInputRef}
                      type="text"
                      className="bg-transparent outline-none w-full text-sm text-theme-800"
                      placeholder="Search supplier..."
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
                        className="w-4 h-4 text-theme-600-text ml-1 shrink-0 cursor-pointer hover:text-rose-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSupplierSearchQuery('');
                          setProductSupplierId('');
                          setIsTypingNewSupplier(false);
                        }}
                      />
                    )}
                    <ChevronDown 
                      className="w-4 h-4 text-theme-600-text ml-2 shrink-0 cursor-pointer" 
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsSupplierDropdownOpen(!isSupplierDropdownOpen);
                        setIsTypingNewSupplier(false);
                      }} 
                    />
                  </div>
                  
                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 w-full mt-2 bg-white border border-theme-200 rounded-2xl shadow-xl max-h-72 overflow-y-auto">
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
                              className={`px-4 py-3 cursor-pointer text-sm font-bold text-theme-900 transition-colors border-b border-theme-50 last:border-0 ${
                                idx === highlightedSupplierIndex ? 'bg-theme-100 text-theme-900' : 'hover:bg-theme-100'
                              }`}
                              onClick={() => handleSelectSupplierForProduct(s)}
                            >
                              {s.name}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-4 text-center text-sm text-theme-600-text">
                            Tidak ditemukan supplier.
                          </div>
                        )
                      ) : (
                        !lastSupplierQuery && (
                          <div className="px-4 py-4 text-center text-sm text-theme-600-text">
                            Ketik nama supplier atau tekan panah bawah untuk memilih...
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Alternative Suppliers */}
              {productSupplierId && (
                <div>
                  <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Alternative Suppliers (Optional)</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {productAlternativeSupplierIds.map(id => {
                      const sName = suppliers.find(s => s.id === id)?.name || id;
                      return (
                        <div key={id} className="flex items-center gap-1 bg-theme-300 text-theme-700 px-2 py-1 rounded-md text-xs font-medium">
                          {sName}
                          <button
                            type="button"
                            onClick={() => setProductAlternativeSupplierIds(prev => prev.filter(x => x !== id))}
                            className="hover:text-rose-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <div className="relative" ref={altSupplierDropdownRef}>
                    <div className="flex items-center w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500">
                      <input
                        type="text"
                        className="bg-transparent outline-none w-full text-sm text-theme-800"
                        placeholder="Search alternative supplier..."
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
                      <ChevronDown className="w-4 h-4 text-theme-600-text ml-2 shrink-0" />
                    </div>
                    {isAltSupplierDropdownOpen && (
                      <div className="absolute z-50 w-full mt-2 bg-white border border-theme-200 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                        {filteredAltSuppliersForSelect.length > 0 ? (
                          filteredAltSuppliersForSelect.map((s, idx) => (
                            <div 
                              key={s.id}
                              data-highlighted={idx === highlightedAltSupplierIndex ? 'true' : undefined}
                              onMouseEnter={() => setHighlightedAltSupplierIndex(idx)}
                              className={`px-4 py-3 cursor-pointer text-sm font-bold text-theme-900 transition-colors border-b border-theme-50 last:border-0 ${
                                idx === highlightedAltSupplierIndex ? 'bg-theme-100 text-theme-900' : 'hover:bg-theme-100'
                              }`}
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
                          <div className="px-4 py-3 text-center text-sm text-theme-600-text">
                            No suppliers found.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="group flex-1 flex items-center justify-center gap-2 bg-theme-500 hover:bg-theme-600 text-white px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm hover:shadow-lg hover:shadow-theme-500/20 active:scale-[0.98]"
                  disabled={suppliers.length === 0 || !productSupplierId}
                >
                  {editingProductId ? <><Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" /> Update</> : <><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Add</>} Product
                </button>
                {editingProductId && (
                  <button
                    type="button"
                    onClick={handleCancelEditProduct}
                    className="group flex-none flex items-center justify-center gap-2 bg-theme-100 hover:bg-theme-200 text-theme-600-text px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm active:scale-[0.98]"
                  >
                    <X className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Cancel
                  </button>
                )}
              </div>
              {suppliers.length === 0 && (
                <p className="text-xs text-rose-500 mt-1">Please add a supplier first.</p>
              )}
            </form>
          )}
          </div>
        </div>

        {/* List Section */}
        <div className={
          isListFullscreen && activeTab === 'products'
            ? "fixed inset-0 z-[100] bg-theme-50 p-3 sm:p-6 md:p-8 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden"
            : "flex-1 border-t lg:border-t-0 lg:border-l border-theme-200 pt-4 lg:pt-0 lg:pl-8 flex flex-col min-w-0"
        }>
          <div className="flex flex-col gap-3 mb-4 shrink-0">
            {/* Header: Title & Quick Actions */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-theme-900 text-sm sm:text-base">
                  {activeTab === 'suppliers' ? 'Daftar Supplier' : 'Daftar Produk'}
                </h3>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-theme-100 text-theme-700">
                  {totalItems}
                </span>
              </div>
              
              {activeTab === 'products' && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsListFullscreen(!isListFullscreen)}
                    className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-200 rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm"
                    title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
                  >
                    {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("AWAS: Apakah Anda yakin ingin mengatur SEMUA stok produk menjadi 0? Tindakan ini tidak dapat dibatalkan!")) {
                        await resetAllProductStocks();
                        alert("Semua stok produk berhasil di-nol-kan.");
                      }
                    }}
                    className="px-2.5 py-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95 bg-white border border-rose-200 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                    title="Jadikan Semua Stok 0"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> 
                    <span className="hidden sm:inline">Reset Semua Stok</span>
                    <span className="sm:hidden">Reset Stok</span>
                  </button>
                </div>
              )}
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
                  <div className="absolute left-0 z-50 mt-1 w-72 bg-white border border-theme-200 rounded-xl shadow-xl max-h-60 overflow-y-auto p-1">
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

            {/* Filter Dropdowns: Collapsible on Mobile, inline flex on sm+ */}
            {activeTab === 'products' && (
              <div className={`${isMobileFilterOpen ? 'grid' : 'hidden'} sm:flex flex-wrap items-center gap-2 grid-cols-2 pt-2 border-t border-neutral-100 sm:border-0 sm:pt-0`}>
                {/* Supplier Filter */}
                <div className="relative col-span-2 sm:col-span-1 sm:w-36" ref={listSupplierDropdownRef}>
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
                <div className="relative sm:w-36">
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
                <div className="relative sm:w-36">
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
                <div className="relative sm:w-36">
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
          
          {/* Main List Container: Desktop Table vs Mobile Cards */}
          <div className={
            isListFullscreen && activeTab === 'products'
              ? "flex-1 overflow-auto bg-white rounded-2xl border border-theme-200 shadow-sm min-h-0" 
              : "overflow-auto max-h-[calc(100vh-280px)] min-h-[300px]"
          }>
            {activeTab === 'suppliers' ? (
              <>
                {/* Mobile Cards for Suppliers */}
                <div className="md:hidden space-y-2.5 pb-2">
                  {filteredSuppliersList.length === 0 ? (
                    <div className="p-8 text-center text-theme-600-text bg-white rounded-2xl border border-theme-200">
                      <Building2 className="w-10 h-10 mx-auto text-theme-300 mb-2" />
                      <p className="font-bold text-theme-800">Tidak ada supplier ditemukan</p>
                    </div>
                  ) : (
                    paginatedSuppliersList.map(s => {
                      const productCount = products.filter(p => p.supplierId === s.id).length;
                      return (
                        <div 
                          key={s.id}
                          className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                            editingSupplierId === s.id 
                              ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/40' 
                              : 'border-theme-200 hover:border-theme-300'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0">
                              <h4 className="font-bold text-theme-950 text-base leading-snug break-words">
                                {s.name}
                              </h4>
                              <span className="text-xs text-theme-500 font-mono mt-0.5 block">
                                ID: {s.id}
                              </span>
                            </div>
                            <span className="text-xs font-semibold px-2.5 py-1 bg-theme-100 text-theme-800 rounded-lg shrink-0">
                              {productCount} Produk
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-2 border-t border-theme-100 mt-2">
                            <button
                              onClick={() => {
                                handleEditSupplier(s);
                              }}
                              className="flex-1 min-h-[42px] flex items-center justify-center gap-2 bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold text-xs rounded-xl py-2 px-3 transition-colors active:scale-[0.98]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit Supplier
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus supplier "${s.name}"?`)) {
                                  deleteSupplier(s.id);
                                }
                              }}
                              className="min-h-[42px] flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl py-2 px-3 border border-rose-200 transition-colors active:scale-[0.98]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table for Suppliers */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-theme-200">
                        <th className="sticky top-0 z-10 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">ID</th>
                        <th className="sticky top-0 z-10 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Nama Supplier</th>
                        <th className="sticky top-0 z-10 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Jumlah Produk</th>
                        <th className="sticky top-0 z-10 py-3.5 px-4 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-24 text-right">Aksi</th>
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
                {/* Mobile Cards for Products */}
                <div className="md:hidden space-y-3 pb-2">
                  {filteredProductsList.length === 0 ? (
                    <div className="p-8 text-center text-theme-600-text bg-white rounded-2xl border border-theme-200">
                      <Package className="w-10 h-10 mx-auto text-theme-300 mb-2" />
                      <p className="font-bold text-theme-800">Tidak ada produk ditemukan</p>
                      <p className="text-xs text-theme-500 mt-1">Coba sesuaikan kata kunci atau filter</p>
                    </div>
                  ) : (
                    paginatedProductsList.map(p => {
                      const supplier = suppliers.find(s => s.id === p.supplierId);
                      const isLow = p.bottomStock !== undefined && p.bottomStock !== null && (p.stock || 0) <= p.bottomStock;
                      
                      return (
                        <div 
                          key={p.id}
                          className={`bg-white rounded-2xl border p-4 shadow-sm transition-all ${
                            editingProductId === p.id 
                              ? 'border-amber-400 ring-2 ring-amber-300 bg-amber-50/40' 
                              : 'border-theme-200 hover:border-theme-300'
                          }`}
                        >
                          {/* Card Top: Title & Unit */}
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-bold text-theme-950 text-base leading-snug break-words">
                                {p.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-1.5 mt-1 text-xs">
                                <span className="inline-flex items-center gap-1 bg-theme-100 text-theme-800 font-medium px-2 py-0.5 rounded-md">
                                  <Building2 className="w-3 h-3 text-theme-500" />
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
                            <span className="text-xs font-semibold px-2 py-1 bg-theme-50 text-theme-700 rounded-lg border border-theme-200 shrink-0">
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

                          {/* Stock Metrics Grid */}
                          <div className="grid grid-cols-2 gap-2 my-2.5 py-2.5 px-3 bg-theme-50/80 rounded-xl border border-theme-100 text-xs">
                            <div className="flex flex-col">
                              <span className="text-[10px] uppercase font-bold text-theme-500 tracking-wider">Sisa Stok</span>
                              <div className="flex items-center gap-1.5 mt-0.5">
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
                              <span className="text-sm font-bold text-theme-700 mt-0.5">
                                {p.bottomStock !== undefined && p.bottomStock !== null ? `${p.bottomStock} ${p.unit || 'pcs'}` : '-'}
                              </span>
                            </div>
                          </div>

                          {/* Card Action Buttons */}
                          <div className="flex items-center gap-2 pt-2 border-t border-theme-100">
                            <button
                              onClick={() => {
                                handleEditProduct(p);
                              }}
                              className="flex-1 min-h-[42px] flex items-center justify-center gap-2 bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold text-xs rounded-xl py-2 px-3 transition-colors active:scale-[0.98]"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                              Edit Produk
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm(`Hapus produk "${p.name}"?`)) {
                                  deleteProduct(p.id);
                                }
                              }}
                              className="min-h-[42px] flex items-center justify-center gap-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold text-xs rounded-xl py-2 px-3 border border-rose-200 transition-colors active:scale-[0.98]"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Hapus
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Desktop Table for Products */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-theme-200">
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">Nama Produk</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Satuan</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Supplier</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Butom Stok</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Kategori</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 text-center">Stok</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Lokasi</th>
                        <th className="sticky top-0 z-10 py-3.5 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-24 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-theme-100">
                      {filteredProductsList.length === 0 ? (
                        <tr><td colSpan={8} className="py-8 text-center text-theme-600-text text-sm">Tidak ada produk ditemukan.</td></tr>
                      ) : (
                        paginatedProductsList.map(p => {
                          const isLow = p.bottomStock !== undefined && p.bottomStock !== null && (p.stock || 0) <= p.bottomStock;
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
                              <td className="py-3 px-3 text-sm text-theme-600-text font-mono text-center">
                                {p.bottomStock !== undefined && p.bottomStock !== null ? p.bottomStock : '-'}
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
                                  <button onClick={() => handleEditProduct(p)} className="p-1.5 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" title="Edit">
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
          <div className="flex flex-col sm:flex-row items-center justify-between p-3 sm:px-6 sm:py-4 border-t border-theme-200 bg-white gap-3 shrink-0">
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
              <span className="text-xs text-theme-600-text">
                {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, totalItems)} dari {totalItems}
              </span>
            </div>
            
            <div className="flex items-center justify-center w-full sm:w-auto gap-2">
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

              <div className="hidden sm:flex items-center gap-1 mx-2">
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
