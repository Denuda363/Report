import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Plus, Trash2, Download, Upload, Filter, Calendar as CalendarIcon, Search, 
  ChevronDown, ChevronLeft, ChevronRight, Edit2, X, Copy, AlertTriangle, 
  Maximize2, Minimize2, Check, CheckCircle2, AlertCircle, RefreshCw,
  Table as TableIcon, LayoutGrid, Building2, Factory, PackageCheck, Package, 
  FileSpreadsheet, FileText, CheckSquare, Square
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { exportReportsToExcel, exportReportsToTxt, downloadDailyReportTemplate, parseDailyReportImport, formatExcelDate } from '../lib/excel';
import { exportReportsToPdf } from '../lib/pdf';
import { motion, AnimatePresence } from 'motion/react';
import { getSearchHistory, addSearchHistory, clearSearchHistory } from '../lib/searchHistory';
import { SearchHistoryChips } from './SearchHistoryChips';
import { cn } from '../lib/utils';
import { DailyReportStats } from './daily-report/DailyReportStats';
import { DailyReportCards } from './daily-report/DailyReportCards';
import { DailyReportTable } from './daily-report/DailyReportTable';
import { DailyReportToolbar } from './daily-report/DailyReportToolbar';
import { DailyReportForm, PendingReportItem } from './daily-report/DailyReportForm';
import { OperationProgressModal } from './common/OperationProgressModal';

