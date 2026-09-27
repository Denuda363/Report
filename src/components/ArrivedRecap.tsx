import React, { useState, useMemo, useRef, useEffect } from 'react';
import { format, subDays, startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { 
  Search, Calendar as CalendarIcon, PackageOpen, Plus, ChevronDown, X, 
  Maximize2, Minimize2, Edit2, Check, Trash2, Download, Filter, 
  ChevronUp, Upload, RefreshCw, PackageCheck, CheckCircle2, AlertCircle, 
  FileSpreadsheet, Building2, Layers, ChevronRight, ChevronLeft,
  Boxes, FileText, LayoutGrid, Table as TableIcon, TrendingUp, Sparkles
} from 'lucide-react';
import { useAppContext } from '../store/AppContext';
import { exportArrivedToTxt, exportArrivedToExcel, downloadArrivedTemplate, parseArrivedImport, formatExcelDate } from '../lib/excel';
import { motion, AnimatePresence } from 'motion/react';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { SearchHistoryChips } from './SearchHistoryChips';
import { OperationProgressModal } from './common/OperationProgressModal';
import { cn } from '../lib/utils';

export const ArrivedRecap = () => {
  const { reports, products, suppliers, addReport, updateReport, deleteReport, updateProduct, addSupplier, addProduct } = useAppContext();
  
  // Default to last 7 days
  const [startDate, setStartDate] = useState(format(subDays(new Date(), 6), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [searchQueryList, setSearchQueryList] = useState('');
  const [reportFilter, setReportFilter] = useState<'all' | 'linked' | 'unlinked'>('all');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [isFilterSupplierDropdownOpen, setIsFilterSupplierDropdownOpen] = useState(false);
  const filterSupplierDropdownRef = useRef<HTMLDivElement>(null);
  const [filterSupplierHistory, setFilterSupplierHistory] = useState<string[]>(() => getSearchHistory('arrived_filter_supplier'));
  const [isListFullscreen, setIsListFullscreen] = useState(false);
  const [isFormFullscreen, setIsFormFullscreen] = useState(false);
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [mobileTab, setMobileTab] = useState<'list' | 'form'>('list');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');

  // Import State & Progress Animation
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{ current: number; total: number; currentProduct: string; startTime?: number }>({ current: 0, total: 0, currentProduct: '' });
  const [importSummary, setImportSummary] = useState<{ isOpen: boolean; total: number; errors: string[] }>({ isOpen: false, total: 0, errors: [] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [arrivedSupplierId, setArrivedSupplierId] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Search History State
  const [productSearchHistory, setProductSearchHistory] = useState<string[]>(() => getSearchHistory('arrived_product'));
  const [supplierSearchHistory, setSupplierSearchHistory] = useState<string[]>(() => getSearchHistory('arrived_supplier'));

  interface ArrivedItem {
    id: string; // temp id
    productId: string;
    productName: string;
    notes: string;
    isReorder?: boolean;
    reorderQty?: number;
    reorderReason?: string;
    arrivedQty?: number;
  }
  const [arrivedItems, setArrivedItems] = useState<ArrivedItem[]>([]);
  
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [currentNotes, setCurrentNotes] = useState('');
  const [currentIsReorder, setCurrentIsReorder] = useState(false);
  const [currentReorderQty, setCurrentReorderQty] = useState<number | ''>('');
  const [currentReorderReason, setCurrentReorderReason] = useState('');
  const [currentArrivedQty, setCurrentArrivedQty] = useState<number | ''>('');

  // Saving state & user alerts
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [formErrorMsg, setFormErrorMsg] = useState<string | null>(null);

  // Helper function for consistent date display (immune to UTC/timezone offset)
  const formatDateDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const clean = formatExcelDate(dateStr);
    const parts = clean.split('-');
    if (parts.length === 3) {
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return format(d, 'dd MMM yyyy');
    }
    return dateStr;
  };

  // Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editArrivedQty, setEditArrivedQty] = useState<number | ''>('');

  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
      if (filterSupplierDropdownRef.current && !filterSupplierDropdownRef.current.contains(event.target as Node)) {
        setIsFilterSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProductsForForm = useMemo(() => {
    return products.filter(p => (p.name || '').toLowerCase().includes(currentSearchQuery.toLowerCase()));
  }, [products, currentSearchQuery]);

  const filteredSuppliersForForm = useMemo(() => {
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(supplierSearchQuery.toLowerCase()));
  }, [suppliers, supplierSearchQuery]);

  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  }, [suppliers]);

  const filteredSuppliersForFilter = useMemo(() => {
    const q = (supplierFilterQuery || '').toLowerCase().trim();
    if (!q) return sortedSuppliers;
    return sortedSuppliers.filter(s => (s.name || '').toLowerCase().includes(q));
  }, [sortedSuppliers, supplierFilterQuery]);

  // Select product for active editing in form
  const handleSelectProductForForm = (p: any) => {
    setCurrentProductId(p.id);
    setCurrentSearchQuery(p.name);
    setIsProductDropdownOpen(false);
    setFormErrorMsg(null);

    // Auto-suggest supplier if product has one and not yet specified
    if (p.supplierId && !arrivedSupplierId) {
      setArrivedSupplierId(p.supplierId);
      const sup = suppliers.find(s => s.id === p.supplierId);
      if (sup) setSupplierSearchQuery(sup.name);
    }
    if (currentArrivedQty === '' || currentArrivedQty === 0) {
      setCurrentArrivedQty(1);
    }
  };

  // Quick 1-click add from dropdown
  const handleProductSelect = (id: string, name: string, qtyOverride?: number) => {
    const qty = qtyOverride !== undefined ? qtyOverride : (currentArrivedQty ? Number(currentArrivedQty) : 1);
    setArrivedItems(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      productId: id,
      productName: name,
      notes: currentNotes.trim(),
      isReorder: currentIsReorder,
      reorderQty: currentReorderQty ? Number(currentReorderQty) : 0,
      reorderReason: currentReorderReason.trim(),
      arrivedQty: qty
    }]);
    
    // Save to search history
    if (currentSearchQuery.trim()) {
      const updated = addSearchHistory('arrived_product', currentSearchQuery.trim());
      setProductSearchHistory(updated);
    }

    setCurrentProductId('');
    setCurrentNotes('');
    setCurrentIsReorder(false);
    setCurrentReorderQty('');
    setCurrentReorderReason('');
    setCurrentArrivedQty('');
    setIsProductDropdownOpen(false);
    setFormErrorMsg(null);
  };

  // Add currently typed/selected product into arrivedItems list
  const handleAddToArrivedItems = () => {
    const prodName = currentSearchQuery.trim();
    if (!currentProductId && !prodName) {
      setFormErrorMsg("Pilih atau ketik nama produk terlebih dahulu.");
      return;
    }
    const qty = currentArrivedQty === '' ? 1 : Number(currentArrivedQty);
    if (qty <= 0) {
      setFormErrorMsg("Jumlah datang (Qty) minimal 1.");
      return;
    }

    const p = currentProductId 
      ? products.find(prod => prod.id === currentProductId)
      : products.find(prod => prod.name.trim().toLowerCase() === prodName.toLowerCase());

    const finalId = p ? p.id : (currentProductId || '');
    const finalName = p ? p.name : prodName;

    setArrivedItems(prev => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2, 9),
        productId: finalId,
        productName: finalName,
        notes: currentNotes.trim(),
        isReorder: currentIsReorder,
        reorderQty: currentReorderQty ? Number(currentReorderQty) : 0,
        reorderReason: currentReorderReason.trim(),
        arrivedQty: qty
      }
    ]);

    if (prodName) {
      const updated = addSearchHistory('arrived_product', prodName);
      setProductSearchHistory(updated);
    }

    // Reset inputs for next item
    setCurrentProductId('');
    setCurrentSearchQuery('');
    setCurrentArrivedQty('');
    setCurrentNotes('');
    setCurrentIsReorder(false);
    setCurrentReorderQty('');
    setCurrentReorderReason('');
    setFormErrorMsg(null);
  };

  const handleRemoveItem = (id: string) => {
    setArrivedItems(arrivedItems.filter(item => item.id !== id));
  };

  // Comprehensive, bulletproof save handler
  const handleSaveAllArrived = async () => {
    setFormErrorMsg(null);

    if (!date) {
      setFormErrorMsg("Tanggal barang datang wajib diisi.");
      return;
    }

    // Gather all items to save: arrivedItems PLUS current product if user has filled it in the form
    let itemsToProcess = [...arrivedItems];
    const activeProdName = currentSearchQuery.trim();

    if ((currentProductId || activeProdName) && currentArrivedQty !== '' && Number(currentArrivedQty) > 0) {
      const p = currentProductId 
        ? products.find(prod => prod.id === currentProductId)
        : products.find(prod => prod.name.trim().toLowerCase() === activeProdName.toLowerCase());

      itemsToProcess.push({
        id: Math.random().toString(36).substr(2, 9),
        productId: p ? p.id : (currentProductId || ''),
        productName: p ? p.name : activeProdName,
        notes: currentNotes.trim(),
        isReorder: currentIsReorder,
        reorderQty: currentReorderQty ? Number(currentReorderQty) : 0,
        reorderReason: currentReorderReason.trim(),
        arrivedQty: Number(currentArrivedQty)
      });
    }

    if (itemsToProcess.length === 0) {
      setFormErrorMsg("Pilih produk dan masukkan jumlah datang (Qty) sebelum menyimpan.");
      return;
    }

    setIsSaving(true);

    try {
      const normalizedDate = formatExcelDate(date);
      let savedCount = 0;

      for (const item of itemsToProcess) {
        let finalProductId = item.productId;

        // Auto-create product in Master Data if not existing yet
        if (!finalProductId && item.productName) {
          const existingP = products.find(p => p.name.trim().toLowerCase() === item.productName.trim().toLowerCase());
          if (existingP) {
            finalProductId = existingP.id;
          } else {
            finalProductId = await addProduct({
              name: item.productName.trim(),
              supplierId: arrivedSupplierId || '',
              unit: 'pcs',
              stock: item.arrivedQty || 0,
              bottomStock: undefined
            });
          }
        }

        // Update product stock and supplier references
        if (finalProductId) {
          const product = products.find(p => p.id === finalProductId);
          if (product) {
            let needsUpdate = false;
            let updatedProduct = { ...product };

            if (arrivedSupplierId) {
              if (!product.supplierId) {
                updatedProduct.supplierId = arrivedSupplierId;
                needsUpdate = true;
              } else if (product.supplierId !== arrivedSupplierId) {
                if (!(product.alternativeSupplierIds || []).includes(arrivedSupplierId)) {
                  updatedProduct.alternativeSupplierIds = [...(product.alternativeSupplierIds || []), arrivedSupplierId];
                  needsUpdate = true;
                }
              }
            }

            if (product.isKosongPabrik) {
              updatedProduct.isKosongPabrik = false;
              updatedProduct.kosongPabrikDate = undefined;
              needsUpdate = true;
            }
            
            if (item.arrivedQty && item.arrivedQty > 0) {
              updatedProduct.stock = (product.stock || 0) + item.arrivedQty;
              needsUpdate = true;
            }

            if (needsUpdate) {
              await updateProduct(updatedProduct);
            }
          }
        }

        // Check if report exists for this date and product: PASTIKAN TERCEKLIS DI DAILY REPORT!
        const matchingReports = reports.filter(r => (formatExcelDate(r.date) || r.date) === normalizedDate && r.productId === finalProductId);
        const arrivalNote = item.notes 
          ? (item.notes.startsWith('Datang') ? item.notes : `Datang (${item.notes})`) 
          : 'Barang Datang';

        if (matchingReports.length > 0) {
          // Update matching report for this date and product
          for (const existingReport of matchingReports) {
            await updateReport({
              ...existingReport,
              isArrived: true,
              isArrivedOnly: false,
              arrivedAt: Date.now(),
              arrivedQty: (existingReport.arrivedQty || 0) + (item.arrivedQty || 0),
              arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
              notes: existingReport.notes 
                ? (existingReport.notes.includes(arrivalNote) ? existingReport.notes : `${existingReport.notes} | ${arrivalNote}`) 
                : arrivalNote,
              isKosongPabrik: false,
              ...(item.isReorder ? {
                isReorder: true,
                reorderQty: item.reorderQty,
                reorderReason: item.reorderReason
              } : {})
            });
          }
        } else {
          // Belum ada report di tanggal ini, buat entri baru agar langsung muncul dan terceklis di Daily Report
          await addReport({
            date: normalizedDate,
            productId: finalProductId,
            quantity: 0,
            notes: item.notes || 'Barang Datang',
            isOrdered: false,
            isArrived: true,
            isArrivedOnly: false,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || undefined,
            isBottomStock: false,
            isKosongPabrik: false,
            isWarningStock: false,
            isReorder: item.isReorder || false,
            reorderQty: item.reorderQty || 0,
            reorderReason: item.reorderReason || '',
            arrivedQty: item.arrivedQty || 0
          });
        }

        savedCount++;
      }

      // Automatically adjust date filters so newly saved items are immediately visible in the list
      if (normalizedDate < startDate) {
        setStartDate(normalizedDate);
      }
      if (normalizedDate > endDate) {
        setEndDate(normalizedDate);
      }

      // Reset Form State
      setArrivedItems([]);
      setCurrentProductId('');
      setCurrentSearchQuery('');
      setCurrentArrivedQty('');
      setCurrentNotes('');
      setCurrentIsReorder(false);
      setCurrentReorderQty('');
      setCurrentReorderReason('');
      setArrivedSupplierId('');
      setSupplierSearchQuery('');

      // User feedback
      setSaveSuccessMsg(`Berhasil menyimpan ${savedCount} data barang datang! Stok produk otomatis diperbarui.`);
      setTimeout(() => setSaveSuccessMsg(null), 4000);

      // Switch to list view on mobile
      setMobileTab('list');
    } catch (err: any) {
      console.error("Error saving arrived items:", err);
      setFormErrorMsg("Gagal menyimpan data barang datang: " + (err?.message || "Terjadi kesalahan sistem."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditDate(item.date);
    setEditNotes(item.notes || '');
    setEditArrivedQty(item.arrivedQty || '');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    try {
      const existingReport = reports.find(r => r.id === editingId);
      if (existingReport) {
        const newQty = editArrivedQty ? Number(editArrivedQty) : 0;
        await updateReport({
          ...existingReport,
          date: editDate,
          notes: editNotes,
          arrivedQty: newQty
        });
        
        // Update stock of product if qty changed
        if (existingReport.productId && (newQty !== (existingReport.arrivedQty || 0))) {
          const p = products.find(prod => prod.id === existingReport.productId);
          if (p) {
             const diff = newQty - (existingReport.arrivedQty || 0);
             await updateProduct({...p, stock: Math.max(0, (p.stock || 0) + diff)});
          }
        }
      }
      setEditingId(null);
      setSaveSuccessMsg("Perubahan data barang datang berhasil disimpan.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Gagal mengupdate data: " + (err?.message || "Terjadi kesalahan."));
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = async (item: any) => {
    if (!window.confirm(`Hapus data barang datang "${item.productName}"? Stok produk akan dikurangi sesuai Qty datang (${item.arrivedQty || 0}).`)) return;
    
    try {
      // Restore/deduct product stock
      if (item.productId && item.arrivedQty > 0) {
        const p = products.find(prod => prod.id === item.productId);
        if (p) {
          await updateProduct({
            ...p,
            stock: Math.max(0, (p.stock || 0) - item.arrivedQty)
          });
        }
      }

      if (item.isArrivedOnly) {
        // Hapus permanen jika hanya data barang datang
        await deleteReport(item.id, true);
      } else {
        // Unchecklist jika terkait dengan daily report penjualan
        const existingReport = reports.find(r => r.id === item.id);
        if (existingReport) {
          await updateReport({
            ...existingReport,
            isArrived: false,
            arrivedQty: 0
          });
        }
      }
      setSaveSuccessMsg("Data barang datang berhasil dihapus.");
      setTimeout(() => setSaveSuccessMsg(null), 3000);
    } catch (err: any) {
      alert("Gagal menghapus data: " + (err?.message || "Terjadi kesalahan."));
    }
  };

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Ingin mengimpor data barang datang dari file Excel ini? Pastikan format sesuai template.")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const result = await parseArrivedImport(file);
      if (result.items.length === 0) {
        setIsImporting(false);
        alert("File Excel tidak memiliki baris data barang datang yang valid.");
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }

      const startTime = Date.now();
      setImportProgress({
        current: 0,
        total: result.items.length,
        currentProduct: 'Memulai proses impor...',
        startTime
      });

      let importCount = 0;
      for (let i = 0; i < result.items.length; i++) {
        const item = result.items[i];
        setImportProgress({
          current: i + 1,
          total: result.items.length,
          currentProduct: item.productName,
          startTime
        });

        // 1. Supplier
        let supplierId = '';
        if (item.supplierName) {
          const trimmedSup = item.supplierName.trim();
          const matchedSup = suppliers.find(s => s.name.trim().toLowerCase() === trimmedSup.toLowerCase());
          if (!matchedSup) {
            supplierId = await addSupplier({ name: trimmedSup });
          } else {
            supplierId = matchedSup.id;
          }
        }

        // 2. Product
        const trimmedProduct = item.productName.trim();
        const matchedProduct = products.find(p => p.name.trim().toLowerCase() === trimmedProduct.toLowerCase());
        let finalProductId = '';

        if (!matchedProduct) {
          finalProductId = await addProduct({
            name: trimmedProduct,
            supplierId: supplierId || '',
            unit: 'pcs',
            stock: item.arrivedQty || 0,
            bottomStock: undefined
          });
        } else {
          finalProductId = matchedProduct.id;
          let needsUpdate = false;
          const updatedProduct = { ...matchedProduct };

          if (supplierId) {
            if (!matchedProduct.supplierId) {
              updatedProduct.supplierId = supplierId;
              needsUpdate = true;
            } else if (matchedProduct.supplierId !== supplierId) {
              if (!(matchedProduct.alternativeSupplierIds || []).includes(supplierId)) {
                updatedProduct.alternativeSupplierIds = [...(matchedProduct.alternativeSupplierIds || []), supplierId];
                needsUpdate = true;
              }
            }
          }

          if (matchedProduct.isKosongPabrik) {
            updatedProduct.isKosongPabrik = false;
            updatedProduct.kosongPabrikDate = undefined;
            needsUpdate = true;
          }

          if (item.arrivedQty && item.arrivedQty > 0) {
            updatedProduct.stock = (matchedProduct.stock || 0) + item.arrivedQty;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateProduct(updatedProduct);
          }
        }

        // 3. Report Entry: PASTIKAN TERCEKLIS DI DAILY REPORT!
        const normalizedItemDate = formatExcelDate(item.date);
        const matchingReports = reports.filter(r => (formatExcelDate(r.date) || r.date) === normalizedItemDate && r.productId === finalProductId);
        const arrivalNote = item.notes 
          ? (item.notes.startsWith('Datang') ? item.notes : `Datang (${item.notes})`) 
          : 'Barang Datang';

        if (matchingReports.length > 0) {
          for (const existingReport of matchingReports) {
            await updateReport({
              ...existingReport,
              isArrived: true, // Terceklis di daily report
              isArrivedOnly: false, // Pastikan tampil di daily report
              arrivedAt: Date.now(),
              arrivedQty: (existingReport.arrivedQty || 0) + (item.arrivedQty || 0),
              arrivedSupplierId: supplierId || existingReport.arrivedSupplierId,
              notes: existingReport.notes 
                ? (existingReport.notes.includes(arrivalNote) ? existingReport.notes : `${existingReport.notes} | ${arrivalNote}`) 
                : arrivalNote,
              isKosongPabrik: false, // Otomatis uncheck kosong pabrik saat barang datang
              ...(item.isReorder ? {
                isReorder: true,
                reorderQty: item.reorderQty,
                reorderReason: item.reorderReason
              } : {})
            });
          }
        } else {
          await addReport({
            date: normalizedItemDate,
            productId: finalProductId,
            quantity: 0,
            notes: item.notes || 'Barang Datang',
            isOrdered: false,
            isArrived: true, // Terceklis di daily report
            isArrivedOnly: false, // Pastikan tampil di daily report
            arrivedAt: Date.now(),
            arrivedSupplierId: supplierId || undefined,
            isBottomStock: false,
            isKosongPabrik: false,
            isWarningStock: false,
            isReorder: item.isReorder || false,
            reorderQty: item.reorderQty || 0,
            reorderReason: item.reorderReason || '',
            arrivedQty: item.arrivedQty || 0
          });
        }

        importCount++;
        // Pacing animasi visual halus
        if (result.items.length > 4) {
          await new Promise(resolve => setTimeout(resolve, 40));
        }
      }

      // Jeda di 100% agar animasi selesai dengan memuaskan
      await new Promise(resolve => setTimeout(resolve, 350));

      setIsImporting(false);
      setImportSummary({
        isOpen: true,
        total: importCount,
        errors: result.errors
      });
    } catch (err: any) {
      setIsImporting(false);
      alert("Gagal mengimpor file: " + err.message);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const filteredArrivedData = useMemo(() => {
    return reports
      .filter(r => {
        if (!r.isArrived) return false;

        const itemDate = formatExcelDate(r.date);
        if (startDate && itemDate < startDate) return false;
        if (endDate && itemDate > endDate) return false;

        const product = products.find(p => p.id === r.productId);
        if (searchQueryList) {
          const matchName = (product?.name || '').toLowerCase().includes(searchQueryList.toLowerCase());
          if (!matchName) return false;
        }

        if (reportFilter === 'linked' && r.isArrivedOnly) return false;
        if (reportFilter === 'unlinked' && !r.isArrivedOnly) return false;

        // Filter berdasarkan supplier
        if (filterSupplier) {
          if (filterSupplier === 'none') {
            const hasSupplier = Boolean(r.arrivedSupplierId || product?.supplierId);
            if (hasSupplier) return false;
          } else {
            // Jika ada arrivedSupplierId yang tercatat spesifik saat input barang datang
            if (r.arrivedSupplierId) {
              if (r.arrivedSupplierId !== filterSupplier) return false;
            } else {
              // Jika tidak ada supplier transaksi khusus, cek supplier utama & alternatif dari produk
              const isPrimary = product?.supplierId === filterSupplier;
              const isAlt = (product?.alternativeSupplierIds || []).includes(filterSupplier);
              if (!isPrimary && !isAlt) return false;
            }
          }
        } else if (supplierFilterQuery.trim()) {
          // Jika pengguna mencari dengan mengetik kata kunci nama supplier
          const q = supplierFilterQuery.trim().toLowerCase();
          const productSupName = (suppliers.find(s => s.id === product?.supplierId)?.name || '').toLowerCase();
          const arrivedSupName = (suppliers.find(s => s.id === r.arrivedSupplierId)?.name || '').toLowerCase();
          const altSupNames = (product?.alternativeSupplierIds || [])
            .map(id => (suppliers.find(s => s.id === id)?.name || '').toLowerCase());
          
          const matchesDirect = arrivedSupName.includes(q);
          const matchesProduct = productSupName.includes(q);
          const matchesAlt = altSupNames.some(n => n.includes(q));
          
          if (!matchesDirect && !matchesProduct && !matchesAlt) {
            return false;
          }
        }

        return true;
      })
      .map(r => {
        const product = products.find(p => p.id === r.productId);
        const supplier = suppliers.find(s => s.id === product?.supplierId);
        let sName = supplier?.name || 'Unknown';
        let matchedSupplierId = product?.supplierId || '';
        
        if (r.arrivedSupplierId) {
          const arrivedSup = suppliers.find(s => s.id === r.arrivedSupplierId);
          if (arrivedSup) {
            sName = arrivedSup.name;
            matchedSupplierId = arrivedSup.id;
          }
        } else {
          if (product?.alternativeSupplierIds && product.alternativeSupplierIds.length > 0) {
            const altNames = product.alternativeSupplierIds.map(id => suppliers.find(s => s.id === id)?.name).filter(Boolean);
            if (altNames.length > 0) {
              sName += ` (+${altNames.join(', ')})`;
            }
          }
        }

        return {
          ...r,
          productName: product?.name || 'Unknown',
          unit: product?.unit || 'pcs',
          supplierName: sName,
          supplierId: matchedSupplierId
        };
      })
      .sort((a, b) => {
        const arrivedA = a.arrivedAt || 0;
        const arrivedB = b.arrivedAt || 0;
        
        if (arrivedA !== arrivedB) {
          return arrivedB - arrivedA;
        }

        const timeA = a.createdAt || 0;
        const timeB = b.createdAt || 0;
        if (timeA !== timeB) {
          return timeB - timeA;
        }
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      });
  }, [reports, products, suppliers, startDate, endDate, searchQueryList, reportFilter, filterSupplier, supplierFilterQuery]);

  const stats = useMemo(() => {
    const totalCount = filteredArrivedData.length;
    const totalQty = filteredArrivedData.reduce((sum, item) => sum + (item.arrivedQty || 0), 0);
    const linkedCount = filteredArrivedData.filter(item => !item.isArrivedOnly).length;
    const unlinkedCount = totalCount - linkedCount;
    return { totalCount, totalQty, linkedCount, unlinkedCount };
  }, [filteredArrivedData]);

  const setDatePreset = (preset: 'today' | '7days' | '30days' | 'thisMonth') => {
    const now = new Date();
    if (preset === 'today') {
      const todayStr = format(now, 'yyyy-MM-dd');
      setStartDate(todayStr);
      setEndDate(todayStr);
    } else if (preset === '7days') {
      setStartDate(format(subDays(now, 6), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === '30days') {
      setStartDate(format(subDays(now, 29), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    } else if (preset === 'thisMonth') {
      setStartDate(format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd'));
      setEndDate(format(now, 'yyyy-MM-dd'));
    }
  };

  const activePreset = useMemo(() => {
    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const sevenDaysStr = format(subDays(now, 6), 'yyyy-MM-dd');
    const thirtyDaysStr = format(subDays(now, 29), 'yyyy-MM-dd');
    const monthStartStr = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd');

    if (startDate === todayStr && endDate === todayStr) return 'today';
    if (startDate === sevenDaysStr && endDate === todayStr) return '7days';
    if (startDate === thirtyDaysStr && endDate === todayStr) return '30days';
    if (startDate === monthStartStr && endDate === todayStr) return 'thisMonth';
    return 'custom';
  }, [startDate, endDate]);

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-300">
      
      {/* Mobile Tab Switcher (< lg) */}
      <div className="lg:hidden flex items-center p-1 bg-theme-100/70 backdrop-blur rounded-2xl border border-theme-200 mb-3 shrink-0 shadow-2xs">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all",
            mobileTab === 'list'
              ? "bg-white text-theme-900 shadow-2xs"
              : "text-theme-600-text hover:text-theme-900"
          )}
        >
          <PackageOpen className="w-4 h-4 text-theme-500" />
          <span>Daftar Datang</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-theme-100 text-theme-700 font-bold">
            {filteredArrivedData.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all",
            mobileTab === 'form'
              ? "bg-theme-500 text-white shadow-2xs shadow-theme-500/30"
              : "text-theme-600-text hover:text-theme-900"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>+ Input Barang</span>
          {arrivedItems.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-white text-theme-700 font-bold">
              {arrivedItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 flex-1 min-h-0">
      
      {/* Input Form */}
      <div className={
        isFormFullscreen
          ? "fixed inset-0 z-[100] bg-theme-50/95 backdrop-blur-md p-4 sm:p-6 md:p-8 overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl flex flex-col"
          : cn(
              "bg-white rounded-3xl border border-theme-200 shadow-xs transition-all duration-300 h-fit",
              // Mobile visibility based on active tab
              mobileTab === 'form' ? "w-full block p-4 sm:p-5" : "hidden lg:block",
              // Desktop collapsed state
              isFormCollapsed ? "lg:w-16 lg:p-3 overflow-hidden" : "lg:w-80 xl:w-96 lg:p-5 shrink-0"
            )
      }>
        {/* Collapsed Rail on Desktop */}
        {isFormCollapsed && !isFormFullscreen ? (
          <div className="hidden lg:flex flex-col items-center gap-4 py-2">
            <button
              onClick={() => setIsFormCollapsed(false)}
              className="p-2.5 bg-theme-100 hover:bg-theme-200 text-theme-700 rounded-2xl transition-all shadow-2xs group relative"
              title="Buka Form Input"
            >
              <PackageOpen className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {arrivedItems.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-theme-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs">
                  {arrivedItems.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setIsFormCollapsed(false)}
              className="p-2 text-theme-600-text hover:text-theme-900 hover:bg-theme-50 rounded-xl transition-colors"
              title="Perluas Form Input"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <div 
              className="[writing-mode:vertical-rl] rotate-180 text-xs font-bold text-theme-600-text tracking-wider uppercase select-none cursor-pointer py-2 hover:text-theme-900" 
              onClick={() => setIsFormCollapsed(false)}
            >
              Form Input Barang
            </div>
          </div>
        ) : (
          <>
            {/* Form Header */}
            <div className="flex items-center justify-between mb-4 gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-theme-100 text-theme-700 rounded-xl shadow-2xs">
                  <PackageOpen className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-theme-900 text-sm md:text-base leading-tight">Input Barang Datang</h3>
                  <p className="text-[11px] text-theme-600-text hidden sm:block">Tambah riwayat penerimaan</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsFormFullscreen(!isFormFullscreen)}
                  className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-100 rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-2xs"
                  title={isFormFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
                >
                  {isFormFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
                {!isFormFullscreen && (
                  <button
                    onClick={() => setIsFormCollapsed(true)}
                    className="hidden lg:flex p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-100 rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-2xs"
                    title="Sembunyikan Form (Collapse)"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                {!isFormFullscreen && (
                  <button
                    onClick={() => setMobileTab('list')}
                    className="lg:hidden p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-100 rounded-lg transition-colors active:scale-95 bg-white border border-theme-200 shadow-2xs"
                    title="Kembali ke Daftar"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="space-y-4 flex-1 overflow-y-auto pr-1">
          {/* 1. TANGGAL DI PALING ATAS */}
          <div>
            <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Tanggal</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
            />
          </div>

          {/* 2. SUPPLIER DI PALING ATAS SETELAH TANGGAL */}
          <div className="relative" ref={supplierDropdownRef}>
            <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Datang Dari Supplier</label>
            <div className="relative flex items-center w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all">
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  setSupplierSearchQuery(e.target.value);
                  setArrivedSupplierId('');
                  setIsSupplierDropdownOpen(true);
                }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-theme-800"
                placeholder="Pilih supplier (opsional)..."
              />
              {supplierSearchQuery && (
                <X 
                  className="w-4 h-4 text-theme-600-text ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setArrivedSupplierId('');
                  }} 
                />
              )}
              <ChevronDown className="w-4 h-4 text-theme-600-text ml-2 shrink-0 cursor-pointer hover:text-theme-800 transition-colors" onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} />
            </div>

            {isSupplierDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-theme-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                <SearchHistoryChips
                  history={supplierSearchHistory}
                  onSelect={(term) => {
                    setSupplierSearchQuery(term);
                    setIsSupplierDropdownOpen(true);
                  }}
                  onClear={() => {
                    clearSearchHistory('arrived_supplier');
                    setSupplierSearchHistory([]);
                  }}
                />
                {filteredSuppliersForForm.length > 0 ? (
                  filteredSuppliersForForm.map(s => (
                    <div 
                      key={s.id}
                      className="px-4 py-3 hover:bg-theme-100 cursor-pointer text-sm font-bold text-theme-900 transition-colors border-b border-theme-50 last:border-0"
                      onClick={() => {
                        setArrivedSupplierId(s.id);
                        setSupplierSearchQuery(s.name);
                        const updated = addSearchHistory('arrived_supplier', s.name);
                        setSupplierSearchHistory(updated);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      {s.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-theme-600-text text-center">
                    Tidak ada supplier ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Alert / Notification Banners */}
          {saveSuccessMsg && (
            <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-semibold">{saveSuccessMsg}</span>
              </div>
              <button onClick={() => setSaveSuccessMsg(null)} className="text-emerald-600 hover:text-emerald-800 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {formErrorMsg && (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 text-xs px-3.5 py-2.5 rounded-xl flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span className="font-semibold">{formErrorMsg}</span>
              </div>
              <button onClick={() => setFormErrorMsg(null)} className="text-rose-600 hover:text-rose-800 p-0.5">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* 3. INPUT PRODUK & DETAIL BARANG DATANG */}
          <div className="space-y-3 bg-theme-50 p-3 rounded-2xl border border-theme-200 border-dashed">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider">
                Pilih Produk <span className="text-rose-500">*</span>
              </label>
              {currentProductId && (
                <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Produk Terpilih
                </span>
              )}
            </div>

            <div className="relative" ref={productDropdownRef}>
              <div className="relative flex items-center w-full px-3 py-2.5 border border-theme-200 rounded-xl bg-white focus-within:ring-2 focus-within:ring-theme-500 focus-within:border-theme-500 transition-all">
                <Search className="w-4 h-4 text-theme-600-text mr-2 shrink-0" />
                <input
                  type="text"
                  value={currentSearchQuery}
                  onChange={(e) => {
                    setCurrentSearchQuery(e.target.value);
                    setCurrentProductId('');
                    setIsProductDropdownOpen(true);
                  }}
                  onFocus={() => setIsProductDropdownOpen(true)}
                  className="w-full outline-none bg-transparent text-xs sm:text-sm text-theme-900 font-medium"
                  placeholder="Ketik untuk mencari produk..."
                />
                {currentSearchQuery && (
                  <X 
                    className="w-4 h-4 text-theme-600-text ml-1 shrink-0 cursor-pointer hover:text-rose-500" 
                    onClick={() => {
                      setCurrentSearchQuery('');
                      setCurrentProductId('');
                    }} 
                  />
                )}
              </div>

              {isProductDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-theme-200 rounded-xl shadow-xl max-h-56 overflow-y-auto py-1">
                  <SearchHistoryChips
                    history={productSearchHistory}
                    onSelect={(term) => {
                      setCurrentSearchQuery(term);
                      setIsProductDropdownOpen(true);
                    }}
                    onClear={() => {
                      clearSearchHistory('arrived_product');
                      setProductSearchHistory([]);
                    }}
                  />
                  {filteredProductsForForm.length > 0 ? (
                    filteredProductsForForm.map(p => {
                      const s = suppliers.find(sup => sup.id === p.supplierId);
                      return (
                        <div 
                          key={p.id}
                          className="px-3 py-2 hover:bg-theme-100 border-b border-theme-50 last:border-0 flex items-center justify-between gap-2 transition-colors cursor-pointer"
                          onClick={() => handleSelectProductForForm(p)}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-xs text-theme-900 truncate">{p.name}</div>
                            <div className="flex items-center gap-2 text-[10px] text-theme-600-text mt-0.5">
                              <span>{s?.name || 'Tanpa Supplier'}</span>
                              <span>•</span>
                              <span>Stok: <strong className="text-theme-800">{p.stock || 0} {p.unit || 'pcs'}</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                             <button
                               type="button"
                               onClick={() => handleProductSelect(p.id, p.name, 1)}
                               className="px-2 py-1 bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold rounded text-[11px] transition-colors"
                               title="Langsung tambah 1 ke daftar"
                             >
                               +1 Qty
                             </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-3 text-xs text-theme-600-text text-center">
                      <p>Tidak ada produk "{currentSearchQuery}".</p>
                      <p className="text-[10px] text-theme-400 mt-0.5">Akan otomatis didaftarkan saat disimpan.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Selected Product Info Badge */}
            {currentProductId && (
              <div className="flex items-center justify-between bg-theme-100/80 border border-theme-300/80 px-3 py-2 rounded-xl text-xs">
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-theme-600 uppercase tracking-wider block">Produk Terpilih</span>
                  <span className="font-bold text-theme-900 truncate block">
                    {products.find(p => p.id === currentProductId)?.name || currentSearchQuery}
                  </span>
                  <span className="text-[10px] text-theme-700">
                    Stok saat ini: <strong>{products.find(p => p.id === currentProductId)?.stock ?? 0} {products.find(p => p.id === currentProductId)?.unit || 'pcs'}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentProductId('');
                    setCurrentSearchQuery('');
                  }}
                  className="p-1 text-theme-400 hover:text-rose-500 rounded-lg transition-colors"
                  title="Ganti Produk"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Input Qty and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-1">
                <label className="block text-[11px] font-bold text-theme-600 uppercase mb-1">
                  Qty Datang <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  inputMode="numeric"
                  value={currentArrivedQty}
                  onChange={(e) => setCurrentArrivedQty(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-theme-200 rounded-xl bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs font-bold text-theme-900"
                  placeholder="Qty..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-theme-600 uppercase mb-1">
                  Catatan / Keterangan
                </label>
                <input
                  type="text"
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-200 rounded-xl bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs text-theme-800"
                  placeholder="Keterangan (opsional)..."
                />
              </div>
            </div>
            
            {/* Reorder Request Checkbox */}
            <div className="flex flex-col gap-2 p-2.5 bg-white border border-theme-200 rounded-xl">
              <label className="flex items-center gap-2 text-xs font-bold text-theme-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={currentIsReorder}
                  onChange={(e) => setCurrentIsReorder(e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-theme-200 focus:ring-amber-500 cursor-pointer"
                />
                Ajukan Permintaan Order Ulang
              </label>
              
              {currentIsReorder && (
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    value={currentReorderQty}
                    onChange={(e) => setCurrentReorderQty(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-20 px-2 py-1 border border-theme-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    value={currentReorderReason}
                    onChange={(e) => setCurrentReorderReason(e.target.value)}
                    className="flex-1 px-2 py-1 border border-theme-200 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    placeholder="Alasan / Ket order ulang..."
                  />
                </div>
              )}
            </div>

            {/* Button: Add to List */}
            <button
              type="button"
              onClick={handleAddToArrivedItems}
              className="w-full flex items-center justify-center gap-1.5 bg-white hover:bg-theme-100 text-theme-800 border border-theme-300/80 py-2 px-3 rounded-xl text-xs font-bold transition-all active:scale-95 shadow-2xs"
            >
              <Plus className="w-4 h-4 text-theme-600" />
              <span>+ Masukkan ke Daftar Penerimaan</span>
            </button>
          </div>
          
          {/* Daftar Produk Terpilih */}
          <div className="pt-2 border-t border-theme-200">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-theme-600 uppercase tracking-wider">
                Daftar Barang Masuk ({arrivedItems.length})
              </h4>
              {arrivedItems.length > 1 && (
                <button
                  type="button"
                  onClick={() => setArrivedItems([])}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-medium transition-colors"
                >
                  Hapus Semua
                </button>
              )}
            </div>
            
            {arrivedItems.length > 0 ? (
              <div className={`mb-3 space-y-2 overflow-y-auto pr-1 scrollbar-thin ${isFormFullscreen ? 'max-h-[40vh]' : 'max-h-52'}`}>
                {arrivedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-theme-50 p-2 rounded-xl border border-theme-200 text-xs hover:border-theme-300 transition-colors">
                    <div className="flex-1 truncate pr-2">
                      <div className="font-bold text-theme-900 truncate mb-1">{item.productName}</div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          value={item.arrivedQty || ''} 
                          onChange={(e) => {
                            const newItems = [...arrivedItems];
                            const idx = newItems.findIndex(i => i.id === item.id);
                            if (idx > -1) {
                              newItems[idx].arrivedQty = e.target.value ? Number(e.target.value) : undefined;
                              setArrivedItems(newItems);
                            }
                          }}
                          className="w-16 px-2 py-1 text-xs font-bold border border-theme-200 rounded bg-white"
                        />
                        <input 
                          type="text" 
                          placeholder="Keterangan" 
                          value={item.notes || ''} 
                          onChange={(e) => {
                            const newItems = [...arrivedItems];
                            const idx = newItems.findIndex(i => i.id === item.id);
                            if (idx > -1) {
                              newItems[idx].notes = e.target.value;
                              setArrivedItems(newItems);
                            }
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-theme-200 rounded bg-white"
                        />
                      </div>
                    </div>
                    <button 
                      onClick={() => handleRemoveItem(item.id)} 
                      className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-theme-500 py-3 bg-theme-50/70 rounded-xl border border-theme-200 border-dashed mb-3">
                Belum ada produk dalam daftar. Tekan tombol <strong className="text-theme-700">"+ Masukkan ke Daftar Penerimaan"</strong> atau langsung tekan tombol Simpan di bawah.
              </div>
            )}
          </div>

          {/* Primary Save Button */}
          <button 
            onClick={handleSaveAllArrived}
            disabled={isSaving}
            className="group w-full flex items-center justify-center gap-2 bg-theme-500 hover:bg-theme-600 text-white px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm shadow-lg shadow-theme-500/20 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Menyimpan Data...</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                <span>
                  {arrivedItems.length > 0 
                    ? `Simpan Semua (${arrivedItems.length + ((currentProductId || currentSearchQuery.trim()) && currentArrivedQty ? 1 : 0)})`
                    : (currentProductId || currentSearchQuery.trim()) && currentArrivedQty
                      ? `Simpan Barang Datang`
                      : `Simpan Data Barang Datang`
                  }
                </span>
              </>
            )}
          </button>
          
          {products.length === 0 && (
            <p className="text-xs text-rose-500 mt-2 text-center">Belum ada produk di Master Data. Produk yang diketik baru akan didaftarkan otomatis.</p>
          )}
        </div>
        </>
        )}
      </div>

      {/* Recap List */}
      <div className={
        isListFullscreen
          ? "fixed inset-0 z-[100] bg-theme-50 p-4 sm:p-6 md:p-8 flex flex-col animate-in zoom-in-95 duration-200 shadow-2xl overflow-hidden"
          : cn(
              "flex-1 bg-white rounded-3xl border border-theme-200 shadow-xs overflow-hidden flex flex-col min-w-0 transition-all duration-300",
              mobileTab === 'list' ? "flex" : "hidden lg:flex"
            )
      }>
        {/* Header & Controls */}
        <div className="p-3.5 sm:p-5 border-b border-theme-200 bg-theme-50/50 flex flex-col gap-3.5 shrink-0">
          {/* Top row: Title, Total badge, View switch, Fullscreen */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-theme-100 text-theme-700 rounded-xl shadow-2xs">
                <PackageOpen className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-theme-900">List Barang Datang</h2>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-theme-100 text-theme-700">
                    {filteredArrivedData.length}
                  </span>
                </div>
                <p className="text-[11px] text-theme-600-text hidden sm:block">Daftar fisik barang yang diterima di gudang/toko</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* View Mode Toggle (Card vs Table) */}
              <div className="hidden sm:flex items-center bg-white border border-theme-200 rounded-xl p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setViewMode('auto')}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-semibold transition-all",
                    viewMode === 'auto' ? "bg-theme-100 text-theme-900 font-bold" : "text-theme-600-text hover:text-theme-900"
                  )}
                  title="Otomatis (Kartu di HP, Tabel di Layar Lebar)"
                >
                  Auto
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('table')}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1",
                    viewMode === 'table' ? "bg-theme-100 text-theme-900 font-bold" : "text-theme-600-text hover:text-theme-900"
                  )}
                  title="Tampilan Tabel"
                >
                  <TableIcon className="w-3.5 h-3.5" /> Tabel
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('cards')}
                  className={cn(
                    "px-2.5 py-1 text-xs rounded-lg font-semibold transition-all flex items-center gap-1",
                    viewMode === 'cards' ? "bg-theme-100 text-theme-900 font-bold" : "text-theme-600-text hover:text-theme-900"
                  )}
                  title="Tampilan Kartu"
                >
                  <LayoutGrid className="w-3.5 h-3.5" /> Kartu
                </button>
              </div>

              <button
                onClick={() => setIsListFullscreen(!isListFullscreen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-neutral-600 hover:text-theme-900 hover:bg-theme-100 rounded-xl transition-all active:scale-95 bg-white border border-theme-200 shadow-2xs text-xs font-semibold"
                title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
              >
                {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                <span className="hidden sm:inline">{isListFullscreen ? "Perkecil" : "Layar Penuh"}</span>
              </button>
            </div>
          </div>

          {/* Quick Stat Ribbon */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-2.5">
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-theme-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold text-theme-600-text uppercase tracking-wider">Total Transaksi</div>
              <div className="text-base sm:text-lg font-black text-theme-900 mt-0.5">{stats.totalCount} <span className="text-xs font-normal text-theme-500">kali</span></div>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-theme-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold text-theme-600-text uppercase tracking-wider">Total Qty Datang</div>
              <div className="text-base sm:text-lg font-black text-emerald-600 mt-0.5">+{stats.totalQty.toLocaleString('id-ID')} <span className="text-xs font-normal text-neutral-500">unit</span></div>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-theme-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold text-theme-600-text uppercase tracking-wider">Sales Linked</div>
              <div className="text-base sm:text-lg font-black text-theme-700 mt-0.5">{stats.linkedCount} <span className="text-xs font-normal text-theme-500">item</span></div>
            </div>
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-theme-200 shadow-2xs">
              <div className="text-[10px] sm:text-[11px] font-bold text-theme-600-text uppercase tracking-wider">Tanpa Report</div>
              <div className="text-base sm:text-lg font-black text-amber-600 mt-0.5">{stats.unlinkedCount} <span className="text-xs font-normal text-neutral-500">item</span></div>
            </div>
          </div>

          {/* Filter Bar: Quick Presets, Date, Search, Filter */}
          <div className="flex flex-col xl:flex-row gap-2.5 items-stretch xl:items-center justify-between pt-1">
            <div className="flex flex-wrap items-center gap-2">
              {/* Date Preset Chips */}
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5 max-w-full">
                {[
                  { id: 'today', label: 'Hari Ini' },
                  { id: '7days', label: '7 Hari' },
                  { id: '30days', label: '30 Hari' },
                  { id: 'thisMonth', label: 'Bulan Ini' }
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id as any)}
                    className={cn(
                      "px-2.5 py-1 rounded-xl text-xs font-semibold transition-all border whitespace-nowrap active:scale-95",
                      activePreset === p.id
                        ? "bg-theme-500 text-white border-theme-500 shadow-2xs"
                        : "bg-white text-theme-700 border-theme-200 hover:bg-theme-50"
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Inputs */}
              <div className="flex items-center gap-1.5 bg-white border border-theme-200 rounded-xl px-2.5 py-1 text-xs shadow-2xs">
                <CalendarIcon className="w-3.5 h-3.5 text-theme-500 shrink-0" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent outline-none text-theme-900 font-medium w-26 sm:w-28 text-xs"
                />
                <span className="text-theme-400">-</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent outline-none text-theme-900 font-medium w-26 sm:w-28 text-xs"
                />
              </div>
            </div>

            {/* Search, Filter & Action Group */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Search box */}
              <div className="relative flex-1 sm:w-48 xl:w-52">
                <Search className="w-3.5 h-3.5 text-theme-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={searchQueryList}
                  onChange={(e) => {
                    setSearchQueryList(e.target.value);
                    if (e.target.value.trim().length > 2) {
                      addSearchHistory('arrived_list', e.target.value.trim());
                    }
                  }}
                  className="w-full pl-8 pr-7 py-1.5 text-xs border border-theme-200 rounded-xl bg-white focus:border-theme-500 outline-none shadow-2xs"
                />
                {searchQueryList && (
                  <X 
                    className="w-3.5 h-3.5 text-theme-400 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer hover:text-rose-500" 
                    onClick={() => setSearchQueryList('')}
                  />
                )}
              </div>

              {/* Status select */}
              <div className="relative">
                <select
                  value={reportFilter}
                  onChange={(e) => setReportFilter(e.target.value as 'all' | 'linked' | 'unlinked')}
                  className="appearance-none pl-7 pr-7 py-1.5 text-xs border border-theme-200 rounded-xl bg-white focus:border-theme-500 outline-none text-theme-900 font-medium shadow-2xs"
                >
                  <option value="all">Semua Status</option>
                  <option value="linked">Sales Linked</option>
                  <option value="unlinked">Tanpa Report</option>
                </select>
                <Filter className="w-3.5 h-3.5 text-theme-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <ChevronDown className="w-3.5 h-3.5 text-theme-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              {/* Searchable Supplier Filter */}
              <div className="relative w-44 sm:w-52" ref={filterSupplierDropdownRef}>
                <div className="relative flex items-center w-full">
                  <Building2 className="w-3.5 h-3.5 text-theme-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={supplierFilterQuery}
                    onChange={(e) => {
                      setSupplierFilterQuery(e.target.value);
                      setFilterSupplier('');
                      setIsFilterSupplierDropdownOpen(true);
                    }}
                    onFocus={() => setIsFilterSupplierDropdownOpen(true)}
                    placeholder="Filter supplier..."
                    className={cn(
                      "w-full pl-7 pr-12 py-1.5 text-xs border rounded-xl bg-white outline-none shadow-2xs transition-all placeholder:text-neutral-400",
                      filterSupplier || supplierFilterQuery
                        ? "border-theme-500 ring-1 ring-theme-500/20 font-semibold text-theme-900"
                        : "border-theme-200 text-neutral-800 focus:border-theme-500"
                    )}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {(supplierFilterQuery || filterSupplier) && (
                      <X 
                        className="w-3.5 h-3.5 text-neutral-400 hover:text-rose-500 cursor-pointer transition-colors" 
                        onClick={() => {
                          setSupplierFilterQuery('');
                          setFilterSupplier('');
                        }}
                        title="Hapus filter supplier"
                      />
                    )}
                    <ChevronDown 
                      className={cn(
                        "w-3.5 h-3.5 text-neutral-400 cursor-pointer transition-transform shrink-0",
                        isFilterSupplierDropdownOpen ? "rotate-180 text-theme-600" : ""
                      )}
                      onClick={() => setIsFilterSupplierDropdownOpen(prev => !prev)}
                    />
                  </div>
                </div>

                {isFilterSupplierDropdownOpen && (
                  <div className="absolute left-0 z-50 mt-1 w-64 bg-white border border-theme-200 rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                    {filterSupplierHistory.length > 0 && (
                      <SearchHistoryChips
                        history={filterSupplierHistory}
                        onSelect={(term) => {
                          setSupplierFilterQuery(term);
                          setFilterSupplier('');
                          setIsFilterSupplierDropdownOpen(true);
                        }}
                        onClear={() => {
                          clearSearchHistory('arrived_filter_supplier');
                          setFilterSupplierHistory([]);
                        }}
                      />
                    )}

                    <div 
                      className={cn(
                        "px-3 py-2 hover:bg-theme-50 cursor-pointer text-xs transition-colors border-b border-theme-100 flex items-center justify-between",
                        !filterSupplier && !supplierFilterQuery ? "bg-theme-100 font-bold text-theme-900" : "text-neutral-700 font-medium"
                      )}
                      onClick={() => {
                        setFilterSupplier('');
                        setSupplierFilterQuery('');
                        setIsFilterSupplierDropdownOpen(false);
                      }}
                    >
                      <span>Semua Supplier</span>
                      {!filterSupplier && !supplierFilterQuery && <Check className="w-3.5 h-3.5 text-theme-600" />}
                    </div>

                    <div 
                      className={cn(
                        "px-3 py-2 hover:bg-theme-50 cursor-pointer text-xs transition-colors border-b border-theme-100 flex items-center justify-between",
                        filterSupplier === 'none' ? "bg-theme-100 font-bold text-theme-900" : "text-neutral-600 italic"
                      )}
                      onClick={() => {
                        setFilterSupplier('none');
                        setSupplierFilterQuery('Tanpa Supplier');
                        setIsFilterSupplierDropdownOpen(false);
                      }}
                    >
                      <span>Tanpa Supplier</span>
                      {filterSupplier === 'none' && <Check className="w-3.5 h-3.5 text-theme-600" />}
                    </div>

                    {filteredSuppliersForFilter.length === 0 ? (
                      <div className="p-3 text-xs text-neutral-400 text-center">
                        Tidak ditemukan supplier "{supplierFilterQuery}"
                      </div>
                    ) : (
                      filteredSuppliersForFilter.map(s => {
                        const isSelected = filterSupplier === s.id;
                        return (
                          <div 
                            key={s.id}
                            className={cn(
                              "px-3 py-2 hover:bg-theme-50 cursor-pointer text-xs transition-colors border-b border-theme-50 last:border-0 flex items-center justify-between",
                              isSelected ? "bg-theme-100 font-bold text-theme-900" : "text-neutral-700"
                            )}
                            onClick={() => {
                              setFilterSupplier(s.id);
                              setSupplierFilterQuery(s.name);
                              const updated = addSearchHistory('arrived_filter_supplier', s.name);
                              setFilterSupplierHistory(updated);
                              setIsFilterSupplierDropdownOpen(false);
                            }}
                          >
                            <span className="truncate">{s.name}</span>
                            {isSelected && <Check className="w-3.5 h-3.5 text-theme-600 shrink-0 ml-1.5" />}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Export & Import Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => exportArrivedToExcel(filteredArrivedData, `Barang_Datang_${format(new Date(), 'yyyyMMdd')}`)}
                  disabled={filteredArrivedData.length === 0}
                  className="flex items-center gap-1.5 bg-neutral-900 text-white hover:bg-neutral-800 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs shadow-2xs active:scale-95"
                  title="Export ke File Excel (.xlsx)"
                >
                  <Download className="w-3.5 h-3.5" /> <span>Excel</span>
                </button>
                <button
                  onClick={() => exportArrivedToTxt(filteredArrivedData, `Barang_Datang_${format(new Date(), 'yyyyMMdd')}`)}
                  disabled={filteredArrivedData.length === 0}
                  className="hidden sm:flex items-center gap-1.5 bg-white text-neutral-700 border border-neutral-200 hover:bg-neutral-50 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-medium transition-all text-xs shadow-2xs active:scale-95"
                  title="Export ke File TXT"
                >
                  <Download className="w-3.5 h-3.5" /> <span>TXT</span>
                </button>
                <button
                  onClick={downloadArrivedTemplate}
                  className="hidden md:flex items-center gap-1.5 bg-white text-emerald-700 border border-emerald-200 hover:bg-emerald-50 px-2.5 py-1.5 rounded-xl font-medium transition-all text-xs shadow-2xs active:scale-95"
                  title="Download Template Import Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> <span>Template</span>
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isImporting}
                  className="flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 px-2.5 py-1.5 rounded-xl font-bold transition-all text-xs shadow-2xs active:scale-95"
                  title="Import dari File Excel (.xlsx)"
                >
                  {isImporting ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                  <span>{isImporting ? 'Proses...' : 'Import'}</span>
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImportFileChange}
                  accept=".xlsx, .xls"
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Active Filters Summary Row */}
          {(filterSupplier || supplierFilterQuery || searchQueryList || reportFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-theme-200/60 text-xs">
              <span className="text-[11px] font-semibold text-theme-600-text">Filter aktif:</span>
              {(filterSupplier || supplierFilterQuery) && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] bg-theme-100 text-theme-800 font-bold border border-theme-200">
                  <Building2 className="w-3 h-3 text-theme-600" />
                  <span>
                    Supplier: {supplierFilterQuery || (suppliers.find(s => s.id === filterSupplier)?.name || (filterSupplier === 'none' ? 'Tanpa Supplier' : 'Supplier'))}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      setFilterSupplier('');
                      setSupplierFilterQuery('');
                    }}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Hapus filter supplier"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {searchQueryList && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] bg-theme-100 text-theme-800 font-bold border border-theme-200">
                  <Search className="w-3 h-3 text-theme-600" />
                  <span>"{searchQueryList}"</span>
                  <button 
                    type="button"
                    onClick={() => setSearchQueryList('')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Hapus pencarian produk"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {reportFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] bg-theme-100 text-theme-800 font-bold border border-theme-200">
                  <Filter className="w-3 h-3 text-theme-600" />
                  <span>{reportFilter === 'linked' ? 'Sales Linked' : 'Tanpa Report'}</span>
                  <button 
                    type="button"
                    onClick={() => setReportFilter('all')}
                    className="hover:text-rose-600 ml-0.5 cursor-pointer"
                    title="Reset filter status"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button
                type="button"
                onClick={() => {
                  setFilterSupplier('');
                  setSupplierFilterQuery('');
                  setSearchQueryList('');
                  setReportFilter('all');
                }}
                className="text-[11px] text-theme-600 hover:text-theme-900 font-bold underline ml-1 cursor-pointer"
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>

        {/* List Content: Responsive Cards + Table */}
        <div className={
          isListFullscreen
            ? "flex-1 overflow-auto bg-white rounded-2xl border border-theme-200 shadow-xs min-h-0"
            : "flex-1 overflow-auto"
        }>
          {filteredArrivedData.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-neutral-400 p-8 min-h-[300px]">
              <PackageOpen className="w-16 h-16 mb-3 opacity-20" />
              <p className="text-base font-bold text-neutral-600 text-center">Tidak ada data barang datang</p>
              <p className="text-xs text-neutral-400 text-center mt-0.5">
                {filterSupplier || supplierFilterQuery || searchQueryList || reportFilter !== 'all'
                  ? "Tidak ada data barang datang yang cocok dengan filter aktif."
                  : "Coba sesuaikan rentang tanggal atau kata kunci pencarian."}
              </p>
              {(filterSupplier || supplierFilterQuery || searchQueryList || reportFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setFilterSupplier('');
                    setSupplierFilterQuery('');
                    setSearchQueryList('');
                    setReportFilter('all');
                  }}
                  className="mt-3 px-3.5 py-1.5 text-xs font-bold text-theme-700 bg-theme-100 hover:bg-theme-200 rounded-xl transition-all cursor-pointer shadow-2xs"
                >
                  Reset Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* 1. MOBILE CARDS VIEW (Shown on Mobile / Small screens, or when viewMode is 'cards') */}
              <div className={cn(
                "p-3 sm:p-4 space-y-2.5",
                viewMode === 'table' ? "hidden" : viewMode === 'cards' ? "block" : "block md:hidden"
              )}>
                {filteredArrivedData.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.25) }}
                    className="bg-white rounded-2xl border border-theme-200 p-3 shadow-2xs hover:border-theme-300 transition-all"
                  >
                    {editingId === item.id ? (
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between border-b border-theme-100 pb-1.5">
                          <span className="font-bold text-xs text-theme-900">Edit: {item.productName}</span>
                          <span className="text-[10px] text-theme-500">{item.supplierName}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-theme-600 uppercase">Tanggal</label>
                            <input
                              type="date"
                              value={editDate}
                              onChange={(e) => setEditDate(e.target.value)}
                              className="w-full px-2 py-1.5 border border-theme-200 rounded-xl text-xs bg-theme-50 focus:bg-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-theme-600 uppercase">Qty Datang</label>
                            <input
                              type="number"
                              value={editArrivedQty}
                              onChange={(e) => setEditArrivedQty(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-2 py-1.5 border border-theme-200 rounded-xl text-xs bg-theme-50 focus:bg-white outline-none"
                              placeholder="Qty"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-theme-600 uppercase">Catatan</label>
                          <input
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-2 py-1.5 border border-theme-200 rounded-xl text-xs bg-theme-50 focus:bg-white outline-none"
                            placeholder="Catatan..."
                          />
                        </div>
                        <div className="flex justify-end gap-2 pt-1">
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1.5 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 rounded-xl transition-colors"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleSaveEdit}
                            className="px-4 py-1.5 text-xs font-bold text-white bg-theme-500 hover:bg-theme-600 rounded-xl shadow-2xs transition-colors flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Simpan
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-bold text-sm text-theme-900 leading-snug break-words">
                              {item.productName}
                            </h4>
                            <div 
                              className={cn(
                                "flex items-center gap-1 text-[11px] text-theme-600-text mt-0.5",
                                item.supplierId ? "cursor-pointer hover:text-theme-900 hover:underline" : ""
                              )}
                              onClick={() => {
                                if (item.supplierId) {
                                  setFilterSupplier(item.supplierId);
                                  setSupplierFilterQuery(item.supplierName);
                                }
                              }}
                              title={item.supplierId ? "Klik untuk memfilter barang dari supplier ini" : undefined}
                            >
                              <Building2 className="w-3 h-3 shrink-0 opacity-70" />
                              <span className="truncate">{item.supplierName || 'Tanpa Supplier'}</span>
                            </div>
                          </div>
                          <div className="shrink-0 flex flex-col items-end gap-1">
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 font-black text-xs rounded-lg border border-emerald-200 whitespace-nowrap">
                              +{item.arrivedQty || 0} {item.unit || 'pcs'}
                            </span>
                            {!item.isArrivedOnly ? (
                              <span className="px-1.5 py-0.5 bg-theme-100 text-theme-700 text-[9px] font-bold rounded uppercase tracking-wider">
                                Sales Linked
                              </span>
                            ) : (
                              <span className="px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[9px] font-medium rounded">
                                Hanya Datang
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-theme-100 text-xs text-theme-600-text">
                          <div className="flex items-center gap-2.5">
                            <span className="flex items-center gap-1 font-medium text-theme-800">
                              <CalendarIcon className="w-3 h-3 opacity-70 text-theme-500" />
                              {formatDateDisplay(item.date)}
                            </span>
                            {item.notes && (
                              <span className="flex items-center gap-1 max-w-[130px] truncate text-neutral-500" title={item.notes}>
                                <FileText className="w-3 h-3 shrink-0 opacity-70" />
                                <span className="truncate">{item.notes}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditClick(item)}
                              className="p-1.5 text-neutral-500 hover:text-theme-900 hover:bg-theme-100 rounded-lg transition-colors active:scale-95"
                              title="Edit Item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-neutral-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors active:scale-95"
                              title="Hapus Item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* 2. TABLE VIEW (Shown on Tablet & Desktop, or when viewMode is 'table') */}
              <div className={cn(
                "overflow-x-auto",
                viewMode === 'cards' ? "hidden" : viewMode === 'table' ? "block" : "hidden md:block"
              )}>
                <table className="w-full text-xs sm:text-sm text-left border-collapse">
                  <thead className="text-[11px] text-theme-600-text uppercase tracking-wider bg-theme-50 sticky top-0 z-10 shadow-2xs">
                    <tr>
                      <th className="px-4 py-3 font-bold border-b border-theme-200 whitespace-nowrap">Tanggal</th>
                      <th className="px-4 py-3 font-bold border-b border-theme-200 min-w-[180px]">Nama Barang</th>
                      <th className="px-4 py-3 font-bold border-b border-theme-200">Supplier</th>
                      <th className="px-4 py-3 font-bold border-b border-theme-200 text-center">Qty Datang</th>
                      <th className="px-4 py-3 font-bold border-b border-theme-200">Keterangan</th>
                      <th className="px-4 py-3 font-bold border-b border-theme-200 text-right whitespace-nowrap">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-theme-100">
                    {filteredArrivedData.map((item, i) => (
                      <motion.tr 
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(i * 0.02, 0.25) }}
                        key={item.id} 
                        className="hover:bg-theme-50/70 transition-colors"
                      >
                        {editingId === item.id ? (
                          <>
                            <td className="px-4 py-3">
                              <input 
                                type="date"
                                value={editDate}
                                onChange={(e) => setEditDate(e.target.value)}
                                className="w-full px-2 py-1 border border-theme-200 rounded-lg text-xs focus:border-theme-500 outline-none"
                              />
                            </td>
                            <td className="px-4 py-3 font-bold text-theme-900">
                              {item.productName}
                            </td>
                            <td className="px-4 py-3 text-theme-600-text">
                              {item.supplierName}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <input 
                                type="number"
                                value={editArrivedQty}
                                onChange={(e) => setEditArrivedQty(e.target.value ? Number(e.target.value) : '')}
                                className="w-20 px-2 py-1 border border-theme-200 rounded-lg text-xs font-bold text-center focus:border-theme-500 outline-none"
                                placeholder="Qty"
                              />
                            </td>
                            <td className="px-4 py-3">
                              <input 
                                type="text"
                                value={editNotes}
                                onChange={(e) => setEditNotes(e.target.value)}
                                className="w-full px-2 py-1 border border-theme-200 rounded-lg text-xs focus:border-theme-500 outline-none"
                                placeholder="Catatan..."
                              />
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button onClick={handleSaveEdit} className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Simpan">
                                  <Check className="w-4 h-4" />
                                </button>
                                <button onClick={handleCancelEdit} className="p-1.5 text-neutral-400 hover:bg-neutral-100 rounded-lg transition-colors" title="Batal">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-theme-800 font-medium">
                              {formatDateDisplay(item.date)}
                            </td>
                            <td className="px-4 py-3 font-bold text-theme-900">
                              <span>{item.productName}</span>
                              {!item.isArrivedOnly ? (
                                <span className="ml-2 px-1.5 py-0.5 bg-theme-100 text-theme-700 text-[10px] rounded uppercase tracking-wider font-bold inline-block">
                                  Sales Linked
                                </span>
                              ) : (
                                <span className="ml-2 px-1.5 py-0.5 bg-neutral-100 text-neutral-600 text-[10px] rounded font-medium inline-block">
                                  Hanya Datang
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-theme-600-text">
                              <span
                                className={cn(
                                  item.supplierId ? "cursor-pointer hover:text-theme-900 hover:underline inline-block" : ""
                                )}
                                onClick={() => {
                                  if (item.supplierId) {
                                    setFilterSupplier(item.supplierId);
                                    setSupplierFilterQuery(item.supplierName);
                                  }
                                }}
                                title={item.supplierId ? "Klik untuk memfilter barang dari supplier ini" : undefined}
                              >
                                {item.supplierName}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center whitespace-nowrap">
                              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-black text-xs inline-block">
                                +{item.arrivedQty || 0} {item.unit || 'pcs'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-theme-600-text">
                              {item.notes || '-'}
                            </td>
                            <td className="px-4 py-3 text-right whitespace-nowrap">
                              <div className="flex justify-end gap-1">
                                <button onClick={() => handleEditClick(item)} className="p-1.5 text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors" title="Edit">
                                  <Edit2 className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(item)} className="p-1.5 text-neutral-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Hapus">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </>
                        )}
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
      </div>

      {/* Progress Animation Modal for Excel Import */}
      <OperationProgressModal
        isOpen={isImporting}
        type="import"
        title="Mengimpor Barang Datang..."
        subtitle="Sinkronisasi data ke Daily Report..."
        current={importProgress.current}
        total={importProgress.total}
        currentItemName={importProgress.currentProduct}
        startTime={importProgress.startTime}
      />

      {/* Import Result Summary Modal */}
      <AnimatePresence>
        {importSummary.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col relative"
            >
              <button
                onClick={() => setImportSummary({ isOpen: false, total: 0, errors: [] })}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-neutral-900">Impor Berhasil Selesai</h3>
                  <p className="text-xs text-neutral-500">Data barang datang telah tersinkronisasi</p>
                </div>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 mb-4 text-sm text-emerald-900">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>{importSummary.total} Barang Datang Berhasil Diimpor</span>
                </div>
                <p className="text-xs text-emerald-700 mt-1">
                  Semua barang datang ini otomatis terceklis (Sudah Datang: ✓) pada tabel Daily Report.
                </p>
              </div>

              {importSummary.errors.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold text-amber-700 flex items-center gap-1 mb-2">
                    <AlertCircle className="w-3.5 h-3.5" /> Catatan Impor ({importSummary.errors.length}):
                  </h4>
                  <div className="max-h-32 overflow-y-auto space-y-1 p-2 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900">
                    {importSummary.errors.map((err, idx) => (
                      <div key={idx} className="leading-tight">• {err}</div>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={() => setImportSummary({ isOpen: false, total: 0, errors: [] })}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl font-bold text-sm transition-all active:scale-95 shadow-md"
              >
                Selesai & Tutup
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
