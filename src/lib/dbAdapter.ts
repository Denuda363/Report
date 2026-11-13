import { db, handleFirestoreError, OperationType, isFirebaseQuotaExceeded } from './firebase';
import { localDb, generateId } from './localDb';
import { getSupabaseClient, checkSupabaseTableStatus, SUPABASE_SQL_SCHEMA } from './supabase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, setDoc, writeBatch, getDoc, getDocs, query, limit } from 'firebase/firestore';
import { DbProvider, AutoDeleteMode } from '../types';

export const REQUIRED_TABLES = [
  'suppliers', 
  'products', 
  'reports', 
  'stock_outs', 
  'near_expired', 
  'settings', 
  'chat_users', 
  'messages'
] as const;
export type RequiredTableName = typeof REQUIRED_TABLES[number];

export interface TableStatusDetail {
  name: RequiredTableName;
  label: string;
  description: string;
  exists: boolean;
  statusText: string;
}

export interface AllTablesStatusResult {
  provider: DbProvider;
  tables: TableStatusDetail[];
  allReady: boolean;
  message: string;
}

export const TABLE_METADATA: Record<RequiredTableName, { label: string; description: string }> = {
  suppliers: {
    label: 'Master Supplier',
    description: 'Menyimpan daftar vendor & pemasok barang'
  },
  products: {
    label: 'Master Produk',
    description: 'Katalog barang, butom stok, stok real, dan kategori'
  },
  reports: {
    label: 'Laporan Harian & Order',
    description: 'Laporan stok harian, status order, barang datang, & ceklis'
  },
  stock_outs: {
    label: 'Barang Keluar (Pengeluaran)',
    description: 'Riwayat pengeluaran barang dan pengurangan stok'
  },
  near_expired: {
    label: 'Rekap Produk Expired Dekat',
    description: 'Mencatat produk mendekati kedaluwarsa, no batch, expired, dan estimasi supplier'
  },
  settings: {
    label: 'Pengaturan Aplikasi',
    description: 'Konfigurasi tema, auto-delete, dan preferensi'
  },
  chat_users: {
    label: 'Pengguna Chat Realtime',
    description: 'Kehadiran aktif dan identitas kolaborasi tim'
  },
  messages: {
    label: 'Pesan Chat Kolaborasi',
    description: 'Pesan koordinasi dan catatan instan antar staf'
  }
};

export const sanitizeForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  const clean: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      clean[key] = sanitizeForFirestore(val);
    }
  }
  return clean;
};

export const getDbProvider = (): DbProvider => {
  const p = localStorage.getItem('dbProvider') as DbProvider;
  if (p === 'firebase' || p === 'local' || p === 'supabase') return p;
  if (localStorage.getItem('useLocalDb') === 'true') return 'local';
  // Default to Firebase Firestore
  return 'firebase';
};

export const setDbProviderSetting = (provider: DbProvider) => {
  localStorage.setItem('dbProvider', provider);
  localStorage.setItem('useLocalDb', provider === 'local' ? 'true' : 'false');
};

export const isLocalDb = () => getDbProvider() === 'local';
export const isSupabaseDb = () => getDbProvider() === 'supabase';
export const isFirebaseDb = () => getDbProvider() === 'firebase';

export const setLocalDbSetting = (value: boolean) => {
  setDbProviderSetting(value ? 'local' : 'firebase');
};

const notifyLocalChange = (storeName: string) => {
  window.dispatchEvent(new Event(`localDbChange_${storeName}`));
};

const notifySupabaseChange = (tableName: string) => {
  window.dispatchEvent(new Event(`supabaseChange_${tableName}`));
};

export { generateId };

