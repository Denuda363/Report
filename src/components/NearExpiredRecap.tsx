import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Search, X, Trash2, Edit2, Save, Plus, CalendarClock, Download, 
  Copy, Printer, Check, AlertTriangle, Clock, Building2, Package, 
  Filter, CheckCircle2, ChevronDown, ArrowUpDown, RefreshCw, Sparkles,
  ArrowRight, LayoutGrid, Table as TableIcon, Layers
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { NearExpiredEntry, Product, Supplier } from '../types';
import { format, differenceInDays, parseISO, isValid, isBefore, startOfDay, addMonths } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import * as XLSX from 'xlsx';
import { getLastSearchQuery, setLastSearchQuery, addSearchHistory, getSearchHistory } from '../lib/searchHistory';
import { PreviousSearchSection } from './PreviousSearchSection';

interface PendingNearExpiredItem {
  id: string;
  productId?: string;
  productName: string;
  batch: string;
  expiredDate: string;
  supplierId?: string;
  supplierName: string;
  quantity?: number;
  unit?: string;
  notes?: string;
}

export const NearExpiredRecap: React.FC = () => {
  const { 
    nearExpiredList, 
    products, 
    suppliers, 
    addNearExpired, 
    addNearExpiredBatch, 
    updateNearExpired, 
    deleteNearExpired, 
    deleteMultipleNearExpired 
  } = useAppContext();

  // Search & Navigation in Form
  const [productSearchQuery, setProductSearchQuery] = useState('');
  const [isTypingNew, setIsTypingNew] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const productInputRef = useRef<HTMLInputElement>(null);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const expiredDateInputRef = useRef<HTMLInputElement>(null);
  const supplierInputRef = useRef<HTMLInputElement>(null);
  const qtyInputRef = useRef<HTMLInputElement>(null);

  // Form Field States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [productNameInput, setProductNameInput] = useState('');
  const [batchInput, setBatchInput] = useState('');
  const [expiredDateInput, setExpiredDateInput] = useState('');
  const [supplierNameInput, setSupplierNameInput] = useState('');
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | undefined>(undefined);
  const [quantityInput, setQuantityInput] = useState<number | ''>('');
  const [unitInput, setUnitInput] = useState('Pcs');
  const [notesInput, setNotesInput] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Search History for Product
  const [lastSearchQuery, setLastSearchQueryState] = useState(() => getLastSearchQuery('near_expired_product'));
  const [searchHistory, setSearchHistory] = useState<string[]>(() => getSearchHistory('near_expired_product'));

  // Pending Items Queue (List Form Input before Batch Save)
  const [pendingItems, setPendingItems] = useState<PendingNearExpiredItem[]>(() => {
    try {
      const saved = localStorage.getItem('near_expired_pending_items');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('near_expired_pending_items', JSON.stringify(pendingItems));
    } catch (e) {
      console.error('Error saving pending near expired items:', e);
    }
  }, [pendingItems]);

  // Table Filtering, Searching, & Sorting State
  const [tableSearch, setTableSearch] = useState('');
  const [filterUrgency, setFilterUrgency] = useState<'all' | 'expired' | 'critical' | 'warning' | 'safe'>('all');
  const [filterSupplier, setFilterSupplier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'resolved'>('all');
  const [sortBy, setSortBy] = useState<'expired_asc' | 'expired_desc' | 'name_asc' | 'created_desc'>('expired_asc');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Edit Modal State
  const [editingEntry, setEditingEntry] = useState<NearExpiredEntry | null>(null);
  const [editBatch, setEditBatch] = useState('');
  const [editExpiredDate, setEditExpiredDate] = useState('');
  const [editSupplierName, setEditSupplierName] = useState('');
  const [editQuantity, setEditQuantity] = useState<number | ''>('');
  const [editUnit, setEditUnit] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editStatus, setEditStatus] = useState<'pending' | 'returned' | 'disposed' | 'resolved'>('pending');

  // Copy TXT Modal / Toast State
  const [copyToast, setCopyToast] = useState(false);
  const [isFormExpanded, setIsFormExpanded] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Print Report States
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [printDataScope, setPrintDataScope] = useState<'filtered' | 'critical' | 'all' | 'pending'>('filtered');
  const [printNotes, setPrintNotes] = useState('Daftar monitoring produk mendekati masa kedaluwarsa untuk tindak lanjut / retur.');
  const [printOfficer, setPrintOfficer] = useState('');

  // Filtered Products for Autocomplete in Form
  const filteredProducts = useMemo(() => {
    const q = productSearchQuery.trim().toLowerCase();
    if (!q) return products.slice(0, 50);
    return products.filter(p => {
      const sup = suppliers.find(s => s.id === p.supplierId);
      return (
        (p.name || '').toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (sup?.name || '').toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [products, suppliers, productSearchQuery]);

  const previousProducts = useMemo(() => {
    if (!lastSearchQuery) return [];
    const q = lastSearchQuery.toLowerCase();
    return products.filter(p => (p.name || '').toLowerCase().includes(q)).slice(0, 50);
  }, [products, lastSearchQuery]);

  // Active product's master data suppliers (Primary & Alternatives)
  const activeProductSuppliers = useMemo(() => {
    if (!selectedProduct) return { primary: null, alternatives: [] };
    const primary = suppliers.find(s => s.id === selectedProduct.supplierId) || null;
    const alternatives = (selectedProduct.alternativeSupplierIds || [])
      .map(id => suppliers.find(s => s.id === id))
      .filter((s): s is Supplier => Boolean(s));
    return { primary, alternatives };
  }, [selectedProduct, suppliers]);

  // Categorized Suppliers for Supplier Input Dropdown (Product related master suppliers first, then others)
  const categorizedSuppliers = useMemo(() => {
    const q = supplierNameInput.trim().toLowerCase();
    const primary = activeProductSuppliers.primary;
    const alts = activeProductSuppliers.alternatives;
    const relatedIds = new Set<string>();
    if (primary) relatedIds.add(primary.id);
    alts.forEach(a => relatedIds.add(a.id));

    const matchedPrimary = primary && (!q || primary.name.toLowerCase().includes(q)) ? primary : null;
    const matchedAlts = alts.filter(a => !q || a.name.toLowerCase().includes(q));

    const otherSuppliers = suppliers.filter(s => {
      if (relatedIds.has(s.id)) return false;
      return !q || s.name.toLowerCase().includes(q);
    }).slice(0, 30);

    return {
      matchedPrimary,
      matchedAlts,
      otherSuppliers
    };
  }, [suppliers, supplierNameInput, activeProductSuppliers]);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Auto-scroll highlighted dropdown item into view
  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const activeEl = dropdownRef.current.querySelector('[data-highlighted="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex, isDropdownOpen]);

  // Product Selection Handler (auto-fill primary supplier from master data)
  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setProductNameInput(product.name);
    setProductSearchQuery(product.name);
    setUnitInput(product.unit || 'Pcs');

    // Auto-fill primary supplier from master data
    const primarySup = suppliers.find(s => s.id === product.supplierId);
    if (primarySup) {
      setSupplierNameInput(primarySup.name);
      setSelectedSupplierId(primarySup.id);
    } else {
      setSupplierNameInput('');
      setSelectedSupplierId(undefined);
    }

    // Save search history
    const typed = productSearchQuery.trim();
    const queryToSave = (isTypingNew && typed) ? typed : product.name;
    if (queryToSave) {
      setLastSearchQuery('near_expired_product', queryToSave);
      setLastSearchQueryState(queryToSave);
      const updated = addSearchHistory('near_expired_product', queryToSave);
      setSearchHistory(updated);
    }

    setIsDropdownOpen(false);
    setIsTypingNew(false);

    // Focus next field (Batch)
    setTimeout(() => {
      batchInputRef.current?.focus();
    }, 50);
  };

  // Keyboard navigation for product search (Arrow Up, Arrow Down, Enter)
  const handleProductSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const isShowingPrevious = (!isTypingNew || !productSearchQuery.trim()) && !!lastSearchQuery && previousProducts.length > 0;
    const activeList = isShowingPrevious ? previousProducts : filteredProducts;

    if (!isDropdownOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
        if (!lastSearchQuery) {
          setIsTypingNew(true);
        }
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (selectedProduct) {
          batchInputRef.current?.focus();
        } else if (productSearchQuery.trim()) {
          const exact = products.find(p => p.name.trim().toLowerCase() === productSearchQuery.trim().toLowerCase());
          if (exact) {
            handleProductSelect(exact);
          } else {
            setProductNameInput(productSearchQuery.trim());
            setIsDropdownOpen(false);
            batchInputRef.current?.focus();
          }
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
        handleProductSelect(activeList[highlightedIndex]);
      } else if (productSearchQuery.trim()) {
        const exact = products.find(p => p.name.trim().toLowerCase() === productSearchQuery.trim().toLowerCase());
        if (exact) {
          handleProductSelect(exact);
        } else {
          setProductNameInput(productSearchQuery.trim());
          setIsDropdownOpen(false);
          batchInputRef.current?.focus();
        }
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setIsTypingNew(false);
    }
  };

  // Resolve current form input into structured entry
  const resolveCurrentFormItem = (): Omit<NearExpiredEntry, 'id'> | null => {
    const name = productNameInput.trim() || productSearchQuery.trim();
    if (!name || !batchInput.trim() || !expiredDateInput.trim()) return null;

    const matchedProduct = selectedProduct || products.find(p => p.name.trim().toLowerCase() === name.toLowerCase());
    let finalSupplierName = supplierNameInput.trim();
    let finalSupplierId = selectedSupplierId;
    if (!finalSupplierName && matchedProduct) {
      const sup = suppliers.find(s => s.id === matchedProduct.supplierId);
      if (sup) {
        finalSupplierName = sup.name;
        finalSupplierId = sup.id;
      }
    }
    if (!finalSupplierName) {
      finalSupplierName = 'Tidak Diketahui';
    }

    return {
      productId: matchedProduct?.id,
      productName: name,
      batch: batchInput.trim().toUpperCase(),
      expiredDate: expiredDateInput.trim(),
      supplierId: finalSupplierId,
      supplierName: finalSupplierName,
      quantity: quantityInput !== '' ? Number(quantityInput) : undefined,
      unit: unitInput.trim() || 'Pcs',
      notes: notesInput.trim() || undefined,
      createdAt: Date.now(),
      status: 'pending'
    };
  };

  const resetFormFields = () => {
    setSelectedProduct(null);
    setProductNameInput('');
    setProductSearchQuery('');
    setBatchInput('');
    setExpiredDateInput('');
    setSupplierNameInput('');
    setSelectedSupplierId(undefined);
    setQuantityInput('');
    setNotesInput('');
    setIsDropdownOpen(false);
    setTimeout(() => {
      productInputRef.current?.focus();
    }, 50);
  };

  // Add Item to Pending List (with duplicate merge protection so data is never clobbered)
  const handleAddPending = () => {
    const name = productNameInput.trim() || productSearchQuery.trim();
    if (!name) {
      alert('Silakan pilih atau masukkan Nama Produk.');
      productInputRef.current?.focus();
      return;
    }

    if (!batchInput.trim()) {
      alert('Silakan masukkan Nomor Batch.');
      batchInputRef.current?.focus();
      return;
    }

    if (!expiredDateInput.trim()) {
      alert('Silakan pilih Tanggal Expired.');
      expiredDateInputRef.current?.focus();
      return;
    }

    const currentItem = resolveCurrentFormItem();
    if (!currentItem) return;

    // Check if identical product and batch already exists in pendingItems to prevent duplicate / overwritten entries
    const existingIndex = pendingItems.findIndex(
      it => it.productName.trim().toLowerCase() === currentItem.productName.toLowerCase() &&
            it.batch.trim().toUpperCase() === currentItem.batch.toUpperCase()
    );

    if (existingIndex >= 0) {
      const updated = [...pendingItems];
      const existing = { ...updated[existingIndex] };
      const currentQty = existing.quantity || 0;
      const addQty = currentItem.quantity || 0;
      if (addQty > 0 || currentQty > 0) {
        existing.quantity = currentQty + addQty;
      }
      if (currentItem.notes) {
        existing.notes = existing.notes ? `${existing.notes} | ${currentItem.notes}` : currentItem.notes;
      }
      if (currentItem.expiredDate) existing.expiredDate = currentItem.expiredDate;
      if (currentItem.supplierName && currentItem.supplierName !== 'Tidak Diketahui') {
        existing.supplierName = currentItem.supplierName;
        existing.supplierId = currentItem.supplierId;
      }
      updated[existingIndex] = existing;
      setPendingItems(updated);
      alert(`Produk "${currentItem.productName}" (Batch: ${currentItem.batch}) sudah ada di antrean. Jumlah digabungkan menjadi ${existing.quantity || 'ada'} ${existing.unit}!`);
    } else {
      const newItem: PendingNearExpiredItem = {
        id: Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36),
        productId: currentItem.productId,
        productName: currentItem.productName,
        batch: currentItem.batch,
        expiredDate: currentItem.expiredDate,
        supplierId: currentItem.supplierId,
        supplierName: currentItem.supplierName,
        quantity: currentItem.quantity,
        unit: currentItem.unit,
        notes: currentItem.notes
      };
      setPendingItems(prev => [newItem, ...prev]);
    }

    resetFormFields();
  };

  // Remove Item from Pending List
  const handleRemovePendingItem = (id: string) => {
    setPendingItems(prev => prev.filter(item => item.id !== id));
  };

  // Save All Pending Items (Ctrl + S) - guarantees all queued items + any active form item are fully saved
  const handleSaveAllPending = async () => {
    if (isSaving) return;

    const currentItem = resolveCurrentFormItem();
    const entriesToAdd: Omit<NearExpiredEntry, 'id'>[] = pendingItems.map(item => ({
      productId: item.productId,
      productName: item.productName,
      batch: item.batch,
      expiredDate: item.expiredDate,
      supplierId: item.supplierId,
      supplierName: item.supplierName,
      quantity: item.quantity,
      unit: item.unit,
      notes: item.notes,
      createdAt: Date.now(),
      status: 'pending'
    }));

    if (currentItem) {
      entriesToAdd.push(currentItem);
    }

    if (entriesToAdd.length === 0) {
      alert('Daftar antrean masih kosong. Silakan lengkapi Nama Produk, Batch, dan Tanggal Expired terlebih dahulu.');
      return;
    }

    setIsSaving(true);
    try {
      await addNearExpiredBatch(entriesToAdd);
      setPendingItems([]);
      if (currentItem) {
        resetFormFields();
      }
      alert(`Berhasil menyimpan ${entriesToAdd.length} data produk expired dekat tanpa tertimpa!`);
    } catch (e: any) {
      console.error('Gagal menyimpan batch:', e);
      alert('Terjadi kesalahan saat menyimpan data: ' + (e?.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  // Direct Save: Saves cleanly without overwriting previous data. If there are pending items, saves everything together!
  const handleDirectSave = async () => {
    if (isSaving) return;

    const currentItem = resolveCurrentFormItem();

    // If there are pending items in the queue, save all pending items + current item together so nothing is missed or lost
    if (pendingItems.length > 0) {
      setIsSaving(true);
      try {
        const entriesToAdd: Omit<NearExpiredEntry, 'id'>[] = pendingItems.map(item => ({
          productId: item.productId,
          productName: item.productName,
          batch: item.batch,
          expiredDate: item.expiredDate,
          supplierId: item.supplierId,
          supplierName: item.supplierName,
          quantity: item.quantity,
          unit: item.unit,
          notes: item.notes,
          createdAt: Date.now(),
          status: 'pending'
        }));

        if (currentItem) {
          entriesToAdd.push(currentItem);
        }

        await addNearExpiredBatch(entriesToAdd);
        setPendingItems([]);
        if (currentItem) {
          resetFormFields();
        }
        alert(`Berhasil menyimpan ${entriesToAdd.length} data produk expired dekat tanpa tertimpa!`);
      } catch (e: any) {
        console.error('Gagal menyimpan data:', e);
        alert('Terjadi kesalahan saat menyimpan data: ' + (e?.message || e));
      } finally {
        setIsSaving(false);
      }
      return;
    }

    // No pending items: validate single current item
    const name = productNameInput.trim() || productSearchQuery.trim();
    if (!name) {
      alert('Silakan pilih atau masukkan Nama Produk.');
      productInputRef.current?.focus();
      return;
    }

    if (!batchInput.trim()) {
      alert('Silakan masukkan Nomor Batch.');
      batchInputRef.current?.focus();
      return;
    }

    if (!expiredDateInput.trim()) {
      alert('Silakan pilih Tanggal Expired.');
      expiredDateInputRef.current?.focus();
      return;
    }

    if (!currentItem) return;

    // Check if this exact product & batch already exists in database
    const existingInDb = nearExpiredList.find(
      r => r.productName.trim().toLowerCase() === currentItem.productName.toLowerCase() &&
           r.batch.trim().toUpperCase() === currentItem.batch.toUpperCase() &&
           r.status !== 'resolved' && r.status !== 'returned' && r.status !== 'disposed'
    );

    if (existingInDb && currentItem.quantity !== undefined && currentItem.quantity > 0) {
      const confirmMerge = window.confirm(
        `Produk "${currentItem.productName}" dengan No. Batch "${currentItem.batch}" sudah ada di data tersimpan.\n` +
        `• Jumlah saat ini: ${existingInDb.quantity || 0} ${existingInDb.unit || 'Pcs'}\n` +
        `• Tambahan baru: +${currentItem.quantity} ${currentItem.unit || 'Pcs'}\n\n` +
        `Klik OK untuk MENAMBAH JUMLAH ke data yang sudah ada (Total: ${(existingInDb.quantity || 0) + currentItem.quantity} ${currentItem.unit}).\n` +
        `Klik CANCEL untuk tetap menyimpan sebagai baris catatan baru (data lama tetap aman dan tidak akan tertimpa).`
      );

      if (confirmMerge) {
        setIsSaving(true);
        try {
          const mergedNotes = currentItem.notes 
            ? (existingInDb.notes ? `${existingInDb.notes} | ${currentItem.notes}` : currentItem.notes)
            : existingInDb.notes;
          await updateNearExpired(existingInDb.id, {
            quantity: (existingInDb.quantity || 0) + currentItem.quantity,
            notes: mergedNotes,
            expiredDate: currentItem.expiredDate || existingInDb.expiredDate,
            supplierName: currentItem.supplierName !== 'Tidak Diketahui' ? currentItem.supplierName : existingInDb.supplierName
          });
          resetFormFields();
          alert(`Berhasil memperbarui jumlah stok expired produk "${currentItem.productName}"!`);
        } catch (e: any) {
          alert('Gagal memperbarui data: ' + (e?.message || e));
        } finally {
          setIsSaving(false);
        }
        return;
      }
    }

    // Save as distinct new entry (ensuring unique ID & timestamp so nothing is overwritten)
    setIsSaving(true);
    try {
      await addNearExpired(currentItem);
      resetFormFields();
      alert('Berhasil menyimpan data produk expired dekat!');
    } catch (e: any) {
      alert('Gagal menyimpan data: ' + (e?.message || e));
    } finally {
      setIsSaving(false);
    }
  };

  // Ctrl + S Keyboard Shortcut Listener (intelligently saves all active and pending items)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleDirectSave();
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [pendingItems, productNameInput, productSearchQuery, batchInput, expiredDateInput, supplierNameInput, selectedProduct, selectedSupplierId, quantityInput, unitInput, notesInput, isSaving]);

  // Urgency Helper Calculation
  const today = useMemo(() => startOfDay(new Date()), []);

  const getUrgencyInfo = (expiredDateStr: string) => {
    try {
      const expDate = startOfDay(parseISO(expiredDateStr));
      if (!isValid(expDate)) return { days: 0, status: 'unknown', label: 'Tidak Valid', color: 'gray' };

      const diff = differenceInDays(expDate, today);

      if (diff < 0) {
        return {
          days: diff,
          status: 'expired',
          label: `Sudah Lewat (${Math.abs(diff)} hr)`,
          badgeClass: 'bg-red-100 text-red-800 border-red-300',
          dotColor: 'bg-red-600'
        };
      }
      if (diff === 0) {
        return {
          days: 0,
          status: 'expired',
          label: 'Hari Ini (0 hr)',
          badgeClass: 'bg-red-100 text-red-800 border-red-300 font-bold animate-pulse',
          dotColor: 'bg-red-600'
        };
      }
      if (diff <= 30) {
        return {
          days: diff,
          status: 'critical',
          label: `Kritis: Sisa ${diff} hari`,
          badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-semibold',
          dotColor: 'bg-rose-500'
        };
      }
      if (diff <= 90) {
        const months = Math.ceil(diff / 30);
        return {
          days: diff,
          status: 'warning',
          label: `Waspada: ~${months} bln (${diff} hr)`,
          badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
          dotColor: 'bg-amber-500'
        };
      }
      const months = Math.floor(diff / 30);
      return {
        days: diff,
        status: 'safe',
        label: `Aman: ${months}+ bln (${diff} hr)`,
        badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        dotColor: 'bg-emerald-500'
      };
    } catch {
      return { days: 0, status: 'unknown', label: 'Format Error', badgeClass: 'bg-gray-100 text-gray-700 border-gray-300', dotColor: 'bg-gray-400' };
    }
  };

  // Metrics Summary
  const stats = useMemo(() => {
    let total = nearExpiredList.length;
    let expired = 0;
    let critical = 0;
    let warning = 0;
    let safe = 0;
    let returnedOrResolved = 0;

    nearExpiredList.forEach(item => {
      if (item.status === 'resolved' || item.status === 'returned' || item.status === 'disposed') {
        returnedOrResolved++;
      }
      const info = getUrgencyInfo(item.expiredDate);
      if (info.status === 'expired') expired++;
      else if (info.status === 'critical') critical++;
      else if (info.status === 'warning') warning++;
      else if (info.status === 'safe') safe++;
    });

    return { total, expired, critical, warning, safe, returnedOrResolved };
  }, [nearExpiredList, today]);

  // Unique list of suppliers from existing entries for filter
  const existingSupplierNames = useMemo(() => {
    const set = new Set<string>();
    nearExpiredList.forEach(item => {
      if (item.supplierName) set.add(item.supplierName);
    });
    return Array.from(set).sort();
  }, [nearExpiredList]);

  // Filter & Sort Table Records
  const filteredRecords = useMemo(() => {
    let result = [...nearExpiredList];

    // Search query
    if (tableSearch.trim()) {
      const q = tableSearch.toLowerCase().trim();
      result = result.filter(item => {
        const directMatch = 
          (item.productName || '').toLowerCase().includes(q) ||
          (item.batch || '').toLowerCase().includes(q) ||
          (item.supplierName || '').toLowerCase().includes(q) ||
          (item.notes || '').toLowerCase().includes(q) ||
          (item.expiredDate || '').includes(q);
        if (directMatch) return true;

        const prod = item.productId
          ? products.find(p => p.id === item.productId)
          : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
        if (prod?.alternativeSupplierIds) {
          return prod.alternativeSupplierIds.some(id => {
            const s = suppliers.find(sup => sup.id === id);
            return s && s.name.toLowerCase().includes(q);
          });
        }
        return false;
      });
    }

    // Urgency filter
    if (filterUrgency !== 'all') {
      result = result.filter(item => {
        const info = getUrgencyInfo(item.expiredDate);
        return info.status === filterUrgency;
      });
    }

    // Supplier filter
    if (filterSupplier !== 'all') {
      result = result.filter(item => {
        if (item.supplierName === filterSupplier) return true;
        const prod = item.productId
          ? products.find(p => p.id === item.productId)
          : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
        if (prod?.alternativeSupplierIds) {
          return prod.alternativeSupplierIds.some(id => {
            const s = suppliers.find(sup => sup.id === id);
            return s && s.name === filterSupplier;
          });
        }
        return false;
      });
    }

    // Status filter
    if (filterStatus === 'pending') {
      result = result.filter(item => !item.status || item.status === 'pending');
    } else if (filterStatus === 'resolved') {
      result = result.filter(item => item.status && item.status !== 'pending');
    }

    // Sorting with stable tie-breakers
    result.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'expired_asc') {
        cmp = (a.expiredDate || '').localeCompare(b.expiredDate || '');
      } else if (sortBy === 'expired_desc') {
        cmp = (b.expiredDate || '').localeCompare(a.expiredDate || '');
      } else if (sortBy === 'name_asc') {
        cmp = (a.productName || '').localeCompare(b.productName || '');
      } else if (sortBy === 'created_desc') {
        cmp = (b.createdAt || 0) - (a.createdAt || 0);
      }
      if (cmp !== 0) return cmp;
      const nameCmp = (a.productName || '').localeCompare(b.productName || '');
      if (nameCmp !== 0) return nameCmp;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    return result;
  }, [nearExpiredList, tableSearch, filterUrgency, filterSupplier, filterStatus, sortBy, today]);

  // Multi-select Handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredRecords.map(r => r.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Hapus ${selectedIds.size} data produk expired yang dipilih?`)) return;

    try {
      await deleteMultipleNearExpired(Array.from(selectedIds));
      setSelectedIds(new Set());
    } catch (e: any) {
      alert('Gagal menghapus data: ' + (e?.message || e));
    }
  };

  const handleBatchMarkStatus = async (newStatus: 'resolved' | 'returned' | 'pending') => {
    if (selectedIds.size === 0) return;
    try {
      for (const id of Array.from(selectedIds)) {
        await updateNearExpired(id, { status: newStatus });
      }
      setSelectedIds(new Set());
    } catch (e: any) {
      alert('Gagal memperbarui status: ' + (e?.message || e));
    }
  };

  // Edit Modal Product & Master Suppliers
  const editEntryProduct = useMemo(() => {
    if (!editingEntry) return null;
    if (editingEntry.productId) {
      const p = products.find(prod => prod.id === editingEntry.productId);
      if (p) return p;
    }
    return products.find(prod => prod.name.trim().toLowerCase() === editingEntry.productName.trim().toLowerCase()) || null;
  }, [editingEntry, products]);

  const editEntrySuppliers = useMemo(() => {
    if (!editEntryProduct) return { primary: null, alternatives: [] };
    const primary = suppliers.find(s => s.id === editEntryProduct.supplierId) || null;
    const alternatives = (editEntryProduct.alternativeSupplierIds || [])
      .map(id => suppliers.find(s => s.id === id))
      .filter((s): s is Supplier => Boolean(s));
    return { primary, alternatives };
  }, [editEntryProduct, suppliers]);

  // Edit Modal Handlers
  const openEditModal = (entry: NearExpiredEntry) => {
    setEditingEntry(entry);
    setEditBatch(entry.batch || '');
    setEditExpiredDate(entry.expiredDate || '');
    setEditSupplierName(entry.supplierName || '');
    setEditQuantity(entry.quantity !== undefined ? entry.quantity : '');
    setEditUnit(entry.unit || 'Pcs');
    setEditNotes(entry.notes || '');
    setEditStatus(entry.status || 'pending');
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    if (!editBatch.trim()) {
      alert('Nomor Batch tidak boleh kosong.');
      return;
    }
    if (!editExpiredDate.trim()) {
      alert('Tanggal Expired tidak boleh kosong.');
      return;
    }

    try {
      await updateNearExpired(editingEntry.id, {
        batch: editBatch.trim().toUpperCase(),
        expiredDate: editExpiredDate.trim(),
        supplierName: editSupplierName.trim() || 'Tidak Diketahui',
        quantity: editQuantity !== '' ? Number(editQuantity) : undefined,
        unit: editUnit.trim() || 'Pcs',
        notes: editNotes.trim() || undefined,
        status: editStatus
      });
      setEditingEntry(null);
    } catch (e: any) {
      alert('Gagal mengupdate data: ' + (e?.message || e));
    }
  };

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const dataToExport = filteredRecords.map((item, index) => {
      const urgency = getUrgencyInfo(item.expiredDate);
      return {
        'No': index + 1,
        'Nama Produk': item.productName,
        'No. Batch': item.batch,
        'Tanggal Expired': item.expiredDate,
        'Sisa Waktu (Hari)': urgency.days,
        'Status Urgensi': urgency.label,
        'Perkiraan Supplier': item.supplierName,
        'Jumlah (Qty)': item.quantity !== undefined ? item.quantity : '-',
        'Satuan': item.unit || '-',
        'Status Penanganan': item.status === 'returned' ? 'Retur ke Supplier' : item.status === 'resolved' ? 'Selesai' : item.status === 'disposed' ? 'Pemusnahan' : 'Menunggu (Pending)',
        'Catatan': item.notes || '-',
        'Tanggal Dicatat': item.createdAt ? format(new Date(item.createdAt), 'dd/MM/yyyy HH:mm') : '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    worksheet['!cols'] = [
      { wch: 5 },  // No
      { wch: 32 }, // Nama Produk
      { wch: 16 }, // Batch
      { wch: 16 }, // Expired
      { wch: 18 }, // Sisa Hari
      { wch: 22 }, // Status Urgensi
      { wch: 28 }, // Perkiraan Supplier
      { wch: 14 }, // Qty
      { wch: 10 }, // Satuan
      { wch: 20 }, // Status Penanganan
      { wch: 25 }, // Catatan
      { wch: 20 }, // Tanggal Dicatat
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Expired Dekat');
    const fileName = `Rekap_Produk_Expired_Dekat_${format(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  };

  // Export / Copy to TXT for sharing
  const handleCopyTxt = () => {
    if (filteredRecords.length === 0) {
      alert('Tidak ada data untuk disalin.');
      return;
    }

    const todayStr = format(new Date(), 'dd MMMM yyyy', { locale: localeId });
    let txt = `📋 *REKAP PRODUK EXPIRED DEKAT*\n`;
    txt += `📅 Per Tanggal: ${todayStr}\n`;
    txt += `📦 Total Terdata: ${filteredRecords.length} Item\n`;
    txt += `-------------------------------------------\n\n`;

    filteredRecords.forEach((item, idx) => {
      const urgency = getUrgencyInfo(item.expiredDate);
      txt += `${idx + 1}. *${item.productName.toUpperCase()}*\n`;
      txt += `   • No. Batch       : ${item.batch}\n`;
      txt += `   • Tanggal Expired : ${item.expiredDate} (${urgency.label})\n`;
      txt += `   • Estimasi Vendor : ${item.supplierName}\n`;
      if (item.quantity !== undefined && item.quantity > 0) {
        txt += `   • Jumlah / Stok   : ${item.quantity} ${item.unit || 'Pcs'}\n`;
      }
      if (item.notes) {
        txt += `   • Catatan         : ${item.notes}\n`;
      }
      if (item.status && item.status !== 'pending') {
        txt += `   • Status          : [${item.status.toUpperCase()}]\n`;
      }
      txt += `\n`;
    });

    txt += `-------------------------------------------\n`;
    txt += `Keterangan Urgensi:\n`;
    txt += `🔴 Sudah Lewat / Hari Ini: ${stats.expired} Item\n`;
    txt += `🟠 Kritis (< 30 Hari): ${stats.critical} Item\n`;
    txt += `🟡 Waspada (1 - 3 Bulan): ${stats.warning} Item\n`;
    txt += `🟢 Aman (> 3 Bulan): ${stats.safe} Item\n`;

    navigator.clipboard.writeText(txt).then(() => {
      setCopyToast(true);
      setTimeout(() => setCopyToast(false), 3000);
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
      alert('Gagal menyalin teks ke clipboard.');
    });
  };

  // Records specifically selected for printing
  const printRecords = useMemo(() => {
    if (printDataScope === 'all') {
      return [...nearExpiredList].sort((a, b) => (a.expiredDate || '').localeCompare(b.expiredDate || ''));
    }
    if (printDataScope === 'critical') {
      return nearExpiredList.filter(item => {
        const u = getUrgencyInfo(item.expiredDate);
        return u.status === 'expired' || u.status === 'critical';
      }).sort((a, b) => (a.expiredDate || '').localeCompare(b.expiredDate || ''));
    }
    if (printDataScope === 'pending') {
      return nearExpiredList.filter(item => !item.status || item.status === 'pending')
        .sort((a, b) => (a.expiredDate || '').localeCompare(b.expiredDate || ''));
    }
    return filteredRecords;
  }, [printDataScope, filteredRecords, nearExpiredList]);

  // Open Print Preview Modal
  const handleOpenPrintModal = () => {
    if (nearExpiredList.length === 0) {
      alert('Belum ada data produk expired dekat untuk dicetak. Tambahkan produk ke daftar terlebih dahulu.');
      return;
    }
    setIsPrintModalOpen(true);
  };

  // Execute clean printable report via isolated print mechanism
  const executePrint = () => {
    const printDateStr = format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeId }) + ' WIB';
    
    let expCount = 0;
    let critCount = 0;
    let warnCount = 0;
    let safeCount = 0;
    printRecords.forEach(r => {
      const u = getUrgencyInfo(r.expiredDate);
      if (u.status === 'expired') expCount++;
      else if (u.status === 'critical') critCount++;
      else if (u.status === 'warning') warnCount++;
      else if (u.status === 'safe') safeCount++;
    });

    const rowsHtml = printRecords.map((item, idx) => {
      const u = getUrgencyInfo(item.expiredDate);
      const prod = item.productId
        ? products.find(p => p.id === item.productId)
        : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
      const alts = (prod?.alternativeSupplierIds || [])
        .map(id => suppliers.find(s => s.id === id)?.name)
        .filter(Boolean);

      let urgencyBadgeColor = '#374151';
      let urgencyBg = '#f3f4f6';
      if (u.status === 'expired') {
        urgencyBadgeColor = '#991b1b';
        urgencyBg = '#fee2e2';
      } else if (u.status === 'critical') {
        urgencyBadgeColor = '#9a3412';
        urgencyBg = '#ffedd5';
      } else if (u.status === 'warning') {
        urgencyBadgeColor = '#854d0e';
        urgencyBg = '#fef9c3';
      } else if (u.status === 'safe') {
        urgencyBadgeColor = '#166534';
        urgencyBg = '#dcfce7';
      }

      return `
        <tr style="border-bottom: 1px solid #e5e7eb; page-break-inside: avoid;">
          <td style="padding: 6px 8px; text-align: center; font-size: 11px; vertical-align: top;">${idx + 1}</td>
          <td style="padding: 6px 8px; font-size: 11px; font-weight: bold; color: #111827; vertical-align: top;">
            ${item.productName}
            ${prod?.category ? `<div style="font-size: 9px; color: #6b7280; font-weight: normal; margin-top: 1px;">Kategori: ${prod.category}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; font-size: 11px; font-family: monospace; font-weight: bold; color: #1f2937; vertical-align: top;">
            ${item.batch || '-'}
          </td>
          <td style="padding: 6px 8px; font-size: 11px; font-weight: bold; color: #111827; vertical-align: top; white-space: nowrap;">
            ${item.expiredDate}
          </td>
          <td style="padding: 6px 8px; font-size: 10px; vertical-align: top;">
            <span style="display: inline-block; padding: 2px 6px; border-radius: 4px; font-weight: 600; background: ${urgencyBg}; color: ${urgencyBadgeColor}; border: 1px solid rgba(0,0,0,0.08);">
              ${u.label}
            </span>
          </td>
          <td style="padding: 6px 8px; font-size: 11px; color: #374151; vertical-align: top;">
            <strong>${item.supplierName || 'Tidak Diketahui'}</strong>
            ${alts.length > 0 ? `<div style="font-size: 9px; color: #b45309; margin-top: 1px;">Alt: ${alts.join(', ')}</div>` : ''}
          </td>
          <td style="padding: 6px 8px; text-align: right; font-size: 11px; font-weight: bold; color: #111827; vertical-align: top; white-space: nowrap;">
            ${item.quantity !== undefined ? `${item.quantity} ${item.unit || 'Pcs'}` : '-'}
          </td>
          <td style="padding: 6px 8px; font-size: 10px; color: #4b5563; vertical-align: top;">
            ${item.notes || '-'}
          </td>
          <td style="padding: 6px 8px; font-size: 10px; text-align: center; vertical-align: top; white-space: nowrap;">
            <span style="font-weight: 600; text-transform: uppercase;">
              ${item.status === 'returned' ? 'Retur PBF' : item.status === 'resolved' ? 'Selesai' : item.status === 'disposed' ? 'Pemusnahan' : 'Pending'}
            </span>
          </td>
        </tr>
      `;
    }).join('');

    const printHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Laporan Rekap Produk Expired Dekat - ${format(new Date(), 'yyyy-MM-dd')}</title>
        <style>
          @page {
            size: A4 landscape;
            margin: 10mm 8mm;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            color: #111827;
            background: #fff;
            margin: 0;
            padding: 8px;
          }
          .header-box {
            border-bottom: 2px solid #111827;
            padding-bottom: 8px;
            margin-bottom: 10px;
          }
          .title {
            font-size: 18px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin: 0 0 3px 0;
            text-transform: uppercase;
          }
          .subtitle {
            font-size: 11px;
            color: #4b5563;
            margin: 0;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: #4b5563;
            margin-top: 6px;
          }
          .summary-bar {
            display: flex;
            gap: 12px;
            background: #f9fafb;
            border: 1px solid #e5e7eb;
            border-radius: 6px;
            padding: 6px 10px;
            margin-bottom: 10px;
            font-size: 11px;
          }
          .summary-item strong {
            color: #111827;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
          }
          th {
            background-color: #f3f4f6;
            color: #111827;
            font-weight: 700;
            text-align: left;
            padding: 7px 8px;
            border-top: 1px solid #d1d5db;
            border-bottom: 2px solid #9ca3af;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          .sign-section {
            margin-top: 24px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
            font-size: 11px;
          }
          .sign-box {
            text-align: center;
            width: 220px;
          }
          .sign-line {
            margin-top: 50px;
            border-top: 1px solid #111827;
            padding-top: 4px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="header-box">
          <div style="display: flex; justify-content: space-between; align-items: flex-start;">
            <div>
              <h1 class="title">Laporan Rekap Produk Expired Dekat</h1>
              <p class="subtitle">Sistem Pengawasan Tanggal Kedaluwarsa &amp; Estimasi Supplier Produk Farmasi / Apotek</p>
            </div>
            <div style="text-align: right; font-size: 10px; color: #6b7280;">
              <div>DailyReportPro</div>
              <div>Dicetak: <strong>${printDateStr}</strong></div>
            </div>
          </div>
          <div class="meta-row">
            <div>Cakupan Data: <strong>${
              printDataScope === 'critical' ? 'Khusus Kritis & Lewat ED (<= 30 Hari)' :
              printDataScope === 'pending' ? 'Khusus Status Pending (Belum Ditangani)' :
              printDataScope === 'all' ? 'Seluruh Data Expired Dekat' :
              'Data Sesuai Filter Layar'
            } (${printRecords.length} Produk)</strong></div>
            ${printNotes ? `<div>Catatan: <em>${printNotes}</em></div>` : ''}
          </div>
        </div>

        <div class="summary-bar">
          <div class="summary-item">Total Terdata: <strong>${printRecords.length} Produk</strong></div>
          <div class="summary-item" style="color: #991b1b;">🔴 Lewat ED: <strong>${expCount}</strong></div>
          <div class="summary-item" style="color: #c2410c;">🟠 Kritis (&le; 30 Hari): <strong>${critCount}</strong></div>
          <div class="summary-item" style="color: #854d0e;">🟡 Waspada (1 - 3 Bln): <strong>${warnCount}</strong></div>
          <div class="summary-item" style="color: #15803d;">🟢 Aman (&gt; 3 Bln): <strong>${safeCount}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px; text-align: center;">No</th>
              <th style="width: 23%;">Nama Produk</th>
              <th style="width: 11%;">No. Batch</th>
              <th style="width: 10%;">Tgl Expired</th>
              <th style="width: 13%;">Sisa Waktu</th>
              <th style="width: 15%;">Perkiraan Supplier</th>
              <th style="width: 10%; text-align: right;">Jumlah (Qty)</th>
              <th style="width: 11%;">Catatan Tindakan</th>
              <th style="width: 7%; text-align: center;">Status</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml || '<tr><td colspan="9" style="text-align:center; padding: 20px; color: #9ca3af;">Tidak ada data produk expired dekat</td></tr>'}
          </tbody>
        </table>

        <div class="sign-section">
          <div class="sign-box">
            <div>Dibuat / Diperiksa Oleh:</div>
            <div class="sign-line">${printOfficer || 'Petugas Gudang / Farmasi'}</div>
          </div>
          <div class="sign-box">
            <div>Mengetahui,</div>
            <div class="sign-line">Apoteker / Penanggung Jawab</div>
          </div>
        </div>
      </body>
      </html>
    `;

    let iframe = document.getElementById('report-print-iframe') as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'report-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.error('Iframe print error, falling back to window.print():', e);
          window.print();
        }
      }, 350);
    } else {
      window.print();
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Top Banner & Header */}
      <div className="bg-white rounded-3xl p-5 md:p-6 border border-theme-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 no-print">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <CalendarClock className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                Rekap Produk Expired Dekat
              </h1>
              <p className="text-xs md:text-sm text-neutral-500 mt-0.5">
                Pencatatan batch, tanggal kedaluwarsa, dan perkiraan supplier perolehan produk
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyTxt}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-neutral-100 hover:bg-neutral-200 text-neutral-800 transition-colors shadow-xs active:scale-95"
            title="Salin ringkasan teks untuk WhatsApp"
          >
            <Copy className="w-4 h-4 text-neutral-600" />
            <span>Salin TXT</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-xs active:scale-95"
            title="Export Excel (.xlsx)"
          >
            <Download className="w-4 h-4" />
            <span>Export Excel</span>
          </button>

          <button
            type="button"
            onClick={handleOpenPrintModal}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition-colors shadow-xs active:scale-95"
            title="Buka Pratinjau & Cetak Laporan Produk Expired Dekat"
          >
            <Printer className="w-4 h-4 text-white" />
            <span>Cetak Data</span>
          </button>
        </div>
      </div>

      {/* Copy Toast Alert */}
      {copyToast && (
        <div className="fixed top-6 right-6 z-50 bg-neutral-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-3 text-sm animate-in fade-in slide-in-from-top-4">
          <div className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
            <Check className="w-4 h-4" />
          </div>
          <span>Format teks rekap expired dekat berhasil disalin ke clipboard!</span>
        </div>
      )}

      {/* Interactive Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 no-print">
        <button
          type="button"
          onClick={() => setFilterUrgency('all')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterUrgency === 'all'
              ? 'bg-neutral-900 text-white border-neutral-900 shadow-sm'
              : 'bg-white hover:bg-neutral-50 text-neutral-800 border-neutral-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium uppercase opacity-75 tracking-wider">Total Terdata</span>
            <Package className="w-4 h-4 opacity-60" />
          </div>
          <div className="text-2xl font-bold mt-2">{stats.total}</div>
          <div className="text-[11px] opacity-75 mt-0.5">Semua item expired</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterUrgency(filterUrgency === 'expired' ? 'all' : 'expired')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterUrgency === 'expired'
              ? 'bg-red-600 text-white border-red-600 shadow-sm ring-2 ring-red-400'
              : 'bg-red-50/70 hover:bg-red-100/70 text-red-900 border-red-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-red-700">Sudah Expired</span>
            <div className="w-2.5 h-2.5 rounded-full bg-red-600 animate-ping" />
          </div>
          <div className="text-2xl font-bold mt-2 text-red-950">{stats.expired}</div>
          <div className="text-[11px] text-red-700 mt-0.5">Kedaluwarsa / hari ini</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterUrgency(filterUrgency === 'critical' ? 'all' : 'critical')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterUrgency === 'critical'
              ? 'bg-rose-600 text-white border-rose-600 shadow-sm ring-2 ring-rose-400'
              : 'bg-rose-50/70 hover:bg-rose-100/70 text-rose-900 border-rose-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">Kritis (&lt; 30 Hari)</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold mt-2 text-rose-950">{stats.critical}</div>
          <div className="text-[11px] text-rose-700 mt-0.5">Perlu retur / diskon segera</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterUrgency(filterUrgency === 'warning' ? 'all' : 'warning')}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterUrgency === 'warning'
              ? 'bg-amber-600 text-white border-amber-600 shadow-sm ring-2 ring-amber-400'
              : 'bg-amber-50/70 hover:bg-amber-100/70 text-amber-900 border-amber-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">Waspada (1-3 Bln)</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold mt-2 text-amber-950">{stats.warning}</div>
          <div className="text-[11px] text-amber-700 mt-0.5">Prioritaskan penjualan</div>
        </button>

        <button
          type="button"
          onClick={() => setFilterUrgency(filterUrgency === 'safe' ? 'all' : 'safe')}
          className={`p-4 rounded-2xl border text-left transition-all col-span-2 sm:col-span-1 ${
            filterUrgency === 'safe'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-400'
              : 'bg-emerald-50/70 hover:bg-emerald-100/70 text-emerald-900 border-emerald-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Aman (&gt; 3 Bln)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold mt-2 text-emerald-950">{stats.safe}</div>
          <div className="text-[11px] text-emerald-700 mt-0.5">Pemantauan berkala</div>
        </button>
      </div>

      {/* FORM INPUT & DAFTAR ANTREAN (PENDING LIST) */}
      <div className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden no-print">
        <div 
          onClick={() => setIsFormExpanded(!isFormExpanded)}
          className="p-4 md:p-5 bg-gradient-to-r from-theme-50/80 to-white flex items-center justify-between cursor-pointer select-none border-b border-theme-200"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-theme-500 text-white flex items-center justify-center font-bold text-sm">
              <Plus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-bold text-neutral-900 text-sm md:text-base">
                Form Input Produk Expired Dekat
              </h2>
              <p className="text-xs text-neutral-500">
                Gunakan panah keyboard (↑ / ↓) pada pencarian dan tekan <kbd className="px-1.5 py-0.5 bg-neutral-200 text-neutral-800 rounded text-[10px] font-mono font-bold">Ctrl + S</kbd> untuk menyimpan daftar list
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pendingItems.length > 0 && (
              <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500 text-white shadow-xs">
                {pendingItems.length} di Antrean
              </span>
            )}
            <ChevronDown className={`w-5 h-5 text-neutral-400 transition-transform ${isFormExpanded ? 'rotate-180' : ''}`} />
          </div>
        </div>

        {isFormExpanded && (
          <div className="p-4 md:p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4">
              
              {/* Field 1: Nama Produk (Searchable + Arrow navigation) */}
              <div className="lg:col-span-4 relative" ref={dropdownRef}>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Nama Produk <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    ref={productInputRef}
                    type="text"
                    value={productSearchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setProductSearchQuery(val);
                      setProductNameInput(val);
                      setIsTypingNew(true);
                      setIsDropdownOpen(true);
                      setHighlightedIndex(0);

                      // Automatically link master data product and supplier if exact match
                      const exact = products.find(p => p.name.trim().toLowerCase() === val.trim().toLowerCase());
                      if (exact) {
                        setSelectedProduct(exact);
                        if (exact.unit) setUnitInput(exact.unit);
                        const primarySup = suppliers.find(s => s.id === exact.supplierId);
                        if (primarySup) {
                          setSupplierNameInput(primarySup.name);
                          setSelectedSupplierId(primarySup.id);
                        }
                      } else if (selectedProduct && !selectedProduct.name.toLowerCase().includes(val.trim().toLowerCase())) {
                        setSelectedProduct(null);
                      }
                    }}
                    onBlur={() => {
                      // On blur, auto-link if exact product match in master data
                      if (!selectedProduct && productSearchQuery.trim()) {
                        const exact = products.find(p => p.name.trim().toLowerCase() === productSearchQuery.trim().toLowerCase());
                        if (exact) {
                          handleProductSelect(exact);
                        }
                      }
                    }}
                    onFocus={() => {
                      setIsDropdownOpen(true);
                    }}
                    onKeyDown={handleProductSearchKeyDown}
                    placeholder="Ketik / cari nama produk..."
                    className="w-full pl-9 pr-8 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                  />
                  <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                  {productSearchQuery && (
                    <button
                      type="button"
                      onClick={() => {
                        setProductSearchQuery('');
                        setProductNameInput('');
                        setSelectedProduct(null);
                        setSupplierNameInput('');
                        setSelectedSupplierId(undefined);
                      }}
                      className="absolute right-2.5 top-2.5 p-1 text-neutral-400 hover:text-neutral-600 rounded-lg"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Dropdown with arrow scroll */}
                {isDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto p-1.5">
                    {/* Previous Search Section if available */}
                    {(!isTypingNew || !productSearchQuery.trim()) && !!lastSearchQuery && previousProducts.length > 0 && (
                      <div className="mb-2 pb-2 border-b border-neutral-100">
                        <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                          Pencarian Terakhir: &quot;{lastSearchQuery}&quot;
                        </div>
                      </div>
                    )}

                    {filteredProducts.length === 0 ? (
                      <div className="p-3 text-center text-xs text-neutral-500">
                        Produk tidak ditemukan di master data.
                        <div className="mt-1 font-semibold text-neutral-700">
                          Tekan Enter untuk menggunakan nama ini sebagai produk kustom.
                        </div>
                      </div>
                    ) : (
                      filteredProducts.map((p, idx) => {
                        const sup = suppliers.find(s => s.id === p.supplierId);
                        const isHighlighted = idx === highlightedIndex;
                        return (
                          <div
                            key={p.id}
                            data-highlighted={isHighlighted ? "true" : undefined}
                            onClick={() => handleProductSelect(p)}
                            onMouseEnter={() => setHighlightedIndex(idx)}
                            className={`p-2.5 rounded-xl cursor-pointer text-xs transition-colors flex items-center justify-between ${
                              isHighlighted ? 'bg-theme-100 text-theme-900 font-semibold' : 'hover:bg-neutral-50 text-neutral-700'
                            }`}
                          >
                            <div>
                              <div className="font-semibold text-neutral-900">{p.name}</div>
                              <div className="text-[11px] text-neutral-500 flex items-center gap-2 mt-0.5">
                                {sup && <span>Vendor: {sup.name}</span>}
                                {p.category && <span>• {p.category}</span>}
                              </div>
                            </div>
                            <div className="text-right shrink-0">
                              <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-600 font-mono text-[10px]">
                                {p.unit || 'Pcs'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Field 2: No Batch */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  No. Batch <span className="text-red-500">*</span>
                </label>
                <input
                  ref={batchInputRef}
                  type="text"
                  value={batchInput}
                  onChange={(e) => setBatchInput(e.target.value.toUpperCase())}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      expiredDateInputRef.current?.focus();
                    }
                  }}
                  placeholder="Contoh: B89012"
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold tracking-wide uppercase text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                />
              </div>

              {/* Field 3: Tanggal Expired */}
              <div className="lg:col-span-3">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Tanggal Expired <span className="text-red-500">*</span>
                  </label>
                  {expiredDateInput && (
                    <span className="text-[10px] font-semibold text-neutral-500">
                      {getUrgencyInfo(expiredDateInput).label}
                    </span>
                  )}
                </div>
                <input
                  ref={expiredDateInputRef}
                  type="date"
                  value={expiredDateInput}
                  onChange={(e) => setExpiredDateInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      supplierInputRef.current?.focus();
                    }
                  }}
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                />
              </div>

              {/* Field 4: Perkiraan Supplier Produk Didapat */}
              <div className="lg:col-span-3 relative" ref={supplierDropdownRef}>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Perkiraan Supplier <span className="text-red-500">*</span>
                  </label>
                  {selectedProduct && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Otomatis Master Data
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    ref={supplierInputRef}
                    type="text"
                    value={supplierNameInput}
                    onChange={(e) => {
                      setSupplierNameInput(e.target.value);
                      setIsSupplierDropdownOpen(true);
                    }}
                    onFocus={() => setIsSupplierDropdownOpen(true)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        qtyInputRef.current?.focus();
                        setIsSupplierDropdownOpen(false);
                      }
                    }}
                    placeholder="Pemasok / Sumber..."
                    className="w-full pl-9 pr-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                  />
                  <Building2 className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                </div>

                {/* Categorized Supplier dropdown */}
                {isSupplierDropdownOpen && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-neutral-200 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 divide-y divide-neutral-100">
                    {/* Master data related suppliers */}
                    {(categorizedSuppliers.matchedPrimary || categorizedSuppliers.matchedAlts.length > 0) && (
                      <div className="pb-1.5">
                        <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-theme-600" />
                          <span>Supplier Master Produk</span>
                        </div>
                        {categorizedSuppliers.matchedPrimary && (
                          <div
                            onClick={() => {
                              setSupplierNameInput(categorizedSuppliers.matchedPrimary!.name);
                              setSelectedSupplierId(categorizedSuppliers.matchedPrimary!.id);
                              setIsSupplierDropdownOpen(false);
                              qtyInputRef.current?.focus();
                            }}
                            className="px-2.5 py-2 rounded-xl text-xs hover:bg-theme-50 cursor-pointer flex items-center justify-between font-semibold text-theme-900 transition-colors"
                          >
                            <span className="flex items-center gap-1.5">
                              <Building2 className="w-3.5 h-3.5 text-theme-600" />
                              {categorizedSuppliers.matchedPrimary.name}
                            </span>
                            <span className="text-[10px] font-bold text-theme-700 bg-theme-100 px-2 py-0.5 rounded-md">
                              Utama
                            </span>
                          </div>
                        )}
                        {categorizedSuppliers.matchedAlts.map((alt) => (
                          <div
                            key={alt.id}
                            onClick={() => {
                              setSupplierNameInput(alt.name);
                              setSelectedSupplierId(alt.id);
                              setIsSupplierDropdownOpen(false);
                              qtyInputRef.current?.focus();
                            }}
                            className="px-2.5 py-2 rounded-xl text-xs hover:bg-amber-50 cursor-pointer flex items-center justify-between text-neutral-800 transition-colors"
                          >
                            <span className="flex items-center gap-1.5 font-medium">
                              <Layers className="w-3.5 h-3.5 text-amber-600" />
                              {alt.name}
                            </span>
                            <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-md">
                              Alternatif
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Other suppliers */}
                    <div className="pt-1.5">
                      {categorizedSuppliers.otherSuppliers.length > 0 ? (
                        <>
                          <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-neutral-400">
                            Semua Supplier ({categorizedSuppliers.otherSuppliers.length})
                          </div>
                          {categorizedSuppliers.otherSuppliers.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSupplierNameInput(s.name);
                                setSelectedSupplierId(s.id);
                                setIsSupplierDropdownOpen(false);
                                qtyInputRef.current?.focus();
                              }}
                              className="px-2.5 py-2 rounded-xl text-xs hover:bg-neutral-100 cursor-pointer flex items-center justify-between text-neutral-700 transition-colors"
                            >
                              <span>{s.name}</span>
                            </div>
                          ))}
                        </>
                      ) : (
                        !categorizedSuppliers.matchedPrimary && categorizedSuppliers.matchedAlts.length === 0 && (
                          <div className="p-3 text-center text-xs text-neutral-400">
                            Tidak ditemukan supplier yang cocok
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

                {/* Master Data Supplier & Alternatif Interactive Chips */}
                {selectedProduct && (
                  <div className="mt-2 p-2 bg-neutral-50/90 rounded-xl border border-neutral-200 text-xs space-y-1.5">
                    {/* Supplier Utama */}
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-theme-600" />
                        Utama:
                      </span>
                      {activeProductSuppliers.primary ? (
                        <button
                          type="button"
                          onClick={() => {
                            setSupplierNameInput(activeProductSuppliers.primary!.name);
                            setSelectedSupplierId(activeProductSuppliers.primary!.id);
                          }}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-semibold transition-all ${
                            supplierNameInput.trim().toLowerCase() === activeProductSuppliers.primary.name.trim().toLowerCase()
                              ? 'bg-theme-600 text-white shadow-2xs'
                              : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-theme-50 hover:border-theme-300'
                          }`}
                          title="Gunakan Supplier Utama dari Master Data"
                        >
                          {supplierNameInput.trim().toLowerCase() === activeProductSuppliers.primary.name.trim().toLowerCase() && (
                            <Check className="w-3 h-3 text-white" />
                          )}
                          <span className="truncate max-w-[140px]">{activeProductSuppliers.primary.name}</span>
                        </button>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">Belum diset di master</span>
                      )}
                    </div>

                    {/* Supplier Alternatif */}
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-neutral-200/60">
                      <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider flex items-center gap-1">
                        <Layers className="w-3 h-3 text-amber-600" />
                        Alternatif:
                      </span>
                      {activeProductSuppliers.alternatives.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {activeProductSuppliers.alternatives.map((altSup) => {
                            const isSelected = supplierNameInput.trim().toLowerCase() === altSup.name.trim().toLowerCase();
                            return (
                              <button
                                key={altSup.id}
                                type="button"
                                onClick={() => {
                                  setSupplierNameInput(altSup.name);
                                  setSelectedSupplierId(altSup.id);
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs transition-all ${
                                  isSelected
                                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                                    : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-50 hover:border-amber-300 font-medium'
                                }`}
                                title="Klik untuk memilih alternatif supplier ini"
                              >
                                {isSelected && <Check className="w-3 h-3 text-white" />}
                                <span className="truncate max-w-[120px]">{altSup.name}</span>
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <span className="text-[10px] text-neutral-400 italic">
                          Tidak ada alternatif di master data
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Field 5: Qty & Satuan */}
              <div className="lg:col-span-3">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Jumlah (Qty) &amp; Satuan
                </label>
                <div className="flex gap-2">
                  <input
                    ref={qtyInputRef}
                    type="number"
                    min="0"
                    step="1"
                    value={quantityInput}
                    onChange={(e) => setQuantityInput(e.target.value === '' ? '' : Number(e.target.value))}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddPending();
                      }
                    }}
                    placeholder="Qty..."
                    className="w-1/2 px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                  />
                  <input
                    type="text"
                    value={unitInput}
                    onChange={(e) => setUnitInput(e.target.value)}
                    placeholder="Satuan"
                    className="w-1/2 px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Field 6: Catatan / Rencana Aksi */}
              <div className="lg:col-span-5">
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Catatan / Rencana Penanganan
                </label>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddPending();
                    }
                  }}
                  placeholder="Misal: Retur ke PBF, Tukar Guling, Promo Diskon..."
                  className="w-full px-3 py-2.5 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
                />
              </div>

              {/* Buttons Action */}
              <div className="lg:col-span-4 flex items-end gap-2">
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleAddPending}
                  className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95"
                  title="Tambah ke antrean list (kumpulkan beberapa item lalu simpan sekali klik)"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah ke List</span>
                </button>

                <button
                  type="button"
                  disabled={isSaving}
                  onClick={handleDirectSave}
                  className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-white border border-theme-300 hover:bg-theme-50 disabled:opacity-50 text-theme-800 shadow-xs transition-all active:scale-95"
                  title="Simpan langsung ke database tanpa tertimpa (Ctrl + S)"
                >
                  {isSaving ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-theme-600" />
                  ) : (
                    <Save className="w-4 h-4 text-theme-600" />
                  )}
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
                </button>
              </div>
            </div>

            {/* PENDING ITEMS LIST (Daftar Antrean Input) */}
            {pendingItems.length > 0 && (
              <div className="pt-4 border-t border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
                    <h3 className="font-bold text-neutral-900 text-sm">
                      Daftar Antrean Tersedia ({pendingItems.length} Item Siap Disimpan)
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={() => setPendingItems([])}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 transition-colors"
                    >
                      Kosongkan Antrean
                    </button>

                    <button
                      type="button"
                      disabled={isSaving}
                      onClick={handleSaveAllPending}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95"
                      title="Simpan seluruh antrean ke database"
                    >
                      {isSaving ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isSaving ? 'Menyimpan...' : 'Simpan Semua (Ctrl + S)'}</span>
                    </button>
                  </div>
                </div>

                <div className="bg-neutral-50 rounded-2xl border border-neutral-200 overflow-hidden divide-y divide-neutral-200 max-h-60 overflow-y-auto">
                  {pendingItems.map((item, index) => {
                    const urgency = getUrgencyInfo(item.expiredDate);
                    return (
                      <div key={item.id} className="p-3 flex items-center justify-between gap-3 hover:bg-white transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-700 flex items-center justify-center font-bold text-xs">
                            {index + 1}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-neutral-900">{item.productName}</div>
                            <div className="text-xs text-neutral-500 flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                              <span>Batch: <strong className="text-neutral-800">{item.batch}</strong></span>
                              <span>Expired: <strong className="text-neutral-800">{item.expiredDate}</strong> ({urgency.label})</span>
                              <span>Supplier: <strong className="text-neutral-800">{item.supplierName}</strong></span>
                              {(() => {
                                const prod = item.productId
                                  ? products.find(p => p.id === item.productId)
                                  : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
                                const alts = (prod?.alternativeSupplierIds || [])
                                  .map(id => suppliers.find(s => s.id === id)?.name)
                                  .filter(Boolean);
                                if (alts.length === 0) return null;
                                return (
                                  <span className="text-[11px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                    Alt: {alts.join(', ')}
                                  </span>
                                );
                              })()}
                              {item.quantity !== undefined && <span>Qty: <strong>{item.quantity} {item.unit}</strong></span>}
                              {item.notes && <span className="italic">Catatan: {item.notes}</span>}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemovePendingItem(item.id)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded-lg transition-colors"
                          title="Hapus dari antrean"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* TABLE & FILTER REKAP DATA */}
      <div className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden space-y-4 p-4 md:p-6 no-print">
        {/* Table Toolbar: Search, Filters, Sort */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              value={tableSearch}
              onChange={(e) => setTableSearch(e.target.value)}
              placeholder="Cari produk, batch, supplier..."
              className="w-full pl-9 pr-8 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs md:text-sm font-medium text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-theme-500 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
            {tableSearch && (
              <button
                type="button"
                onClick={() => setTableSearch('')}
                className="absolute right-2.5 top-2 p-1 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter options */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Supplier */}
            {existingSupplierNames.length > 0 && (
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
              >
                <option value="all">Semua Supplier</option>
                {existingSupplierNames.map(sup => (
                  <option key={sup} value={sup}>{sup}</option>
                ))}
              </select>
            )}

            {/* Filter Status Penanganan */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
            >
              <option value="all">Semua Status</option>
              <option value="pending">Menunggu (Pending)</option>
              <option value="resolved">Selesai / Retur</option>
            </select>

            {/* Sort Dropdown */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-700 focus:outline-none focus:ring-2 focus:ring-theme-500"
            >
              <option value="expired_asc">Expired Terdekat (Asc)</option>
              <option value="expired_desc">Expired Terjauh (Desc)</option>
              <option value="name_asc">Nama Produk (A-Z)</option>
              <option value="created_desc">Tanggal Input Terbaru</option>
            </select>

            {/* View Mode Switcher */}
            <div className="flex items-center gap-1 p-0.5 bg-neutral-100 rounded-xl border border-neutral-200">
              <button
                type="button"
                onClick={() => setViewMode(viewMode === 'cards' ? 'table' : 'cards')}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'cards' || viewMode === 'auto'
                    ? 'bg-white text-theme-900 shadow-2xs font-bold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
                title="Ganti Mode Tampilan"
              >
                {viewMode === 'table' ? (
                  <>
                    <TableIcon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mode Tabel</span>
                  </>
                ) : (
                  <>
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Mode Kartu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Selected Items Batch Action Bar */}
        {selectedIds.size > 0 && (
          <div className="bg-neutral-900 text-white px-4 py-2.5 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs animate-in fade-in">
            <div className="font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-theme-400" />
              <span>{selectedIds.size} item terpilih</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleBatchMarkStatus('returned')}
                className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 transition-colors"
              >
                Tandai Retur
              </button>
              <button
                type="button"
                onClick={() => handleBatchMarkStatus('resolved')}
                className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white transition-colors"
              >
                Tandai Selesai
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white transition-colors flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Terpilih</span>
              </button>
            </div>
          </div>
        )}

        {/* Responsive Mobile Card View */}
        <div className={viewMode === 'table' ? 'hidden' : viewMode === 'cards' ? 'block space-y-3' : 'md:hidden space-y-3'}>
          {filteredRecords.length === 0 ? (
            <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200 text-neutral-500">
              <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-40 text-neutral-400" />
              <p className="font-semibold text-neutral-700">Belum ada data produk expired dekat</p>
              <p className="text-xs text-neutral-400 mt-1">Tambahkan produk melalui form di atas atau sesuaikan filter</p>
            </div>
          ) : (
            filteredRecords.map((item) => {
              const urgency = getUrgencyInfo(item.expiredDate);
              const isSelected = selectedIds.has(item.id);
              const isResolved = item.status === 'resolved' || item.status === 'returned';

              return (
                <div
                  key={`card-${item.id}`}
                  className={`p-3.5 bg-white rounded-2xl border transition-all relative overflow-hidden ${
                    isSelected ? 'border-theme-500 ring-2 ring-theme-200 bg-theme-50/20' : 'border-neutral-200 hover:border-neutral-300'
                  } ${isResolved ? 'opacity-75 bg-neutral-50/60' : ''}`}
                >
                  {/* Urgency Color Accent Bar on Left */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${urgency.dotColor}`} />

                  {/* Card Top: Checkbox, Name, and Status Badge */}
                  <div className="flex items-start justify-between gap-2 pl-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded text-theme-600 focus:ring-theme-500 cursor-pointer mt-0.5 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className={`font-bold text-sm text-neutral-900 leading-snug ${isResolved ? 'line-through text-neutral-500' : ''}`}>
                          {item.productName}
                        </h4>
                        {item.createdAt && (
                          <span className="text-[10px] text-neutral-400">
                            Dicatat: {format(new Date(item.createdAt), 'dd MMM yyyy')}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${urgency.badgeClass}`}>
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${urgency.dotColor}`} />
                      {urgency.label}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div className="mt-3 pl-2 grid grid-cols-2 gap-2 text-xs bg-neutral-50 p-2.5 rounded-xl border border-neutral-200/70">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">No. Batch</span>
                      <span className="font-mono font-bold text-neutral-900">{item.batch}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Tgl Expired</span>
                      <span className="font-semibold text-neutral-900">{item.expiredDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Perkiraan Supplier</span>
                      <div className="flex items-center gap-1 font-medium text-neutral-800 truncate">
                        <Building2 className="w-3 h-3 text-neutral-400 shrink-0" />
                        <span className="truncate">{item.supplierName}</span>
                      </div>
                      {(() => {
                        const prod = item.productId
                          ? products.find(p => p.id === item.productId)
                          : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
                        const alts = (prod?.alternativeSupplierIds || [])
                          .map(id => suppliers.find(s => s.id === id)?.name)
                          .filter(Boolean);
                        if (alts.length === 0) return null;
                        return (
                          <div className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 mt-1 truncate" title={`Alternatif: ${alts.join(', ')}`}>
                            <span className="font-bold">Alt:</span> {alts.join(', ')}
                          </div>
                        );
                      })()}
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-neutral-400 block">Jumlah (Qty)</span>
                      <span className="font-bold text-neutral-900">
                        {item.quantity !== undefined ? `${item.quantity} ${item.unit || 'Pcs'}` : '-'}
                      </span>
                    </div>
                  </div>

                  {/* Notes if any */}
                  {item.notes && (
                    <div className="mt-2 pl-2 text-xs text-neutral-600 italic bg-amber-50/60 p-2 rounded-lg border border-amber-100">
                      Catatan: {item.notes}
                    </div>
                  )}

                  {/* Card Footer: Status & Quick Action Buttons */}
                  <div className="mt-3 pl-2 pt-2 border-t border-neutral-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      {item.status && item.status !== 'pending' ? (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-800">
                          {item.status === 'returned' ? 'Retur Vendor' : item.status === 'resolved' ? 'Selesai' : item.status}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => updateNearExpired(item.id, { status: item.status === 'returned' ? 'pending' : 'returned' })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                          item.status === 'returned' ? 'bg-neutral-200 text-neutral-800' : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                        }`}
                        title="Tandai Retur"
                      >
                        {item.status === 'returned' ? 'Batal Retur' : 'Retur'}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateNearExpired(item.id, { status: item.status === 'resolved' ? 'pending' : 'resolved' })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors shadow-2xs ${
                          item.status === 'resolved' ? 'bg-emerald-200 text-emerald-900' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}
                        title="Tandai Selesai"
                      >
                        {item.status === 'resolved' ? 'Batal Selesai' : 'Selesai'}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="p-1.5 text-neutral-600 hover:text-neutral-900 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
                        title="Edit Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (confirm(`Hapus data expired ${item.productName} (Batch: ${item.batch})?`)) {
                            deleteNearExpired(item.id);
                          }
                        }}
                        className="p-1.5 text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                        title="Hapus Data"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Desktop / Full Table Content */}
        <div className={viewMode === 'cards' ? 'hidden' : viewMode === 'table' ? 'block' : 'hidden md:block'}>
          <div className="overflow-x-auto rounded-2xl border border-neutral-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-neutral-50/80 text-neutral-600 border-b border-neutral-200 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={filteredRecords.length > 0 && selectedIds.size === filteredRecords.length}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded text-theme-600 focus:ring-theme-500 cursor-pointer"
                    />
                  </th>
                  <th className="p-3">Nama Produk</th>
                  <th className="p-3">No. Batch</th>
                  <th className="p-3">Tanggal Expired</th>
                  <th className="p-3">Sisa Waktu</th>
                  <th className="p-3">Perkiraan Supplier</th>
                  <th className="p-3 text-right">Qty</th>
                  <th className="p-3">Status / Catatan</th>
                  <th className="p-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {filteredRecords.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-10 text-center text-neutral-400">
                      <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-40 text-neutral-400" />
                      <p className="font-semibold text-neutral-600">Belum ada data produk expired dekat yang sesuai.</p>
                      <p className="text-xs text-neutral-400 mt-1">
                        Tambahkan produk melalui form input di atas atau sesuaikan kata kunci pencarian.
                      </p>
                    </td>
                  </tr>
                ) : (
                  filteredRecords.map((item) => {
                    const urgency = getUrgencyInfo(item.expiredDate);
                    const isSelected = selectedIds.has(item.id);
                    const isResolved = item.status === 'resolved' || item.status === 'returned';

                    return (
                      <tr 
                        key={item.id} 
                        className={`hover:bg-neutral-50/80 transition-colors ${
                          isSelected ? 'bg-theme-50/60' : ''
                        } ${isResolved ? 'opacity-65 bg-neutral-50/40' : ''}`}
                      >
                        <td className="p-3 text-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleSelect(item.id)}
                            className="rounded text-theme-600 focus:ring-theme-500 cursor-pointer"
                          />
                        </td>

                        <td className="p-3">
                          <div className={`font-bold text-neutral-900 ${isResolved ? 'line-through text-neutral-500' : ''}`}>
                            {item.productName}
                          </div>
                          {item.createdAt && (
                            <div className="text-[10px] text-neutral-400 mt-0.5">
                              Dicatat: {format(new Date(item.createdAt), 'dd MMM yyyy')}
                            </div>
                          )}
                        </td>

                        <td className="p-3 font-mono font-bold text-neutral-800">
                          <span className="px-2 py-0.5 rounded-lg bg-neutral-100 text-neutral-800 border border-neutral-200">
                            {item.batch}
                          </span>
                        </td>

                        <td className="p-3 font-semibold text-neutral-900 whitespace-nowrap">
                          {item.expiredDate}
                        </td>

                        <td className="p-3 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${urgency.badgeClass}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${urgency.dotColor}`} />
                            {urgency.label}
                          </span>
                        </td>

                        <td className="p-3">
                          <div className="flex items-center gap-1.5 font-medium text-neutral-800">
                            <Building2 className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                            <span className="line-clamp-1">{item.supplierName}</span>
                          </div>
                          {(() => {
                            const prod = item.productId
                              ? products.find(p => p.id === item.productId)
                              : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
                            const alts = (prod?.alternativeSupplierIds || [])
                              .map(id => suppliers.find(s => s.id === id)?.name)
                              .filter(Boolean);
                            if (alts.length === 0) return null;
                            return (
                              <div className="text-[10px] text-amber-700 flex items-center gap-1 mt-0.5" title={`Alternatif Supplier: ${alts.join(', ')}`}>
                                <Layers className="w-3 h-3 text-amber-500 shrink-0" />
                                <span className="truncate max-w-[170px]">Alt: {alts.join(', ')}</span>
                              </div>
                            );
                          })()}
                        </td>

                        <td className="p-3 text-right font-semibold text-neutral-900 whitespace-nowrap">
                          {item.quantity !== undefined ? (
                            <span>{item.quantity} <span className="text-[10px] text-neutral-500 font-normal">{item.unit || 'Pcs'}</span></span>
                          ) : (
                            <span className="text-neutral-400">-</span>
                          )}
                        </td>

                        <td className="p-3">
                          <div className="space-y-1">
                            {item.status && item.status !== 'pending' && (
                              <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-neutral-200 text-neutral-800">
                                {item.status === 'returned' ? 'Retur Vendor' : item.status === 'resolved' ? 'Selesai' : item.status}
                              </span>
                            )}
                            {item.notes && (
                              <div className="text-neutral-600 text-[11px] line-clamp-1 italic">
                                {item.notes}
                              </div>
                            )}
                          </div>
                        </td>

                        <td className="p-3 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              type="button"
                              onClick={() => openEditModal(item)}
                              className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-neutral-100 rounded-lg transition-colors"
                              title="Edit Data"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Hapus data expired ${item.productName} (Batch: ${item.batch})?`)) {
                                  deleteNearExpired(item.id);
                                }
                              }}
                              className="p-1.5 text-neutral-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Data"
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
        </div>

        {/* Table Footer Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-neutral-500 pt-2">
          <div>
            Menampilkan <strong className="text-neutral-800">{filteredRecords.length}</strong> dari total <strong className="text-neutral-800">{nearExpiredList.length}</strong> produk expired terdata
          </div>
          <div className="text-[11px] text-neutral-400 mt-1 sm:mt-0">
            Pembaruan otomatis real-time &amp; tersimpan aman
          </div>
        </div>
      </div>

      {/* EDIT MODAL */}
      {editingEntry && (
        <div className="fixed inset-0 z-50 bg-neutral-900/50 backdrop-blur-xs flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-neutral-200 animate-in fade-in zoom-in-95 space-y-5">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div>
                <h3 className="font-bold text-neutral-900 text-base">Edit Data Produk Expired</h3>
                <p className="text-xs text-neutral-500">{editingEntry.productName}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="p-1.5 text-neutral-400 hover:text-neutral-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-neutral-700 mb-1">No. Batch</label>
                <input
                  type="text"
                  value={editBatch}
                  onChange={(e) => setEditBatch(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-semibold uppercase text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                />
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Tanggal Expired</label>
                <input
                  type="date"
                  value={editExpiredDate}
                  onChange={(e) => setEditExpiredDate(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-bold text-neutral-700">Perkiraan Supplier</label>
                  {editEntryProduct && (
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Tersambung Master Data
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={editSupplierName}
                  onChange={(e) => setEditSupplierName(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                />
                {(editEntrySuppliers.primary || editEntrySuppliers.alternatives.length > 0) && (
                  <div className="mt-2 p-2 bg-neutral-50 rounded-xl border border-neutral-200 text-xs space-y-1.5">
                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider block">
                      Pilihan dari Master Data:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {editEntrySuppliers.primary && (
                        <button
                          type="button"
                          onClick={() => setEditSupplierName(editEntrySuppliers.primary!.name)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            editSupplierName.trim().toLowerCase() === editEntrySuppliers.primary.name.trim().toLowerCase()
                              ? 'bg-theme-600 text-white shadow-2xs'
                              : 'bg-white border border-neutral-300 text-neutral-800 hover:bg-theme-50'
                          }`}
                        >
                          <Building2 className="w-3 h-3" />
                          <span>Utama: {editEntrySuppliers.primary.name}</span>
                        </button>
                      )}
                      {editEntrySuppliers.alternatives.map(alt => (
                        <button
                          key={alt.id}
                          type="button"
                          onClick={() => setEditSupplierName(alt.name)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                            editSupplierName.trim().toLowerCase() === alt.name.trim().toLowerCase()
                              ? 'bg-amber-600 text-white font-semibold shadow-2xs'
                              : 'bg-white border border-amber-200 text-amber-900 hover:bg-amber-50'
                          }`}
                        >
                          <Layers className="w-3 h-3 text-amber-500" />
                          <span>Alt: {alt.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Jumlah (Qty)</label>
                  <input
                    type="number"
                    value={editQuantity}
                    onChange={(e) => setEditQuantity(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-neutral-700 mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editUnit}
                    onChange={(e) => setEditUnit(e.target.value)}
                    className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-sm font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Status Penanganan</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-theme-500"
                >
                  <option value="pending">Menunggu Tindakan (Pending)</option>
                  <option value="returned">Sudah Diretur ke Supplier</option>
                  <option value="resolved">Selesai Ditangani</option>
                  <option value="disposed">Pemusnahan Barang</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-neutral-700 mb-1">Catatan</label>
                <textarea
                  rows={2}
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-xl text-xs font-medium text-neutral-900 focus:outline-none focus:ring-2 focus:ring-theme-500"
                  placeholder="Keterangan tambahan..."
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => setEditingEntry(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-theme-600 hover:bg-theme-700 text-white transition-colors shadow-xs"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PRINT PREVIEW & SETTINGS MODAL */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 z-50 bg-neutral-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto no-print">
          <div className="bg-white rounded-3xl max-w-4xl w-full shadow-2xl border border-neutral-200 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border-b border-amber-200 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base sm:text-lg">
                    Pratinjau &amp; Cetak Laporan Expired Dekat
                  </h3>
                  <p className="text-xs text-neutral-600">
                    Pastikan data produk expired dekat yang dicetak sudah sesuai kebutuhan
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPrintModalOpen(false)}
                className="p-2 text-neutral-500 hover:text-neutral-800 hover:bg-white/80 rounded-xl transition-colors"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scope & Print Settings Bar */}
            <div className="p-4 bg-neutral-50 border-b border-neutral-200 space-y-3 shrink-0">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                  Cakupan Data Yang Dicetak:
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPrintDataScope('filtered')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      printDataScope === 'filtered'
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Sesuai Filter ({filteredRecords.length} Item)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDataScope('critical')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      printDataScope === 'critical'
                        ? 'bg-red-600 text-white shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Kritis &amp; Lewat ED ({nearExpiredList.filter(i => { const u = getUrgencyInfo(i.expiredDate); return u.status === 'expired' || u.status === 'critical'; }).length} Item)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDataScope('pending')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      printDataScope === 'pending'
                        ? 'bg-neutral-900 text-white shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Belum Ditangani ({nearExpiredList.filter(i => !i.status || i.status === 'pending').length} Item)
                  </button>

                  <button
                    type="button"
                    onClick={() => setPrintDataScope('all')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      printDataScope === 'all'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    Semua Data ({nearExpiredList.length} Item)
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Catatan Dokumen / Tujuan Laporan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={printNotes}
                    onChange={(e) => setPrintNotes(e.target.value)}
                    placeholder="Contoh: Monitoring rutin / Penarikan retur ke PBF..."
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-neutral-600 mb-1">
                    Nama Petugas Pemeriksa / Penanggung Jawab (Opsional)
                  </label>
                  <input
                    type="text"
                    value={printOfficer}
                    onChange={(e) => setPrintOfficer(e.target.value)}
                    placeholder="Contoh: Apt. Rina / Petugas Gudang..."
                    className="w-full px-3 py-1.5 bg-white border border-neutral-300 rounded-xl text-xs text-neutral-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Document Paper Preview (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-neutral-200/60">
              <div className="bg-white rounded-xl shadow-md border border-neutral-300 p-5 sm:p-8 max-w-3xl mx-auto text-neutral-900 font-sans text-xs">
                {/* Paper Header */}
                <div className="border-b-2 border-neutral-900 pb-3 mb-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-[10px] uppercase font-bold tracking-widest text-neutral-500">
                        DailyReportPro Farmasi &amp; Apotek
                      </div>
                      <h1 className="text-base sm:text-lg font-black uppercase text-neutral-950 tracking-tight mt-0.5">
                        Laporan Rekap Produk Expired Dekat
                      </h1>
                      <p className="text-[11px] text-neutral-600">
                        Sistem Pengawasan Tanggal Kedaluwarsa &amp; Perkiraan Supplier Produk
                      </p>
                    </div>
                    <div className="text-right text-[10px] text-neutral-500 shrink-0">
                      <div>Dicetak: <strong>{format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeId })} WIB</strong></div>
                      <div>Total Data: <strong>{printRecords.length} Produk</strong></div>
                    </div>
                  </div>

                  {printNotes && (
                    <div className="mt-2 text-[11px] text-neutral-700 bg-neutral-50 p-2 rounded-lg border border-neutral-200 italic">
                      Catatan: {printNotes}
                    </div>
                  )}
                </div>

                {/* Urgency Summary Bar */}
                <div className="grid grid-cols-4 gap-2 mb-4 text-center">
                  <div className="p-2 rounded-lg bg-red-50 border border-red-200 text-red-950">
                    <div className="text-[10px] font-bold text-red-700">🔴 Lewat ED</div>
                    <div className="text-sm font-extrabold mt-0.5">
                      {printRecords.filter(r => getUrgencyInfo(r.expiredDate).status === 'expired').length}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-orange-50 border border-orange-200 text-orange-950">
                    <div className="text-[10px] font-bold text-orange-700">🟠 Kritis (&le;30 hr)</div>
                    <div className="text-sm font-extrabold mt-0.5">
                      {printRecords.filter(r => getUrgencyInfo(r.expiredDate).status === 'critical').length}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-950">
                    <div className="text-[10px] font-bold text-amber-700">🟡 Waspada (1-3 bln)</div>
                    <div className="text-sm font-extrabold mt-0.5">
                      {printRecords.filter(r => getUrgencyInfo(r.expiredDate).status === 'warning').length}
                    </div>
                  </div>
                  <div className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950">
                    <div className="text-[10px] font-bold text-emerald-700">🟢 Aman (&gt;3 bln)</div>
                    <div className="text-sm font-extrabold mt-0.5">
                      {printRecords.filter(r => getUrgencyInfo(r.expiredDate).status === 'safe').length}
                    </div>
                  </div>
                </div>

                {/* Table Preview */}
                <div className="overflow-x-auto border border-neutral-200 rounded-lg">
                  <table className="w-full text-left text-[11px] border-collapse">
                    <thead>
                      <tr className="bg-neutral-100 text-neutral-800 font-bold border-b border-neutral-300 text-[10px] uppercase">
                        <th className="p-2 w-8 text-center border-r border-neutral-200">No</th>
                        <th className="p-2 border-r border-neutral-200">Nama Produk</th>
                        <th className="p-2 border-r border-neutral-200">No. Batch</th>
                        <th className="p-2 border-r border-neutral-200">Tgl Expired</th>
                        <th className="p-2 border-r border-neutral-200">Sisa Waktu</th>
                        <th className="p-2 border-r border-neutral-200">Perkiraan Supplier</th>
                        <th className="p-2 text-right border-r border-neutral-200">Qty</th>
                        <th className="p-2">Catatan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-200">
                      {printRecords.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-6 text-center text-neutral-400 italic">
                            Tidak ada data produk expired dekat yang sesuai cakupan ini.
                          </td>
                        </tr>
                      ) : (
                        printRecords.map((item, idx) => {
                          const u = getUrgencyInfo(item.expiredDate);
                          const prod = item.productId
                            ? products.find(p => p.id === item.productId)
                            : products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
                          const alts = (prod?.alternativeSupplierIds || [])
                            .map(id => suppliers.find(s => s.id === id)?.name)
                            .filter(Boolean);

                          return (
                            <tr key={item.id} className="hover:bg-neutral-50/50">
                              <td className="p-2 text-center text-neutral-500 border-r border-neutral-200 font-mono text-[10px]">
                                {idx + 1}
                              </td>
                              <td className="p-2 font-bold text-neutral-900 border-r border-neutral-200">
                                <div>{item.productName}</div>
                                {prod?.category && (
                                  <div className="text-[9px] text-neutral-500 font-normal">Kat: {prod.category}</div>
                                )}
                              </td>
                              <td className="p-2 font-mono font-bold text-neutral-800 border-r border-neutral-200 text-[10px]">
                                {item.batch || '-'}
                              </td>
                              <td className="p-2 font-semibold text-neutral-900 border-r border-neutral-200 whitespace-nowrap">
                                {item.expiredDate}
                              </td>
                              <td className="p-2 border-r border-neutral-200">
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  u.status === 'expired' ? 'bg-red-100 text-red-800' :
                                  u.status === 'critical' ? 'bg-orange-100 text-orange-800' :
                                  u.status === 'warning' ? 'bg-amber-100 text-amber-800' :
                                  'bg-emerald-100 text-emerald-800'
                                }`}>
                                  {u.label}
                                </span>
                              </td>
                              <td className="p-2 border-r border-neutral-200 text-neutral-700">
                                <div className="font-semibold">{item.supplierName || 'Tidak Diketahui'}</div>
                                {alts.length > 0 && (
                                  <div className="text-[9px] text-amber-700">Alt: {alts.join(', ')}</div>
                                )}
                              </td>
                              <td className="p-2 text-right font-bold text-neutral-900 border-r border-neutral-200 whitespace-nowrap">
                                {item.quantity !== undefined ? `${item.quantity} ${item.unit || 'Pcs'}` : '-'}
                              </td>
                              <td className="p-2 text-neutral-600 text-[10px]">
                                {item.notes || '-'}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Signatures */}
                <div className="mt-8 flex justify-between items-center text-center text-neutral-700 text-[11px] pt-4 border-t border-neutral-100">
                  <div className="w-48">
                    <div>Dibuat / Diperiksa Oleh:</div>
                    <div className="mt-12 border-t border-neutral-800 pt-1 font-bold text-neutral-900">
                      {printOfficer || 'Petugas Gudang / Farmasi'}
                    </div>
                  </div>
                  <div className="w-48">
                    <div>Mengetahui,</div>
                    <div className="mt-12 border-t border-neutral-800 pt-1 font-bold text-neutral-900">
                      Apoteker / Penanggung Jawab
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 bg-white border-t border-neutral-200 flex items-center justify-between gap-3 shrink-0">
              <div className="text-xs text-neutral-600">
                Menyiapkan <strong>{printRecords.length} Produk Expired Dekat</strong> untuk dicetak
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPrintModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-neutral-600 hover:bg-neutral-100 transition-colors"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={executePrint}
                  disabled={printRecords.length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white shadow-sm transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang (Print / PDF)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT-ONLY CONTAINER (For direct browser Ctrl+P) */}
      <div id="printable-near-expired-report" className="hidden print:block print-full-width p-4">
        <div className="border-b-2 border-black pb-2 mb-3">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-xl font-bold uppercase">Laporan Rekap Produk Expired Dekat</h1>
              <p className="text-xs text-gray-600">DailyReportPro Farmasi &amp; Apotek</p>
            </div>
            <div className="text-right text-xs">
              <div>Dicetak: {format(new Date(), 'dd MMMM yyyy, HH:mm', { locale: localeId })} WIB</div>
              <div>Total: {filteredRecords.length} Produk</div>
            </div>
          </div>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b-2 border-black bg-gray-100 font-bold">
              <th className="p-2 w-8 text-center">No</th>
              <th className="p-2">Nama Produk</th>
              <th className="p-2">Batch</th>
              <th className="p-2">Tgl Expired</th>
              <th className="p-2">Sisa Waktu</th>
              <th className="p-2">Perkiraan Supplier</th>
              <th className="p-2 text-right">Qty</th>
              <th className="p-2">Catatan</th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((item, idx) => {
              const u = getUrgencyInfo(item.expiredDate);
              return (
                <tr key={item.id} className="border-b border-gray-200">
                  <td className="p-2 text-center">{idx + 1}</td>
                  <td className="p-2 font-bold">{item.productName}</td>
                  <td className="p-2 font-mono font-bold">{item.batch || '-'}</td>
                  <td className="p-2 font-semibold">{item.expiredDate}</td>
                  <td className="p-2 font-bold">{u.label}</td>
                  <td className="p-2">{item.supplierName}</td>
                  <td className="p-2 text-right font-bold">{item.quantity !== undefined ? `${item.quantity} ${item.unit || 'Pcs'}` : '-'}</td>
                  <td className="p-2">{item.notes || '-'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="mt-8 flex justify-between text-center text-xs">
          <div className="w-48">
            <div>Dibuat / Diperiksa:</div>
            <div className="mt-12 border-t border-black pt-1 font-bold">Petugas Gudang</div>
          </div>
          <div className="w-48">
            <div>Mengetahui:</div>
            <div className="mt-12 border-t border-black pt-1 font-bold">Apoteker / Penanggung Jawab</div>
          </div>
        </div>
      </div>
    </div>
  );
};
