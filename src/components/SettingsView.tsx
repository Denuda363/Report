import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Settings, Trash2, CheckCircle2, LayoutPanelLeft, Palette, ShieldAlert,
  Database, Download, Upload, Server, Copy, Check, ExternalLink, 
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Layers, CheckCircle, Flame
} from 'lucide-react';
import { AutoDeleteMode, NavbarPosition, DbProvider } from '../types';
import { 
  getSupabaseConfig, setSupabaseConfig, SUPABASE_SQL_SCHEMA, 
  checkSupabaseTableStatus, TableStatus, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY 
} from '../lib/supabase';
import { getDbProvider, AllTablesStatusResult, TABLE_METADATA } from '../lib/dbAdapter';
import { testFirebaseConnection, resetFirebaseQuotaStatus } from '../lib/firebase';
import firebaseConfig from '../../firebase-applet-config.json';

export const SettingsView = () => {
  const { 
    settings, updateSettings, resetAllData, exportData, importData, 
    migrateCurrentDataToSupabase, dbProvider,
    autoCreateMissingTables, getTablesStatus
  } = useAppContext();
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Table Auto-Creation states
  const [allTablesStatus, setAllTablesStatus] = useState<AllTablesStatusResult | null>(null);
  const [isCheckingAllTables, setIsCheckingAllTables] = useState(false);
  const [isCreatingAllTables, setIsCreatingAllTables] = useState(false);
  const [tableNotification, setTableNotification] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const fetchTablesStatus = async () => {
    setIsCheckingAllTables(true);
    try {
      const res = await getTablesStatus();
      setAllTablesStatus(res);
    } catch (e: any) {
      console.warn('Gagal cek status tabel:', e);
    } finally {
      setIsCheckingAllTables(false);
    }
  };

  useEffect(() => {
    fetchTablesStatus();
  }, [dbProvider]);

  const handleCreateAllTables = async () => {
    setIsCreatingAllTables(true);
    setTableNotification(null);
    try {
      const res = await autoCreateMissingTables();
      if (res.success) {
        setTableNotification({
          type: 'success',
          text: res.message || 'Semua tabel yang dibutuhkan berhasil dibuat dan siap digunakan di database!'
        });
      } else {
        setTableNotification({
          type: 'error',
          text: res.message || 'Sebagian tabel belum berhasil dibuat secara otomatis.'
        });
      }
      await fetchTablesStatus();
    } catch (e: any) {
      setTableNotification({
        type: 'error',
        text: e.message || 'Terjadi kesalahan saat membuat tabel database.'
      });
    } finally {
      setIsCreatingAllTables(false);
    }
  };

  // Supabase states
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [isCopiedSql, setIsCopiedSql] = useState(false);
  const [showSqlPreview, setShowSqlPreview] = useState(false);
  
  const [isCheckingTables, setIsCheckingTables] = useState(false);
  const [tableStatus, setTableStatus] = useState<TableStatus | null>(null);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<string | null>(null);

  // Firebase testing states
  const [firebaseStatus, setFirebaseStatus] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [firebaseMsg, setFirebaseMsg] = useState<string | null>(null);

  const handleTestFirebase = async () => {
    setFirebaseStatus('testing');
    setFirebaseMsg(null);
    try {
      const res = await testFirebaseConnection();
      if (res.success) {
        setFirebaseStatus('connected');
        setFirebaseMsg('Koneksi ke Google Cloud Firestore Berhasil Aktif & Siap Digunakan (Baca & Tulis Normal)!');
      } else {
        setFirebaseStatus('error');
        setFirebaseMsg(res.error || 'Gagal tersambung ke Firebase Firestore.');
      }
    } catch (e: any) {
      setFirebaseStatus('error');
      setFirebaseMsg(e.message || 'Terjadi kesalahan saat menguji koneksi Firebase.');
    }
  };

  // Load current Supabase config
  useEffect(() => {
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseKey(config.key);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (window.confirm("Peringatan: Merestore data akan menimpa/mengganti data Anda saat ini yang memiliki ID yang sama, atau menambahkannya jika belum ada. Lanjutkan?")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        await importData(text);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleProviderChange = (provider: DbProvider) => {
    if (provider === dbProvider) return;
    const providerNames = {
      supabase: 'Supabase Cloud (PostgreSQL)',
      firebase: 'Firebase Firestore',
      local: 'Offline / Lokal Browser (IndexedDB)'
    };
    
    if (provider === 'firebase') {
      resetFirebaseQuotaStatus();
    }

    if (window.confirm(`Ganti sumber database utama ke ${providerNames[provider]}? Halaman akan dimuat ulang.`)) {
      updateSettings({ ...settings, dbProvider: provider });
    }
  };

  const handleSaveSupabaseConfig = () => {
    setSupabaseConfig(supabaseUrl, supabaseKey);
    alert('Konfigurasi Supabase berhasil disimpan! Memuat ulang...');
    window.location.reload();
  };

  const handleResetSupabaseConfig = () => {
    if (window.confirm('Reset konfigurasi Supabase ke proyek default (Daily - fxmqvpfepatumdzzlqzt)?')) {
      setSupabaseConfig(DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY);
      setSupabaseUrl(DEFAULT_SUPABASE_URL);
      setSupabaseKey(DEFAULT_SUPABASE_KEY);
      alert('Konfigurasi Supabase dikembalikan ke default.');
    }
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SQL_SCHEMA);
    setIsCopiedSql(true);
    setTimeout(() => setIsCopiedSql(false), 3000);
  };

  const handleCheckTables = async () => {
    setIsCheckingTables(true);
    setConnectionError(null);
    try {
      const res = await checkSupabaseTableStatus();
      if (!res.connected) {
        setConnectionError(res.error || 'Gagal tersambung ke Supabase');
      } else {
        setTableStatus(res.tables);
      }
    } catch (err: any) {
      setConnectionError(err.message || 'Terjadi kesalahan saat memeriksa tabel');
    } finally {
      setIsCheckingTables(false);
    }
  };

  const handleMigrateData = async () => {
    if (!window.confirm("Apakah Anda ingin memigrasikan semua data lokal/Firebase saat ini ke Supabase? Pastikan tabel Supabase sudah dibuat terlebih dahulu.")) {
      return;
    }
    setIsMigrating(true);
    setMigrationResult(null);
    try {
      const res = await migrateCurrentDataToSupabase();
      setMigrationResult(res.message);
    } catch (e: any) {
      setMigrationResult(`Gagal migrasi: ${e.message}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const handleModeChange = (mode: AutoDeleteMode) => {
    updateSettings({ ...settings, autoDeleteMode: mode });
  };

  const handleThemeChange = (theme: string) => {
    updateSettings({ ...settings, theme });
  };
  
  const handleNavPositionChange = (position: NavbarPosition) => {
    updateSettings({ ...settings, navbarPosition: position });
  };

  const handleClearCache = async () => {
    if (window.confirm("Apakah Anda yakin ingin menghapus cache sistem aplikasi? Ini dapat membantu menyelesaikan masalah teknis ringan. Aplikasi akan dimuat ulang setelah selesai.")) {
      try {
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
        }
        sessionStorage.clear();
        // Do not clear localStorage completely as it holds theme and db settings,
        // but clearing cache and session storage is usually sufficient for "system cache".
        window.location.reload();
      } catch (e) {
        alert("Gagal menghapus cache: " + e);
      }
    }
  };

  const activeProvider = dbProvider || getDbProvider();

  return (
    <div className="h-full flex flex-col gap-8 pb-12 max-w-5xl mx-auto w-full">
      <div className="flex flex-col gap-2 px-2">
        <h2 className="text-3xl font-black text-theme-900 tracking-tight">Pengaturan</h2>
        <p className="text-theme-600-text font-medium">Sesuaikan database, integrasi Supabase, dan preferensi aplikasi Anda.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          {/* DATABASE PROVIDER SELECTION */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm">
                <Database className="w-7 h-7 text-emerald-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-theme-900">Sumber Database</h3>
                  <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                    {activeProvider === 'supabase' ? 'Supabase Aktif' : activeProvider === 'firebase' ? 'Firebase Aktif' : 'Offline Aktif'}
                  </span>
                </div>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Pilih database yang digunakan untuk menyimpan produk, supplier, dan laporan harian Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              {/* Supabase Option */}
              <div 
                onClick={() => handleProviderChange('supabase')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  activeProvider === 'supabase'
                    ? 'border-emerald-500 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20'
                    : 'border-theme-100 hover:border-emerald-300 hover:bg-neutral-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-theme-900 text-base">Supabase Cloud</span>
                    {activeProvider === 'supabase' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded">Rekomendasi</span>
                    )}
                  </div>
                  <p className="text-xs font-medium text-theme-600-text leading-relaxed">
                    PostgreSQL cloud cepat, stabil, bebas limit kuota Firestore, mendukung realtime multi-perangkat.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-emerald-100/50 text-[11px] font-semibold text-emerald-700">
                  Project: Daily (fxmqv...)
                </div>
              </div>

              {/* Firebase Option */}
              <div 
                onClick={() => handleProviderChange('firebase')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  activeProvider === 'firebase'
                    ? 'border-theme-500 bg-theme-50/50 shadow-md ring-2 ring-theme-500/20'
                    : 'border-theme-100 hover:border-theme-300 hover:bg-neutral-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-theme-900 text-base">Firebase</span>
                    {activeProvider === 'firebase' && <CheckCircle2 className="w-5 h-5 text-theme-500" />}
                  </div>
                  <p className="text-xs font-medium text-theme-600-text leading-relaxed">
                    Google Cloud Firestore online. (Dapat terkena limit kuota gratis harian).
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-theme-100/50 text-[11px] font-semibold text-theme-600-text">
                  Google Firestore
                </div>
              </div>

              {/* Local Offline Option */}
              <div 
                onClick={() => handleProviderChange('local')}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between ${
                  activeProvider === 'local'
                    ? 'border-amber-500 bg-amber-50/50 shadow-md ring-2 ring-amber-500/20'
                    : 'border-theme-100 hover:border-amber-300 hover:bg-neutral-50 bg-white'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-theme-900 text-base">Lokal Offline</span>
                    {activeProvider === 'local' && <CheckCircle2 className="w-5 h-5 text-amber-600" />}
                  </div>
                  <p className="text-xs font-medium text-theme-600-text leading-relaxed">
                    Tersimpan di IndexedDB browser perangkat ini saja. Tidak sinkron antar HP/laptop.
                  </p>
                </div>
                <div className="mt-3 pt-2 border-t border-amber-100/50 text-[11px] font-semibold text-amber-700">
                  Penyimpanan Lokal
                </div>
              </div>
            </div>

            {/* FIREBASE STATUS & QUICK TEST */}
            <div className="mt-4 p-4 rounded-2xl bg-theme-50/60 border border-theme-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-theme-100/80 rounded-xl text-theme-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-theme-900">Google Firebase Firestore</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-200/60 text-theme-800">
                      ID: {firebaseConfig.firestoreDatabaseId}
                    </span>
                  </div>
                  <p className="text-xs text-theme-600-text mt-0.5 font-medium">
                    Proyek: <span className="font-semibold text-theme-800">{firebaseConfig.projectId}</span> (Region Cloud Firestore)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={handleTestFirebase}
                  disabled={firebaseStatus === 'testing'}
                  className="px-3.5 py-1.5 bg-theme-600 hover:bg-theme-700 active:scale-95 text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${firebaseStatus === 'testing' ? 'animate-spin' : ''}`} />
                  {firebaseStatus === 'testing' ? 'Menguji...' : 'Uji Koneksi Firebase'}
                </button>
              </div>
            </div>

            {firebaseMsg && (
              <div className={`mt-3 p-3 rounded-xl text-xs font-semibold flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                firebaseStatus === 'connected' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <div className="flex items-center gap-2">
                  {firebaseStatus === 'connected' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  )}
                  <span>{firebaseMsg}</span>
                </div>
                {firebaseStatus === 'error' && (
                  <a 
                    href={`https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data?openUpgradeDialog=true`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold underline text-amber-900 hover:text-amber-950 shrink-0 self-end sm:self-center"
                  >
                    Buka Upgrade Dialog &rarr;
                  </a>
                )}
              </div>
            )}
          </div>

          {/* PEMERIKSAAN & PEMBUATAN TABEL DATABASE OTOMATIS */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 mb-5">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 text-theme-600 shadow-sm shrink-0">
                  <Layers className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg md:text-xl font-bold text-theme-900">Pemeriksaan & Pembuatan Tabel Otomatis</h3>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-theme-100 text-theme-800">
                      {dbProvider === 'firebase' ? 'Google Firestore' : dbProvider === 'supabase' ? 'Supabase Cloud' : 'IndexedDB Lokal'}
                    </span>
                  </div>
                  <p className="text-xs md:text-sm text-theme-600-text mt-1 font-medium leading-relaxed">
                    Sistem secara otomatis mendeteksi dan membuat seluruh tabel/koleksi yang dibutuhkan pada database aktif saat aplikasi dimuat atau tombol pembuatan ditekan.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification alert */}
            {tableNotification && (
              <div className={`mb-5 p-3.5 rounded-2xl text-xs md:text-sm font-semibold flex items-center justify-between gap-3 ${
                tableNotification.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-900 border border-amber-200'
              }`}>
                <div className="flex items-center gap-2.5">
                  {tableNotification.type === 'success' ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  )}
                  <span>{tableNotification.text}</span>
                </div>
                <button 
                  onClick={() => setTableNotification(null)}
                  className="text-xs font-bold hover:underline opacity-80"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Tables Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 mb-5">
              {[
                { name: 'suppliers', label: '1. Master Supplier', desc: 'Vendor & pemasok barang' },
                { name: 'products', label: '2. Master Produk', desc: 'Katalog barang & butom stok' },
                { name: 'reports', label: '3. Laporan & Order', desc: 'Laporan harian & status barang datang' },
                { name: 'stock_outs', label: '4. Pengeluaran (Keluar)', desc: 'Riwayat pengeluaran barang' },
                { name: 'settings', label: '5. Pengaturan Sistem', desc: 'Konfigurasi tema & auto-delete' },
              ].map((t) => {
                const tableInfo = allTablesStatus?.tables.find(tbl => tbl.name === t.name);
                // In Firebase and Local, tables are automatically initialized or marked ready
                const isReady = tableInfo ? tableInfo.exists : true;

                return (
                  <div 
                    key={t.name}
                    className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 hover:bg-neutral-50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-neutral-900 text-sm">{t.label}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          isReady 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isReady ? <Check className="w-3 h-3 text-emerald-700" /> : <AlertTriangle className="w-3 h-3 text-amber-700" />}
                          {isReady ? 'Tersedia' : 'Belum Ada'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-2 font-medium">
                        {t.desc}
                      </p>
                    </div>
                    <div className="pt-2 border-t border-neutral-200/60 flex items-center justify-between text-[11px] font-mono text-neutral-600">
                      <span>Tabel: <strong>{t.name}</strong></span>
                      <span className="text-[10px] text-emerald-700 font-semibold uppercase">Auto-Sync</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <div className="text-xs text-neutral-500 font-medium">
                Status saat ini: <strong className="text-neutral-800 font-bold">
                  {allTablesStatus ? allTablesStatus.message : 'Semua tabel aktif & siap'}
                </strong>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={fetchTablesStatus}
                  disabled={isCheckingAllTables}
                  className="px-3.5 py-2 text-xs font-bold rounded-xl border border-neutral-200 hover:bg-neutral-50 active:scale-95 text-neutral-700 transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingAllTables ? 'animate-spin' : ''}`} />
                  {isCheckingAllTables ? 'Memeriksa...' : 'Periksa Status'}
                </button>

                <button
                  type="button"
                  onClick={handleCreateAllTables}
                  disabled={isCreatingAllTables}
                  className="px-4 py-2 text-xs font-bold rounded-xl bg-theme-600 hover:bg-theme-700 active:scale-95 text-white transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Layers className={`w-3.5 h-3.5 ${isCreatingAllTables ? 'animate-spin' : ''}`} />
                  {isCreatingAllTables ? 'Sedang Membuat Tabel...' : 'Buat / Perbarui Tabel Otomatis'}
                </button>
              </div>
            </div>
          </div>

          {/* SUPABASE INTEGRATION & AUTO-SETUP PANEL */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-6">
              <div className="p-4 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-sm">
                <Server className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-theme-900">Integrasi & Setup Otomatis Supabase</h3>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    Project: Daily
                  </span>
                </div>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Konfigurasi tabel otomatis dan kredensial koneksi untuk project Supabase Anda.
                </p>
              </div>
            </div>

            {/* STEP 1: SQL SCRIPT GENERATOR FOR AUTOMATIC TABLES */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  1
                </div>
                <h4 className="text-base font-bold text-neutral-900">Buat Tabel & RLS Otomatis di Supabase</h4>
              </div>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                Supabase membutuhkan tabel: <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">suppliers</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">products</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">reports</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">stock_outs</code>, dan <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">settings</code> beserta hak akses publik (RLS) dan realtime.
              </p>

              <div className="flex flex-wrap gap-3 items-center">
                <button
                  onClick={handleCopySql}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  {isCopiedSql ? <Check className="w-4 h-4 text-emerald-200" /> : <Copy className="w-4 h-4" />}
                  {isCopiedSql ? 'Script SQL Berhasil Disalin!' : 'Salin Script SQL Pembuatan Tabel'}
                </button>

                <a
                  href="https://supabase.com/dashboard/project/fxmqvpfepatumdzzlqzt/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Supabase SQL Editor
                </a>

                <button
                  onClick={() => setShowSqlPreview(!showSqlPreview)}
                  className="px-3 py-2 text-neutral-600 hover:text-neutral-900 font-medium rounded-xl text-sm flex items-center gap-1 transition-all"
                >
                  {showSqlPreview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showSqlPreview ? 'Sembunyikan Script' : 'Lihat Script SQL'}
                </button>
              </div>

              {showSqlPreview && (
                <div className="mt-4">
                  <div className="flex items-center justify-between bg-neutral-800 text-neutral-300 text-xs px-3 py-1.5 rounded-t-xl">
                    <span>supabase_schema.sql</span>
                    <button onClick={handleCopySql} className="hover:text-white flex items-center gap-1">
                      <Copy className="w-3 h-3" /> Salin
                    </button>
                  </div>
                  <pre className="bg-neutral-900 text-emerald-400 p-4 rounded-b-xl text-xs overflow-x-auto max-h-60 font-mono leading-relaxed">
                    {SUPABASE_SQL_SCHEMA}
                  </pre>
                </div>
              )}
            </div>

            {/* STEP 2: VERIFY TABLES STATUS */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                    2
                  </div>
                  <h4 className="text-base font-bold text-neutral-900">Verifikasi Status Tabel Supabase</h4>
                </div>
                <button
                  onClick={handleCheckTables}
                  disabled={isCheckingTables}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 border border-neutral-300 text-neutral-700 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCheckingTables ? 'animate-spin' : ''}`} />
                  {isCheckingTables ? 'Memeriksa...' : 'Cek Status Tabel'}
                </button>
              </div>

              {connectionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{connectionError}</span>
                </div>
              )}

              {tableStatus ? (
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mt-3">
                  {[
                    { key: 'suppliers', name: 'suppliers' },
                    { key: 'products', name: 'products' },
                    { key: 'reports', name: 'reports' },
                    { key: 'stock_outs', name: 'stock_outs' },
                    { key: 'settings', name: 'settings' }
                  ].map((tbl) => {
                    const exists = tableStatus[tbl.key as keyof TableStatus];
                    return (
                      <div 
                        key={tbl.key} 
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 ${
                          exists 
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900' 
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <span className="font-mono text-xs font-bold">{tbl.name}</span>
                        {exists ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Siap
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700">
                            <AlertTriangle className="w-3.5 h-3.5" /> Belum dibuat
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-neutral-500 italic">
                  Klik tombol &quot;Cek Status Tabel&quot; untuk memverifikasi apakah 5 tabel sudah siap di database Supabase.
                </p>
              )}
            </div>

            {/* STEP 3: MIGRATE CURRENT DATA */}
            <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs">
                  3
                </div>
                <h4 className="text-base font-bold text-neutral-900">Salin / Migrasikan Data ke Supabase</h4>
              </div>
              <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                Sudah memiliki data supplier, produk, atau laporan di aplikasi? Anda dapat menyalin seluruh data tersebut langsung ke database Supabase dengan 1 klik.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={handleMigrateData}
                  disabled={isMigrating}
                  className="px-4 py-2.5 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Upload className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                  {isMigrating ? 'Memigrasikan Data...' : 'Migrasikan Data ke Supabase Sekarang'}
                </button>
              </div>

              {migrationResult && (
                <div className={`mt-3 p-3 rounded-xl text-xs font-medium ${
                  migrationResult.startsWith('Berhasil') 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}>
                  {migrationResult}
                </div>
              )}
            </div>

            {/* SUPABASE CONNECTION CREDENTIALS */}
            <div className="border-t border-neutral-200 pt-6">
              <h4 className="text-sm font-bold text-neutral-900 mb-3">Detail Kredensial Supabase (Dapat Diedit)</h4>
              <div className="grid grid-cols-1 gap-4 mb-4">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Project URL</label>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-id.supabase.co"
                    className="w-full px-3.5 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Public API Key (Anon / Publishable)</label>
                  <input
                    type="text"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="sb_publishable_..."
                    className="w-full px-3.5 py-2 text-sm border border-neutral-200 rounded-xl bg-neutral-50 focus:bg-white focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none transition-all font-mono"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSupabaseConfig}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white font-bold rounded-xl text-xs transition-colors shadow-sm"
                >
                  Simpan Perubahan Kredensial
                </button>
                <button
                  onClick={handleResetSupabaseConfig}
                  className="px-4 py-2 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 font-bold rounded-xl text-xs transition-colors"
                >
                  Reset ke Proyek Daily
                </button>
              </div>
            </div>
          </div>
          
          {/* Backup & Restore Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm">
                <Download className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-900">Backup & Restore File JSON</h3>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Cadangkan seluruh data aplikasi Anda menjadi file JSON, atau pulihkan dari file cadangan sebelumnya.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button 
                onClick={() => exportData()}
                className="w-full sm:w-auto px-6 py-3 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Backup
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-theme-50 text-theme-700 border border-theme-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Restore Data
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Theme Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm">
                <Palette className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-900">Tema Warna</h3>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Pilih skema warna yang paling nyaman untuk Anda gunakan sehari-hari.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {[
                { id: 'default', name: 'Sage Green', color: 'bg-[#8B9D77]' },
                { id: 'blue', name: 'Ocean Blue', color: 'bg-blue-500' },
                { id: 'rose', name: 'Rose Red', color: 'bg-rose-500' },
                { id: 'amber', name: 'Warm Amber', color: 'bg-amber-500' },
                { id: 'purple', name: 'Royal Purple', color: 'bg-purple-500' },
                { id: 'cyan', name: 'Cyan Breeze', color: 'bg-cyan-500' },
                { id: 'colorful', name: 'Colorful', color: 'bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500' },
              ].map((t) => (
                <div 
                  key={t.id}
                  onClick={() => handleThemeChange(t.id)}
                  className={`relative p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-4 group ${
                    (settings.theme || 'default') === t.id 
                      ? 'border-theme-500 bg-theme-50 shadow-md scale-100' 
                      : 'border-theme-100 hover:border-theme-300 hover:bg-neutral-50 bg-white hover:-translate-y-1'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full ${t.color} shadow-inner flex items-center justify-center transition-transform group-hover:scale-110`}>
                    {(settings.theme || 'default') === t.id && <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />}
                  </div>
                  <span className="font-bold text-theme-900 text-sm text-center">{t.name}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm">
                <LayoutPanelLeft className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-900">Posisi Menu Navigasi</h3>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Sesuaikan letak menu utama pada layar agar lebih mudah dijangkau.
                </p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'bottom', title: 'Bawah', desc: 'Sangat nyaman untuk HP' },
                { id: 'left', title: 'Kiri', desc: 'Cocok untuk tablet/desktop' },
                { id: 'right', title: 'Kanan', desc: 'Alternatif di layar besar' }
              ].map((nav) => {
                const isSelected = (!settings.navbarPosition && nav.id === 'bottom') || settings.navbarPosition === nav.id;
                return (
                  <div 
                    key={nav.id}
                    onClick={() => handleNavPositionChange(nav.id as NavbarPosition)}
                    className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-theme-500 bg-theme-50 shadow-md' 
                        : 'border-theme-100 hover:border-theme-300 bg-white hover:-translate-y-1'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-theme-900 text-base">{nav.title}</span>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-theme-500" />}
                    </div>
                    <p className="text-xs font-medium text-theme-600-text">{nav.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Right Column - Data & Danger */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          
          {/* Auto-Delete Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-theme-50 rounded-xl border border-theme-100">
                <Settings className="w-6 h-6 text-theme-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-theme-900">Pembersihan Data</h3>
                <p className="text-xs text-theme-600-text mt-1 font-medium">Hapus laporan lama otomatis.</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3">
              {[
                { id: 'none', title: 'Nonaktif', desc: 'Simpan semua data selamanya (Default).' },
                { id: 'keep_today', title: 'Hanya Hari Ini', desc: 'Hapus data kemarin dan sebelumnya.' },
                { id: 'keep_2_days', title: 'Simpan 2 Hari', desc: 'Simpan data hari ini dan kemarin.' }
              ].map((opt) => {
                const isSelected = settings.autoDeleteMode === opt.id;
                return (
                  <div 
                    key={opt.id}
                    onClick={() => handleModeChange(opt.id as AutoDeleteMode)}
                    className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                      isSelected 
                        ? 'border-theme-500 bg-theme-50 shadow-sm' 
                        : 'border-theme-100 hover:border-theme-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-bold text-theme-900 text-sm">{opt.title}</span>
                      {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-theme-500" />}
                    </div>
                    <p className="text-xs font-medium text-theme-600-text">{opt.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-rose-50/70 rounded-[2rem] border border-rose-100 overflow-hidden p-6 relative">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <ShieldAlert className="w-24 h-24 text-rose-500" />
            </div>
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-rose-100 rounded-xl">
                  <Trash2 className="w-5 h-5 text-rose-600" />
                </div>
                <h3 className="text-lg font-bold text-rose-700">Manajemen Sistem & Zona Berbahaya</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Clear Cache Card */}
                <div className="bg-white/60 p-4 rounded-xl border border-rose-200/60 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-rose-800 text-sm mb-1">Hapus Cache Aplikasi</h4>
                    <p className="text-xs text-rose-700/80 font-medium leading-relaxed mb-4">
                      Bersihkan cache sistem dan *service worker*. Berguna jika aplikasi terasa lambat atau tidak memuat pembaruan terbaru. Tidak menghapus data.
                    </p>
                  </div>
                  <button 
                    onClick={handleClearCache}
                    className="w-full px-4 py-2 bg-white border border-rose-200 text-rose-600 font-bold rounded-lg hover:bg-rose-50 transition-colors shadow-sm text-xs flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> 
                    Hapus Cache
                  </button>
                </div>

                {/* Reset Data Card */}
                <div className="bg-white/60 p-4 rounded-xl border border-rose-200/60 flex flex-col justify-between">
                  <div>
                    <h4 className="font-bold text-rose-800 text-sm mb-1">Reset Database</h4>
                    <p className="text-xs text-rose-700/80 font-medium leading-relaxed mb-4">
                      Hapus permanen semua data master dan laporan harian di database yang sedang aktif. Tindakan ini <strong>tidak dapat dibatalkan</strong>.
                    </p>
                  </div>
                  <button 
                    onClick={() => {
                      if (window.confirm("Apakah Anda yakin ingin MENGHAPUS SEMUA DATA? Data produk, supplier, dan laporan akan hilang permanen.")) {
                        resetAllData();
                      }
                    }}
                    className="w-full px-4 py-2 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition-colors shadow-sm text-xs flex items-center justify-center gap-2 group"
                  >
                    <Trash2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" /> 
                    Reset Semua Data
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