// Generic subscribe
export const subscribeToCollection = (
  collectionName: string, 
  callback: (data: any[]) => void
) => {
  const provider = getDbProvider();

  if (provider === 'local') {
    // Initial fetch from IndexedDB
    const fetch = async () => {
      try {
        const store = localDb[collectionName as keyof typeof localDb];
        if (!store) return callback([]);
        const keys = await store.keys();
        const items = await Promise.all(keys.map(k => store.getItem(k)));
        const mapped = items.map((item: any) => ({
          ...item,
          isChecked: Boolean(item?.isChecked !== undefined ? item?.isChecked : item?.ischecked),
          checkedAt: item?.checkedAt || item?.checkedat || null,
          checkedBy: item?.checkedBy || item?.checkedby || null
        })).filter((item: any) => item && !String(item.id || '').startsWith('_'));
        callback(mapped);
      } catch (e) {
        console.error(`[LocalDB] Error reading ${collectionName}:`, e);
        callback([]);
      }
    };
    fetch();
    
    // Listen to local changes
    const listener = () => fetch();
    window.addEventListener(`localDbChange_${collectionName}`, listener);
    return () => window.removeEventListener(`localDbChange_${collectionName}`, listener);
  } 
  
  if (provider === 'supabase') {
    const supabase = getSupabaseClient();
    let isSubscribed = true;
    let fetchTimeout: any;

    const fetchSupabase = async () => {
      try {
        const { data, error } = await supabase.from(collectionName).select('*');
        if (!isSubscribed) return;
        if (!error && data) {
          const mapped = data.map((item: any) => ({
            ...item,
            isChecked: Boolean(item.isChecked !== undefined ? item.isChecked : item.ischecked),
            checkedAt: item.checkedAt || item.checkedat || null,
            checkedBy: item.checkedBy || item.checkedby || null
          })).filter((item: any) => item && !String(item.id || '').startsWith('_'));
          callback(mapped);
        } else if (error) {
          // Table doesn't exist yet in Supabase or schema error
          if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
            console.warn(`[Supabase] Tabel '${collectionName}' belum dibuat di Supabase.`);
          } else {
            console.warn(`[Supabase] Error fetching ${collectionName}:`, error.message);
          }
          callback([]);
        }
      } catch (e) {
        console.error(`[Supabase] Exception fetching ${collectionName}:`, e);
        if (isSubscribed) callback([]);
      }
    };

    const debouncedFetch = () => {
      if (fetchTimeout) clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        if (isSubscribed) fetchSupabase();
      }, 300); // 300ms debounce
    };

    fetchSupabase();

    // Listen to immediate mutations in this window
    const localListener = () => debouncedFetch();
    window.addEventListener(`supabaseChange_${collectionName}`, localListener);

    // Live subscription via Supabase Realtime channel
    const channelId = `realtime_${collectionName}_${Math.random().toString(36).substring(2, 8)}`;
    const channel = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: collectionName },
        () => {
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      isSubscribed = false;
      if (fetchTimeout) clearTimeout(fetchTimeout);
      window.removeEventListener(`supabaseChange_${collectionName}`, localListener);
      supabase.removeChannel(channel).catch(() => {});
    };
  }

  // Firebase provider
  const colRef = collectionName === 'settings' ? doc(db, 'settings', 'public') : collection(db, collectionName);
  if (collectionName === 'settings') {
    return onSnapshot(colRef as any, (docSnap: any) => {
      if (docSnap.exists()) callback([{ id: 'public', ...docSnap.data() }]);
      else callback([]);
    }, (err) => {
      console.warn(`[Firestore] settings onSnapshot error:`, err);
      callback([]);
    });
  }
  return onSnapshot(colRef as any, (snapshot: any) => {
    const docs = snapshot.docs
      .map((d: any) => {
        const raw = d.data() || {};
        return {
          ...raw,
          id: d.id,
          isChecked: Boolean(raw.isChecked !== undefined ? raw.isChecked : raw.ischecked),
          checkedAt: raw.checkedAt || raw.checkedat || null,
          checkedBy: raw.checkedBy || raw.checkedby || null
        };
      })
      .filter((item: any) => item && !String(item.id || '').startsWith('_'));
    callback(docs);
  }, (err) => {
    console.warn(`[Firestore] ${collectionName} onSnapshot error:`, err);
    callback([]);
  });
};

