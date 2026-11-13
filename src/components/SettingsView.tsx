import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Settings, Trash2, CheckCircle2, LayoutPanelLeft, Palette, ShieldAlert,
  Database, Download, Upload, Server, Copy, Check, ExternalLink, 
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Layers, CheckCircle, Flame,
  BookOpen, Sparkles, Play, Calendar, Clock, Minus, Plus, Info, ShieldCheck,
  Code2, Copyright, Award, Heart, BadgeCheck, Laptop, Cpu,
  Lock, KeyRound, Eye, EyeOff, X
} from 'lucide-react';
import { AutoDeleteMode, NavbarPosition, DbProvider } from '../types';
import { 
  getSupabaseConfig, setSupabaseConfig, SUPABASE_SQL_SCHEMA, 
  checkSupabaseTableStatus, TableStatus, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY 
} from '../lib/supabase';
import { getDbProvider, AllTablesStatusResult, TABLE_METADATA } from '../lib/dbAdapter';
import { testFirebaseConnection, resetFirebaseQuotaStatus } from '../lib/firebase';
import { getCleanupCutoffDate, formatDateIndo, AUTO_DELETE_PRESETS, getRetentionDays } from '../lib/cleanupUtils';
import { verifyDatabasePin, hashUserPin, isValidPinFormat } from '../lib/pinSecurity';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserGuide } from './UserGuide';
import { DbPinModal } from './common/DbPinModal';

