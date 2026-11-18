import { createClient, SupabaseClient } from '@supabase/supabase-js';

export const DEFAULT_SUPABASE_URL = 'https://fxmqvpfepatumdzzlqzt.supabase.co';
export const DEFAULT_SUPABASE_KEY = 'sb_publishable_hM3Hx_MCbdQmCOefLD7ZeA_WLjfDL-7';

export const normalizeSupabaseUrl = (rawUrl: string): string => {
  if (!rawUrl) return '';
  let url = rawUrl.trim();
  url = url.replace(/\/rest\/v1\/?$/, '');
  url = url.replace(/\/$/, '');
  return url;
};

export const getSupabaseConfig = () => {
  const customUrl = localStorage.getItem('supabase_url');
  const customKey = localStorage.getItem('supabase_key');
  return {
    url: normalizeSupabaseUrl(customUrl || DEFAULT_SUPABASE_URL),
    key: (customKey || DEFAULT_SUPABASE_KEY).trim()
  };
};

export const setSupabaseConfig = (url: string, key: string) => {
  const cleanUrl = normalizeSupabaseUrl(url);
  const cleanKey = key.trim();
  localStorage.setItem('supabase_url', cleanUrl);
  localStorage.setItem('supabase_key', cleanKey);
  // Reinitialize client
  cachedClient = null;
};

let cachedClient: SupabaseClient | null = null;

export const getSupabaseClient = (): SupabaseClient => {
  if (cachedClient) return cachedClient;
  const { url, key } = getSupabaseConfig();
  cachedClient = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true
    }
  });
  return cachedClient;
};