export const addRecord = async (collectionName: string, data: any) => {
  const provider = getDbProvider();

  if (provider === 'local') {
    const id = data.id || generateId();
    const record = { ...data, id };
    await localDb[collectionName as keyof typeof localDb].setItem(id, record);
    notifyLocalChange(collectionName);
    return id;
  }

  if (provider === 'supabase') {
    const supabase = getSupabaseClient();
    const id = data.id || generateId();
    const record = { id, ...data };
    const { error } = await supabase.from(collectionName).insert([record]);
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        throw new Error(`Tabel '${collectionName}' belum dibuat di database Supabase. Silakan buka tab Pengaturan untuk menjalankan Script Setup Tabel.`);
      }
      throw new Error(error.message || `Gagal menyimpan data ke Supabase (${collectionName})`);
    }
    notifySupabaseChange(collectionName);
    return id;
  }

  // Firebase
  if (isFirebaseQuotaExceeded()) {
    throw new Error('Batas kuota harian Firebase Firestore gratis telah tercapai.');
  }
  try {
    const cleanData = sanitizeForFirestore(data);
    if (cleanData.id) {
      const docId = cleanData.id;
      await setDoc(doc(db, collectionName, docId), cleanData);
      return docId;
    }
    const ref = await addDoc(collection(db, collectionName), cleanData);
    return ref.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, collectionName);
    throw error;
  }
};

export const updateRecord = async (collectionName: string, id: string, data: any) => {
  const provider = getDbProvider();

  if (provider === 'local') {
    const store = localDb[collectionName as keyof typeof localDb];
    if (store) {
      const existing: any = await store.getItem(id);
      if (existing) {
        await store.setItem(id, { ...existing, ...data });
      } else {
        await store.setItem(id, { id, ...data });
      }
      notifyLocalChange(collectionName);
    }
    return;
  }

  if (provider === 'supabase') {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(collectionName).upsert({ id, ...data });
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        throw new Error(`Tabel '${collectionName}' belum dibuat di database Supabase. Silakan buka tab Pengaturan untuk menjalankan Setup SQL.`);
      }
      throw new Error(error.message || `Gagal menyimpan update data di Supabase (${collectionName})`);
    }
    notifySupabaseChange(collectionName);
    return;
  }

  // Firebase - using setDoc with merge: true ensures safety if document does not exist yet
  if (isFirebaseQuotaExceeded()) {
    throw new Error('Batas kuota harian Firebase Firestore gratis telah tercapai.');
  }
  try {
    const cleanData = sanitizeForFirestore(data);
    await setDoc(doc(db, collectionName, id), cleanData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${collectionName}/${id}`);
    throw error;
  }
};

export const deleteRecord = async (collectionName: string, id: string) => {
  const provider = getDbProvider();

  if (provider === 'local') {
    await localDb[collectionName as keyof typeof localDb].removeItem(id);
    notifyLocalChange(collectionName);
    return;
  }

  if (provider === 'supabase') {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(collectionName).delete().eq('id', id);
    if (error) throw new Error(error.message);
    notifySupabaseChange(collectionName);
    return;
  }

  // Firebase
  if (isFirebaseQuotaExceeded()) {
    throw new Error('Batas kuota harian Firebase Firestore gratis telah tercapai.');
  }
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${collectionName}/${id}`);
    throw error;
  }
};

