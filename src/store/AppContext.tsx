import { 
  subscribeToCollection, addRecord, updateRecord, deleteRecord, executeBatch, 
  setLocalDbSetting, isLocalDb, getDbProvider, setDbProviderSetting,
  ensureDatabaseTables, checkDatabaseTablesStatus, AllTablesStatusResult, RequiredTableName,
  generateId, subscribeToSettings, syncSettingsToCloud
} from '../lib/dbAdapter';
import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Product, ReportEntry, Supplier, UserSettings, AutoDeleteMode, StockOutEntry, DbProvider, NearExpiredEntry } from '../types';
import { formatExcelDate } from '../lib/excel';
import { getCleanupCutoffDate } from '../lib/cleanupUtils';
import { mergeCrosscheckStatus, saveCrosscheckStatus, saveCrosscheckBatch } from '../lib/crosscheckRegistry';
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
  nearExpiredList: NearExpiredEntry[];
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
  updateProductsBatch: (products: Product[]) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  resetAllProductStocks: () => Promise<void>;

  addReport: (report: Omit<ReportEntry, 'id'>) => Promise<void>;
  addReportsBatch: (reportsToAdd: Omit<ReportEntry, 'id'>[], reportsToUpdate?: ReportEntry[]) => Promise<{ count: number }>;
  updateReport: (report: ReportEntry) => Promise<void>;
  updateReportsBatch: (reportsToUpdate: ReportEntry[]) => Promise<void>;
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
  addStockOutsBatch: (
    stockOutsToAdd: Omit<StockOutEntry, 'id'>[],
    productsToUpdate?: Product[],
    reportsToAdd?: Omit<ReportEntry, 'id'>[]
  ) => Promise<void>;

  addNearExpired: (entry: Omit<NearExpiredEntry, 'id'>) => Promise<string>;
  addNearExpiredBatch: (entries: Omit<NearExpiredEntry, 'id'>[]) => Promise<void>;
  updateNearExpired: (id: string, entry: Partial<NearExpiredEntry>) => Promise<void>;
  deleteNearExpired: (id: string) => Promise<void>;
  deleteMultipleNearExpired: (ids: string[]) => Promise<void>;

  autoCreateMissingTables: (targetProvider?: DbProvider) => Promise<{ success: boolean; message: string; createdTables: RequiredTableName[] }>;
  getTablesStatus: (targetProvider?: DbProvider) => Promise<AllTablesStatusResult>;
  cleanOldReportsNow: (targetMode?: AutoDeleteMode, targetDays?: number) => Promise<{ count: number; cutoffDate: string }>;
}

const getInitialSettings = (): UserSettings => {
  if (typeof window === 'undefined') {
    return { autoDeleteMode: 'none', autoDeleteDays: 3, navbarPosition: 'bottom', theme: 'green' };
  }
  const currentProvider = getDbProvider();
  const savedSettingsStr = localStorage.getItem('appSettings');
  let savedSettings = {};
  if (savedSettingsStr) {
    try {
      savedSettings = JSON.parse(savedSettingsStr);
    } catch {}
  }
  return {
    autoDeleteMode: 'none',
    autoDeleteDays: 3,
    navbarPosition: 'bottom',
    theme: 'green',
    ...savedSettings,
    useLocalDb: isLocalDb(),
    dbProvider: currentProvider
  };
};