// SQL Schema for one-click setup
export const SUPABASE_SQL_SCHEMA = `-- ==========================================
-- SCRIPT SETUP LENGKAP SUPABASE (Daily)
-- Jalankan di: Supabase Dashboard -> SQL Editor -> New Query -> Run
-- ==========================================

-- 1. Tabel Suppliers
CREATE TABLE IF NOT EXISTS public.suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS "userId" TEXT DEFAULT 'public';

-- 2. Tabel Products
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "supplierId" TEXT NOT NULL DEFAULT '',
  "alternativeSupplierIds" JSONB DEFAULT '[]'::jsonb,
  unit TEXT NOT NULL DEFAULT 'pcs',
  "bottomStock" NUMERIC,
  "minStock" NUMERIC DEFAULT 5,
  "isKosongPabrik" BOOLEAN DEFAULT FALSE,
  "kosongPabrikDate" BIGINT,
  stock NUMERIC DEFAULT 0,
  location TEXT,
  category TEXT,
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "alternativeSupplierIds" JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "bottomStock" NUMERIC;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "minStock" NUMERIC DEFAULT 5;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "isKosongPabrik" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "kosongPabrikDate" BIGINT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock NUMERIC DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS "userId" TEXT DEFAULT 'public';

-- 3. Tabel Reports (Laporan Barang & Order)
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  quantity NUMERIC DEFAULT 0,
  "createdAt" BIGINT,
  "isOrdered" BOOLEAN DEFAULT FALSE,
  "isArrived" BOOLEAN DEFAULT FALSE,
  "isKosongPabrik" BOOLEAN DEFAULT FALSE,
  "isReorder" BOOLEAN DEFAULT FALSE,
  "reorderQty" NUMERIC,
  "reorderReason" TEXT,
  notes TEXT,
  "isWarningStock" BOOLEAN DEFAULT FALSE,
  "isArrivedOnly" BOOLEAN DEFAULT FALSE,
  "arrivedAt" BIGINT,
  "arrivedSupplierId" TEXT,
  "arrivedQty" NUMERIC,
  "isChecked" BOOLEAN DEFAULT FALSE,
  "checkedAt" BIGINT,
  "checkedBy" TEXT,
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS quantity NUMERIC DEFAULT 0;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "createdAt" BIGINT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isOrdered" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isArrived" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isKosongPabrik" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isReorder" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "reorderQty" NUMERIC;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "reorderReason" TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isWarningStock" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isArrivedOnly" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "arrivedAt" BIGINT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "arrivedSupplierId" TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "arrivedQty" NUMERIC;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "isChecked" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "checkedAt" BIGINT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "checkedBy" TEXT;
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS "userId" TEXT DEFAULT 'public';

-- 4. Tabel Stock Outs (Barang Keluar)
CREATE TABLE IF NOT EXISTS public.stock_outs (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  quantity NUMERIC NOT NULL,
  notes TEXT,
  "createdAt" BIGINT,
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.stock_outs ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.stock_outs ADD COLUMN IF NOT EXISTS "createdAt" BIGINT;
ALTER TABLE public.stock_outs ADD COLUMN IF NOT EXISTS "userId" TEXT DEFAULT 'public';

-- 5. Tabel Settings (Pengaturan Aplikasi)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'public',
  "autoDeleteMode" TEXT DEFAULT 'none',
  "autoDeleteDays" INTEGER DEFAULT 3,
  "navbarPosition" TEXT DEFAULT 'bottom',
  theme TEXT DEFAULT 'default',
  "useLocalDb" BOOLEAN DEFAULT FALSE,
  "dbProvider" TEXT DEFAULT 'supabase',
  "dbPinHash" TEXT,
  "companyName" TEXT,
  "companyTagline" TEXT,
  "companyAddress" TEXT,
  "companyPhone" TEXT,
  "companyEmail" TEXT,
  "companyIcon" TEXT,
  "updatedAt" BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "autoDeleteMode" TEXT DEFAULT 'none';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "autoDeleteDays" INTEGER DEFAULT 3;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "navbarPosition" TEXT DEFAULT 'bottom';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS theme TEXT DEFAULT 'default';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "useLocalDb" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "dbProvider" TEXT DEFAULT 'supabase';
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "dbPinHash" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyName" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyTagline" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyPhone" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyEmail" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "companyIcon" TEXT;
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS "updatedAt" BIGINT;

-- 6. Tabel Near Expired (Rekap Produk Expired Dekat)
CREATE TABLE IF NOT EXISTS public.near_expired (
  id TEXT PRIMARY KEY,
  "productId" TEXT,
  "productName" TEXT NOT NULL,
  batch TEXT NOT NULL,
  "expiredDate" TEXT NOT NULL,
  "supplierId" TEXT,
  "supplierName" TEXT NOT NULL,
  quantity NUMERIC,
  unit TEXT DEFAULT 'Pcs',
  notes TEXT,
  "createdAt" BIGINT,
  status TEXT DEFAULT 'pending',
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS "productId" TEXT;
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS "supplierId" TEXT;
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS quantity NUMERIC;
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS unit TEXT DEFAULT 'Pcs';
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS "createdAt" BIGINT;
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.near_expired ADD COLUMN IF NOT EXISTS "userId" TEXT DEFAULT 'public';

-- 7. Tabel Chat Users (Pengguna Chat Realtime)
CREATE TABLE IF NOT EXISTS public.chat_users (
  id TEXT PRIMARY KEY,
  "displayName" TEXT NOT NULL,
  "isOnline" BOOLEAN DEFAULT FALSE,
  "lastSeen" BIGINT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.chat_users ADD COLUMN IF NOT EXISTS "isOnline" BOOLEAN DEFAULT FALSE;
ALTER TABLE public.chat_users ADD COLUMN IF NOT EXISTS "lastSeen" BIGINT;

-- 8. Tabel Messages (Pesan Kolaborasi)
CREATE TABLE IF NOT EXISTS public.messages (
  id TEXT PRIMARY KEY,
  "chatId" TEXT,
  "senderId" TEXT NOT NULL,
  "receiverId" TEXT NOT NULL,
  text TEXT NOT NULL,
  "createdAt" BIGINT,
  read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "chatId" TEXT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS "createdAt" BIGINT;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT FALSE;

-- INDEX PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_products_supplier ON public.products("supplierId");
CREATE INDEX IF NOT EXISTS idx_reports_date ON public.reports(date);
CREATE INDEX IF NOT EXISTS idx_reports_product ON public.reports("productId");
CREATE INDEX IF NOT EXISTS idx_stock_outs_date ON public.stock_outs(date);
CREATE INDEX IF NOT EXISTS idx_near_expired_date ON public.near_expired("expiredDate");
CREATE INDEX IF NOT EXISTS idx_messages_chat ON public.messages("chatId");

-- AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.near_expired ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- IZINKAN AKSES PENUH (BACA, TULIS, UPDATE, HAPUS) UNTUK API KEY PUBLIK
DROP POLICY IF EXISTS "Public full access suppliers" ON public.suppliers;
CREATE POLICY "Public full access suppliers" ON public.suppliers FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access products" ON public.products;
CREATE POLICY "Public full access products" ON public.products FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access reports" ON public.reports;
CREATE POLICY "Public full access reports" ON public.reports FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access stock_outs" ON public.stock_outs;
CREATE POLICY "Public full access stock_outs" ON public.stock_outs FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access settings" ON public.settings;
CREATE POLICY "Public full access settings" ON public.settings FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access near_expired" ON public.near_expired;
CREATE POLICY "Public full access near_expired" ON public.near_expired FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access chat_users" ON public.chat_users;
CREATE POLICY "Public full access chat_users" ON public.chat_users FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access messages" ON public.messages;
CREATE POLICY "Public full access messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);

-- PUBLIKASI REALTIME UNTUK SEMUA TABEL
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.suppliers;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.stock_outs;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.near_expired;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_users;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
`;