export const executeBatch = async (
  operations: { type: 'delete' | 'update' | 'set', collection: string, id: string, data?: any }[]
) => {
  const provider = getDbProvider();

  if (provider === 'local') {
    const affectedCols = new Set<string>();
    for (const op of operations) {
      affectedCols.add(op.collection);
      if (op.type === 'delete') {
        await localDb[op.collection as keyof typeof localDb].removeItem(op.id);
      } else if (op.type === 'update') {
        const existing: any = await localDb[op.collection as keyof typeof localDb].getItem(op.id);
        if (existing) {
          await localDb[op.collection as keyof typeof localDb].setItem(op.id, { ...existing, ...op.data });
        }
      } else if (op.type === 'set') {
        await localDb[op.collection as keyof typeof localDb].setItem(op.id, { id: op.id, ...op.data });
      }
    }
    affectedCols.forEach(col => notifyLocalChange(col));
    return;
  }

  if (provider === 'supabase') {
    const supabase = getSupabaseClient();
    const affectedCols = new Set<string>();

    // Group operations by collection and type to minimize HTTP requests where possible
    const deletesByCol: Record<string, string[]> = {};
    const otherOps: any[] = [];

    for (const op of operations) {
      affectedCols.add(op.collection);
      if (op.type === 'delete') {
        if (!deletesByCol[op.collection]) deletesByCol[op.collection] = [];
        deletesByCol[op.collection].push(op.id);
      } else {
        otherOps.push(op);
      }
    }
    
    // 1. Execute bulk deletes (very fast, 1 request per collection)
    for (const [col, ids] of Object.entries(deletesByCol)) {
      // Supabase IN filter has limits too, chunk the IDs if there are too many
      const ID_CHUNK_SIZE = 200;
      for (let i = 0; i < ids.length; i += ID_CHUNK_SIZE) {
        const chunk = ids.slice(i, i + ID_CHUNK_SIZE);
        await supabase.from(col).delete().in('id', chunk);
      }
    }
    
    // 2. Execute updates and sets in chunks to prevent overloading the network
    const CHUNK_SIZE = 20; // smaller chunk for parallel HTTP requests
    for (let i = 0; i < otherOps.length; i += CHUNK_SIZE) {
      const chunk = otherOps.slice(i, i + CHUNK_SIZE);
      await Promise.all(chunk.map(op => {
        if (op.type === 'update') {
          return supabase.from(op.collection).upsert({ id: op.id, ...op.data });
        } else if (op.type === 'set') {
          return supabase.from(op.collection).upsert({ id: op.id, ...op.data });
        }
      }));
    }

    affectedCols.forEach(col => notifySupabaseChange(col));
    return;
  }

  // Firebase batch
  if (isFirebaseQuotaExceeded()) {
    throw new Error('Batas kuota harian Firebase Firestore gratis telah tercapai.');
  }
  let batch = writeBatch(db);
  let count = 0;
  const batches = [];
  
  for (const op of operations) {
    const ref = doc(db, op.collection, op.id);
    if (op.type === 'delete') {
      batch.delete(ref);
    } else if (op.type === 'update' || op.type === 'set') {
      const clean = sanitizeForFirestore(op.data || {});
      batch.set(ref, clean, { merge: true });
    }
    count++;
    if (count === 500) {
      batches.push(batch.commit());
      batch = writeBatch(db);
      count = 0;
    }
  }
  if (count > 0) batches.push(batch.commit());
  try {
    await Promise.all(batches);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'batch');
    throw error;
  }
};

/**
 * Otomatis membuat tabel/koleksi di Firebase Firestore jika belum ada
 */
export const ensureFirebaseCollections = async (): Promise<{
  created: RequiredTableName[];
  skipped: RequiredTableName[];
  details: string;
}> => {
  if (isFirebaseQuotaExceeded()) {
    throw new Error('Batas kuota harian Firebase Firestore gratis telah tercapai.');
  }

  const created: RequiredTableName[] = [];
  const skipped: RequiredTableName[] = [];

  for (const table of REQUIRED_TABLES) {
    try {
      if (table === 'settings') {
        const settingsRef = doc(db, 'settings', 'public');
        const snap = await getDoc(settingsRef);
        if (!snap.exists()) {
          await setDoc(settingsRef, {
            id: 'public',
            autoDeleteMode: 'none',
            autoDeleteDays: 3,
            navbarPosition: 'bottom',
            theme: 'green',
            dbProvider: 'firebase',
            initializedAt: Date.now(),
            updatedAt: Date.now(),
            isSystemConfig: true
          });
          created.push('settings');
        } else {
          skipped.push('settings');
        }
      } else {
        // Buat dokumen skema eksplisit agar koleksi langsung terdaftar di Google Cloud/Firebase Console
        const schemaRef = doc(db, table, '_schema');
        await setDoc(schemaRef, {
          id: '_schema',
          tableName: table,
          label: TABLE_METADATA[table].label,
          description: TABLE_METADATA[table].description,
          isSystemTable: true,
          initializedAt: Date.now(),
          status: 'ready'
        }, { merge: true });
        created.push(table);
      }
    } catch (err: any) {
      console.warn(`[Firestore Auto-Table] Gagal inisialisasi tabel ${table}:`, err?.message || err);
      skipped.push(table);
    }
  }

  return {
    created,
    skipped,
    details: skipped.length === 0
      ? `Semua ${REQUIRED_TABLES.length} tabel Firestore (${created.join(', ')}) berhasil dibuat dan aktif.`
      : `${created.length} tabel dibuat, ${skipped.length} dilewati.`
  };
};