const defaultState: AppState = {
  suppliers: [],
  products: [],
  reports: [],
  stockOuts: [],
  nearExpiredList: [],
  settings: { autoDeleteMode: 'none', autoDeleteDays: 3 },
  loading: true,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AppState>(() => ({
    ...defaultState,
    settings: getInitialSettings()
  }));
  const [userId, setUserId] = useState<string | null>('public');
  const [authLoading, setAuthLoading] = useState(false);
  const [quotaExceededInfo, setQuotaExceededInfo] = useState<QuotaExceededInfo | null>(null);
  const autoDeleteAttemptedRef = useRef<string>('');

  useEffect(() => {
    let isMounted = true;
    try {
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
        try {
          unsubAuth();
        } catch {}
      };
    } catch (e: any) {
      console.warn('Firebase Auth init handled gracefully:', e?.message || e);
      setUserId('public');
      setAuthLoading(false);
    }
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
      const merged = mergeCrosscheckStatus(data);
      setState(prev => ({ ...prev, reports: merged }));
    });
    const unsubStockOuts = subscribeToCollection('stock_outs', (data) => {
      setState(prev => ({ ...prev, stockOuts: data }));
    });
    const unsubNearExpired = subscribeToCollection('near_expired', (data) => {
      setState(prev => ({ ...prev, nearExpiredList: data }));
    });

    // Realtime subscription to settings so changes on any device immediately sync to all devices
    const unsubSettings = subscribeToCollection('settings', (data) => {
      if (!data || data.length === 0) return;
      const remote = data.find((d: any) => d && (d.id === 'public' || d.id === 'settings')) || data[0];
      if (!remote) return;

      setState(prev => {
        const remoteMode = remote.autoDeleteMode as AutoDeleteMode | undefined;
        const remoteDays = remote.autoDeleteDays !== undefined ? Number(remote.autoDeleteDays) : undefined;

        let hasChanges = false;
        const updated = { ...prev.settings };

        if (remoteMode && remoteMode !== prev.settings.autoDeleteMode) {
          updated.autoDeleteMode = remoteMode;
          hasChanges = true;
        }

        if (remoteDays !== undefined && !isNaN(remoteDays) && remoteDays !== prev.settings.autoDeleteDays) {
          updated.autoDeleteDays = remoteDays;
          hasChanges = true;
        }

        if (!hasChanges) return prev;

        try {
          localStorage.setItem('appSettings', JSON.stringify(updated));
        } catch {}

        return {
          ...prev,
          settings: updated
        };
      });
    });

    // Cross-tab / cross-window broadcast channel on this device
    let settingsBc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        settingsBc = new BroadcastChannel('dailyreport_settings_sync');
        settingsBc.onmessage = (event) => {
          if (event.data) {
            setState(prev => ({
              ...prev,
              settings: {
                ...prev.settings,
                ...event.data
              }
            }));
          }
        };
      }
    } catch {}

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
        autoDeleteDays: 3,
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
      unsubNearExpired();
      unsubSettings();
      if (settingsBc) settingsBc.close();
    };
  }, []);

  const cleanOldReportsNow = async (targetMode?: AutoDeleteMode, targetDays?: number): Promise<{ count: number; cutoffDate: string }> => {
    const activeMode = targetMode !== undefined ? targetMode : state.settings.autoDeleteMode;
    const activeDays = targetDays !== undefined ? targetDays : state.settings.autoDeleteDays;

    const cutoff = getCleanupCutoffDate(activeMode, activeDays);
    if (!cutoff) return { count: 0, cutoffDate: '' };

    const reportsToDelete = state.reports.filter(r => r.date < cutoff.cutoffDateStr);
    if (reportsToDelete.length === 0) {
      return { count: 0, cutoffDate: cutoff.cutoffDateStr };
    }

    const ops = reportsToDelete.map(r => r.isArrived 
      ? { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } }
      : { type: 'delete', collection: 'reports', id: r.id }
    ) as any[];

    await executeBatch(ops);
    return { count: reportsToDelete.length, cutoffDate: cutoff.cutoffDateStr };
  };

  // Auto-delete logic with custom retention days support and loop protection
  useEffect(() => {
    if (state.loading) return;
    
    const mode = state.settings.autoDeleteMode;
    if (mode === 'none') return;
    
    const cutoff = getCleanupCutoffDate(mode, state.settings.autoDeleteDays);
    if (!cutoff) return;

    // Prevent repeated loops if already attempted for this threshold in this session
    const attemptKey = `${mode}_${state.settings.autoDeleteDays || 0}_${cutoff.cutoffDateStr}`;
    if (autoDeleteAttemptedRef.current === attemptKey) return;

    const reportsToDelete = state.reports.filter(r => r.date < cutoff.cutoffDateStr);
    
    if (reportsToDelete.length > 0) {
      console.log(`Auto-deleting ${reportsToDelete.length} reports older than ${cutoff.cutoffDateStr} (retention: ${cutoff.retentionDays} days)`);
      autoDeleteAttemptedRef.current = attemptKey;
      const ops = reportsToDelete.map(r => r.isArrived 
        ? { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } }
        : { type: 'delete', collection: 'reports', id: r.id }
      ) as any[];
      executeBatch(ops).catch(e => {
        console.warn("Auto delete execution skipped or quota exhausted:", e?.message || e);
      });
    }
  }, [state.reports.length, state.settings.autoDeleteMode, state.settings.autoDeleteDays, state.loading]);

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
    
    const mergedSettings = { ...state.settings, ...newSettings };
    // Save settings per device to localStorage for offline cache
    localStorage.setItem('appSettings', JSON.stringify(mergedSettings));
    
    // Update local state directly so UI updates immediately without lag
    setState(prev => ({
      ...prev,
      settings: mergedSettings
    }));

    // Synchronize to the cloud database (Firestore & Supabase) so all other devices follow in realtime!
    await syncSettingsToCloud(mergedSettings);
  };

  const addSupplier = async (supplier: Omit<Supplier, 'id'>): Promise<string> => {
    if (!userId) throw new Error("Not logged in");
    const id = await addRecord('suppliers', { ...supplier, userId });
    const newSup = { ...supplier, id, userId } as Supplier;
    setState(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, newSup]
    }));
    return id;
  };

  const updateSupplier = async (supplier: Supplier) => {
    if (!userId) return;
    const { id, ...data } = supplier;
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.map(s => s.id === id ? { ...s, ...data } : s)
    }));
    await updateRecord('suppliers', id, data);
  };

  const deleteSupplier = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    setState(prev => ({
      ...prev,
      suppliers: prev.suppliers.filter(s => s.id !== id)
    }));
    await deleteRecord('suppliers', id);
  };

  const addProduct = async (product: Omit<Product, 'id'>): Promise<string> => {
    if (!userId) throw new Error("Not logged in");
    const cleanData = Object.fromEntries(Object.entries(product).filter(([_, v]) => v !== undefined));
    const id = await addRecord('products', { ...cleanData, userId });
    const newProd = { ...cleanData, id, userId } as unknown as Product;
    setState(prev => ({
      ...prev,
      products: [...prev.products, newProd]
    }));
    return id;
  };

  const updateProduct = async (product: Product) => {
    if (!userId) return;
    const { id, ...data } = product;
    if (!id) return;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === id ? { ...p, ...cleanData } : p)
    }));
    await updateRecord('products', id, cleanData);
  };

  const updateProductsBatch = async (productsToUpdate: Product[]) => {
    if (!userId || productsToUpdate.length === 0) return;
    const updateMap = new Map<string, Product>();
    const ops = productsToUpdate.map(p => {
      const { id, ...data } = p;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      updateMap.set(id, { ...p, ...cleanData });
      return {
        type: 'update' as const,
        collection: 'products',
        id,
        data: cleanData
      };
    });

    // Optimistic local state update (0ms UI latency!)
    setState(prev => ({
      ...prev,
      products: prev.products.map(p => updateMap.get(p.id) || p)
    }));

    await executeBatch(ops);
  };

  const deleteProduct = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    setState(prev => ({
      ...prev,
      products: prev.products.filter(p => p.id !== id)
    }));
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

  const addReportsBatch = async (
    reportsToAdd: Omit<ReportEntry, 'id'>[],
    reportsToUpdate: ReportEntry[] = []
  ): Promise<{ count: number }> => {
    if (!userId) return { count: 0 };
    if (reportsToAdd.length === 0 && reportsToUpdate.length === 0) return { count: 0 };

    const ops: { type: 'set' | 'update'; collection: string; id: string; data: any }[] = [];
    const newReportsState: ReportEntry[] = [];
    const updatedReportsStateMap = new Map<string, ReportEntry>();

    for (const report of reportsToUpdate) {
      const { id, ...data } = report;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      ops.push({
        type: 'update',
        collection: 'reports',
        id,
        data: cleanData
      });
      updatedReportsStateMap.set(id, report);
    }

    for (const report of reportsToAdd) {
      const cleanData = Object.fromEntries(Object.entries(report).filter(([_, v]) => v !== undefined));
      const id = generateId();
      const finalRecord = {
        ...cleanData,
        id,
        createdAt: Date.now(),
        userId
      } as unknown as ReportEntry;

      ops.push({
        type: 'set',
        collection: 'reports',
        id,
        data: finalRecord
      });
      newReportsState.push(finalRecord);
    }

    // Optimistic local state update (0ms UI latency!)
    setState(prev => {
      const updatedReports = prev.reports.map(r => updatedReportsStateMap.get(r.id) || r);
      return {
        ...prev,
        reports: [...updatedReports, ...newReportsState]
      };
    });

    // Execute atomic batch write in database (single commit!)
    await executeBatch(ops);

    return { count: ops.length };
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
      const updatedRecord: ReportEntry = {
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
      };

      // Optimistic update
      setState(prev => ({
        ...prev,
        reports: prev.reports.map(r => r.id === existingArrived.id ? updatedRecord : r)
      }));

      await updateRecord('reports', existingArrived.id, updatedRecord);
      return;
    }

    const docId = generateId();
    const finalReportData = {
      ...cleanData,
      id: docId,
      ...(existingArrived ? { isArrived: true, arrivedAt: existingArrived.arrivedAt || Date.now() } : {}),
      createdAt: Date.now(),
      userId
    } as unknown as ReportEntry;

    // Optimistic update
    setState(prev => ({
      ...prev,
      reports: [...prev.reports, finalReportData]
    }));

    await addRecord('reports', finalReportData);
  };

  const updateReport = async (report: ReportEntry) => {
    if (!userId) return;
    const { id, ...data } = report;
    const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));

    // Persist to local crosscheck registry immediately so a page reload never loses the checkmark
    if (cleanData.isChecked !== undefined) {
      saveCrosscheckStatus(
        id, 
        Boolean(cleanData.isChecked), 
        typeof cleanData.checkedAt === 'number' ? cleanData.checkedAt : null, 
        typeof cleanData.checkedBy === 'string' ? cleanData.checkedBy : null, 
        report.date, 
        report.productId
      );
    }

    // Optimistic update
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => r.id === id ? { ...r, ...cleanData } : r)
    }));

    await updateRecord('reports', id, cleanData);
  };

  const updateReportsBatch = async (reportsToUpdate: ReportEntry[]) => {
    if (!userId || !reportsToUpdate.length) return;

    // Persist all batch checklist states to local crosscheck registry immediately
    saveCrosscheckBatch(reportsToUpdate.map(r => ({
      id: r.id,
      isChecked: Boolean(r.isChecked),
      checkedAt: r.checkedAt,
      date: r.date,
      productId: r.productId
    })));

    const updateMap = new Map<string, ReportEntry>();
    const ops = reportsToUpdate.map(r => {
      const { id, ...data } = r;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      updateMap.set(id, { ...r, ...cleanData });
      return {
        type: 'update' as const,
        collection: 'reports',
        id,
        data: cleanData
      };
    });

    // Optimistic local state update (0ms UI latency!)
    setState(prev => ({
      ...prev,
      reports: prev.reports.map(r => updateMap.get(r.id) || r)
    }));

    await executeBatch(ops);
  };

  const deleteReport = async (id: string, forceDeleteArrived = false) => {
    if (!id) return;
    if (!userId) return;
    
    if (!forceDeleteArrived) {
      const report = state.reports.find(r => r.id === id);
      if (report && report.isArrived) {
        const updated = { ...report, quantity: 0, isKosongPabrik: false, isArrivedOnly: true };
        setState(prev => ({
          ...prev,
          reports: prev.reports.map(r => r.id === id ? updated : r)
        }));
        await updateRecord('reports', id, {
          quantity: 0,
          isKosongPabrik: false,
          isArrivedOnly: true
        });
        return;
      }
    }
    
    // Optimistic delete
    setState(prev => ({
      ...prev,
      reports: prev.reports.filter(r => r.id !== id)
    }));

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
    const id = generateId();
    const newRecord = { ...cleanData, id, createdAt: Date.now(), userId } as StockOutEntry;
    setState(prev => ({
      ...prev,
      stockOuts: [newRecord, ...prev.stockOuts]
    }));
    await addRecord('stock_outs', newRecord);
  };

  const updateStockOut = async (id: string, entry: Partial<StockOutEntry>) => {
    if (!id || !userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    setState(prev => ({
      ...prev,
      stockOuts: prev.stockOuts.map(s => s.id === id ? { ...s, ...cleanData } : s)
    }));
    await updateRecord('stock_outs', id, cleanData);
  };

  const deleteStockOut = async (id: string) => {
    if (!id || !userId) return;
    setState(prev => ({
      ...prev,
      stockOuts: prev.stockOuts.filter(s => s.id !== id)
    }));
    await deleteRecord('stock_outs', id);
  };

  const addStockOutsBatch = async (
    stockOutsToAdd: Omit<StockOutEntry, 'id'>[],
    productsToUpdate: Product[] = [],
    reportsToAdd: Omit<ReportEntry, 'id'>[] = []
  ) => {
    if (!userId) return;
    const ops: { type: 'set' | 'update'; collection: string; id: string; data: any }[] = [];
    const newStockOuts: StockOutEntry[] = [];

    for (const entry of stockOutsToAdd) {
      const id = generateId();
      const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
      const record = { ...cleanData, id, userId, createdAt: entry.createdAt || Date.now() } as StockOutEntry;
      ops.push({ type: 'set', collection: 'stock_outs', id, data: record });
      newStockOuts.push(record);
    }

    const prodUpdateMap = new Map<string, Product>();
    for (const prod of productsToUpdate) {
      const { id, ...data } = prod;
      const cleanData = Object.fromEntries(Object.entries(data).filter(([_, v]) => v !== undefined));
      ops.push({ type: 'update', collection: 'products', id, data: cleanData });
      prodUpdateMap.set(id, prod);
    }

    const newReports: ReportEntry[] = [];
    for (const r of reportsToAdd) {
      const id = generateId();
      const cleanData = Object.fromEntries(Object.entries(r).filter(([_, v]) => v !== undefined));
      const record = { ...cleanData, id, userId, createdAt: Date.now() } as unknown as ReportEntry;
      ops.push({ type: 'set', collection: 'reports', id, data: record });
      newReports.push(record);
    }

    // Instant optimistic state update (0ms UI latency!)
    setState(prev => ({
      ...prev,
      stockOuts: [...newStockOuts, ...prev.stockOuts],
      products: prev.products.map(p => prodUpdateMap.get(p.id) || p),
      reports: [...prev.reports, ...newReports]
    }));

    await executeBatch(ops);
  };

  const addNearExpired = async (entry: Omit<NearExpiredEntry, 'id'>) => {
    const id = generateId();
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    const newRecord = { ...cleanData, id, createdAt: entry.createdAt || Date.now(), userId: userId || 'public' } as unknown as NearExpiredEntry;
    setState(prev => ({
      ...prev,
      nearExpiredList: [newRecord, ...prev.nearExpiredList]
    }));
    await addRecord('near_expired', newRecord);
    return id;
  };

  const addNearExpiredBatch = async (entries: Omit<NearExpiredEntry, 'id'>[]) => {
    if (entries.length === 0) return;
    const ops: { type: 'set' | 'update'; collection: string; id: string; data: any }[] = [];
    const newRecords: NearExpiredEntry[] = [];
    const baseNow = Date.now();
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      const id = generateId();
      const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
      const createdAt = entry.createdAt ? entry.createdAt + i : baseNow + i;
      const record = { ...cleanData, id, createdAt, userId: userId || 'public' } as unknown as NearExpiredEntry;
      ops.push({ type: 'set', collection: 'near_expired', id, data: record });
      newRecords.push(record);
    }
    setState(prev => ({
      ...prev,
      nearExpiredList: [...newRecords, ...prev.nearExpiredList]
    }));
    await executeBatch(ops);
  };

  const updateNearExpired = async (id: string, entry: Partial<NearExpiredEntry>) => {
    if (!id) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    setState(prev => ({
      ...prev,
      nearExpiredList: prev.nearExpiredList.map(item => item.id === id ? { ...item, ...cleanData } : item)
    }));
    await updateRecord('near_expired', id, cleanData);
  };

  const deleteNearExpired = async (id: string) => {
    if (!id) return;
    setState(prev => ({
      ...prev,
      nearExpiredList: prev.nearExpiredList.filter(item => item.id !== id)
    }));
    await deleteRecord('near_expired', id);
  };

  const deleteMultipleNearExpired = async (ids: string[]) => {
    if (!ids || ids.length === 0) return;
    const idSet = new Set(ids);
    setState(prev => ({
      ...prev,
      nearExpiredList: prev.nearExpiredList.filter(item => !idSet.has(item.id))
    }));
    const ops = ids.map(id => ({ type: 'delete' as const, collection: 'near_expired', id }));
    await executeBatch(ops);
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
      const ops: { type: 'set' | 'update'; collection: string; id: string; data: any }[] = [];
      const supplierMap = new Map(state.suppliers.map(s => [s.name.toLowerCase().trim(), s.id]));
      const addedSuppliers = new Map<string, string>();
      const newSuppliersList: Supplier[] = [];

      // 1. Process explicit new suppliers
      for (let i = 0; i < newSuppliers.length; i++) {
        const ns = newSuppliers[i];
        processedCount++;
        onProgress?.(processedCount, totalItems, `Supplier: ${ns.name}`);
        const key = ns.name.toLowerCase().trim();
        if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
          const id = generateId();
          const record = { id, name: ns.name, userId };
          ops.push({ type: 'set', collection: 'suppliers', id, data: record });
          addedSuppliers.set(key, id);
          newSuppliersList.push(record as Supplier);
        }
      }

      // 2. Auto-create suppliers referenced by products
      for (let i = 0; i < newProducts.length; i++) {
        const np = newProducts[i];
        const key = np.supplierName.toLowerCase().trim();
        if (!supplierMap.has(key) && !addedSuppliers.has(key)) {
          const id = generateId();
          const record = { id, name: np.supplierName, userId };
          ops.push({ type: 'set', collection: 'suppliers', id, data: record });
          addedSuppliers.set(key, id);
          newSuppliersList.push(record as Supplier);
        }
      }

      // 3. Process products
      const newProductsList: Product[] = [];
      const updatedProductsMap = new Map<string, Product>();

      for (let i = 0; i < newProducts.length; i++) {
        const np = newProducts[i];
        processedCount++;
        onProgress?.(processedCount, totalItems, `Produk: ${np.name}`);

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
              const updated = {
                ...existingProduct,
                unit: np.unit,
                supplierId: supplierId,
                bottomStock: newBottomStock
              };
              ops.push({
                type: 'update',
                collection: 'products',
                id: existingProduct.id,
                data: {
                  unit: np.unit,
                  supplierId: supplierId,
                  bottomStock: newBottomStock
                }
              });
              updatedProductsMap.set(existingProduct.id, updated as Product);
            }
          } else {
            const id = generateId();
            const record = {
              id,
              name: np.name,
              unit: np.unit,
              supplierId: supplierId,
              bottomStock: newBottomStock,
              userId
            } as Product;
            ops.push({
              type: 'set',
              collection: 'products',
              id,
              data: record
            });
            newProductsList.push(record);
          }
        } else {
          errors.push(`Could not find or create supplier "${np.supplierName}" for product "${np.name}".`);
        }
      }

      // Optimistic state update immediately (0ms UI latency!)
      setState(prev => ({
        ...prev,
        suppliers: [...prev.suppliers, ...newSuppliersList],
        products: [
          ...prev.products.map(p => updatedProductsMap.get(p.id) || p),
          ...newProductsList
        ]
      }));

      // High-speed batch execution in database
      if (ops.length > 0) {
        await executeBatch(ops);
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
        minStock: p.minStock ?? 5,
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
        isChecked: r.isChecked ?? false,
        checkedAt: r.checkedAt ?? null,
        checkedBy: r.checkedBy ?? null,
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

    // Near Expired
    if (state.nearExpiredList && state.nearExpiredList.length > 0) {
      const records = state.nearExpiredList.map(n => ({
        id: n.id,
        productId: n.productId ?? null,
        productName: n.productName,
        batch: n.batch,
        expiredDate: n.expiredDate,
        supplierId: n.supplierId ?? null,
        supplierName: n.supplierName,
        quantity: n.quantity ?? null,
        unit: n.unit || 'Pcs',
        notes: n.notes ?? null,
        status: n.status || 'pending',
        createdAt: n.createdAt ?? Date.now(),
        userId: 'public'
      }));
      const chunks = chunkArray(records, BATCH_SIZE);
      for (const chunk of chunks) {
        const { error } = await supabase.from('near_expired').upsert(chunk);
        if (error) throw new Error(`Gagal migrasi data expired dekat: ${error.message}`);
      }
      totalCount += records.length;
    }

    // Settings
    const settingsRecord = {
      id: 'public',
      autoDeleteMode: state.settings.autoDeleteMode || 'none',
      autoDeleteDays: state.settings.autoDeleteDays || 3,
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
      const supplierPromises = state.suppliers.map(s => deleteRecord('suppliers', s.id));
      const productPromises = state.products.map(p => deleteRecord('products', p.id));
      const reportPromises = state.reports.map(r => deleteRecord('reports', r.id));
      const nearExpiredPromises = (state.nearExpiredList || []).map(n => deleteRecord('near_expired', n.id));
      
      await Promise.all([...supplierPromises, ...productPromises, ...reportPromises, ...nearExpiredPromises]);
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
      addProduct, updateProduct, updateProductsBatch, deleteProduct, resetAllProductStocks,
      addReport, addReportsBatch, updateReport, updateReportsBatch, deleteReport, deleteMultipleReports, deleteReportsByDateRange, importMasterData, exportData, importData,
      migrateCurrentDataToSupabase,
      resetAllData, updateSettings, addStockOut, updateStockOut, deleteStockOut, addStockOutsBatch,
      addNearExpired, addNearExpiredBatch, updateNearExpired, deleteNearExpired, deleteMultipleNearExpired,
      autoCreateMissingTables,
      getTablesStatus,
      cleanOldReportsNow
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
