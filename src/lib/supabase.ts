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

-- 2. Tabel Products
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  "supplierId" TEXT NOT NULL,
  "alternativeSupplierIds" JSONB DEFAULT '[]'::jsonb,
  unit TEXT NOT NULL,
  "bottomStock" NUMERIC,
  "isKosongPabrik" BOOLEAN DEFAULT FALSE,
  "kosongPabrikDate" BIGINT,
  stock NUMERIC DEFAULT 0,
  location TEXT,
  category TEXT,
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  "userId" TEXT DEFAULT 'public',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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

-- 5. Tabel Settings (Pengaturan Aplikasi)
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'public',
  "autoDeleteMode" TEXT DEFAULT 'none',
  "navbarPosition" TEXT DEFAULT 'bottom',
  theme TEXT DEFAULT 'default',
  "useLocalDb" BOOLEAN DEFAULT FALSE,
  "dbProvider" TEXT DEFAULT 'supabase',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AKTIFKAN ROW LEVEL SECURITY (RLS)
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_outs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

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
`;

export interface TableStatus {
  suppliers: boolean | null;
  products: boolean | null;
  reports: boolean | null;
  stock_outs: boolean | null;
  settings: boolean | null;
}

export const checkSupabaseTableStatus = async (): Promise<{
  connected: boolean;
  error?: string;
  tables: TableStatus;
}> => {
  const supabase = getSupabaseClient();
  const tables: TableStatus = {
    suppliers: null,
    products: null,
    reports: null,
    stock_outs: null,
    settings: null
  };

  try {
    const checkTable = async (name: string): Promise<boolean> => {
      const { error } = await supabase.from(name).select('id').limit(1);
      if (!error) return true;
      // PGRST205 or PGRST116 means table does not exist
      if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
        return false;
      }
      // If permission error or other error, table might exist but RLS blocked
      if (error.code === '42P01') return false;
      return true;
    };

    const [sup, prod, rep, so, set] = await Promise.all([
      checkTable('suppliers'),
      checkTable('products'),
      checkTable('reports'),
      checkTable('stock_outs'),
      checkTable('settings')
    ]);

    tables.suppliers = sup;
    tables.products = prod;
    tables.reports = rep;
    tables.stock_outs = so;
    tables.settings = set;

    return {
      connected: true,
      tables
    };
  } catch (err: any) {
    return {
      connected: false,
      error: err.message || 'Gagal tersambung ke Supabase',
      tables
    };
  }
};