/**
 * Otomatis inisialisasi store IndexedDB lokal jika belum ada
 */
export const ensureLocalDbStores = async (): Promise<{
  created: RequiredTableName[];
  details: string;
}> => {
  const created: RequiredTableName[] = [];
  for (const table of REQUIRED_TABLES) {
    const store = localDb[table === 'stock_outs' ? 'stockOuts' : table as keyof typeof localDb];
    if (store) {
      try {
        await store.setItem('_schema', {
          id: '_schema',
          tableName: table,
          label: TABLE_METADATA[table].label,
          initializedAt: Date.now(),
          isSystemStore: true
        });
        created.push(table);
      } catch (e) {
        console.warn(`[LocalDB Auto-Table] Store ${table} notice:`, e);
      }
    }
  }
  return {
    created,
    details: `Semua ${REQUIRED_TABLES.length} tabel lokal IndexedDB (${created.join(', ')}) siap digunakan.`
  };
};

/**
 * Cek dan coba buat tabel otomatis di Supabase
 */
export const ensureSupabaseTables = async (): Promise<{
  created: RequiredTableName[];
  missing: RequiredTableName[];
  details: string;
}> => {
  const statusRes = await checkSupabaseTableStatus();
  const created: RequiredTableName[] = [];
  const missing: RequiredTableName[] = [];

  for (const table of REQUIRED_TABLES) {
    if (statusRes.tables[table] === true) {
      created.push(table);
    } else {
      missing.push(table);
    }
  }

  // Jika terdapat tabel yang belum dibuat, coba jalankan RPC exec_sql otomatis bila tersedia
  if (missing.length > 0) {
    const supabase = getSupabaseClient();
    try {
      const { error } = await supabase.rpc('exec_sql', { sql: SUPABASE_SQL_SCHEMA });
      if (!error) {
        return {
          created: [...REQUIRED_TABLES],
          missing: [],
          details: 'Semua tabel Supabase berhasil dibuat otomatis secara langsung.'
        };
      }
    } catch {
      // RPC exec_sql belum ada di instance Supabase pengguna
    }
  }

  return {
    created,
    missing,
    details: missing.length === 0
      ? `Semua ${REQUIRED_TABLES.length} tabel Supabase sudah lengkap (${created.join(', ')}).`
      : `Terdapat ${missing.length} tabel belum dibuat (${missing.join(', ')}). Buka Pengaturan untuk menjalankan Setup SQL.`
  };
};

/**
 * Fungsi utama otomatis membuat tabel yang dibutuhkan jika belum terdapat tabel di database aktif
 */
export const ensureDatabaseTables = async (targetProvider?: DbProvider): Promise<{
  success: boolean;
  provider: DbProvider;
  createdTables: RequiredTableName[];
  missingTables?: RequiredTableName[];
  message: string;
}> => {
  const provider = targetProvider || getDbProvider();

  if (provider === 'firebase') {
    try {
      const res = await ensureFirebaseCollections();
      return {
        success: res.created.length > 0,
        provider: 'firebase',
        createdTables: res.created,
        missingTables: res.skipped,
        message: res.details
      };
    } catch (e: any) {
      return {
        success: false,
        provider: 'firebase',
        createdTables: [],
        missingTables: [...REQUIRED_TABLES],
        message: e.message || 'Gagal membuat tabel di Firebase Firestore.'
      };
    }
  }

  if (provider === 'local') {
    const res = await ensureLocalDbStores();
    return {
      success: true,
      provider: 'local',
      createdTables: res.created,
      message: res.details
    };
  }

  if (provider === 'supabase') {
    const res = await ensureSupabaseTables();
    return {
      success: res.missing.length === 0,
      provider: 'supabase',
      createdTables: res.created,
      missingTables: res.missing,
      message: res.details
    };
  }

  return {
    success: true,
    provider,
    createdTables: [...REQUIRED_TABLES],
    message: 'Tabel database siap digunakan.'
  };
};