export interface SettingsViewProps {
  onNavigateTab?: (tab: 'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'settings') => void;
  defaultSubTab?: 'config' | 'guide' | 'about';
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateTab, defaultSubTab = 'config' }) => {
  const { 
    settings, updateSettings, resetAllData, exportData, importData, 
    migrateCurrentDataToSupabase, dbProvider,
    autoCreateMissingTables, getTablesStatus,
    reports, cleanOldReportsNow
  } = useAppContext();
  
  const [activeSubTab, setActiveSubTab] = useState<'config' | 'guide' | 'about'>(defaultSubTab);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Copyright & Developer states
  const [isCopiedCopyright, setIsCopiedCopyright] = useState(false);
  const handleCopyCopyright = () => {
    const text = `Daily Report Pro v3.2.0\nDeveloper: Denuda\nHak Cipta © 2024 - 2026 Denuda. Seluruh Hak Cipta Dilindungi Undang-Undang.`;
    navigator.clipboard.writeText(text);
    setIsCopiedCopyright(true);
    setTimeout(() => setIsCopiedCopyright(false), 3000);
  };

  // Database PIN security & hidden PIN change states
  const [pendingProvider, setPendingProvider] = useState<DbProvider | null>(null);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [showPinFields, setShowPinFields] = useState(false);
  const [pinChangeError, setPinChangeError] = useState<string | null>(null);
  const [pinChangeSuccess, setPinChangeSuccess] = useState<string | null>(null);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);

  const openHiddenPinSettings = () => {
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setShowPinFields(false);
    setPinChangeError(null);
    setPinChangeSuccess(null);
    setShowChangePinModal(true);
  };

  const handleSecretIdTap = () => {
    const next = secretTapCount + 1;
    if (next >= 3) {
      setSecretTapCount(0);
      openHiddenPinSettings();
    } else {
      setSecretTapCount(next);
      setTimeout(() => {
        setSecretTapCount((prev) => (prev === next ? 0 : prev));
      }, 2000);
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinChangeError(null);
    setPinChangeSuccess(null);

    const checkCurrent = verifyDatabasePin(currentPinInput, settings.dbPinHash);
    if (!checkCurrent.valid) {
      setPinChangeError('PIN saat ini tidak sesuai.');
      return;
    }

    if (!isValidPinFormat(newPinInput)) {
      setPinChangeError('PIN baru harus berupa 4 hingga 8 digit angka.');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      setPinChangeError('Konfirmasi PIN baru tidak cocok.');
      return;
    }

    setIsSavingPin(true);
    try {
      const nextHash = hashUserPin(newPinInput);
      await updateSettings({ ...settings, dbPinHash: nextHash });
      setPinChangeSuccess('PIN keamanan database berhasil diperbarui dan disinkronkan.');
      setCurrentPinInput('');
      setNewPinInput('');
      setConfirmPinInput('');
      setTimeout(() => {
        setShowChangePinModal(false);
        setPinChangeSuccess(null);
      }, 1200);
    } catch (err: any) {
      setPinChangeError(err?.message || 'Gagal menyimpan perubahan PIN.');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Auto-Delete / Data Cleaner states
  const [customDays, setCustomDays] = useState<number>(settings.autoDeleteDays || 3);
  const [isCleaningNow, setIsCleaningNow] = useState(false);
  const [cleanNotification, setCleanNotification] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings.autoDeleteDays) {
      setCustomDays(settings.autoDeleteDays);
    }
  }, [settings.autoDeleteDays]);

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

  const providerDisplayNames: Record<DbProvider, string> = {
    supabase: 'Supabase Cloud (PostgreSQL)',
    firebase: 'Firebase Firestore',
    local: 'Offline / Lokal Browser (IndexedDB)'
  };

  const handleProviderChange = (provider: DbProvider) => {
    if (provider === dbProvider) return;
    setPendingProvider(provider);
  };

  const executeConfirmedProviderSwitch = () => {
    if (!pendingProvider) return;
    const target = pendingProvider;
    setPendingProvider(null);
    if (target === 'firebase') {
      resetFirebaseQuotaStatus();
    }
    updateSettings({ ...settings, dbProvider: target });
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

  const currentCutoff = getCleanupCutoffDate(settings.autoDeleteMode, settings.autoDeleteDays || customDays);
  const affectedReportsCount = currentCutoff 
    ? reports.filter(r => r.date < currentCutoff.cutoffDateStr).length 
    : 0;

  const handleModeChange = (mode: AutoDeleteMode, days?: number) => {
    const targetDays = days !== undefined ? days : (settings.autoDeleteDays || customDays || 3);
    updateSettings({ ...settings, autoDeleteMode: mode, autoDeleteDays: targetDays });
  };

  const handleCustomDaysChange = (newDays: number) => {
    const validDays = Math.max(1, Math.min(365, newDays));
    setCustomDays(validDays);
    updateSettings({
      ...settings,
      autoDeleteMode: 'custom',
      autoDeleteDays: validDays
    });
  };

  const handleCleanNow = async () => {
    if (settings.autoDeleteMode === 'none') {
      alert("Mode pembersihan saat ini adalah 'Nonaktif'. Silakan pilih salah satu durasi retensi data (misal: Hari Ini, 2 Hari, 3 Hari, dst.) terlebih dahulu.");
      return;
    }
    if (!currentCutoff) return;

    if (!window.confirm(
      `Pembersihan Data Manual Sekarang:\n\n` +
      `Data laporan sebelum tanggal ${currentCutoff.formattedCutoffDate} akan dibersihkan (${affectedReportsCount} data laporan terdeteksi).\n` +
      `Data laporan mulai ${currentCutoff.formattedCutoffDate} s/d Hari Ini serta riwayat barang datang tetap aman tersimpan.\n\n` +
      `Lanjutkan pembersihan sekarang?`
    )) {
      return;
    }

    setIsCleaningNow(true);
    setCleanNotification(null);
    try {
      const res = await cleanOldReportsNow(settings.autoDeleteMode, settings.autoDeleteDays || customDays);
      if (res.count > 0) {
        setCleanNotification({
          type: 'success',
          text: `Berhasil membersihkan ${res.count} laporan lama sebelum tanggal ${currentCutoff.formattedCutoffDate}!`
        });
      } else {
        setCleanNotification({
          type: 'info',
          text: `Semua data laporan masih dalam masa retensi aktif (${currentCutoff.formattedCutoffDate} s/d Hari ini). Tidak ada data lama yang perlu dihapus.`
        });
      }
    } catch (e: any) {
      setCleanNotification({
        type: 'error',
        text: `Gagal menjalankan pembersihan data: ${e?.message || e}`
      });
    } finally {
      setIsCleaningNow(false);
    }
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

  const renderAboutCard = () => (
    <div id="section-tentang-aplikasi" className="bg-white rounded-[2.5rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8 relative">
      {/* Background ambient accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-emerald-100/40 via-theme-100/30 to-transparent rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-theme-100/40 to-transparent rounded-full blur-3xl pointer-events-none -ml-20 -mb-20" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-neutral-100 mb-8">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <Award className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-xl md:text-2xl font-black text-theme-900 tracking-tight">
                  Tentang Aplikasi & Hak Cipta
                </h3>
                {/* APPLICATION VERSION BADGE PROMINENT */}
                <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                  Versi Aplikasi: v3.2.0 Pro Edition
                </span>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                  Build 2026.11.12 (Stable)
                </span>
              </div>
              <p className="text-xs md:text-sm text-theme-600-text mt-1 font-medium">
                Informasi resmi profil pengembang (Developer), sertifikat hak cipta, dan spesifikasi arsitektur aplikasi.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyCopyright}
              className="px-3.5 py-2 text-xs font-bold rounded-xl border border-neutral-200 hover:border-emerald-300 bg-white hover:bg-emerald-50 text-neutral-700 hover:text-emerald-800 transition-all shadow-xs flex items-center gap-2 active:scale-95"
              title="Salin ringkasan hak cipta & developer"
            >
              {isCopiedCopyright ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-neutral-500" />}
              <span>{isCopiedCopyright ? 'Info Berhasil Disalin!' : 'Salin Info Pengembang'}</span>
            </button>
          </div>
        </div>

        {/* 3 Main Grid Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* CARD 1: DEVELOPER APLIKASI (DENUDA) */}
          <div className="bg-gradient-to-b from-neutral-50/80 to-white rounded-[2rem] border-2 border-emerald-500/30 p-6 flex flex-col justify-between shadow-xs hover:border-emerald-500/60 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  Developer Aplikasi
                </span>
                <span className="text-xs font-semibold text-neutral-400">Pencipta Resmi</span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-neutral-900 via-emerald-950 to-neutral-900 text-emerald-400 border-2 border-emerald-400/40 font-black text-xl flex items-center justify-center shadow-md shadow-emerald-900/10 shrink-0">
                  DN
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xl font-black text-neutral-950 tracking-tight">Denuda</h4>
                    <BadgeCheck className="w-5 h-5 text-emerald-600 fill-emerald-100 shrink-0" />
                  </div>
                  <p className="text-xs font-bold text-emerald-700">Lead Developer & Software Creator</p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 font-medium leading-relaxed mb-4">
                Aplikasi ini dirancang, diprogram, dan dikembangkan secara penuh oleh <strong className="text-neutral-900 font-bold">Denuda</strong> sebagai solusi manajemen operasional toko dan gudang yang cepat, presisi, serta terhubung antarperangkat secara real-time.
              </p>

              <div className="space-y-1.5 pt-3 border-t border-neutral-200/60 text-xs">
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Code2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Arsitek Kode & Desain Sistem</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <Database className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Spesialis Database Real-Time & Cloud</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-700 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Dedikasi Optimalisasi Operasional</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
              <span>Pengembang: <strong>Denuda</strong></span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] uppercase font-bold">Original Author</span>
            </div>
          </div>

          {/* CARD 2: HAK CIPTA APLIKASI */}
          <div className="bg-gradient-to-b from-neutral-50/80 to-white rounded-[2rem] border border-neutral-200 p-6 flex flex-col justify-between shadow-xs hover:border-theme-300 transition-all relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-28 h-28 bg-theme-400/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-theme-100 text-theme-900 border border-theme-200 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-theme-600" />
                  Hak Cipta Aplikasi
                </span>
                <span className="text-xs font-semibold text-neutral-400">Legal Notice</span>
              </div>

              <div className="flex items-center gap-3.5 mb-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-theme-800 to-neutral-900 text-white flex items-center justify-center shadow-md shadow-neutral-900/10 shrink-0">
                  <Copyright className="w-7 h-7 text-theme-200" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-neutral-950 tracking-tight leading-snug">
                    © 2024 - 2026 Denuda
                  </h4>
                  <p className="text-xs font-bold text-theme-700">Seluruh Hak Cipta Dilindungi</p>
                </div>
              </div>

              <p className="text-xs text-neutral-600 font-medium leading-relaxed mb-4">
                Seluruh arsitektur kode sumber, modul antarmuka pengguna (UI/UX), tata kelola basis data, dan fitur inovatif aplikasi ini merupakan karya cipta intelektual yang dilindungi undang-undang atas nama <strong className="text-neutral-900 font-bold">Denuda</strong>.
              </p>

              <div className="p-3 rounded-xl bg-theme-50/70 border border-theme-100 text-xs text-theme-900 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-theme-600 shrink-0" />
                  <span>Lisensi Perangkat Lunak:</span>
                </div>
                <p className="text-[11px] text-theme-700 font-medium">
                  Hak kepemilikan penuh dan lisensi eksklusif terdaftar resmi pada pengembang <strong>Denuda</strong> (All Rights Reserved).
                </p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] font-semibold text-neutral-600">
              <span>Status: <strong>Resmi & Dilindungi</strong></span>
              <span
                onClick={handleSecretIdTap}
                className="text-[10px] text-theme-600 font-mono select-none cursor-default"
              >
                ID: DRP-DENUDA-2026
              </span>
            </div>
          </div>

          {/* CARD 3: TENTANG APLIKASI & SPESIFIKASI */}
          <div className="bg-gradient-to-b from-neutral-50/80 to-white rounded-[2rem] border border-neutral-200 p-6 flex flex-col justify-between shadow-xs hover:border-neutral-300 transition-all md:col-span-2 lg:col-span-1">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-neutral-200/80 text-neutral-800 flex items-center gap-1">
                  <Info className="w-3 h-3 text-neutral-600" />
                  Spesifikasi Aplikasi
                </span>
                <span className="text-xs font-mono font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-md border border-emerald-300">
                  v3.2.0 Pro
                </span>
              </div>

              <div className="mb-4">
                <h4 className="text-lg font-black text-neutral-950 tracking-tight">Daily Report Pro</h4>
                <p className="text-xs text-neutral-500 font-medium mt-0.5">
                  Sistem Rekap Laporan Stok, Barang Datang & Expired
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-medium">Versi Aplikasi</span>
                  <span className="font-black text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    v3.2.0 Pro Edition
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-medium">Pengembang (Developer)</span>
                  <span className="font-black text-neutral-900 bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-lg border border-emerald-200">
                    Denuda
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-medium">Arsitektur Aplikasi</span>
                  <span className="font-bold text-neutral-800">Progressive Web App (PWA)</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-medium">Database Aktif</span>
                  <span className="font-bold text-neutral-800">
                    {activeProvider === 'supabase' ? 'Supabase PostgreSQL' : activeProvider === 'firebase' ? 'Google Cloud Firestore' : 'IndexedDB Lokal'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-neutral-100">
                  <span className="text-neutral-500 font-medium">Dukungan Multi-Perangkat</span>
                  <span className="font-bold text-emerald-700 flex items-center gap-1">
                    <Check className="w-3 h-3" /> Real-time Sinkron
                  </span>
                </div>

                <div className="flex items-center justify-between py-1.5">
                  <span className="text-neutral-500 font-medium">Teknologi</span>
                  <span className="font-mono text-[11px] text-neutral-700">React 19 + TypeScript + Tailwind</span>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
              <span>Kesiapan Offline</span>
              <span className="font-bold text-emerald-700">Aktif (IndexedDB Failover)</span>
            </div>
          </div>

        </div>

        {/* Bottom Dedicated Credit Banner */}
        <div className="mt-8 pt-6 border-t border-neutral-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
            <span>
              Dibuat dan dipersembahkan dengan dedikasi tinggi oleh <strong className="text-neutral-900 font-bold">Denuda</strong> untuk kemudahan operasional harian Anda.
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[11px]">
            <span>Hak Cipta © 2024 - 2026 <strong>Denuda</strong></span>
            <span className="text-neutral-300">•</span>
            <span>All Rights Reserved</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-full flex flex-col gap-6 pb-12 max-w-5xl mx-auto w-full">
      {/* Settings Top Header with Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
        <div className="flex flex-col gap-1">
          <h2 className="text-3xl font-black text-theme-900 tracking-tight">Pengaturan & Panduan</h2>
          <p className="text-theme-600-text text-sm font-medium">Sesuaikan database, integrasi sistem, dan pelajari panduan lengkap penggunaan aplikasi.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center p-1.5 bg-neutral-100 rounded-2xl border border-neutral-200/80 shrink-0 self-start sm:self-auto flex-wrap gap-1">
          <button
            onClick={() => setActiveSubTab('config')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              activeSubTab === 'config'
                ? 'bg-white text-theme-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Konfigurasi Sistem</span>
          </button>

          <button
            onClick={() => setActiveSubTab('guide')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === 'guide'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Panduan Lengkap</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
              activeSubTab === 'guide' ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              Animasi
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab('about')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all relative ${
              activeSubTab === 'about'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Tentang Aplikasi</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
              activeSubTab === 'about' ? 'bg-white text-emerald-900' : 'bg-emerald-100 text-emerald-800'
            }`}>
              v3.2.0
            </span>
          </button>
        </div>
      </div>

      {/* View Content: Guide vs About vs Config */}
      {activeSubTab === 'guide' ? (
        <UserGuide onNavigateTab={onNavigateTab} isEmbedded />
      ) : activeSubTab === 'about' ? (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Quick Sub-navigation bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-50 p-4 rounded-2xl border border-neutral-200/80">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-neutral-500 mr-1">Navigasi Tab:</span>
              <button
                onClick={() => setActiveSubTab('config')}
                className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-theme-400 hover:bg-theme-50 text-xs font-bold rounded-xl text-neutral-700 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <Settings className="w-3.5 h-3.5 text-theme-600" />
                <span>Buka Konfigurasi Sistem</span>
              </button>
              <button
                onClick={() => setActiveSubTab('guide')}
                className="px-3 py-1.5 bg-white border border-neutral-300 hover:border-emerald-400 hover:bg-emerald-50 text-xs font-bold rounded-xl text-neutral-700 transition-all flex items-center gap-1.5 shadow-2xs"
              >
                <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                <span>Buka Panduan Lengkap</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-3 py-1 rounded-xl border border-emerald-300 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-600" />
                Versi Aplikasi: v3.2.0 Pro
              </span>
            </div>
          </div>

          {renderAboutCard()}
        </div>
      ) : (
        <div className="space-y-8">
          {/* Top Quick Launcher Banners (Tentang Aplikasi Launcher & Panduan) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. TENTANG APLIKASI LAUNCHER (MENAMPILKAN VERSI APLIKASI INI & DEVELOPER DENUDA) */}
            <div className="relative bg-gradient-to-br from-neutral-900 via-theme-950 to-neutral-900 rounded-[2rem] p-5 sm:p-6 text-white shadow-md overflow-hidden flex flex-col justify-between border border-theme-700/50 group">
              <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />
              
              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                      Tentang Aplikasi Launcher
                    </span>
                  </div>

                  {/* PROMINENT APPLICATION VERSION BADGE */}
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 shadow-inner">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                    <span className="text-xs font-black tracking-wide">Versi Aplikasi: v3.2.0 Pro</span>
                  </div>
                </div>

                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-900/30">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white tracking-tight flex items-center gap-2">
                      <span>Daily Report Pro</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 text-emerald-300 border border-emerald-400/30">
                        Build 2026.11.12
                      </span>
                    </h3>
                    <p className="text-xs text-neutral-300 font-medium mt-0.5">
                      Developer: <strong className="text-emerald-400 font-bold">Denuda</strong> • Hak Cipta © 2024 - 2026 Denuda
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300/90 leading-relaxed mb-4">
                  Sistem rekap laporan stok harian, checklist barang datang kilat, kontrol expired dekat, & manajemen data multi-perangkat.
                </p>
              </div>

              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 text-[11px] text-neutral-300 font-medium">
                  <BadgeCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Karya Resmi <strong>Denuda</strong></span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('section-tentang-aplikasi');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth' });
                    } else {
                      setActiveSubTab('about');
                    }
                  }}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>Buka Tentang Aplikasi</span>
                </button>
              </div>
            </div>

            {/* 2. PANDUAN LENGKAP LAUNCHER BANNER */}
            <div className="relative bg-gradient-to-br from-theme-900 via-neutral-900 to-neutral-900 rounded-[2rem] p-5 sm:p-6 text-white shadow-md overflow-hidden flex flex-col justify-between border border-theme-700/50 group">
              <div className="absolute top-0 right-0 w-44 h-44 bg-teal-500/10 rounded-full blur-2xl pointer-events-none group-hover:scale-125 transition-transform" />

              <div className="relative z-10">
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-teal-400 animate-pulse" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-teal-400">
                      Panduan Interaktif & Animasi
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-500/20 text-teal-300 border border-teal-400/30">
                    Animasi & Simulasi
                  </span>
                </div>

                <div className="flex items-start gap-3.5 mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400 shrink-0 shadow-inner">
                    <BookOpen className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">Panduan Cara Penggunaan</h3>
                    <p className="text-xs text-neutral-300 font-medium mt-0.5">
                      Pelajari alur antrean kilat, otomatisasi checklist, dan simulasi demo.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-neutral-300/90 leading-relaxed mb-4">
                  Panduan visual langkah-demi-langkah dilengkapi animasi alur kerja untuk mempercepat adaptasi tim operasional.
                </p>
              </div>

              <div className="relative z-10 pt-3 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
                <span className="text-[11px] text-neutral-300 font-medium">Tersedia 6 Modul Lengkap</span>

                <button
                  type="button"
                  onClick={() => setActiveSubTab('guide')}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95 shrink-0"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Buka Panduan Lengkap</span>
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column */}
            <div className="lg:col-span-8 flex flex-col gap-8">
              
              {/* DATABASE PROVIDER SELECTION */}
              <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8 relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-5">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shrink-0">
                  <Database className="w-7 h-7 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-theme-900">Sumber Database</h3>
                    <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                      {activeProvider === 'supabase' ? 'Supabase Aktif' : activeProvider === 'firebase' ? 'Firebase Aktif' : 'Offline Aktif'}
                    </span>
                  </div>
                  <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                    Pilih database yang digunakan untuk menyimpan produk, supplier, dan laporan harian Anda. (Dilindungi PIN)
                  </p>
                </div>
              </div>

              {/* Discreet hidden trigger for changing database PIN */}
              <button
                type="button"
                onClick={openHiddenPinSettings}
                className="p-2 rounded-xl text-neutral-300 hover:text-neutral-600 hover:bg-neutral-100/80 transition-all opacity-40 hover:opacity-100 shrink-0"
                aria-label="Keamanan PIN"
              >
                <Lock className="w-4 h-4" />
              </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-5">
              {[
                { name: 'suppliers', label: '1. Master Supplier', desc: 'Vendor & pemasok barang' },
                { name: 'products', label: '2. Master Produk', desc: 'Katalog barang & butom stok' },
                { name: 'reports', label: '3. Laporan & Order', desc: 'Laporan harian, status datang, & ceklis' },
                { name: 'stock_outs', label: '4. Pengeluaran (Keluar)', desc: 'Riwayat pengeluaran barang' },
                { name: 'near_expired', label: '5. Expired Dekat', desc: 'Rekap produk mendekati kadaluwarsa & batch' },
                { name: 'settings', label: '6. Pengaturan Sistem', desc: 'Konfigurasi tema, auto-cleaner, & sync' },
                { name: 'chat_users', label: '7. Pengguna Chat', desc: 'Kehadiran staf & koordinasi online' },
                { name: 'messages', label: '8. Pesan Chat Tim', desc: 'Riwayat percakapan & chat real-time' },
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
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                  {[
                    { key: 'suppliers', name: 'suppliers' },
                    { key: 'products', name: 'products' },
                    { key: 'reports', name: 'reports' },
                    { key: 'stock_outs', name: 'stock_outs' },
                    { key: 'near_expired', name: 'near_expired' },
                    { key: 'settings', name: 'settings' },
                    { key: 'chat_users', name: 'chat_users' },
                    { key: 'messages', name: 'messages' }
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
                  Klik tombol &quot;Cek Status Tabel&quot; untuk memverifikasi apakah seluruh tabel sudah siap di database Supabase.
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
          
          {/* Auto-Delete & Data Retention Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-theme-50 rounded-2xl border border-theme-100 text-theme-600 shadow-sm shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-theme-900">Pembersihan Data</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-theme-100 text-theme-800">
                      {settings.autoDeleteMode === 'none' 
                        ? 'Nonaktif' 
                        : settings.autoDeleteMode === 'custom'
                          ? `Kustom (${settings.autoDeleteDays || customDays} Hari)`
                          : AUTO_DELETE_PRESETS.find(p => p.id === settings.autoDeleteMode)?.badge || 'Aktif'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                      <RefreshCw className="w-2.5 h-2.5 text-emerald-600" />
                      Sinkron Antar-Perangkat
                    </span>
                  </div>
                  <p className="text-xs text-theme-600-text mt-0.5 font-medium">
                    Atur durasi data laporan yang dipertahankan. Jika diubah di satu perangkat, perangkat lain otomatis mengikuti secara real-time.
                  </p>
                </div>
              </div>
            </div>

            {/* Notification alert */}
            {cleanNotification && (
              <div className={`mb-4 p-3 rounded-2xl text-xs font-semibold flex items-center justify-between gap-2.5 transition-all ${
                cleanNotification.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : cleanNotification.type === 'info'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {cleanNotification.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : cleanNotification.type === 'info' ? (
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{cleanNotification.text}</span>
                </div>
                <button 
                  onClick={() => setCleanNotification(null)}
                  className="text-xs font-bold hover:underline opacity-70 shrink-0"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Live Cutoff Status Box */}
            <div className={`mb-4 p-4 rounded-2xl border text-xs leading-relaxed ${
              settings.autoDeleteMode !== 'none' && currentCutoff
                ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                : 'bg-neutral-50 border-neutral-200 text-neutral-700'
            }`}>
              {settings.autoDeleteMode !== 'none' && currentCutoff ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between font-bold text-[13px] text-emerald-900 border-b border-emerald-200/60 pb-1.5">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-emerald-600" />
                      Masa Retensi: {currentCutoff.retentionDays} Hari
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 bg-emerald-100 rounded-full text-emerald-800">
                      Otomatis Aktif
                    </span>
                  </div>

                  <div className="text-[11px] space-y-1">
                    <div className="flex items-start gap-1.5 text-emerald-900">
                      <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span><strong>Dipertahankan:</strong> Mulai <span className="underline font-semibold">{currentCutoff.formattedCutoffDate}</span> s/d Hari ini.</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-emerald-800">
                      <Trash2 className="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                      <span><strong>Dibersihkan:</strong> Laporan sebelum tanggal {currentCutoff.formattedCutoffDate}.</span>
                    </div>
                  </div>

                  <div className="pt-1.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-semibold">
                    <span>Laporan lama siap dibersihkan:</span>
                    <span className={`px-2 py-0.5 rounded-full ${affectedReportsCount > 0 ? 'bg-amber-100 text-amber-900' : 'bg-emerald-100 text-emerald-800'}`}>
                      {affectedReportsCount} data
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2.5">
                  <Info className="w-4 h-4 text-neutral-500 shrink-0" />
                  <p className="text-xs text-neutral-600 font-medium">
                    Semua riwayat laporan disimpan selamanya tanpa pembersihan otomatis.
                  </p>
                </div>
              )}
            </div>

            {/* Presets List */}
            <div className="flex flex-col gap-2 mb-4 max-h-[340px] overflow-y-auto pr-1">
              {AUTO_DELETE_PRESETS.map((opt) => {
                const isSelected = settings.autoDeleteMode === opt.id;
                return (
                  <div 
                    key={opt.id}
                    onClick={() => handleModeChange(opt.id, opt.days || undefined)}
                    className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 ${
                      isSelected 
                        ? 'border-theme-500 bg-theme-50 shadow-xs ring-1 ring-theme-500/30' 
                        : 'border-theme-100 hover:border-theme-300 bg-white hover:bg-neutral-50/60'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-theme-900 text-xs sm:text-sm">{opt.label}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                          isSelected ? 'bg-theme-200 text-theme-900' : 'bg-neutral-100 text-neutral-600'
                        }`}>
                          {opt.id === 'custom' && isSelected ? `${settings.autoDeleteDays || customDays} Hari` : opt.badge}
                        </span>
                      </div>
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border ${
                        isSelected ? 'border-theme-600 bg-theme-600' : 'border-neutral-300'
                      }`}>
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                    </div>
                    <p className="text-[11px] font-medium text-theme-600-text leading-snug">
                      {opt.id === 'custom' && isSelected
                        ? `Mempertahankan data ${settings.autoDeleteDays || customDays} hari terakhir.`
                        : opt.description}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Custom Days Input Section */}
            {settings.autoDeleteMode === 'custom' && (
              <div className="p-4 rounded-2xl bg-theme-50/80 border border-theme-200 mb-4 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-theme-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-theme-600" />
                    Kustom Jumlah Hari yang Dipertahankan:
                  </label>
                  <span className="text-xs font-bold text-theme-800 bg-white px-2 py-0.5 rounded-lg border border-theme-200">
                    {customDays} Hari
                  </span>
                </div>

                {/* Interactive Stepper */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => handleCustomDaysChange(Math.max(1, customDays - 1))}
                    disabled={customDays <= 1}
                    className="w-10 h-10 rounded-xl bg-white border border-theme-200 hover:bg-theme-100 text-theme-800 font-black flex items-center justify-center transition-all disabled:opacity-40 shadow-xs"
                    title="Kurangi 1 Hari"
                  >
                    <Minus className="w-4 h-4" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="number"
                      min={1}
                      max={365}
                      value={customDays}
                      onChange={(e) => {
                        const val = parseInt(e.target.value, 10);
                        if (!isNaN(val)) {
                          handleCustomDaysChange(val);
                        }
                      }}
                      className="w-full text-center py-2 px-3 text-sm font-black text-theme-900 bg-white border border-theme-300 rounded-xl focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none shadow-xs"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-neutral-400 pointer-events-none">
                      Hari
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCustomDaysChange(Math.min(365, customDays + 1))}
                    disabled={customDays >= 365}
                    className="w-10 h-10 rounded-xl bg-white border border-theme-200 hover:bg-theme-100 text-theme-800 font-black flex items-center justify-center transition-all disabled:opacity-40 shadow-xs"
                    title="Tambah 1 Hari"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {/* Quick chip presets */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-theme-600 uppercase tracking-wide mr-1">Pilihan Cepat:</span>
                  {[
                    { label: '4 Hari', days: 4 },
                    { label: '5 Hari', days: 5 },
                    { label: '10 Hari', days: 10 },
                    { label: '21 Hari', days: 21 },
                    { label: '60 Hari', days: 60 },
                    { label: '90 Hari', days: 90 },
                  ].map((chip) => (
                    <button
                      key={chip.days}
                      type="button"
                      onClick={() => handleCustomDaysChange(chip.days)}
                      className={`px-2 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        customDays === chip.days 
                          ? 'bg-theme-600 text-white shadow-xs' 
                          : 'bg-white text-theme-800 border border-theme-200 hover:bg-theme-100/70'
                      }`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Manual Action Button */}
            <div className="pt-2 border-t border-neutral-100 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleCleanNow}
                disabled={isCleaningNow || settings.autoDeleteMode === 'none'}
                className="w-full py-2.5 px-4 bg-theme-600 hover:bg-theme-700 active:scale-98 disabled:opacity-50 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCleaningNow ? 'animate-spin' : ''}`} />
                <span>{isCleaningNow ? 'Sedang Membersihkan...' : 'Jalankan Pembersihan Sekarang'}</span>
              </button>

              <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 font-medium px-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Riwayat Barang Datang tetap aman disimpan untuk arsip audit.</span>
              </div>
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

      {/* TENTANG APLIKASI, DEVELOPER & HAK CIPTA */}
      {renderAboutCard()}
    </div>
  )}

      {/* Database Switch PIN Verification Modal */}
      <DbPinModal
        isOpen={pendingProvider !== null}
        targetProviderName={pendingProvider ? providerDisplayNames[pendingProvider] : ''}
        storedPinHash={settings.dbPinHash}
        onSuccess={executeConfirmedProviderSwitch}
        onCancel={() => setPendingProvider(null)}
      />

      {/* Hidden / Discreet Change Database PIN Modal */}
      {showChangePinModal && (
        <div
          className="fixed inset-0 z-[220] flex items-center justify-center bg-neutral-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150"
          onClick={() => setShowChangePinModal(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-[2rem] border border-theme-200 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 pb-4 border-b border-neutral-100 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                  <KeyRound className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-theme-900 tracking-tight">
                    Pengaturan Ubah PIN Database
                  </h3>
                  <p className="text-xs font-medium text-neutral-500 mt-0.5">
                    Perbarui PIN keamanan untuk perpindahan sumber database
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
                title="Tutup"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleChangePinSubmit} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-neutral-700">
                    PIN Saat Ini
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPinFields(!showPinFields)}
                    className="text-[11px] font-semibold text-theme-700 hover:underline flex items-center gap-1"
                  >
                    {showPinFields ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPinFields ? 'Sembunyikan' : 'Tampilkan'}</span>
                  </button>
                </div>
                <input
                  type={showPinFields ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={10}
                  value={currentPinInput}
                  onChange={(e) => {
                    setCurrentPinInput(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  placeholder="Masukkan PIN lama"
                  className="w-full px-3.5 py-2.5 text-sm font-bold tracking-widest rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  PIN Baru (4 - 8 Digit Angka)
                </label>
                <input
                  type={showPinFields ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={newPinInput}
                  onChange={(e) => {
                    setNewPinInput(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  placeholder="Masukkan PIN baru"
                  className="w-full px-3.5 py-2.5 text-sm font-bold tracking-widest rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-700 mb-1.5">
                  Konfirmasi PIN Baru
                </label>
                <input
                  type={showPinFields ? 'text' : 'password'}
                  inputMode="numeric"
                  autoComplete="off"
                  maxLength={8}
                  value={confirmPinInput}
                  onChange={(e) => {
                    setConfirmPinInput(e.target.value.replace(/\D/g, ''));
                    setPinChangeError(null);
                  }}
                  placeholder="Ulangi PIN baru"
                  className="w-full px-3.5 py-2.5 text-sm font-bold tracking-widest rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                />
              </div>

              {pinChangeError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{pinChangeError}</span>
                </div>
              )}

              {pinChangeSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{pinChangeSuccess}</span>
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowChangePinModal(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-bold transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingPin}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] disabled:opacity-50 text-white text-xs font-bold transition-all shadow-sm"
                >
                  {isSavingPin ? 'Menyimpan...' : 'Simpan PIN Baru'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
</div>
  );
};