export const REQUIRED_SUPABASE_COLUMNS: Record<keyof TableStatus, string[]> = {
  suppliers: ['id', 'name', 'userId'],
  products: [
    'id', 'name', 'supplierId', 'alternativeSupplierIds', 'unit',
    'bottomStock', 'minStock', 'isKosongPabrik', 'kosongPabrikDate',
    'stock', 'location', 'category', 'userId'
  ],
  reports: [
    'id', 'date', 'productId', 'quantity', 'createdAt',
    'isOrdered', 'isArrived', 'isKosongPabrik', 'isReorder',
    'reorderQty', 'reorderReason', 'notes', 'isWarningStock',
    'isArrivedOnly', 'arrivedAt', 'arrivedSupplierId', 'arrivedQty',
    'isChecked', 'checkedAt', 'checkedBy', 'userId'
  ],
  stock_outs: ['id', 'date', 'productId', 'quantity', 'notes', 'createdAt', 'userId'],
  settings: [
    'id', 'autoDeleteMode', 'autoDeleteDays', 'navbarPosition',
    'theme', 'useLocalDb', 'dbProvider', 'dbPinHash',
    'companyName', 'companyTagline', 'companyAddress', 'companyPhone', 'companyEmail', 'companyIcon',
    'updatedAt'
  ],
  near_expired: [
    'id', 'productId', 'productName', 'batch', 'expiredDate',
    'supplierId', 'supplierName', 'quantity', 'unit', 'notes',
    'createdAt', 'status', 'userId'
  ],
  chat_users: ['id', 'displayName', 'isOnline', 'lastSeen'],
  messages: ['id', 'chatId', 'senderId', 'receiverId', 'text', 'createdAt', 'read']
};

export interface TableStatus {
  suppliers: boolean | null;
  products: boolean | null;
  reports: boolean | null;
  stock_outs: boolean | null;
  settings: boolean | null;
  near_expired: boolean | null;
  chat_users: boolean | null;
  messages: boolean | null;
}

export const checkSupabaseTableStatus = async (): Promise<{
  connected: boolean;
  error?: string;
  tables: TableStatus;
  existingTables: TableStatus;
  missingColumns: Partial<Record<keyof TableStatus, string[]>>;
}> => {
  const supabase = getSupabaseClient();
  const tables: TableStatus = {
    suppliers: null,
    products: null,
    reports: null,
    stock_outs: null,
    settings: null,
    near_expired: null,
    chat_users: null,
    messages: null
  };
  const existingTables: TableStatus = { ...tables };
  const missingColumns: Partial<Record<keyof TableStatus, string[]>> = {};

  try {
    const checkTable = async (name: keyof TableStatus): Promise<{ tableExists: boolean; isComplete: boolean; missingCols: string[] }> => {
      const { error: tableErr } = await supabase.from(name).select('id').limit(1);
      if (tableErr) {
        if (
          tableErr.code === 'PGRST205' ||
          tableErr.code === '42P01' ||
          tableErr.message?.includes('schema cache') ||
          tableErr.message?.includes('does not exist')
        ) {
          return { tableExists: false, isComplete: false, missingCols: [] };
        }
      }

      const requiredCols = REQUIRED_SUPABASE_COLUMNS[name];
      const quotedSelect = requiredCols.map(c => `"${c}"`).join(',');
      const { error: colsErr } = await supabase.from(name).select(quotedSelect).limit(0);
      if (!colsErr) {
        return { tableExists: true, isComplete: true, missingCols: [] };
      }

      // Check column-by-column to pinpoint exactly which columns are missing
      const missingCols: string[] = [];
      for (const col of requiredCols) {
        const { error: singleErr } = await supabase.from(name).select(`"${col}"`).limit(0);
        if (singleErr && (singleErr.code === '42703' || singleErr.code === 'PGRST204' || singleErr.message?.includes('does not exist'))) {
          missingCols.push(col);
        }
      }

      return {
        tableExists: true,
        isComplete: missingCols.length === 0,
        missingCols
      };
    };

    const keys = Object.keys(tables) as (keyof TableStatus)[];
    const results = await Promise.all(keys.map(k => checkTable(k)));

    keys.forEach((key, idx) => {
      const res = results[idx];
      existingTables[key] = res.tableExists;
      tables[key] = res.isComplete;
      if (res.missingCols.length > 0) {
        missingColumns[key] = res.missingCols;
      }
    });

    return {
      connected: true,
      tables,
      existingTables,
      missingColumns
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Gagal tersambung ke Supabase',
      tables,
      existingTables,
      missingColumns
    };
  }
};