/**
 * Cek status detail keberadaan semua tabel di database
 */
export const checkDatabaseTablesStatus = async (targetProvider?: DbProvider): Promise<AllTablesStatusResult> => {
  const provider = targetProvider || getDbProvider();
  const tables: TableStatusDetail[] = [];

  if (provider === 'local') {
    for (const name of REQUIRED_TABLES) {
      const store = localDb[name === 'stock_outs' ? 'stockOuts' : name as keyof typeof localDb];
      let exists = false;
      try {
        if (store) {
          const keys = await store.keys();
          exists = keys.length > 0 || !!(await store.getItem('_schema'));
        }
      } catch {
        exists = false;
      }
      tables.push({
        name,
        label: TABLE_METADATA[name].label,
        description: TABLE_METADATA[name].description,
        exists,
        statusText: exists ? 'Tersedia di IndexedDB' : 'Belum diinisialisasi'
      });
    }
    const allReady = tables.every(t => t.exists);
    return {
      provider: 'local',
      tables,
      allReady,
      message: allReady ? 'Semua tabel lokal IndexedDB aktif.' : 'Beberapa tabel lokal belum diinisialisasi.'
    };
  }

  if (provider === 'supabase') {
    const res = await checkSupabaseTableStatus();
    for (const name of REQUIRED_TABLES) {
      const exists = res.tables[name] === true;
      tables.push({
        name,
        label: TABLE_METADATA[name].label,
        description: TABLE_METADATA[name].description,
        exists,
        statusText: exists ? 'Tersedia di PostgreSQL Supabase' : 'Tabel belum dibuat'
      });
    }
    const allReady = tables.every(t => t.exists);
    return {
      provider: 'supabase',
      tables,
      allReady,
      message: allReady ? 'Semua tabel Supabase siap digunakan.' : 'Terdapat tabel Supabase yang belum dibuat.'
    };
  }

  // Firebase provider
  for (const name of REQUIRED_TABLES) {
    let exists = false;
    try {
      if (name === 'settings') {
        const snap = await getDoc(doc(db, 'settings', 'public'));
        exists = snap.exists();
      } else {
        const schemaSnap = await getDoc(doc(db, name, '_schema'));
        if (schemaSnap.exists()) {
          exists = true;
        } else {
          // Check if at least 1 real record exists in this collection
          const sampleSnap = await getDocs(query(collection(db, name), limit(1)));
          exists = !sampleSnap.empty;
        }
      }
    } catch {
      // If permission or quota issue, assume checking failed
      exists = false;
    }
    tables.push({
      name,
      label: TABLE_METADATA[name].label,
      description: TABLE_METADATA[name].description,
      exists,
      statusText: exists ? 'Tersedia di Firestore' : 'Belum terdaftar'
    });
  }

  const allReady = tables.every(t => t.exists);
  return {
    provider: 'firebase',
    tables,
    allReady,
    message: allReady ? `Semua ${REQUIRED_TABLES.length} koleksi/tabel Firestore siap digunakan.` : 'Beberapa tabel belum dibuat di Firestore.'
  };
};

/**
 * Berlangganan perubahan pengaturan pembersih data secara real-time antar semua perangkat.
 * Menggunakan direct document listener pada Firestore 'settings/public' dan Supabase realtime.
 */
