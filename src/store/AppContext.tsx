import { 
  subscribeToCollection, addRecord, updateRecord, deleteRecord, executeBatch, 
  setLocalDbSetting, isLocalDb, getDbProvider, setDbProviderSetting,
  ensureDatabaseTables, checkDatabaseTablesStatus, AllTablesStatusResult, RequiredTableName
} from '../lib/dbAdapter';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Product, ReportEntry, Supplier, UserSettings, AutoDeleteMode, StockOutEntry, DbProvider } from '../types';
import { formatExcelDate } from '../lib/excel';
import { db, auth, googleProvider, signInWithPopup, FIREBASE_UPGRADE_URL } from '../lib/firebase';
import { getSupabaseClient } from '../lib/supabase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, deleteDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';

export interface QuotaExceededInfo {
  isExceeded: boolean;
  message: string;
  upgradeUrl: string;
}

interface AppState {
  suppliers: Supplier[];
  products: Product[];
  reports: ReportEntry[];
  stockOuts: StockOutEntry[];
  settings: UserSettings;
  loading: boolean;
}

interface AppContextType extends AppState {
  userId: string | null;
  dbProvider: DbProvider;
  quotaExceededInfo: QuotaExceededInfo | null;
  dismissQuotaAlert: () => void;
  switchToLocalDb: () => void;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => Promise<string>;
  updateSupplier: (supplier: Supplier) => Promise<void>;
  deleteSupplier: (id: string) => Promise<void>;
  
  addProduct: (product: Omit<Product, 'id'>) => Promise<string>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetAllProductStocks: () => Promise<void>;

  addReport: (report: Omit<ReportEntry, 'id'>) => Promise<void>;
  updateReport: (report: ReportEntry) => Promise<void>;
  deleteReport: (id: string, forceDeleteArrived?: boolean) => Promise<void>;
  deleteMultipleReports: (ids: string[], forceDeleteArrived?: boolean) => Promise<void>;
  deleteReportsByDateRange: (startDate: string, endDate: string) => Promise<void>;

  importMasterData: (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string; category?: string }[],
    onProgress?: (current: number, total: number, itemName?: string) => void
  ) => Promise<string[]>;
  exportData: () => void;
  importData: (jsonData: string) => Promise<void>;
  migrateCurrentDataToSupabase: () => Promise<{ success: boolean; message: string; count: number }>;
  
  resetAllData: () => Promise<void>;
  updateSettings: (settings: UserSettings) => Promise<void>;
  addStockOut: (entry: Omit<StockOutEntry, 'id'>) => Promise<void>;
  updateStockOut: (id: string, entry: Partial<StockOutEntry>) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;

  autoCreateMissingTables: (targetProvider?: DbProvider) => Promise<{ success: boolean; message: string; createdTables: RequiredTableName[] }>;
  getTablesStatus: (targetProvider?: DbProvider) => Promise<AllTablesStatusResult>;
}