export const DailyReport = () => {
  const { reports, products, suppliers, addReport, updateReport, deleteReport, deleteMultipleReports, deleteReportsByDateRange, updateProduct, addSupplier, addProduct } = useAppContext();

  // Mobile and responsive view mode
  const [mobileTab, setMobileTab] = useState<'list' | 'form'>('list');
  const [viewMode, setViewMode] = useState<'auto' | 'table' | 'cards'>('auto');
  const [isFormFullscreen, setIsFormFullscreen] = useState(false);

  // Form State
  const [editingReportId, setEditingReportId] = useState<string | null>(null);
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [quantity, setQuantity] = useState('');
  const [bottomStock, setBottomStock] = useState<number | ''>('');
  const [showBottomStockInput, setShowBottomStockInput] = useState(false);
  const [notes, setNotes] = useState('');
  const [isWarningStock, setIsWarningStock] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingReportItem[]>([]);
  const [saveSummary, setSaveSummary] = useState<{ isOpen: boolean; saved: any[]; failed: { item: any, reason: string }[]; }>({ isOpen: false, saved: [], failed: [] });
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [saveProgress, setSaveProgress] = useState<{
    current: number;
    total: number;
    currentItemName?: string;
    startTime?: number;
  }>({ current: 0, total: 0 });

  // Bulk Delete State
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [bulkStartDate, setBulkStartDate] = useState('');
  const [bulkEndDate, setBulkEndDate] = useState('');

  // Copy Yesterday State
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [selectedCopyIds, setSelectedCopyIds] = useState<string[]>([]);
  const [copySearchQuery, setCopySearchQuery] = useState('');
  const [copySummary, setCopySummary] = useState<{
    isOpen: boolean;
    copied: { productName: string }[];
    skipped: { productName: string, reason: string }[];
  }>({
    isOpen: false,
    copied: [],
    skipped: []
  });
  const [isCopying, setIsCopying] = useState(false);
  const [copyProgress, setCopyProgress] = useState<{
    current: number;
    total: number;
    currentItemName?: string;
    startTime?: number;
  }>({ current: 0, total: 0 });

  // Import State
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
    currentItemName?: string;
    startTime?: number;
  }>({ current: 0, total: 0 });

  // Form Collapse State
  const [isFormCollapsed, setIsFormCollapsed] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  
  // Searchable Select State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inlineDropdownRef = useRef<HTMLDivElement>(null);
  const lastSearchQueryRef = useRef('');
  const [productSearchHistory, setProductSearchHistory] = useState<string[]>(() => getSearchHistory('report_product'));
  const [supplierSearchHistory, setSupplierSearchHistory] = useState<string[]>(() => getSearchHistory('supplier'));

  // Filter State
  const [filterDate, setFilterDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [productFilterQuery, setProductFilterQuery] = useState('');
  const [bottomStockFilter, setBottomStockFilter] = useState<'all' | 'has' | 'none' | 'warning'>('all');
  const [arrivedFilter, setArrivedFilter] = useState<'all' | 'arrived' | 'not_arrived'>('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!window.confirm("Ingin mengimpor laporan dari file Excel ini? Pastikan format sesuai template.")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    try {
      const result = await parseDailyReportImport(file);
      if (result.errors.length > 0) {
        alert("Beberapa peringatan impor:\n" + result.errors.join('\n'));
      }

      const totalRows = result.reports.length;
      const startTime = Date.now();
      setImportProgress({
        current: 0,
        total: totalRows,
        currentItemName: 'Memulai proses impor...',
        startTime
      });

      let importCount = 0;
      for (let i = 0; i < result.reports.length; i++) {
        const row = result.reports[i];
        setImportProgress({
          current: i + 1,
          total: totalRows,
          currentItemName: row.productName,
          startTime
        });

        // Find or create supplier
        let supplierId = '';
        if (row.supplierName) {
          let supplier = suppliers.find(s => s.name.toLowerCase() === row.supplierName.toLowerCase());
          if (!supplier) {
            supplierId = await addSupplier({ name: row.supplierName });
          } else {
            supplierId = supplier.id;
          }
        }

        // Find or create product
        let prod = products.find(p => p.name.toLowerCase() === row.productName.toLowerCase());
        let finalProductId = '';
        if (!prod) {
          finalProductId = await addProduct({
            name: row.productName,
            supplierId: supplierId || '',
            unit: 'pcs',
            bottomStock: undefined
          });
        } else {
          finalProductId = prod.id;
          // Update product supplier if not set
          if (!prod.supplierId && supplierId) {
            await updateProduct({ ...prod, supplierId });
          }
        }

        // Check if report already exists or arrived on this date
        const normalizedRowDate = formatExcelDate(row.date) || row.date;
        const existingReport = reports.find(
          r => (formatExcelDate(r.date) || r.date) === normalizedRowDate && r.productId === finalProductId
        );
        const hasArrivedOnDate = reports.some(
          r => (formatExcelDate(r.date) || r.date) === normalizedRowDate && 
               r.productId === finalProductId && 
               r.isArrived
        );

        if (existingReport && existingReport.isArrived && (existingReport.quantity === 0 || existingReport.isArrivedOnly)) {
          await updateReport({
            ...existingReport,
            quantity: row.qty,
            notes: row.notes 
              ? (existingReport.notes && !existingReport.notes.includes(row.notes) ? `${existingReport.notes} | ${row.notes}` : existingReport.notes || row.notes)
              : existingReport.notes,
            isArrived: true,
            isArrivedOnly: false
          });
        } else {
          // Create report
          await addReport({
            date: row.date,
            productId: finalProductId,
            quantity: row.qty,
            notes: row.notes || '',
            isOrdered: false,
            isArrived: hasArrivedOnDate,
            isKosongPabrik: false,
            isReorder: false,
            isWarningStock: false,
            isArrivedOnly: false
          });
        }
        importCount++;

        // Pacing delay for smooth visual animation
        if (totalRows <= 100) {
          await new Promise(resolve => setTimeout(resolve, 30));
        }
      }

      await new Promise(resolve => setTimeout(resolve, 350));
      alert(`Berhasil mengimpor ${importCount} laporan data harian.`);
    } catch (err: any) {
      alert("Gagal mengimpor file: " + err.message);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterSupplier, productFilterQuery, bottomStockFilter, arrivedFilter, showDuplicatesOnly]);

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  // Handle click outside for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        (dropdownRef.current && dropdownRef.current.contains(target)) ||
        (inlineDropdownRef.current && inlineDropdownRef.current.contains(target))
      ) {
        // clicked inside one of them, do nothing
      } else {
        setIsDropdownOpen(false);
      }
      
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(target)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSuppliersForFilter = useMemo(() => {
    return suppliers.filter(s => (s.name || '').toLowerCase().includes(supplierFilterQuery.toLowerCase()));
  }, [suppliers, supplierFilterQuery]);

  const filteredProductsForSelect = useMemo(() => {
    return products.filter(p => (p.name || '').toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleProductSelect = (id: string, name: string) => {
    if (searchQuery.trim()) {
      lastSearchQueryRef.current = searchQuery.trim();
      const updated = addSearchHistory('report_product', searchQuery.trim());
      setProductSearchHistory(updated);
    }
    setProductId(id);
    setSearchQuery(name);
    const prod = products.find(p => p.id === id);
    setUnit(prod?.unit || 'pcs');
    if (prod && (prod.bottomStock === undefined || prod.bottomStock === null || prod.bottomStock === 0)) {
      setShowBottomStockInput(true);
      setBottomStock('');
    } else {
      setShowBottomStockInput(false);
      setBottomStock('');
    }
    setIsDropdownOpen(false);
    setErrorMsg(null);
  };

  
  const handleAddToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    if (!productId && !searchQuery.trim()) {
      setErrorMsg("Produk harus diisi.");
      return;
    }
    
    let finalProductId = productId;
    const prodName = finalProductId ? (products.find(p => p.id === finalProductId)?.name || searchQuery) : searchQuery.trim();
    
    const qty = quantity === '' ? 0 : Number(quantity);
    if (qty < 0) {
      setErrorMsg("Quantity tidak valid.");
      return;
    }

    const newItem: PendingReportItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: finalProductId,
      productName: prodName,
      unit,
      quantity,
      bottomStock,
      showBottomStockInput,
      notes,
      isWarningStock
    };
    
    setPendingItems([...pendingItems, newItem]);
    
    // reset form fields
    setQuantity('');
    setSearchQuery('');
    setProductId('');
    setUnit('pcs');
    setNotes('');
    setBottomStock('');
    setShowBottomStockInput(false);
    setIsWarningStock(false);
    setErrorMsg(null);
  };

  const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;
    setIsSavingAll(true);
    const startTime = Date.now();
    setSaveProgress({
      current: 0,
      total: pendingItems.length,
      currentItemName: pendingItems[0]?.productName || 'Mempersiapkan data...',
      startTime
    });
    
    const saved = [];
    const failed = [];
    const processedProductIds = new Set();
    
    for (let i = 0; i < pendingItems.length; i++) {
      const item = pendingItems[i];
      setSaveProgress({
        current: i + 1,
        total: pendingItems.length,
        currentItemName: item.productName,
        startTime
      });
      let finalProductId = item.productId;
      
      try {
        if (!finalProductId && item.productName) {
          let defaultSupplier = suppliers.find(s => s.name.toLowerCase() === 'tanpa supplier' || s.name.toLowerCase() === 'unknown supplier');
          let supplierId = defaultSupplier?.id;
          if (!supplierId) {
            supplierId = await addSupplier({ name: 'Tanpa Supplier' });
          }
          
          finalProductId = await addProduct({
            name: item.productName,
            supplierId,
            unit: item.unit || 'pcs',
            ...(item.showBottomStockInput && item.bottomStock !== '' ? { bottomStock: Number(item.bottomStock) } : {})
          });
        } else if (finalProductId) {
          const selectedProd = products.find(p => p.id === finalProductId);
          if (selectedProd) {
            let hasChanges = false;
            let updatedProd = { ...selectedProd };
            if (selectedProd.unit !== item.unit) {
              updatedProd.unit = item.unit || 'pcs';
              hasChanges = true;
            }
            if (item.showBottomStockInput && item.bottomStock !== '') {
              updatedProd.bottomStock = Number(item.bottomStock);
              hasChanges = true;
            }
            if (hasChanges) {
              await updateProduct(updatedProd);
            }
          }
        }
        
        
        if (processedProductIds.has(finalProductId)) {
          failed.push({ item, reason: "Data ganda (duplikat di dalam list input)." });
          continue;
        }

        const p = products.find(prod => prod.id === finalProductId);
        const normalizedDate = formatExcelDate(date) || date;

        const duplicateReport = reports.find(
          r => (formatExcelDate(r.date) || r.date) === normalizedDate && r.productId === finalProductId
        );
        const hasArrivedOnDate = reports.some(
          r => (formatExcelDate(r.date) || r.date) === normalizedDate && 
               r.productId === finalProductId && 
               r.isArrived
        );
        
        if (duplicateReport) {
          if (duplicateReport.isArrived || duplicateReport.quantity === 0 || duplicateReport.isArrivedOnly) {
            // Sudah tercatat datang di Barang Datang atau placeholder, update dengan kuantitas harian dan pertahankan status datang
            const qty = item.quantity === '' ? 0 : Number(item.quantity);
            if (qty < 0) {
              failed.push({ item, reason: "Quantity minus tidak diizinkan." });
              continue;
            }
            await updateReport({
              ...duplicateReport,
              quantity: qty,
              notes: item.notes 
                ? (duplicateReport.notes && !duplicateReport.notes.includes(item.notes) 
                    ? `${duplicateReport.notes} | ${item.notes}` 
                    : duplicateReport.notes || item.notes) 
                : duplicateReport.notes,
              isWarningStock: item.isWarningStock,
              isKosongPabrik: p?.isKosongPabrik || false,
              isArrived: duplicateReport.isArrived || hasArrivedOnDate,
              isArrivedOnly: false
            });
            saved.push(item);
            processedProductIds.add(finalProductId);
            continue;
          }
          failed.push({ item, reason: "Data ganda (sudah ada di laporan sebelumnya)." });
          continue;
        }
        processedProductIds.add(finalProductId);
        
        const qty = item.quantity === '' ? 0 : Number(item.quantity);
        if (qty < 0) {
          failed.push({ item, reason: "Quantity minus tidak diizinkan." });
          continue;
        }
        
        await addReport({
          date,
          productId: finalProductId,
          quantity: qty,
          notes: item.notes || undefined,
          isWarningStock: item.isWarningStock,
          isKosongPabrik: p?.isKosongPabrik || false,
          isArrived: hasArrivedOnDate,
          arrivedAt: hasArrivedOnDate ? Date.now() : undefined
        });
        
        saved.push(item);
      } catch (e: any) {
        failed.push({ item, reason: e.message || "Gagal menyimpan data." });
      }

      // Smooth animation pacing so user can see progress and time estimate
      await new Promise(resolve => setTimeout(resolve, 150));
    }
    
    // Short pause for 100% completion feel
    await new Promise(resolve => setTimeout(resolve, 350));
    setSaveSummary({ isOpen: true, saved, failed });
    setPendingItems([]);
    setIsSavingAll(false);
    if (saved.length > 0) {
      setMobileTab('list');
    }
  };

  const handleAddReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;

    let finalProductId = productId;
    let autoNotes = '';

    if (!finalProductId && searchQuery.trim()) {
      // Auto-add new product
      let defaultSupplier = suppliers.find(s => s.name.toLowerCase() === 'tanpa supplier' || s.name.toLowerCase() === 'unknown supplier');
      let supplierId = defaultSupplier?.id;
      if (!supplierId) {
        supplierId = await addSupplier({ name: 'Tanpa Supplier' });
      }
      
      finalProductId = await addProduct({
        name: searchQuery.trim(),
        supplierId,
        unit: unit || 'pcs',
        ...(showBottomStockInput && bottomStock !== '' ? { bottomStock: Number(bottomStock) } : {})
      });
    } else if (finalProductId) {
      // Update existing product unit or bottom stock if changed
      const selectedProd = products.find(p => p.id === finalProductId);
      if (selectedProd) {
        let hasChanges = false;
        let updatedProd = { ...selectedProd };

        if (selectedProd.unit !== unit) {
          updatedProd.unit = unit || 'pcs';
          hasChanges = true;
        }

        if (showBottomStockInput && bottomStock !== '') {
          updatedProd.bottomStock = Number(bottomStock);
          hasChanges = true;
        }

        if (hasChanges) {
          await updateProduct(updatedProd);
        }
      }
    }

    if (!finalProductId) return;

    const selectedProd = products.find(p => p.id === finalProductId) || { name: searchQuery.trim() };

    const qty = quantity === '' ? 0 : Number(quantity);
    if (qty < 0) return;

    const normalizedDate = formatExcelDate(date) || date;
    const duplicateReport = reports.find(
      r => (formatExcelDate(r.date) || r.date) === normalizedDate && r.productId === finalProductId && r.id !== editingReportId
    );
    const hasArrivedOnDate = reports.some(
      r => (formatExcelDate(r.date) || r.date) === normalizedDate && 
           r.productId === finalProductId && 
           r.isArrived
    );

    if (duplicateReport) {
      // Jika duplicate adalah record placeholder barang datang (qty 0 atau isArrivedOnly), update langsung tanpa konfirmasi
      if (duplicateReport.isArrived && (duplicateReport.quantity === 0 || duplicateReport.isArrivedOnly)) {
        let combinedNotes = notes.trim();
        if (autoNotes) {
          combinedNotes = combinedNotes ? `${combinedNotes} - ${autoNotes}` : autoNotes;
        }
        await updateReport({
          ...duplicateReport,
          quantity: qty,
          notes: combinedNotes 
            ? (duplicateReport.notes && !duplicateReport.notes.includes(combinedNotes)
                ? `${duplicateReport.notes} | ${combinedNotes}`
                : duplicateReport.notes || combinedNotes)
            : duplicateReport.notes,
          isWarningStock,
          isKosongPabrik: products.find(prod => prod.id === finalProductId)?.isKosongPabrik || duplicateReport.isKosongPabrik,
          isArrived: true,
          isArrivedOnly: false
        });
        setQuantity('');
        setSearchQuery('');
        setProductId('');
        setUnit('pcs');
        setNotes('');
        setBottomStock('');
        setShowBottomStockInput(false);
        setIsWarningStock(false);
        setMobileTab('list');
        return;
      }

      if (window.confirm(`Produk "${selectedProd.name}" sudah ada pada tanggal ${date} dengan Qty: ${duplicateReport.quantity}. Apakah Anda ingin mengupdate qty menjadi ${qty}?`)) {
        let combinedNotes = notes.trim();
        if (autoNotes) {
          combinedNotes = combinedNotes ? `${combinedNotes} - ${autoNotes}` : autoNotes;
        }
        await updateReport({
          ...duplicateReport,
          quantity: qty,
          notes: combinedNotes || duplicateReport.notes,
          isWarningStock,
          isKosongPabrik: products.find(prod => prod.id === finalProductId)?.isKosongPabrik || duplicateReport.isKosongPabrik,
          isArrived: duplicateReport.isArrived || hasArrivedOnDate,
          isArrivedOnly: false
        });
        setQuantity('');
        setSearchQuery('');
        setProductId('');
        setUnit('pcs');
        setNotes('');
        setBottomStock('');
        setShowBottomStockInput(false);
        setIsWarningStock(false);
      }
      return;
    }

    setErrorMsg(null);

    let combinedNotes = notes.trim();
    if (autoNotes) {
      combinedNotes = combinedNotes ? `${combinedNotes} - ${autoNotes}` : autoNotes;
    }

    if (editingReportId) {
      const existingReport = reports.find(r => r.id === editingReportId);
      updateReport({
        ...(existingReport || {}),
        id: editingReportId,
        date,
        productId: finalProductId,
        quantity: qty,
        notes: combinedNotes || undefined,
        isWarningStock
      });
      setEditingReportId(null);
      setMobileTab('list');
    } else {
      const p = products.find(prod => prod.id === finalProductId);
      addReport({
        date,
        productId: finalProductId,
        quantity: qty,
        notes: combinedNotes || undefined,
        isWarningStock,
        isKosongPabrik: p?.isKosongPabrik || false,
        isArrived: hasArrivedOnDate,
        arrivedAt: hasArrivedOnDate ? Date.now() : undefined
      });
      setMobileTab('list');
    }

    // Reset qty, keep date and product for faster multi-entry
    setQuantity('');
    setSearchQuery('');
    setProductId('');
    setUnit('pcs');
    setNotes('');
    setBottomStock('');
    setShowBottomStockInput(false);
    setIsWarningStock(false);
  };

  const handleEdit = (r: typeof reports[0]) => {
    setEditingReportId(r.id);
    setIsFormCollapsed(false);
    setMobileTab('form');
    setDate(r.date);
    setProductId(r.productId);
    const prod = products.find(p => p.id === r.productId);
    setSearchQuery(prod ? prod.name : '');
    setUnit(prod?.unit || 'pcs');

    if (prod && (prod.bottomStock === undefined || prod.bottomStock === null || prod.bottomStock === 0)) {
      setShowBottomStockInput(true);
      setBottomStock('');
    } else {
      setShowBottomStockInput(false);
      setBottomStock('');
    }

    setQuantity(r.quantity.toString());
    setNotes(r.notes || '');
    setIsWarningStock(!!r.isWarningStock);
  };

  const cancelEdit = () => {
    setEditingReportId(null);
    setMobileTab('list');
    setQuantity('');
    setSearchQuery('');
    setProductId('');
    setUnit('pcs');
    setNotes('');
    setBottomStock('');
    setShowBottomStockInput(false);
    setIsWarningStock(false);
    setDate(format(new Date(), 'yyyy-MM-dd'));
    setErrorMsg(null);
  };

  const handleExportExcel = () => {
    exportReportsToExcel(reportsForExport, products, suppliers, `Report_${format(new Date(), 'yyyyMMdd')}`);
  };

  const handleExportTxt = () => {
    exportReportsToTxt(reportsForExport, products, suppliers, `Report_${format(new Date(), 'yyyyMMdd')}`);
  };

  const handleKosongPabrikChange = async (r: typeof reports[0], checked: boolean) => {
    await updateReport({ ...r, isKosongPabrik: checked });
    const product = products.find(p => p.id === r.productId);
    if (product) {
      await updateProduct({
        ...product,
        isKosongPabrik: checked,
        kosongPabrikDate: checked ? Date.now() : undefined
      });
    }
  };

  const handleExportPdf = () => {
    exportReportsToPdf(reportsForExport, products, suppliers, `Report_${format(new Date(), 'yyyyMMdd')}`);
  };

  const handleBulkDelete = async () => {
    if (!bulkStartDate || !bulkEndDate) {
      alert("Please select both start and end dates.");
      return;
    }
    if (bulkStartDate > bulkEndDate) {
      alert("Start date cannot be after end date.");
      return;
    }
    const confirmMessage = `Are you sure you want to delete ALL records from ${bulkStartDate} to ${bulkEndDate}? This action cannot be undone.`;
    if (window.confirm(confirmMessage)) {
      await deleteReportsByDateRange(bulkStartDate, bulkEndDate);
      setIsBulkDeleteModalOpen(false);
      setBulkStartDate('');
      setBulkEndDate('');
    }
  };

  const handleDeleteAllDuplicates = async () => {
    if (!showDuplicatesOnly) return;
    
    // Group duplicates
    const groups: Record<string, string[]> = {};
    filteredReports.forEach(r => {
      const key = `${r.date}_${r.productId}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r.id);
    });

    // Identify IDs to delete (keep the first one in each group)
    const idsToDelete: string[] = [];
    Object.values(groups).forEach(ids => {
      if (ids.length > 1) {
        // Keep the first (newest, according to our sort) and delete the rest
        idsToDelete.push(...ids.slice(1));
      }
    });

    if (idsToDelete.length === 0) {
      alert("Tidak ada data ganda untuk dihapus.");
      return;
    }

    if (window.confirm(`Apakah Anda yakin ingin menghapus ${idsToDelete.length} data ganda? Tindakan ini tidak dapat dibatalkan.`)) {
      await deleteMultipleReports(idsToDelete);
      alert(`Berhasil menghapus ${idsToDelete.length} data ganda.`);
      setShowDuplicatesOnly(false); // turn off duplicate mode after clearing
    }
  };

  const todayDate = date; // Use the currently selected date in the form as the target date

  const yesterdayDate = useMemo(() => {
    const dates = [...new Set(reports.map(r => r.date))].sort().reverse();
    return dates.find(d => d < todayDate) || format(subDays(new Date(todayDate), 1), 'yyyy-MM-dd');
  }, [reports, todayDate]);

  const yesterdayReports = useMemo(() => {
    return reports.filter(r => r.date === yesterdayDate && !r.isArrivedOnly);
  }, [reports, yesterdayDate]);

  const openCopyModal = () => {
    if (yesterdayReports.length === 0) {
      alert("Tidak ada data report kemarin.");
      return;
    }
    const validReports = yesterdayReports.filter(r => !(r.isArrived && !r.isReorder));
    setSelectedCopyIds(validReports.map(r => r.id));
    setCopySearchQuery('');
    setIsCopyModalOpen(true);
  };

  const handleCopyYesterday = async () => {
    const reportsToCopy = yesterdayReports.filter(r => (selectedCopyIds || []).includes(r.id));
    
    if (reportsToCopy.length === 0) return;

    const startTime = Date.now();
    setIsCopyModalOpen(false); // Close selection modal
    setIsCopying(true); // Open progress modal
    setCopyProgress({
      current: 0,
      total: reportsToCopy.length,
      currentItemName: 'Memulai penyalinan data...',
      startTime
    });

    const copied: { productName: string }[] = [];
    const skipped: { productName: string, reason: string }[] = [];

    for (let i = 0; i < reportsToCopy.length; i++) {
      const r = reportsToCopy[i];
      const product = products.find(p => p.id === r.productId);
      const productName = product?.name || 'Unknown Product';

      setCopyProgress({
        current: i + 1,
        total: reportsToCopy.length,
        currentItemName: productName,
        startTime
      });

      if (r.isArrived && !r.isReorder) {
        skipped.push({ productName, reason: 'Barang sudah datang' });
      } else {
        const normalizedToday = formatExcelDate(todayDate) || todayDate;
        const existingToday = reports.find(
          tr => (formatExcelDate(tr.date) || tr.date) === normalizedToday && tr.productId === r.productId
        );
        const hasArrivedToday = reports.some(
          tr => (formatExcelDate(tr.date) || tr.date) === normalizedToday && tr.productId === r.productId && tr.isArrived
        );
        
        if (existingToday && existingToday.isArrived && (existingToday.quantity === 0 || existingToday.isArrivedOnly)) {
          try {
            await updateReport({
              ...existingToday,
              quantity: r.quantity,
              isOrdered: r.isOrdered,
              isArrived: true,
              isArrivedOnly: false,
              isKosongPabrik: r.isKosongPabrik,
              isReorder: (existingToday.isReorder || r.isReorder) || false,
              reorderQty: existingToday.reorderQty || r.reorderQty,
              reorderReason: existingToday.reorderReason || r.reorderReason
            });
            copied.push({ productName });
          } catch (error) {
            skipped.push({ productName, reason: 'Gagal memperbarui ke database' });
          }
        } else if (!existingToday) {
          try {
            await addReport({
              date: todayDate,
              productId: r.productId,
              quantity: r.quantity,
              isOrdered: r.isOrdered,
              isArrived: hasArrivedToday || ((r.isArrived && r.isReorder) ? true : false),
              isKosongPabrik: r.isKosongPabrik,
              isReorder: (r.isArrived && r.isReorder) ? true : r.isReorder,
              reorderQty: r.reorderQty,
              reorderReason: r.reorderReason,
            });
            copied.push({ productName });
          } catch (error) {
            skipped.push({ productName, reason: 'Gagal menyimpan ke database' });
          }
        } else {
          skipped.push({ productName, reason: 'Sudah ada di laporan hari ini' });
        }
      }
      // Artificial delay for cool animation
      await new Promise(resolve => setTimeout(resolve, 250));
    }
    
    // Slight pause at 100%
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setIsCopying(false);
    setCopySummary({
      isOpen: true,
      copied,
      skipped
    });
  };

  const toggleCopySelection = (id: string) => {
    setSelectedCopyIds(prev => 
      prev.includes(id) ? prev.filter(copyId => copyId !== id) : [...prev, id]
    );
  };

  const filteredYesterdayReports = useMemo(() => {
    if (!copySearchQuery.trim()) return yesterdayReports;
    const query = copySearchQuery.toLowerCase();
    return yesterdayReports.filter(r => {
      const product = products.find(p => p.id === r.productId);
      return (product?.name || '').toLowerCase().includes(query);
    });
  }, [yesterdayReports, products, copySearchQuery]);

  // Filter reports including arrived only (for export)
  const reportsForExport = useMemo(() => {
    // Map of arrived products per date: key is `${formatExcelDate(date)}_${productId}`
    const arrivedProductDateMap = new Map<string, typeof reports[0]>();
    reports.forEach(r => {
      if (r.isArrived) {
        const d = formatExcelDate(r.date) || r.date;
        const key = `${d}_${r.productId}`;
        if (!arrivedProductDateMap.has(key)) {
          arrivedProductDateMap.set(key, r);
        }
      }
    });

    // Check if there are reports where one is an arrived placeholder (quantity === 0)
    // and one is a real sales report (quantity > 0) on the same date
    const hasSalesMap = new Set<string>();
    reports.forEach(r => {
      if (r.quantity > 0 && !r.isArrivedOnly) {
        const d = formatExcelDate(r.date) || r.date;
        hasSalesMap.add(`${d}_${r.productId}`);
      }
    });

    let result = reports.map(r => {
      const d = formatExcelDate(r.date) || r.date;
      const key = `${d}_${r.productId}`;
      const arrivedEntry = arrivedProductDateMap.get(key);

      // If item arrived on this date, ensure isArrived is true
      if (!r.isArrived && arrivedEntry) {
        return {
          ...r,
          isArrived: true,
          arrivedAt: arrivedEntry.arrivedAt || r.arrivedAt,
          arrivedQty: arrivedEntry.arrivedQty || r.arrivedQty,
          arrivedSupplierId: arrivedEntry.arrivedSupplierId || r.arrivedSupplierId
        };
      }
      return r;
    }).filter(r => {
      const d = formatExcelDate(r.date) || r.date;
      const key = `${d}_${r.productId}`;

      // If this report is an arrived placeholder with qty 0 or isArrivedOnly, but a real sales report exists for this product on this date,
      // hide the placeholder to avoid cluttering with a duplicate 0 qty row!
      if ((r.quantity === 0 || r.isArrivedOnly) && hasSalesMap.has(key)) {
        return false;
      }

      let matchDate = true;
      let matchSupplier = true;
      let matchProduct = true;
      let matchArrived = true;

      if (filterDate) {
        matchDate = (formatExcelDate(r.date) || r.date) === (formatExcelDate(filterDate) || filterDate);
      }
      
      const product = products.find(p => p.id === r.productId);

      if (filterSupplier) {
        matchSupplier = product?.supplierId === filterSupplier || (product?.alternativeSupplierIds || []).includes(filterSupplier);
      }
      
      if (productFilterQuery) {
        matchProduct = !!product && (product?.name || '').toLowerCase().includes(productFilterQuery.toLowerCase());
      }

      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = product?.bottomStock !== undefined && product?.bottomStock !== null && product.bottomStock > 0;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = product?.bottomStock === undefined || product?.bottomStock === null || product.bottomStock === 0;
      } else if (bottomStockFilter === 'warning') {
        matchBottomStock = !!r.isWarningStock;
      }
      
      if (arrivedFilter === 'arrived') {
        matchArrived = !!r.isArrived;
      } else if (arrivedFilter === 'not_arrived') {
        matchArrived = !r.isArrived;
      }

      return matchDate && matchSupplier && matchProduct && matchBottomStock && matchArrived;
    });

    if (showDuplicatesOnly) {
      const counts: Record<string, number> = {};
      result.forEach(r => {
        const d = formatExcelDate(r.date) || r.date;
        const key = `${d}_${r.productId}`;
        counts[key] = (counts[key] || 0) + 1;
      });
      result = result.filter(r => {
        const d = formatExcelDate(r.date) || r.date;
        const key = `${d}_${r.productId}`;
        return counts[key] > 1;
      });
    }

    return result.sort((a, b) => {
      const dA = formatExcelDate(a.date) || a.date;
      const dB = formatExcelDate(b.date) || b.date;
      if (dA !== dB) return new Date(dB).getTime() - new Date(dA).getTime();
      return (b.createdAt || 0) - (a.createdAt || 0);
    });
  }, [reports, filterDate, filterSupplier, productFilterQuery, products, bottomStockFilter, arrivedFilter, showDuplicatesOnly]);

  // Filter reports for display
  const filteredReports = useMemo(() => {
    return reportsForExport.filter(r => !r.isArrivedOnly || r.isArrived);
  }, [reportsForExport]);

  const totalFilteredValue = filteredReports.reduce((sum, r) => sum + r.quantity, 0);

  const paginatedReports = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredReports.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredReports, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage) || 1;

  const stats = useMemo(() => {
    const totalCount = filteredReports.length;
    const totalVolume = filteredReports.reduce((sum, r) => sum + (r.quantity || 0), 0);
    const orderedCount = filteredReports.filter(r => r.isOrdered).length;
    const arrivedCount = filteredReports.filter(r => r.isArrived).length;
    const kosongPabrikCount = filteredReports.filter(r => r.isKosongPabrik).length;
    const warningCount = filteredReports.filter(r => r.isWarningStock).length;
    return { totalCount, totalVolume, orderedCount, arrivedCount, kosongPabrikCount, warningCount };
  }, [filteredReports]);

  const setDatePreset = (preset: 'all' | 'today' | 'yesterday') => {
    if (preset === 'all') {
      setFilterDate('');
    } else if (preset === 'today') {
      setFilterDate(format(new Date(), 'yyyy-MM-dd'));
    } else if (preset === 'yesterday') {
      setFilterDate(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
    }
  };

  const activePreset = useMemo(() => {
    if (!filterDate) return 'all';
    const today = format(new Date(), 'yyyy-MM-dd');
    if (filterDate === today) return 'today';
    const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
    if (filterDate === yesterday) return 'yesterday';
    return 'custom';
  }, [filterDate]);

  const hasActiveFilters = !!(filterDate || filterSupplier || supplierFilterQuery || productFilterQuery || bottomStockFilter !== 'all' || arrivedFilter !== 'all' || showDuplicatesOnly);

  const resetAllFilters = () => {
    setFilterDate('');
    setFilterSupplier('');
    setSupplierFilterQuery('');
    setProductFilterQuery('');
    setBottomStockFilter('all');
    setArrivedFilter('all');
    setShowDuplicatesOnly(false);
  };

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Mobile Tab Switcher */}
      <div className="lg:hidden flex items-center bg-white p-1 rounded-2xl border border-theme-200 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('list')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2",
            mobileTab === 'list'
              ? "bg-theme-500 text-white shadow-xs"
              : "text-theme-600-text hover:text-theme-900"
          )}
        >
          <FileText className="w-4 h-4" />
          <span>Daftar Report</span>
          <span className={cn(
            "px-1.5 py-0.5 rounded-full text-[10px]",
            mobileTab === 'list' ? "bg-white/20 text-white" : "bg-theme-100 text-theme-800"
          )}>
            {filteredReports.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMobileTab('form')}
          className={cn(
            "flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2",
            mobileTab === 'form'
              ? "bg-theme-500 text-white shadow-xs"
              : "text-theme-600-text hover:text-theme-900"
          )}
        >
          <Plus className="w-4 h-4" />
          <span>{editingReportId ? 'Edit Record' : '+ Input Sales'}</span>
          {pendingItems.length > 0 && (
            <span className={cn(
              "px-1.5 py-0.5 rounded-full text-[10px]",
              mobileTab === 'form' ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800 font-bold"
            )}>
              {pendingItems.length}
            </span>
          )}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-5 h-full items-start">
        {/* Input Form */}
        <DailyReportForm
          editingReportId={editingReportId}
          date={date}
          setDate={setDate}
          productId={productId}
          setProductId={setProductId}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          quantity={quantity}
          setQuantity={setQuantity}
          unit={unit}
          setUnit={setUnit}
          bottomStock={bottomStock}
          setBottomStock={setBottomStock}
          showBottomStockInput={showBottomStockInput}
          setShowBottomStockInput={setShowBottomStockInput}
          notes={notes}
          setNotes={setNotes}
          isWarningStock={isWarningStock}
          setIsWarningStock={setIsWarningStock}
          errorMsg={errorMsg}
          setErrorMsg={setErrorMsg}
          products={products}
          suppliers={suppliers}
          reports={reports}
          pendingItems={pendingItems}
          setPendingItems={setPendingItems}
          isSavingAll={isSavingAll}
          onSaveAll={handleSaveAll}
          onAddReport={handleAddReport}
          onAddToList={handleAddToList}
          onCancelEdit={cancelEdit}
          isFormCollapsed={isFormCollapsed}
          setIsFormCollapsed={setIsFormCollapsed}
          isFormFullscreen={isFormFullscreen}
          setIsFormFullscreen={setIsFormFullscreen}
          mobileTab={mobileTab}
          setMobileTab={setMobileTab}
          productSearchHistory={productSearchHistory}
          setProductSearchHistory={setProductSearchHistory}
        />

      {/* Reports Data Container */}
      <div className={isFullScreen 
        ? "fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden" 
        : cn(
            "flex-1 bg-white rounded-3xl border border-theme-200 shadow-xs flex flex-col overflow-hidden min-h-[500px] transition-all",
            mobileTab === 'list' ? "w-full flex" : "hidden lg:flex"
          )
      }>
        {/* Header Ribbon with Title, View Mode Switcher and Fullscreen */}
        <div className="px-4 py-3 border-b border-theme-200 bg-theme-50/50 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-theme-200/70 flex items-center justify-center text-theme-800">
              <TableIcon className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-theme-900 text-sm sm:text-base leading-tight">
                Data Laporan Sales
              </h3>
              <p className="text-[11px] text-theme-500 font-medium">
                {filteredReports.length} transaksi ditemukan
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            {/* View Mode Toggle (Auto / Table / Cards) */}
            <div className="flex items-center bg-white border border-theme-200 p-1 rounded-xl shadow-2xs text-xs">
              <button
                type="button"
                onClick={() => setViewMode('auto')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition-all",
                  viewMode === 'auto'
                    ? "bg-theme-500 text-white shadow-xs font-bold"
                    : "text-theme-600-text hover:text-theme-900"
                )}
                title="Tampilan otomatis (kartu di mobile, tabel di layar lebar)"
              >
                Auto
              </button>
              <button
                type="button"
                onClick={() => setViewMode('table')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1",
                  viewMode === 'table'
                    ? "bg-theme-500 text-white shadow-xs font-bold"
                    : "text-theme-600-text hover:text-theme-900"
                )}
                title="Mode Tabel"
              >
                <TableIcon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={cn(
                  "px-2.5 py-1 rounded-lg font-semibold transition-all flex items-center gap-1",
                  viewMode === 'cards'
                    ? "bg-theme-500 text-white shadow-xs font-bold"
                    : "text-theme-600-text hover:text-theme-900"
                )}
                title="Mode Kartu"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(!isFullScreen)}
              className="p-2 text-theme-600-text hover:text-theme-900 hover:bg-theme-100 rounded-xl transition-colors border border-theme-200 bg-white shadow-2xs"
              title={isFullScreen ? "Keluar Layar Penuh" : "Layar Penuh"}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Stats Ribbon */}
        <DailyReportStats
          totalCount={stats.totalCount}
          totalVolume={stats.totalVolume}
          arrivedCount={stats.arrivedCount}
          kosongPabrikCount={stats.kosongPabrikCount}
          warningCount={stats.warningCount}
        />

        {/* Toolbar & Filters */}
        <DailyReportToolbar
          filterDate={filterDate}
          setFilterDate={setFilterDate}
          filterSupplier={filterSupplier}
          setFilterSupplier={setFilterSupplier}
          supplierFilterQuery={supplierFilterQuery}
          setSupplierFilterQuery={setSupplierFilterQuery}
          isSupplierDropdownOpen={isSupplierDropdownOpen}
          setIsSupplierDropdownOpen={setIsSupplierDropdownOpen}
          suppliers={suppliers}
          filteredSuppliers={filteredSuppliersForFilter}
          supplierSearchHistory={supplierSearchHistory}
          setSupplierSearchHistory={setSupplierSearchHistory}
          productFilterQuery={productFilterQuery}
          setProductFilterQuery={setProductFilterQuery}
          bottomStockFilter={bottomStockFilter}
          setBottomStockFilter={setBottomStockFilter}
          arrivedFilter={arrivedFilter}
          setArrivedFilter={setArrivedFilter}
          showDuplicatesOnly={showDuplicatesOnly}
          setShowDuplicatesOnly={setShowDuplicatesOnly}
          onDeleteAllDuplicates={handleDeleteAllDuplicates}
          onCopyKemarin={openCopyModal}
          onBulkDelete={() => setIsBulkDeleteModalOpen(true)}
          onExportExcel={handleExportExcel}
          onExportPdf={handleExportPdf}
          onExportTxt={handleExportTxt}
          onDownloadTemplate={downloadDailyReportTemplate}
          onImportClick={() => fileInputRef.current?.click()}
          isImporting={isImporting}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={resetAllFilters}
          activePreset={activePreset}
          onSelectPreset={setDatePreset}
          totalResults={filteredReports.length}
        />
        <input 
          type="file" 
          ref={fileInputRef} 
          onChange={handleImportFileChange} 
          accept=".xlsx, .xls" 
          className="hidden" 
        />

        {/* Data View: Cards or Table */}
        <div className="flex-1 overflow-auto p-3 sm:p-4 min-h-[320px]">
          {filteredReports.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-theme-500">
              <div className="w-14 h-14 bg-theme-50 rounded-2xl flex items-center justify-center mb-3 border border-theme-200 shadow-2xs">
                <Filter className="w-6 h-6 text-theme-400" />
              </div>
              <p className="font-bold text-theme-800 text-base">Tidak ada data laporan ditemukan</p>
              <p className="text-xs text-theme-500 mt-1 max-w-sm">
                Coba sesuaikan filter pencarian, tanggal, atau gunakan form di sebelah untuk menambah data baru.
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="mt-4 px-3.5 py-1.5 rounded-xl bg-theme-100 hover:bg-theme-200 text-theme-800 text-xs font-bold transition-colors"
                >
                  Reset Semua Filter
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Cards layout: shown when cards mode is forced, or on mobile when auto */}
              {(viewMode === 'cards' || viewMode === 'auto') && (
                <div className={viewMode === 'auto' ? 'block lg:hidden' : 'block'}>
                  <DailyReportCards
                    reports={paginatedReports}
                    products={products}
                    suppliers={suppliers}
                    onEdit={handleEdit}
                    onDelete={deleteReport}
                    onUpdateReport={updateReport}
                    onUpdateProduct={updateProduct}
                    onKosongPabrikChange={handleKosongPabrikChange}
                  />
                </div>
              )}

              {/* Table layout: shown when table mode is forced, or on desktop when auto */}
              {(viewMode === 'table' || viewMode === 'auto') && (
                <div className={viewMode === 'auto' ? 'hidden lg:block' : 'block'}>
                  <DailyReportTable
                    reports={paginatedReports}
                    products={products}
                    suppliers={suppliers}
                    onEdit={handleEdit}
                    onDelete={deleteReport}
                    onUpdateReport={updateReport}
                    onUpdateProduct={updateProduct}
                    onKosongPabrikChange={handleKosongPabrikChange}
                  />
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer & Pagination */}
        <div className="p-3 sm:p-4 border-t border-theme-200 bg-white flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-theme-600 font-medium">
            <span>
              Menampilkan {filteredReports.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}-
              {Math.min(currentPage * itemsPerPage, filteredReports.length)} dari {filteredReports.length} baris
            </span>
            <span className="hidden sm:inline">•</span>
            <div className="flex items-center gap-1.5">
              <span>Baris per halaman:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-neutral-200 rounded-lg px-2 py-1 bg-white font-bold text-neutral-800 outline-none"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-theme-200 hover:bg-theme-100 disabled:opacity-40 disabled:cursor-not-allowed text-theme-800 transition-colors"
              title="Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum = i + 1;
                if (totalPages > 5 && currentPage > 3) {
                  pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                }
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={cn(
                      "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-bold transition-all",
                      currentPage === pageNum
                        ? "bg-neutral-900 text-white shadow-xs"
                        : "hover:bg-theme-100 text-neutral-700"
                    )}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="p-1.5 rounded-lg border border-theme-200 hover:bg-theme-100 disabled:opacity-40 disabled:cursor-not-allowed text-theme-800 transition-colors"
              title="Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

      {/* Copy Yesterday Modal */}
      {isCopyModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-theme-200 shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-theme-900">Salin Report Kemarin</h3>
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="text-theme-600-text hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-theme-600-text mb-4">
              Pilih item dari laporan kemarin yang ingin disalin ke hari ini. 
              <br/>(Item yang sudah ada di hari ini akan dilewati secara otomatis).
            </p>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-600-text" />
              <input
                type="text"
                value={copySearchQuery}
                onChange={(e) => setCopySearchQuery(e.target.value)}
                placeholder="Cari item..."
                className="w-full pl-10 pr-4 py-2 border border-theme-200 rounded-xl bg-theme-50 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm text-theme-800"
              />
            </div>
            
            <div className="flex-1 overflow-y-auto border border-theme-200 rounded-2xl mb-6 p-2 space-y-1">
              {filteredYesterdayReports.map(r => {
                const product = products.find(p => p.id === r.productId);
                return (
                  <div 
                    key={r.id} 
                    className="flex items-center gap-3 p-3 hover:bg-theme-50 rounded-xl cursor-pointer"
                    onClick={() => toggleCopySelection(r.id)}
                  >
                    <input
                      type="checkbox"
                      checked={(selectedCopyIds || []).includes(r.id)}
                      onChange={() => {}} // handled by div click
                      className="w-4 h-4 text-blue-500 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                    />
                    <div className="flex-1">
                      <p className="font-bold text-sm text-theme-900">{product?.name || 'Unknown'}</p>
                      <p className="text-xs text-theme-600-text">Qty: {r.quantity} {product?.unit || ''}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <div className="flex gap-3 mt-auto">
              <button 
                onClick={() => setIsCopyModalOpen(false)}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleCopyYesterday}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                <Copy className="w-4 h-4" /> Salin Data
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Summary Modal */}
      {copySummary.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-theme-200 shadow-2xl p-6 w-full max-w-lg flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-theme-900">Hasil Salin Data</h3>
              <button 
                onClick={() => setCopySummary(prev => ({ ...prev, isOpen: false }))}
                className="text-theme-600-text hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              <div>
                <h4 className="font-bold text-sm text-theme-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Tersalin ({copySummary.copied.length})
                </h4>
                {copySummary.copied.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-theme-700 space-y-1">
                    {copySummary.copied.map((item, idx) => (
                      <li key={idx}>{item.productName}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-theme-600-text italic">Tidak ada data yang disalin.</p>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm text-theme-800 mb-2 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Tidak Tersalin ({copySummary.skipped.length})
                </h4>
                {copySummary.skipped.length > 0 ? (
                  <ul className="list-disc pl-5 text-sm text-rose-600 space-y-1">
                    {copySummary.skipped.map((item, idx) => (
                      <li key={idx}>
                        <span className="font-semibold">{item.productName}</span>: {item.reason}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-theme-600-text italic">Semua data berhasil disalin.</p>
                )}
              </div>
            </div>

            <div className="mt-6">
              <button 
                onClick={() => setCopySummary(prev => ({ ...prev, isOpen: false }))}
                className="w-full flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-theme-200 shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-theme-900">Bulk Delete Reports</h3>
              <button 
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="text-theme-600-text hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <p className="text-sm text-theme-600-text mb-6">
              Select a date range to delete multiple report records at once. <span className="font-bold text-rose-500">This action cannot be undone.</span>
            </p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Start Date</label>
                <input
                  type="date"
                  value={bulkStartDate}
                  onChange={(e) => setBulkStartDate(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm text-theme-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">End Date</label>
                <input
                  type="date"
                  value={bulkEndDate}
                  onChange={(e) => setBulkEndDate(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-rose-500 focus:border-rose-500 outline-none transition-all text-sm text-theme-800"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <X className="w-4 h-4" /> Cancel
              </button>
              <button 
                onClick={handleBulkDelete}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-rose-600 hover:bg-rose-700 text-white transition-colors"
              >
                <Trash2 className="w-4 h-4" /> Delete Records
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Copy Progress Modal */}
      <OperationProgressModal
        isOpen={isCopying}
        type="copy"
        title="Menyalin Data dari Kemarin..."
        current={copyProgress.current}
        total={copyProgress.total}
        currentItemName={copyProgress.currentItemName}
        startTime={copyProgress.startTime}
      />

      {/* Save Progress Modal */}
      <OperationProgressModal
        isOpen={isSavingAll}
        type="save"
        title="Menyimpan Data Laporan..."
        subtitle="Menyimpan antrean data ke database"
        current={saveProgress.current}
        total={saveProgress.total}
        currentItemName={saveProgress.currentItemName}
        startTime={saveProgress.startTime}
      />

      {/* Import Progress Modal */}
      <OperationProgressModal
        isOpen={isImporting}
        type="import"
        title="Mengimpor Data Laporan..."
        subtitle="Memproses baris data Excel ke Daily Report"
        current={importProgress.current}
        total={importProgress.total}
        currentItemName={importProgress.currentItemName}
        startTime={importProgress.startTime}
      />

      {/* Save Summary Modal */}
      <AnimatePresence>
        {saveSummary.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-theme-900">Rincian Simpan Data</h3>
                <button
                  onClick={() => setSaveSummary({ isOpen: false, saved: [], failed: [] })}
                  className="p-2 text-theme-600-text hover:bg-theme-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Saved Items */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-theme-700 mb-3 text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Berhasil Tersimpan ({saveSummary.saved.length})
                  </h4>
                  {saveSummary.saved.length > 0 ? (
                    <div className="space-y-2">
                      {saveSummary.saved.map((item, idx) => (
                        <div key={idx} className="bg-theme-50 p-3 rounded-xl border border-theme-200 text-sm flex justify-between">
                          <span className="font-bold text-theme-900">{item.productName}</span> 
                          <span className="text-theme-600-text ml-2">Qty: {item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-theme-600-text">Tidak ada data yang berhasil disimpan.</p>
                  )}
                </div>
                
                {/* Failed Items */}
                {saveSummary.failed.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-rose-600 mb-3 text-sm">
                      <AlertCircle className="w-5 h-5" /> Gagal Tersimpan ({saveSummary.failed.length})
                    </h4>
                    <div className="space-y-2">
                      {saveSummary.failed.map((f, idx) => (
                        <div key={idx} className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-sm">
                          <div className="font-bold text-rose-900">{f.item.productName}</div>
                          <div className="text-rose-600 text-xs mt-1">Alasan: {f.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-theme-200">
                <button
                  onClick={() => setSaveSummary({ isOpen: false, saved: [], failed: [] })}
                  className="w-full bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold py-3 rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