export const subscribeToSettings = (
  callback: (settings: { autoDeleteMode?: AutoDeleteMode; autoDeleteDays?: number; theme?: string; dbPinHash?: string }) => void
): (() => void) => {
  const unsubscribers: (() => void)[] = [];

  // 1. Direct Firestore realtime listener on 'settings/public'
  try {
    const settingsDocRef = doc(db, 'settings', 'public');
    const unsubFirestore = onSnapshot(settingsDocRef, (docSnap) => {
      const exists = typeof docSnap.exists === 'function' ? docSnap.exists() : Boolean(docSnap.exists);
      if (exists) {
        const data = docSnap.data();
        if (data) {
          callback({
            autoDeleteMode: data.autoDeleteMode as AutoDeleteMode,
            autoDeleteDays: data.autoDeleteDays !== undefined ? Number(data.autoDeleteDays) : undefined,
            theme: data.theme,
            dbPinHash: data.dbPinHash || data.dbpinhash
          });
        }
      }
    }, (err) => {
      console.warn('[Firestore Settings Listener] Notice:', err?.message || err);
    });
    unsubscribers.push(unsubFirestore);
  } catch (e) {
    console.warn('[Firestore Settings Setup] Notice:', e);
  }

  // 2. Supabase realtime listener (if active)
  if (isSupabaseDb()) {
    try {
      const supabase = getSupabaseClient();
      const channelId = `realtime_settings_${Math.random().toString(36).substring(2, 8)}`;
      const channel = supabase
        .channel(channelId)
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'settings' },
          async () => {
            try {
              const { data } = await supabase.from('settings').select('*').eq('id', 'public').maybeSingle();
              if (data) {
                callback({
                  autoDeleteMode: data.autoDeleteMode as AutoDeleteMode,
                  autoDeleteDays: data.autoDeleteDays !== undefined ? Number(data.autoDeleteDays) : undefined,
                  theme: data.theme,
                  dbPinHash: data.dbPinHash || data.dbpinhash
                });
              }
            } catch {}
          }
        )
        .subscribe();
      unsubscribers.push(() => {
        supabase.removeChannel(channel).catch(() => {});
      });
    } catch (e) {
      console.warn('[Supabase Settings Listener] Notice:', e);
    }
  }

  // 3. Local BroadcastChannel for instant cross-tab / cross-window sync on the same device
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('dailyreport_settings_sync');
      bc.onmessage = (event) => {
        if (event.data) {
          callback(event.data);
        }
      };
      unsubscribers.push(() => {
        bc.close();
      });
    }
  } catch {}

  return () => {
    unsubscribers.forEach(unsub => {
      try { unsub(); } catch {}
    });
  };
};

/**
 * Menyinkronkan perubahan pengaturan pembersih data & keamanan ke seluruh database cloud (Firestore & Supabase)
 * dan broadcast local sehingga perangkat lain langsung mengikuti secara real-time.
 */
export const syncSettingsToCloud = async (
  newSettings: { autoDeleteMode?: AutoDeleteMode; autoDeleteDays?: number; theme?: string; dbPinHash?: string }
): Promise<void> => {
  const payload: Record<string, any> = {
    id: 'public',
    updatedAt: Date.now()
  };
  if (newSettings.autoDeleteMode !== undefined) {
    payload.autoDeleteMode = newSettings.autoDeleteMode;
  }
  if (newSettings.autoDeleteDays !== undefined) {
    payload.autoDeleteDays = Number(newSettings.autoDeleteDays);
  }
  if (newSettings.theme !== undefined) {
    payload.theme = newSettings.theme;
  }
  if (newSettings.dbPinHash !== undefined) {
    payload.dbPinHash = newSettings.dbPinHash;
  }

  // 1. Broadcast ke tab lokal pada perangkat yang sama
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const bc = new BroadcastChannel('dailyreport_settings_sync');
      bc.postMessage(payload);
      bc.close();
    }
  } catch {}

  // 2. Selalu simpan ke Google Cloud Firestore (basis database cloud utama)
  try {
    const clean = sanitizeForFirestore(payload);
    await setDoc(doc(db, 'settings', 'public'), clean, { merge: true });
  } catch (err: any) {
    console.warn('[Cloud Sync Firestore] Notice:', err?.message || err);
  }

  // 3. Simpan juga ke Supabase jika instance Supabase aktif
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from('settings').upsert({
      id: 'public',
      ...payload
    });
    if (error && payload.dbPinHash !== undefined) {
      // Fallback if older Supabase table schema doesn't yet have "dbPinHash" column
      const { dbPinHash: _ignored, ...restPayload } = payload;
      await supabase.from('settings').upsert({
        id: 'public',
        ...restPayload
      });
    }
  } catch {}

  // 4. Update local IndexedDB
  try {
    const store = localDb.settings;
    if (store) {
      const existing: any = await store.getItem('public');
      await store.setItem('public', { ...(existing || {}), ...payload });
      notifyLocalChange('settings');
    }
  } catch {}
};