const defaultState: AppState = {
  suppliers: [],
  products: [],
  reports: [],
  stockOuts: [],
  settings: { autoDeleteMode: 'none' },
  loading: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(defaultState);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [quotaExceededInfo, setQuotaExceededInfo] = useState<QuotaExceededInfo | null>(null);
  const autoDeleteAttemptedRef = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    const unsubAuth = onAuthStateChanged(
      auth,
      (user) => {
        if (!isMounted) return;
        if (user) {
          setUserId(user.uid);
        } else {
          setUserId('public');
        }
        setAuthLoading(false);
      },
      (error) => {
        if (!isMounted) return;
        // If network request failed or client is offline in iframe, fallback gracefully
        console.warn('Firebase Auth state handled gracefully (network/offline fallback):', error?.message);
        setUserId('public');
        setAuthLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubAuth();
    };
  }, []);

  useEffect(() => {
    const handleQuota = (e: any) => {
      setQuotaExceededInfo({
        isExceeded: true,
        message: e.detail?.message || 'Batas kuota harian gratis Firebase Firestore (20.000 unit tulis/hari) telah tercapai.',
        upgradeUrl: e.detail?.upgradeUrl || FIREBASE_UPGRADE_URL
      });
    };
    window.addEventListener('firebase-quota-exceeded', handleQuota);
    return () => window.removeEventListener('firebase-quota-exceeded', handleQuota);
  }, []);

  const dismissQuotaAlert = () => {
    setQuotaExceededInfo(null);
  };

  const switchToLocalDb = () => {
    setDbProviderSetting('local');
    window.location.reload();
  };

  const signIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      if (err?.code === 'auth/network-request-failed' || err?.message?.includes('network-request-failed')) {
        console.warn('Firebase Auth sign-in network error handled gracefully.');
        return;
      }
      console.warn('Sign-in notice:', err?.message || err);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.warn('Sign-out notice:', err?.message || err);
    }
  };

  useEffect(() => {
    // Otomatis cek dan buat tabel-tabel yang dibutuhkan jika belum ada di database
    ensureDatabaseTables().then(res => {
      console.log(`[Auto-Table Init] Database ${res.provider}:`, res.message);
    }).catch(err => {
      console.warn('[Auto-Table Init] Notice:', err?.message || err);
    });

    const unsubSuppliers = subscribeToCollection('suppliers', (data) => {
      setState(prev => ({ ...prev, suppliers: data }));
    });
    const unsubProducts = subscribeToCollection('products', (data) => {
      setState(prev => ({ ...prev, products: data }));
    });
    const unsubReports = subscribeToCollection('reports', (data) => {
      setState(prev => ({ ...prev, reports: data }));
    });
    const unsubStockOuts = subscribeToCollection('stock_outs', (data) => {
      setState(prev => ({ ...prev, stockOuts: data }));
    });
    // Load settings from localStorage per device
    const currentProvider = getDbProvider();
    const savedSettingsStr = localStorage.getItem('appSettings');
    let savedSettings = {};
    if (savedSettingsStr) {
      try {
        savedSettings = JSON.parse(savedSettingsStr);
      } catch(e) {}
    }
    setState(prev => ({ 
      ...prev, 
      settings: { 
        autoDeleteMode: 'none',
        navbarPosition: 'bottom',
        theme: 'green',
        ...savedSettings,
        useLocalDb: isLocalDb(),
        dbProvider: currentProvider
      } 
    }));

    // Assume loading completes once listeners attach (simple approximation)
    setState(prev => ({ ...prev, loading: false }));

    return () => {
      unsubSuppliers();
      unsubProducts();
      unsubReports();
      unsubStockOuts();
    };
  }, []);

  // Auto-delete logic with guard against repeated attempts
  useEffect(() => {
    if (state.loading) return;
    
    const mode = state.settings.autoDeleteMode;
    if (mode === 'none') return;
    
    const today = new Date();
    // Use local time for dates to match UI
    const todayStr = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = new Date(yesterday.getTime() - yesterday.getTimezoneOffset() * 60000).toISOString().split('T')[0];
    
    let thresholdDateStr = ''; // Reports older than this date will be deleted
    
    if (mode === 'keep_today') {
      thresholdDateStr = todayStr; // delete anything strictly less than today
    } else if (mode === 'keep_2_days') {
      thresholdDateStr = yesterdayStr; // delete anything strictly less than yesterday
    }
    
    if (!thresholdDateStr) return;

    // Prevent repeated loops if already attempted for this threshold in this session
    const attemptKey = `${mode}_${thresholdDateStr}`;
    if (autoDeleteAttemptedRef.current === attemptKey) return;

    const reportsToDelete = state.reports.filter(r => r.date < thresholdDateStr);
    
    if (reportsToDelete.length > 0) {
      console.log(`Auto-deleting ${reportsToDelete.length} reports older than ${thresholdDateStr}`);
      autoDeleteAttemptedRef.current = attemptKey;
      const ops = reportsToDelete.map(r => r.isArrived 
        ? { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } }
        : { type: 'delete', collection: 'reports', id: r.id }
      ) as any[];
      executeBatch(ops).catch(e => {
        console.warn("Auto delete execution skipped or quota exhausted:", e?.message || e);
      });
    }
  }, [state.reports.length, state.settings.autoDeleteMode, state.loading]);

  const updateSettings = async (newSettings: UserSettings) => {
    if (newSettings.dbProvider !== undefined) {
      const current = getDbProvider();
      if (current !== newSettings.dbProvider) {
        setDbProviderSetting(newSettings.dbProvider);
        window.location.reload();
        return;
      }
    } else if (newSettings.useLocalDb !== undefined) {
      const changed = isLocalDb() !== newSettings.useLocalDb;
      setLocalDbSetting(newSettings.useLocalDb);
      if (changed) {
        window.location.reload();
        return;
      }
    }
    
    // Save settings per device to localStorage instead of global DB
    localStorage.setItem('appSettings', JSON.stringify(newSettings));
    
    // Update local state directly so UI updates immediately without a full reload or DB sync
    setState(prev => ({
      ...prev,
      settings: { ...prev.settings, ...newSettings }
    }));
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<string> => {
    if (!userId) throw new Error("Not logged in");
        const id = await addRecord('suppliers', { ...supplier, userId });
    return id;
  };

  const updateSupplier = async (supplier: Supplier) => {
    if (!userId) return;
    const { id, ...data } = supplier;
    await updateRecord('suppliers', id, data);
  };

  const deleteSupplier = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    await deleteRecord('suppliers', id);
  };

  const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
    if (!userId) throw new Error("Not logged in");
    const cleanData = Object.fromEntries(Object.entries(product).filter(([_, v]) => v !== undefined));
        const id = await addRecord('products', { ...cleanData, userId });
    return id;
  };

  const updateProduct = async (product: Product) => {
    if (!userId) return;
    const { id, ...data } = product;
    if (!id) return;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await updateRecord('products', id, cleanData);
  };

  const deleteProduct = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    await deleteRecord('products', id);
  };

  const resetAllProductStocks = async () => {
    if (!userId || state.products.length === 0) return;
    
    // Batch updates (max 500 operations per batch)
        const ops = state.products.filter(p => p.stock !== 0).map(p => ({
      type: 'update', collection: 'products', id: p.id, data: { stock: 0 }
    })) as any[];
    await executeBatch(ops);
  };

  const addReport = async (report: Omit<ReportEntry, 'id'>) => {
    if (!userId) return;
    const cleanData = Object.fromEntries(Object.entries(report).filter(([_, v]) => v !== undefined));
    const normalizedDate = formatExcelDate(report.date) || report.date;

    // Check if an arrived report exists on the same date for this product
    const existingArrived = state.reports.find(
      r => (formatExcelDate(r.date) || r.date) === normalizedDate && 
           r.productId === report.productId && 
           r.isArrived
    );

    if (existingArrived && (existingArrived.quantity === 0 || existingArrived.isArrivedOnly)) {
      // Merge with existing arrived placeholder record
      await updateRecord('reports', existingArrived.id, {
        ...existingArrived,
        ...cleanData,
        isArrived: true,
        isArrivedOnly: false,
        arrivedAt: existingArrived.arrivedAt || Date.now(),
        arrivedSupplierId: existingArrived.arrivedSupplierId,
        arrivedQty: existingArrived.arrivedQty,
        notes: report.notes 
          ? (existingArrived.notes && !existingArrived.notes.includes(report.notes)
              ? `${existingArrived.notes} | ${report.notes}`
              : existingArrived.notes || report.notes)
          : existingArrived.notes
      });
      return;
    }

    const finalReportData = {
      ...cleanData,
      ...(existingArrived ? { isArrived: true, arrivedAt: existingArrived.arrivedAt || Date.now() } : {}),
      createdAt: Date.now(),
      userId
    };

    await addRecord('reports', finalReportData);
  };

  const updateReport = async (report: ReportEntry) => {
    if (!userId) return;
    const { id, ...data } = report;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    await updateRecord('reports', id, cleanData);
  };

  const deleteReport = async (id: string, forceDeleteArrived = false) => {
    if (!id) return;
    if (!userId) return;
    
    if (!forceDeleteArrived) {
      const report = state.reports.find(r => r.id === id);
      if (report && report.isArrived) {
        await updateRecord('reports', id, {
          quantity: 0,
          isKosongPabrik: false,
          isArrivedOnly: true
        });
        return;
      }
    }
    
    await deleteRecord('reports', id);
  };

  const deleteMultipleReports = async (ids: string[], forceDeleteArrived = false) => {
    if (!userId || ids.length === 0) return;
    try {
      const ops = ids.map(id => {
        if (!forceDeleteArrived) {
          const report = state.reports.find(r => r.id === id);
          if (report && report.isArrived) {
            return { type: 'update', collection: 'reports', id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
          }
        }
        return { type: 'delete', collection: 'reports', id };
      }) as any[];
      await executeBatch(ops);
    } catch (error) {
      console.error('Error deleting multiple reports:', error);
      throw error;
    }
  };


  const addStockOut = async (entry: Omit<StockOutEntry, 'id'>) => {
    if (!userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await addRecord('stock_outs', { ...cleanData, createdAt: Date.now(), userId });
  };

  const updateStockOut = async (id: string, entry: Partial<StockOutEntry>) => {
    if (!id || !userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await updateRecord('stock_outs', id, cleanData);
  };

  const deleteStockOut = async (id: string) => {
    if (!id || !userId) return;
    await deleteRecord('stock_outs', id);
  };

  const deleteReportsByDateRange = async (startDate: string, endDate: string) => {
    if (!userId) return;
    try {
      const reportsToDelete = state.reports.filter(r => r.date >= startDate && r.date <= endDate);
            const ops = reportsToDelete.map(r => {
        if (r.isArrived) {
          return { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
        }
        return { type: 'delete', collection: 'reports', id: r.id };
      }) as any[];
      await executeBatch(ops);
    } catch (error) {
      console.error("Error deleting reports by date range:", error);
    }
  };

  const importMasterData = async (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string; category?: string }[],
    onProgress?: (current: number, total: number, itemName?: string) => void
  ): Promise<string[]> => {
    if (!userId) return ["User not logged in."];

    const errors: string[] = [];
    const totalItems = newSuppliers.length + newProducts.length;
    let processedCount = 0;

    try {
      // In a real app we'd batch, but for simplicity we'll process sequentially
      const supplierMap = new Map(state.suppliers.map(s => [s.name.toLowerCase().trim(), s.id]));
      const addedSuppliers = new Map<string, string>(); // new ones

      for (let i = 0; i < newSuppliers.length; i++) {
        const ns = newSuppliers[i];
        processedCount++;
        onProgress?.(processedCount, totalItems, `Supplier: ${ns.name}`);
        try {
          const key = ns.name.toLowerCase().trim();
          if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
            const id = await addRecord('suppliers', { name: ns.name, userId });
            addedSuppliers.set(key, id);
          }
        } catch (e: any) {
          errors.push(`Failed to import supplier "${ns.name}": ${e.message}`);
        }
        if (totalItems <= 100) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      for (let i = 0; i < newProducts.length; i++) {
        const np = newProducts[i];
        try {
          const key = np.supplierName.toLowerCase().trim();
          if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
            const id = await addRecord('suppliers', { name: np.supplierName, userId });
            addedSuppliers.set(key, id);
          }
        } catch (e: any) {
          errors.push(`Failed to auto-create supplier "${np.supplierName}" for product "${np.name}": ${e.message}`);
        }
      }

      for (let i = 0; i < newProducts.length; i++) {
        const np = newProducts[i];
        processedCount++;
        onProgress?.(processedCount, totalItems, `Produk: ${np.name}`);
        try {
          const key = np.supplierName.toLowerCase().trim();
          const supplierId = supplierMap.get(key) || addedSuppliers.get(key);
          
          if (supplierId) {
            const existingProduct = state.products.find(p => p.name.toLowerCase().trim() === np.name.toLowerCase().trim());
            const newBottomStock = np.bottomStock !== undefined ? np.bottomStock : null;

            if (existingProduct) {
              const existingBottomStock = existingProduct.bottomStock !== undefined ? existingProduct.bottomStock : null;
              
              if (
                existingProduct.unit !== np.unit ||
                existingProduct.supplierId !== supplierId ||
                existingBottomStock !== newBottomStock
              ) {
                await updateRecord('products', existingProduct.id, {
                  unit: np.unit,
                  supplierId: supplierId,
                  bottomStock: newBottomStock
                });
              }
            } else {
              await addRecord('products', {
                name: np.name,
                unit: np.unit,
                supplierId: supplierId,
                bottomStock: newBottomStock,
                userId
              });
            }
          } else {
            errors.push(`Could not find or create supplier "${np.supplierName}" for product "${np.name}".`);
          }
        } catch (e: any) {
          errors.push(`Failed to import product "${np.name}": ${e.message}`);
        }
        if (totalItems <= 100) {
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }
    } catch (e: any) {
      console.error("Import failed:", e);
      errors.push(`Critical import failure: ${e.message}`);
    }
    
    return errors;
  };

    const exportData = () => {
    const data = {
      suppliers: state.suppliers,
      products: state.products,
      reports: state.reports,
      stockOuts: state.stockOuts,
      settings: state.settings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DailyReportPro_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.suppliers || !data.products) throw new Error("Format cadangan tidak valid (kurang dari versi terbaru).");
      
      const ops: any[] = [];
      
      const queueOps = (collection: string, items: any[]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            const { id, ...rest } = item;
            if (id) {
              ops.push({ type: 'set', collection, id, data: rest });
            }
          });
        }
      };
      
      queueOps('suppliers', data.suppliers);
      queueOps('products', data.products);
      queueOps('reports', data.reports);
      queueOps('stock_outs', data.stockOuts);
      
      if (data.settings) {
        ops.push({ type: 'set', collection: 'settings', id: 'public', data: data.settings });
      }
      
      await executeBatch(ops);
      alert("Restore Data berhasil diselesaikan!");
    } catch (error) {
      console.error("Import failed", error);
      alert("Gagal memulihkan (restore) data. Pastikan file JSON yang dipilih adalah cadangan yang valid.");
    }
  };

  const migrateCurrentDataToSupabase = async () => {
    const supabase = getSupabaseClient();
    let totalCount = 0;
    
    function chunkArray<T>(arr: T[], size: number): T[][] {
      const chunks = [];
      for (let i = 0; i < arr.length; i += size) {
        chunks.push(arr.slice(i, i + size));
      }
      return chunks;
    }

    const BATCH_SIZE = 500;

    // Suppliers
    if (state.suppliers.length > 0) {
      const records = state.suppliers.map(s => ({
        id: s.id,
        name: s.name,
        userId: s.userId || 'public'
      }));
      const chunks = chunkArray(records, BATCH_SIZE);
      for (const chunk of chunks) {
        const { error } = await supabase.from('suppliers').upsert(chunk);
        if (error) throw new Error(`Gagal migrasi supplier: ${error.message}`);
      }
      totalCount += records.length;
    }

    // Products
    if (state.products.length > 0) {
      const records = state.products.map(p => ({
        id: p.id,
        name: p.name,
        supplierId: p.supplierId,
        alternativeSupplierIds: p.alternativeSupplierIds || [],
        unit: p.unit,
        bottomStock: p.bottomStock ?? null,
        isKosongPabrik: p.isKosongPabrik ?? false,
        kosongPabrikDate: p.kosongPabrikDate ?? null,
        stock: p.stock ?? 0,
        location: p.location ?? null,
        category: p.category ?? null,
        userId: p.userId || 'public'
      }));
      const chunks = chunkArray(records, BATCH_SIZE);
      for (const chunk of chunks) {
        const { error } = await supabase.from('products').upsert(chunk);
        if (error) throw new Error(`Gagal migrasi produk: ${error.message}`);
      }
      totalCount += records.length;
    }

    // Reports
    if (state.reports.length > 0) {
      const records = state.reports.map(r => ({
        id: r.id,
        date: r.date,
        productId: r.productId,
        quantity: r.quantity ?? 0,
        createdAt: r.createdAt ?? Date.now(),
        isOrdered: r.isOrdered ?? false,
        isArrived: r.isArrived ?? false,
        isKosongPabrik: r.isKosongPabrik ?? false,
        isReorder: r.isReorder ?? false,
        reorderQty: r.reorderQty ?? null,
        reorderReason: r.reorderReason ?? null,
        notes: r.notes ?? null,
        isWarningStock: r.isWarningStock ?? false,
        isArrivedOnly: r.isArrivedOnly ?? false,
        arrivedAt: r.arrivedAt ?? null,
        arrivedSupplierId: r.arrivedSupplierId ?? null,
        arrivedQty: r.arrivedQty ?? null,
        userId: r.userId || 'public'
      }));
      const chunks = chunkArray(records, BATCH_SIZE);
      for (const chunk of chunks) {
        const { error } = await supabase.from('reports').upsert(chunk);
        if (error) throw new Error(`Gagal migrasi laporan: ${error.message}`);
      }
      totalCount += records.length;
    }

    // Stock outs
    if (state.stockOuts.length > 0) {
      const records = state.stockOuts.map(s => ({
        id: s.id,
        date: s.date,
        productId: s.productId,
        quantity: s.quantity,
        notes: s.notes ?? null,
        createdAt: s.createdAt ?? Date.now(),
        userId: s.userId || 'public'
      }));
      const chunks = chunkArray(records, BATCH_SIZE);
      for (const chunk of chunks) {
        const { error } = await supabase.from('stock_outs').upsert(chunk);
        if (error) throw new Error(`Gagal migrasi data barang keluar: ${error.message}`);
      }
      totalCount += records.length;
    }

    // Settings
    const settingsRecord = {
      id: 'public',
      autoDeleteMode: state.settings.autoDeleteMode || 'none',
      navbarPosition: state.settings.navbarPosition || 'bottom',
      theme: state.settings.theme || 'default',
      useLocalDb: false,
      dbProvider: 'supabase'
    };
    await supabase.from('settings').upsert([settingsRecord]);

    return {
      success: true,
      message: `Berhasil memigrasikan ${totalCount} data ke Supabase!`,
      count: totalCount
    };
  };

  const resetAllData = async () => {
    if (!userId) return;
    try {
      // Chunk deletions if there are more than 500 records overall
      // But for simplicity in this case, we use Promise.all which handles any size.
      const supplierPromises = state.suppliers.map(s => deleteRecord('suppliers', s.id));
      const productPromises = state.products.map(p => deleteRecord('products', p.id));
      const reportPromises = state.reports.map(r => deleteRecord('reports', r.id));
      
      await Promise.all([...supplierPromises, ...productPromises, ...reportPromises]);
    } catch (e) {
      console.error("Reset data failed:", e);
    }
  };

  const autoCreateMissingTables = async (targetProvider?: DbProvider) => {
    return await ensureDatabaseTables(targetProvider);
  };

  const getTablesStatus = async (targetProvider?: DbProvider) => {
    return await checkDatabaseTablesStatus(targetProvider);
  };

  if (authLoading) {
    return <div className="flex h-screen items-center justify-center bg-theme-50"><p className="text-theme-500 font-bold">Loading...</p></div>;
  }

  return (
    <AppContext.Provider value={{
      ...state,
      userId,
      dbProvider: getDbProvider(),
      quotaExceededInfo,
      dismissQuotaAlert,
      switchToLocalDb,
      signIn, logout,
      addSupplier, updateSupplier, deleteSupplier,
      addProduct, updateProduct, deleteProduct, resetAllProductStocks,
      addReport, updateReport, deleteReport, deleteMultipleReports, deleteReportsByDateRange, importMasterData, exportData, importData,
      migrateCurrentDataToSupabase,
      resetAllData, updateSettings, addStockOut, updateStockOut, deleteStockOut,
      autoCreateMissingTables,
      getTablesStatus
    }}>
      {!state.loading && children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
