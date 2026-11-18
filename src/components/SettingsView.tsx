import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { 
  Settings, Trash2, CheckCircle2, LayoutPanelLeft, Palette, ShieldAlert,
  Database, Download, Upload, Server, Copy, Check, ExternalLink, 
  RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Layers, CheckCircle, Flame,
  BookOpen, Sparkles, Play, Calendar, Clock, Minus, Plus, Info, ShieldCheck,
  Code2, Copyright, Award, Heart, BadgeCheck, Laptop, Cpu,
  Lock, KeyRound, Eye, EyeOff, X,
  Building2, MapPin, Phone, Mail, ImagePlus, Save, RotateCcw
} from 'lucide-react';
import { AutoDeleteMode, NavbarPosition, DbProvider, ClockStyle } from '../types';
import { 
  getSupabaseConfig, setSupabaseConfig, SUPABASE_SQL_SCHEMA, 
  checkSupabaseTableStatus, TableStatus, DEFAULT_SUPABASE_URL, DEFAULT_SUPABASE_KEY 
} from '../lib/supabase';
import { getDbProvider, AllTablesStatusResult, TABLE_METADATA } from '../lib/dbAdapter';
import { testFirebaseConnection, resetFirebaseQuotaStatus } from '../lib/firebase';
import { getCleanupCutoffDate, formatDateIndo, AUTO_DELETE_PRESETS, getRetentionDays } from '../lib/cleanupUtils';
import { verifyDatabasePin, hashUserPin, isValidPinFormat } from '../lib/pinSecurity';
import { processCompanyIconFile } from '../lib/imageUtils';
import { CLOCK_STYLE_OPTIONS, getRecommendedClockStyleForTheme } from '../lib/clockStyles';
import firebaseConfig from '../../firebase-applet-config.json';
import { UserGuide } from './UserGuide';
import { DbPinModal } from './common/DbPinModal';
import { Clock as LiveClock } from './Clock';

export type SettingsSubTab = 'profile' | 'appearance' | 'database' | 'data' | 'guide' | 'about';

export interface SettingsViewProps {
  onNavigateTab?: (tab: 'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'settings') => void;
  defaultSubTab?: 'config' | SettingsSubTab;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigateTab, defaultSubTab = 'profile' }) => {
  const { 
    settings, updateSettings, resetAllData, exportData, importData, 
    migrateCurrentDataToSupabase, dbProvider,
    autoCreateMissingTables, getTablesStatus,
    reports, cleanOldReportsNow
  } = useAppContext();
  
  const normalizeSubTab = (tab?: string): SettingsSubTab => {
    const validTabs: SettingsSubTab[] = ['profile', 'appearance', 'database', 'data', 'guide', 'about'];
    return validTabs.includes(tab as SettingsSubTab) ? (tab as SettingsSubTab) : 'profile';
  };

  const [activeSubTab, setActiveSubTab] = useState<SettingsSubTab>(() => normalizeSubTab(defaultSubTab));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyIconInputRef = useRef<HTMLInputElement>(null);

  // Company Profile states
  const [companyName, setCompanyName] = useState(settings.companyName || '');
  const [companyTagline, setCompanyTagline] = useState(settings.companyTagline || '');
  const [companyAddress, setCompanyAddress] = useState(settings.companyAddress || '');
  const [companyPhone, setCompanyPhone] = useState(settings.companyPhone || '');
  const [companyEmail, setCompanyEmail] = useState(settings.companyEmail || '');
  const [companyIcon, setCompanyIcon] = useState(settings.companyIcon || '');
  const [isUploadingCompanyIcon, setIsUploadingCompanyIcon] = useState(false);
  const [isSavingCompanyProfile, setIsSavingCompanyProfile] = useState(false);
  const [companyProfileFeedback, setCompanyProfileFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setCompanyName(settings.companyName || '');
    setCompanyTagline(settings.companyTagline || '');
    setCompanyAddress(settings.companyAddress || '');
    setCompanyPhone(settings.companyPhone || '');
    setCompanyEmail(settings.companyEmail || '');
    setCompanyIcon(settings.companyIcon || '');
  }, [
    settings.companyName,
    settings.companyTagline,
    settings.companyAddress,
    settings.companyPhone,
    settings.companyEmail,
    settings.companyIcon
  ]);

  const handleCompanyIconUpload = async (file?: File | null) => {
    if (!file) return;
    setIsUploadingCompanyIcon(true);
    setCompanyProfileFeedback(null);
    try {
      const processedDataUrl = await processCompanyIconFile(file, 200);
      setCompanyIcon(processedDataUrl);
      await updateSettings({
        ...settings,
        companyName: companyName.trim(),
        companyTagline: companyTagline.trim(),
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        companyIcon: processedDataUrl
      });
      setCompanyProfileFeedback({
        type: 'success',
        text: 'Icon perusahaan berhasil diunggah dan diterapkan.'
      });
    } catch (err: any) {
      setCompanyProfileFeedback({
        type: 'error',
        text: err?.message || 'Gagal memproses gambar icon perusahaan.'
      });
    } finally {
      setIsUploadingCompanyIcon(false);
      if (companyIconInputRef.current) companyIconInputRef.current.value = '';
    }
  };

  const handleRemoveCompanyIcon = async () => {
    setCompanyIcon('');
    setCompanyProfileFeedback(null);
    try {
      await updateSettings({
        ...settings,
        companyIcon: ''
      });
      setCompanyProfileFeedback({
        type: 'success',
        text: 'Icon perusahaan dihapus dan dikembalikan ke inisial default.'
      });
    } catch (err: any) {
      setCompanyProfileFeedback({
        type: 'error',
        text: err?.message || 'Gagal menghapus icon perusahaan.'
      });
    }
  };

  const handleSaveCompanyProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingCompanyProfile(true);
    setCompanyProfileFeedback(null);
    try {
      await updateSettings({
        ...settings,
        companyName: companyName.trim(),
        companyTagline: companyTagline.trim(),
        companyAddress: companyAddress.trim(),
        companyPhone: companyPhone.trim(),
        companyEmail: companyEmail.trim(),
        companyIcon
      });
      setCompanyProfileFeedback({
        type: 'success',
        text: 'Profil perusahaan berhasil disimpan & disinkronkan.'
      });
    } catch (err: any) {
      setCompanyProfileFeedback({
        type: 'error',
        text: err?.message || 'Gagal menyimpan profil perusahaan.'
      });
    } finally {
      setIsSavingCompanyProfile(false);
    }
  };

  const handleResetCompanyProfile = async () => {
    setCompanyName('');
    setCompanyTagline('');
    setCompanyAddress('');
    setCompanyPhone('');
    setCompanyEmail('');
    setCompanyIcon('');
    setCompanyProfileFeedback(null);
    try {
      await updateSettings({
        ...settings,
        companyName: '',
        companyTagline: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyIcon: ''
      });
      setCompanyProfileFeedback({
        type: 'success',
        text: 'Profil perusahaan dikembalikan ke pengaturan default.'
      });
    } catch (err: any) {
      setCompanyProfileFeedback({
        type: 'error',
        text: err?.message || 'Gagal mereset profil perusahaan.'
      });
    }
  };

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
  const [existingTablesStatus, setExistingTablesStatus] = useState<TableStatus | null>(null);
  const [missingColumnsMap, setMissingColumnsMap] = useState<Partial<Record<keyof TableStatus, string[]>>>({});
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
        setExistingTablesStatus(res.existingTables);
        setMissingColumnsMap(res.missingColumns || {});
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
    const matchedClockStyle = getRecommendedClockStyleForTheme(theme);
    updateSettings({ ...settings, theme, clockStyle: matchedClockStyle });
  };

  const handleClockStyleChange = (clockStyle: ClockStyle) => {
    updateSettings({ ...settings, clockStyle });
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

  const settingsTabs: Array<{
    id: SettingsSubTab;
    label: string;
    shortDesc: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
    group: 'pengaturan' | 'bantuan';
  }> = [
    {
      id: 'profile',
      label: 'Profil Perusahaan',
      shortDesc: 'Identitas, kontak & logo',
      icon: Building2,
      group: 'pengaturan'
    },
    {
      id: 'appearance',
      label: 'Tampilan & Tema',
      shortDesc: '10 Tema 3D & navigasi',
      icon: Palette,
      badge: '3D',
      group: 'pengaturan'
    },
    {
      id: 'database',
      label: 'Database & Cloud',
      shortDesc: activeProvider === 'supabase' ? 'Supabase Aktif' : activeProvider === 'firebase' ? 'Firebase Aktif' : 'Offline Lokal',
      icon: Database,
      group: 'pengaturan'
    },
    {
      id: 'data',
      label: 'Data & Sistem',
      shortDesc: 'Retensi, backup & reset',
      icon: ShieldCheck,
      group: 'pengaturan'
    },
    {
      id: 'guide',
      label: 'Panduan Lengkap',
      shortDesc: 'Alur kerja & simulasi',
      icon: BookOpen,
      badge: 'Animasi',
      group: 'bantuan'
    },
    {
      id: 'about',
      label: 'Tentang Aplikasi',
      shortDesc: 'Versi, lisensi & info',
      icon: Award,
      badge: 'v3.2.0',
      group: 'bantuan'
    }
  ];

  const activeThemeDisplayMap: Record<string, string> = {
    default: 'Sage Green 3D',
    green: 'Sage Green 3D',
    blue: 'Ocean Blue 3D',
    rose: 'Rose Red 3D',
    amber: 'Warm Amber 3D',
    purple: 'Royal Purple 3D',
    cyan: 'Cyan Breeze 3D',
    colorful: 'Colorful 3D',
    '3d': '3D Depth',
    glossy: 'Glosy Shine',
    glass: 'Glassmorphism'
  };
  const currentThemeLabel = activeThemeDisplayMap[settings.theme || 'default'] || 'Sage Green 3D';
  const previewCompanyName = companyName.trim() || 'ReportPro';
  const previewCompanyTagline = companyTagline.trim() || 'Manajemen Stok & Laporan';

  return (
    <div className="h-full flex flex-col gap-6 pb-12 max-w-6xl mx-auto w-full">
      {/* Settings Header & Grouped Tab Menu */}
      <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm p-5 sm:p-6 flex flex-col gap-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-200 text-theme-600 shadow-xs shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-theme-900 tracking-tight">Pengaturan Aplikasi</h2>
              <p className="text-theme-600-text text-xs sm:text-sm font-medium mt-0.5 leading-relaxed">
                Kelola profil perusahaan, tampilan tema 3D, koneksi database, pemeliharaan data, dan panduan dalam tab terkelompok.
              </p>
            </div>
          </div>

          {/* Compact Status Overview Chips */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveSubTab('database')}
              className="px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Buka tab Database & Cloud"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>{activeProvider === 'supabase' ? 'Supabase' : activeProvider === 'firebase' ? 'Firebase' : 'Offline'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('appearance')}
              className="px-3 py-1.5 rounded-xl bg-theme-50 hover:bg-theme-100/80 border border-theme-200 text-theme-800 text-xs font-bold flex items-center gap-1.5 transition-colors"
              title="Buka tab Tampilan & Tema"
            >
              <Palette className="w-3.5 h-3.5 text-theme-600" />
              <span>{currentThemeLabel}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveSubTab('about')}
              className="px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-emerald-300 border border-neutral-800 text-xs font-black flex items-center gap-1.5 transition-colors"
              title="Buka tab Tentang Aplikasi"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>v3.2.0 Pro</span>
            </button>
          </div>
        </div>

        {/* Grouped Tab Navigation Bar */}
        <div className="pt-4 border-t border-theme-100 flex flex-col gap-3">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
            {/* Group 1: Konfigurasi Utama */}
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-600-text px-1">
                Konfigurasi & Sistem
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {settingsTabs.filter((t) => t.group === 'pengaturan').map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`text-left px-3.5 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-theme-600 text-white border-theme-700 shadow-sm'
                          : 'bg-theme-50/50 hover:bg-theme-100/70 text-theme-900 border-theme-200/80'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-theme-600 border border-theme-100'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-xs font-extrabold leading-tight break-words">{tab.label}</span>
                          {tab.badge && (
                            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black uppercase ${
                              isActive ? 'bg-white/20 text-white' : 'bg-theme-100 text-theme-800'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${
                          isActive ? 'text-white/85' : 'text-theme-600-text'
                        }`}>
                          {tab.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="hidden xl:block w-px self-stretch bg-theme-100 mx-1" />

            {/* Group 2: Bantuan & Informasi */}
            <div className="flex flex-col gap-1.5 xl:w-[340px] shrink-0">
              <span className="text-[10px] font-black uppercase tracking-wider text-theme-600-text px-1">
                Bantuan & Informasi
              </span>
              <div className="grid grid-cols-2 gap-2">
                {settingsTabs.filter((t) => t.group === 'bantuan').map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeSubTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveSubTab(tab.id)}
                      className={`text-left px-3.5 py-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                        isActive
                          ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                          : 'bg-neutral-50 hover:bg-emerald-50/70 text-neutral-900 border-neutral-200/90'
                      }`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${
                        isActive ? 'bg-white/20 text-white' : 'bg-white text-emerald-600 border border-neutral-200/80'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1 flex-wrap">
                          <span className="text-xs font-extrabold leading-tight break-words">{tab.label}</span>
                          {tab.badge && (
                            <span className={`px-1.5 py-0.2 rounded-md text-[9px] font-black ${
                              isActive ? 'bg-white text-emerald-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {tab.badge}
                            </span>
                          )}
                        </div>
                        <p className={`text-[10px] font-medium leading-tight mt-0.5 truncate ${
                          isActive ? 'text-white/85' : 'text-neutral-500'
                        }`}>
                          {tab.shortDesc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TAB 1: PROFIL PERUSAHAAN */}
      {activeSubTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Form Editor Profil Perusahaan */}
          <div className="lg:col-span-8 bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8 relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm shrink-0">
                  <Building2 className="w-7 h-7 text-theme-500" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-xl font-bold text-theme-900">Profil & Identitas Perusahaan</h3>
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-theme-100 text-theme-800">
                      Sidebar, Header & PDF
                    </span>
                  </div>
                  <p className="text-sm text-theme-600-text mt-1 font-medium leading-relaxed">
                    Sesuaikan nama perusahaan, slogan, kontak, serta unggah logo/icon perusahaan agar tampil di navigasi aplikasi dan kop laporan PDF.
                  </p>
                </div>
              </div>
            </div>

            {companyProfileFeedback && (
              <div className={`mb-5 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between gap-3 ${
                companyProfileFeedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}>
                <div className="flex items-center gap-2">
                  {companyProfileFeedback.type === 'success'
                    ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />}
                  <span>{companyProfileFeedback.text}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setCompanyProfileFeedback(null)}
                  className="text-xs font-bold hover:underline opacity-75 shrink-0"
                >
                  Tutup
                </button>
              </div>
            )}

            <form onSubmit={handleSaveCompanyProfile} className="space-y-6">
              {/* Upload Icon Perusahaan */}
              <div className="p-5 rounded-2xl bg-theme-50/70 border border-theme-200 flex flex-col sm:flex-row items-center gap-5">
                <div
                  onClick={() => companyIconInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) handleCompanyIconUpload(file);
                  }}
                  className="w-24 h-24 rounded-3xl bg-white border-2 border-dashed border-theme-300 hover:border-theme-500 flex items-center justify-center overflow-hidden cursor-pointer shadow-sm shrink-0 transition-all group relative"
                  title="Klik atau seret gambar untuk upload icon perusahaan"
                >
                  {companyIcon ? (
                    <img
                      src={companyIcon}
                      alt="Icon Perusahaan"
                      className="w-full h-full object-contain p-1.5"
                    />
                  ) : (
                    <div className="w-full h-full bg-theme-500 text-white flex flex-col items-center justify-center gap-1">
                      <span className="text-2xl font-black leading-none">
                        {previewCompanyName.charAt(0).toUpperCase()}
                      </span>
                      <span className="text-[9px] font-bold uppercase tracking-wider opacity-85">
                        Default
                      </span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-neutral-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white">
                    <ImagePlus className="w-6 h-6" />
                  </div>
                </div>

                <div className="flex-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-theme-900">Logo / Icon Perusahaan</h4>
                  <p className="text-xs text-theme-600-text mt-1 leading-relaxed">
                    Unggah gambar logo (PNG, JPG, WebP, atau SVG). Gambar otomatis dioptimalkan ke ukuran 200×200px agar ringan & tetap tajam.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center justify-center sm:justify-start gap-2.5">
                    <button
                      type="button"
                      onClick={() => companyIconInputRef.current?.click()}
                      disabled={isUploadingCompanyIcon}
                      className="px-4 py-2 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm disabled:opacity-50"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingCompanyIcon ? 'Memproses...' : (companyIcon ? 'Ganti Icon' : 'Upload Icon')}</span>
                    </button>

                    {companyIcon && (
                      <button
                        type="button"
                        onClick={handleRemoveCompanyIcon}
                        className="px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Icon</span>
                      </button>
                    )}
                  </div>
                  <input
                    ref={companyIconInputRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleCompanyIconUpload(e.target.files?.[0])}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-theme-900 mb-1.5">
                    Nama Perusahaan / Toko
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={150}
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="Contoh: PT Maju Jaya / ReportPro"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-semibold text-theme-900 bg-neutral-50 border border-theme-200 rounded-xl focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-900 mb-1.5">
                    Slogan / Bidang Usaha
                  </label>
                  <input
                    type="text"
                    maxLength={120}
                    value={companyTagline}
                    onChange={(e) => setCompanyTagline(e.target.value)}
                    placeholder="Contoh: Manajemen Stok & Gudang"
                    className="w-full px-3.5 py-2.5 text-sm font-medium text-theme-900 bg-neutral-50 border border-theme-200 rounded-xl focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-900 mb-1.5">
                    No. Telepon / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      maxLength={40}
                      value={companyPhone}
                      onChange={(e) => setCompanyPhone(e.target.value)}
                      placeholder="Contoh: 0812-3456-7890"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium text-theme-900 bg-neutral-50 border border-theme-200 rounded-xl focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-theme-900 mb-1.5">
                    Email Perusahaan
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      maxLength={80}
                      value={companyEmail}
                      onChange={(e) => setCompanyEmail(e.target.value)}
                      placeholder="Contoh: admin@perusahaan.co.id"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium text-theme-900 bg-neutral-50 border border-theme-200 rounded-xl focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-theme-900 mb-1.5">
                    Alamat Perusahaan / Cabang
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
                    <textarea
                      rows={2}
                      maxLength={300}
                      value={companyAddress}
                      onChange={(e) => setCompanyAddress(e.target.value)}
                      placeholder="Contoh: Jl. Sudirman No. 123, Jakarta Selatan"
                      className="w-full pl-10 pr-3.5 py-2.5 text-sm font-medium text-theme-900 bg-neutral-50 border border-theme-200 rounded-xl focus:bg-white focus:border-theme-500 focus:ring-2 focus:ring-theme-500/20 outline-none transition-all resize-none"
                    />
                  </div>
                </div>
              </div>

              {/* Save & Reset Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={handleResetCompanyProfile}
                  className="px-4 py-2.5 bg-white hover:bg-neutral-50 text-neutral-700 border border-neutral-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Default</span>
                </button>

                <button
                  type="submit"
                  disabled={isSavingCompanyProfile}
                  className="px-6 py-2.5 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl text-sm flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSavingCompanyProfile ? 'Menyimpan...' : 'Simpan Profil Perusahaan'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Branding Preview Card */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-extrabold text-theme-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-theme-500" />
                  Pratinjau Identitas
                </h4>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-100 text-theme-800">
                  Live Preview
                </span>
              </div>

              {/* Preview Sidebar / Header Box */}
              <div className="p-4 rounded-2xl bg-theme-50/70 border border-theme-200 flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-theme-500 flex items-center justify-center text-white shadow-sm shrink-0 overflow-hidden">
                  {companyIcon ? (
                    <img src={companyIcon} alt={previewCompanyName} className="w-full h-full object-contain p-0.5 bg-white" />
                  ) : (
                    <span className="font-black text-base">{previewCompanyName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-black text-sm text-theme-900 leading-snug break-words">
                    {previewCompanyName}
                  </div>
                  <div className="text-[11px] font-medium text-theme-600-text leading-snug break-words mt-0.5">
                    {previewCompanyTagline}
                  </div>
                </div>
              </div>

              {/* Preview Kop PDF */}
              <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 block">
                  Kop Laporan PDF & Cetak
                </span>
                <div className="bg-white p-3.5 rounded-xl border border-neutral-200/80 space-y-1.5">
                  <p className="text-xs font-black text-neutral-900 leading-snug break-words">
                    {previewCompanyName}
                  </p>
                  {companyTagline.trim() && (
                    <p className="text-[11px] font-semibold text-theme-700 leading-snug break-words">
                      {companyTagline.trim()}
                    </p>
                  )}
                  {(companyAddress.trim() || companyPhone.trim() || companyEmail.trim()) ? (
                    <div className="pt-1.5 border-t border-neutral-100 text-[10px] text-neutral-600 space-y-0.5 leading-relaxed break-words">
                      {companyAddress.trim() && <p>{companyAddress.trim()}</p>}
                      {(companyPhone.trim() || companyEmail.trim()) && (
                        <p>
                          {[companyPhone.trim(), companyEmail.trim()].filter(Boolean).join(' • ')}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[10px] italic text-neutral-400">
                      Tambahkan alamat, telepon, atau email agar tampil di kop laporan cetak & PDF.
                    </p>
                  )}
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-[11px] text-emerald-900 font-medium leading-relaxed">
                Nama perusahaan panjang otomatis membungkus baris (multi-baris) sehingga tidak terpotong di header maupun cetakan PDF.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAMPILAN & TEMA */}
      {activeSubTab === 'appearance' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* Theme Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-4 mb-7">
              <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm shrink-0">
                <Palette className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-xl font-bold text-theme-900">Tema Warna & Gaya 3D</h3>
                  <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-full bg-theme-100 text-theme-800">
                    10 Pilihan Tema 3D
                  </span>
                </div>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Seluruh tema kini hadir dengan efek kedalaman 3D fisik. Mengubah tema juga otomatis menyesuaikan gaya jam agar serasi.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {[
                {
                  id: 'default',
                  name: 'Sage Green',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-[#A5B791] via-[#8B9D77] to-[#556B2F] shadow-[0_5px_0_#3F5022,inset_0_2px_3px_rgba(255,255,255,0.7)] ring-1 ring-[#DCE2CD]'
                },
                {
                  id: 'blue',
                  name: 'Ocean Blue',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-blue-400 via-blue-500 to-blue-700 shadow-[0_5px_0_#1e40af,inset_0_2px_3px_rgba(255,255,255,0.75)] ring-1 ring-blue-200'
                },
                {
                  id: 'rose',
                  name: 'Rose Red',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-rose-400 via-rose-500 to-rose-700 shadow-[0_5px_0_#9f1239,inset_0_2px_3px_rgba(255,255,255,0.75)] ring-1 ring-rose-200'
                },
                {
                  id: 'amber',
                  name: 'Warm Amber',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-amber-300 via-amber-500 to-amber-700 shadow-[0_5px_0_#92400e,inset_0_2px_3px_rgba(255,255,255,0.8)] ring-1 ring-amber-200'
                },
                {
                  id: 'purple',
                  name: 'Royal Purple',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-purple-400 via-purple-500 to-purple-700 shadow-[0_5px_0_#6b21a8,inset_0_2px_3px_rgba(255,255,255,0.75)] ring-1 ring-purple-200'
                },
                {
                  id: 'cyan',
                  name: 'Cyan Breeze',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-cyan-300 via-cyan-500 to-cyan-700 shadow-[0_5px_0_#155e75,inset_0_2px_3px_rgba(255,255,255,0.8)] ring-1 ring-cyan-200'
                },
                {
                  id: 'colorful',
                  name: 'Colorful',
                  badge: '3D',
                  color: 'bg-gradient-to-b from-pink-400 via-fuchsia-500 to-violet-700 shadow-[0_5px_0_#6d28d9,inset_0_2px_3px_rgba(255,255,255,0.78)] ring-1 ring-pink-200'
                },
                {
                  id: '3d',
                  name: '3D Depth',
                  badge: 'Slate 3D',
                  color: 'bg-gradient-to-b from-blue-400 via-blue-600 to-indigo-800 shadow-[0_5px_0_#1e3a8a,inset_0_2px_3px_rgba(255,255,255,0.75)] ring-1 ring-blue-300'
                },
                {
                  id: 'glossy',
                  name: 'Glosy Shine',
                  badge: '3D Mengkilap',
                  color: 'bg-[linear-gradient(180deg,#7dd3fc_0%,#0ea5e9_47%,#0284c7_51%,#0369a1_100%)] shadow-[0_5px_0_#075985,0_8px_16px_rgba(2,132,199,0.4),inset_0_2px_3px_rgba(255,255,255,0.92)] ring-1 ring-sky-200'
                },
                {
                  id: 'glass',
                  name: 'Glassmorphism',
                  badge: '3D Kaca',
                  color: 'bg-gradient-to-tr from-indigo-500/75 via-sky-400/70 to-pink-400/70 backdrop-blur-md border-2 border-white/90 shadow-[0_5px_0_rgba(67,56,202,0.55),0_8px_16px_rgba(79,70,229,0.28),inset_0_2px_4px_rgba(255,255,255,0.9)]'
                },
              ].map((t) => {
                const activeTheme = settings.theme === 'green' || !settings.theme ? 'default' : settings.theme;
                const isSelected = activeTheme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleThemeChange(t.id)}
                    className={`relative p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all duration-300 flex flex-col items-center gap-3 group ${
                      isSelected
                        ? 'border-theme-500 bg-theme-50 shadow-md scale-100'
                        : 'border-theme-100 hover:border-theme-300 hover:bg-neutral-50 bg-white hover:-translate-y-1'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full ${t.color} flex items-center justify-center transition-transform group-hover:scale-110`}>
                      {isSelected && <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />}
                    </div>
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-bold text-theme-900 text-sm text-center">{t.name}</span>
                      {t.badge && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-theme-100 text-theme-800">
                          {t.badge}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Clock Style Settings */}
          {(() => {
            const recommendedStyle = getRecommendedClockStyleForTheme(settings.theme);
            const activeClockStyle = settings.clockStyle || recommendedStyle;
            const isMatchedWithTheme = activeClockStyle === recommendedStyle;

            return (
              <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-7">
                  <div className="flex items-start gap-4">
                    <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm shrink-0">
                      <Clock className="w-7 h-7 text-theme-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-theme-900">Gaya Jam Header</h3>
                        <span className="text-xs font-semibold text-theme-600-text">
                          10 Gaya Unik · Pratinjau Langsung
                        </span>
                      </div>
                      <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                        Pilih gaya tampilan jam digital atau analog di header aplikasi. Saat tema diubah, gaya jam otomatis menyesuaikan dengan tema pilihan Anda.
                      </p>
                    </div>
                  </div>

                  {!isMatchedWithTheme && (
                    <button
                      type="button"
                      onClick={() => handleClockStyleChange(recommendedStyle)}
                      className="px-3.5 py-2 rounded-xl bg-theme-50 hover:bg-theme-100 border border-theme-200 text-theme-800 text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 self-start"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ikuti Tema ({currentThemeLabel})</span>
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {CLOCK_STYLE_OPTIONS.map((opt) => {
                    const isSelected = activeClockStyle === opt.id;
                    const isRecommended = recommendedStyle === opt.id;

                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => handleClockStyleChange(opt.id)}
                        className={`text-left p-4 rounded-[1.5rem] border-2 transition-all duration-200 flex flex-col justify-between gap-4 group ${
                          isSelected
                            ? 'border-theme-500 bg-theme-50/90 shadow-md'
                            : 'border-theme-100 hover:border-theme-300 bg-white hover:bg-neutral-50/70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 w-full">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-bold text-theme-900 text-sm">{opt.name}</span>
                            </div>
                            <p className="text-[11px] font-medium text-theme-600-text mt-0.5 leading-snug">
                              {opt.description}
                            </p>
                          </div>

                          <div className="shrink-0 flex items-center gap-1.5">
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-theme-600" />}
                          </div>
                        </div>

                        {/* Live Clock Preview Box */}
                        <div className="w-full py-3 px-2 rounded-2xl bg-neutral-100/80 border border-neutral-200/70 flex items-center justify-center overflow-hidden">
                          <div className="pointer-events-none select-none">
                            <LiveClock previewStyle={opt.id} compactPreview />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[11px] font-semibold w-full pt-1 border-t border-theme-100/70">
                          <span className="text-theme-600-text">{opt.badge}</span>
                          {isRecommended ? (
                            <span className="text-emerald-700 font-bold">
                              Serasi dengan tema ini
                            </span>
                          ) : (
                            <span className="text-neutral-400">
                              {isSelected ? 'Dipilih manual' : 'Klik untuk pakai'}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Navigation Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-4 mb-7">
              <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm shrink-0">
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
      )}

      {/* TAB 3: DATABASE & CLOUD */}
      {activeSubTab === 'database' && (
        <div className="flex flex-col gap-6 animate-in fade-in duration-200">
          {/* DATABASE PROVIDER SELECTION */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8 relative">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-4">
                <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm shrink-0">
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
                  <div className="flex items-center gap-2 flex-wrap">
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
                const isStatusLoaded = Boolean(tableInfo);
                const isReady = tableInfo ? tableInfo.exists : false;
                const missingCols = tableInfo?.missingColumns || [];
                const needsColUpdate = isStatusLoaded && !isReady && tableInfo?.tableExists && missingCols.length > 0;

                return (
                  <div
                    key={t.name}
                    className="p-4 rounded-2xl bg-neutral-50/70 border border-neutral-200/80 hover:bg-neutral-50 transition-colors flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span className="font-bold text-neutral-900 text-sm">{t.label}</span>
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          !isStatusLoaded
                            ? 'bg-neutral-100 text-neutral-600'
                            : isReady
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                        }`}>
                          {!isStatusLoaded ? (
                            <RefreshCw className="w-3 h-3 animate-spin text-neutral-500" />
                          ) : isReady ? (
                            <Check className="w-3 h-3 text-emerald-700" />
                          ) : (
                            <AlertTriangle className="w-3 h-3 text-amber-700" />
                          )}
                          {!isStatusLoaded ? 'Memeriksa...' : isReady ? 'Lengkap' : needsColUpdate ? 'Kurang Kolom' : 'Belum Ada'}
                        </span>
                      </div>
                      <p className="text-xs text-neutral-500 mb-2 font-medium">
                        {needsColUpdate ? `Kolom belum ada: ${missingCols.join(', ')}` : t.desc}
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

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-neutral-100">
              <div className="text-xs text-neutral-500 font-medium">
                Status saat ini: <strong className="text-neutral-800 font-bold">
                  {allTablesStatus ? allTablesStatus.message : 'Memeriksa status tabel...'}
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
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3.5 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 shadow-sm shrink-0">
                <Server className="w-7 h-7 text-emerald-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-xl font-bold text-theme-900">Integrasi & Setup Otomatis Supabase</h3>
                  <span className="text-xs font-bold px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full">
                    Project: Daily
                  </span>
                </div>
                <p className="text-sm text-theme-600-text mt-1 font-medium leading-relaxed">
                  Konfigurasi tabel otomatis dan kredensial koneksi untuk project Supabase Anda.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
              {/* STEP 1 */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      1
                    </div>
                    <h4 className="text-base font-bold text-neutral-900">Buat Tabel & RLS Otomatis di Supabase</h4>
                  </div>
                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                    Supabase membutuhkan 8 tabel: <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">suppliers</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">products</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">reports</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">stock_outs</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">near_expired</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">settings</code>, <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">chat_users</code>, dan <code className="text-emerald-700 font-mono bg-emerald-50 px-1 py-0.5 rounded">messages</code> beserta hak akses publik (RLS) dan realtime.
                  </p>
                </div>

                <div className="flex flex-wrap gap-2.5 items-center">
                  <button
                    onClick={handleCopySql}
                    className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm"
                  >
                    {isCopiedSql ? <Check className="w-3.5 h-3.5 text-emerald-200" /> : <Copy className="w-3.5 h-3.5" />}
                    {isCopiedSql ? 'Script SQL Disalin!' : 'Salin Script SQL'}
                  </button>

                  <a
                    href={`https://supabase.com/dashboard/project/${supabaseUrl.match(/https:\/\/([a-z0-9-]+)\.supabase\.co/i)?.[1] || 'fxmqvpfepatumdzzlqzt'}/sql/new`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    SQL Editor
                  </a>

                  <button
                    onClick={() => setShowSqlPreview(!showSqlPreview)}
                    className="px-3 py-2 text-neutral-600 hover:text-neutral-900 font-semibold rounded-xl text-xs flex items-center gap-1 transition-all"
                  >
                    {showSqlPreview ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    {showSqlPreview ? 'Tutup SQL' : 'Lihat SQL'}
                  </button>
                </div>
              </div>

              {/* STEP 3: MIGRATE CURRENT DATA */}
              <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                      3
                    </div>
                    <h4 className="text-base font-bold text-neutral-900">Salin / Migrasikan Data ke Supabase</h4>
                  </div>
                  <p className="text-xs text-neutral-600 mb-4 leading-relaxed">
                    Sudah memiliki data supplier, produk, atau laporan di aplikasi? Anda dapat menyalin seluruh data tersebut langsung ke database Supabase dengan 1 klik.
                  </p>
                </div>

                <div>
                  <button
                    onClick={handleMigrateData}
                    disabled={isMigrating}
                    className="px-4 py-2.5 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
                  >
                    <Upload className={`w-4 h-4 ${isMigrating ? 'animate-bounce' : ''}`} />
                    {isMigrating ? 'Memigrasikan Data...' : 'Migrasikan Data ke Supabase Sekarang'}
                  </button>

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
              </div>
            </div>

            {showSqlPreview && (
              <div className="mb-6">
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
                    const isComplete = tableStatus[tbl.key as keyof TableStatus];
                    const tblExists = existingTablesStatus?.[tbl.key as keyof TableStatus];
                    const missingCols = missingColumnsMap[tbl.key as keyof TableStatus] || [];
                    return (
                      <div
                        key={tbl.key}
                        className={`p-2.5 rounded-xl border text-center flex flex-col items-center gap-1 ${
                          isComplete
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-amber-50 border-amber-200 text-amber-900'
                        }`}
                      >
                        <span className="font-mono text-xs font-bold">{tbl.name}</span>
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Lengkap
                          </span>
                        ) : tblExists && missingCols.length > 0 ? (
                          <span className="inline-flex flex-col items-center text-[10px] font-bold text-amber-800 leading-tight">
                            <span className="inline-flex items-center gap-1"><AlertTriangle className="w-3 h-3 shrink-0" /> Kurang kolom:</span>
                            <span className="font-mono">{missingCols.join(', ')}</span>
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

            {/* SUPABASE CONNECTION CREDENTIALS */}
            <div className="border-t border-neutral-200 pt-6">
              <h4 className="text-sm font-bold text-neutral-900 mb-3">Detail Kredensial Supabase (Dapat Diedit)</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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
              <div className="flex flex-wrap gap-2">
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
        </div>
      )}

      {/* TAB 4: DATA & SISTEM */}
      {activeSubTab === 'data' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-in fade-in duration-200">
          {/* Left: Auto-Delete & Data Retention */}
          <div className="lg:col-span-7 bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-7 flex flex-col justify-between">
            <div>
              <div className="flex items-start gap-3.5 mb-5">
                <div className="p-3 bg-theme-50 rounded-2xl border border-theme-100 text-theme-600 shadow-sm shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-theme-900">Pembersihan Data Otomatis</h3>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-theme-100 text-theme-800">
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
                  <p className="text-xs text-theme-600-text mt-1 font-medium leading-relaxed">
                    Atur durasi data laporan yang dipertahankan. Jika diubah di satu perangkat, perangkat lain otomatis mengikuti secara real-time.
                  </p>
                </div>
              </div>

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

              {/* Presets Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-theme-900 text-xs sm:text-sm">{opt.label}</span>
                          <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full ${
                            isSelected ? 'bg-theme-200 text-theme-900' : 'bg-neutral-100 text-neutral-600'
                          }`}>
                            {opt.id === 'custom' && isSelected ? `${settings.autoDeleteDays || customDays} Hari` : opt.badge}
                          </span>
                        </div>
                        <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center border shrink-0 ${
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
            </div>

            <div className="pt-3 border-t border-neutral-100 flex flex-col gap-2">
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

          {/* Right: Backup & Restore + Danger Zone */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Backup & Restore Settings */}
            <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6">
              <div className="flex items-start gap-4 mb-6">
                <div className="p-3.5 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm shrink-0">
                  <Download className="w-6 h-6 text-theme-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-theme-900">Backup & Restore File JSON</h3>
                  <p className="text-xs text-theme-600-text mt-1 font-medium leading-relaxed">
                    Cadangkan seluruh data aplikasi Anda menjadi file JSON, atau pulihkan dari file cadangan sebelumnya.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                <button
                  onClick={() => exportData()}
                  className="flex-1 px-5 py-2.5 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
                >
                  <Download className="w-4 h-4" />
                  Download Backup
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 px-5 py-2.5 bg-white hover:bg-theme-50 text-theme-700 border border-theme-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm text-xs"
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

            {/* Danger Zone */}
            <div className="bg-rose-50/70 rounded-[2rem] border border-rose-100 overflow-hidden p-6 relative flex-1 flex flex-col justify-between">
              <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                <ShieldAlert className="w-24 h-24 text-rose-500" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2.5 bg-rose-100 rounded-xl">
                    <Trash2 className="w-5 h-5 text-rose-600" />
                  </div>
                  <h3 className="text-lg font-bold text-rose-700">Manajemen Sistem & Zona Berbahaya</h3>
                </div>

                <div className="grid grid-cols-1 gap-3.5">
                  <div className="bg-white/75 p-4 rounded-xl border border-rose-200/60 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-rose-800 text-sm mb-1">Hapus Cache Aplikasi</h4>
                      <p className="text-xs text-rose-700/80 font-medium leading-relaxed mb-3">
                        Bersihkan cache sistem dan service worker. Berguna jika aplikasi terasa lambat atau belum memuat pembaruan terbaru. Tidak menghapus data.
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

                  <div className="bg-white/75 p-4 rounded-xl border border-rose-200/60 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-rose-800 text-sm mb-1">Reset Database</h4>
                      <p className="text-xs text-rose-700/80 font-medium leading-relaxed mb-3">
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
      )}

      {/* TAB 5: PANDUAN LENGKAP */}
      {activeSubTab === 'guide' && (
        <div className="animate-in fade-in duration-200">
          <UserGuide onNavigateTab={onNavigateTab} isEmbedded />
        </div>
      )}

      {/* TAB 6: TENTANG APLIKASI */}
      {activeSubTab === 'about' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Launcher Highlight Banner */}
          <div className="relative bg-gradient-to-br from-neutral-900 via-theme-950 to-neutral-900 rounded-[2rem] p-5 sm:p-6 text-white shadow-md overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4 border border-theme-700/50">
            <div className="relative z-10 flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shrink-0 shadow-md shadow-emerald-900/30">
                <Award className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
                    Tentang Aplikasi Launcher
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-black">
                    Versi Aplikasi: v3.2.0 Pro
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight mt-0.5">
                  Daily Report Pro • Developer: <span className="text-emerald-400">Denuda</span>
                </h3>
                <p className="text-xs text-neutral-300 font-medium mt-0.5">
                  Sistem rekap laporan stok harian, checklist barang datang kilat, kontrol expired dekat, & sinkronisasi multi-perangkat.
                </p>
              </div>
            </div>

            <div className="relative z-10 flex items-center gap-2 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => setActiveSubTab('guide')}
                className="px-3.5 py-2 bg-teal-500 hover:bg-teal-400 text-neutral-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Buka Panduan Lengkap</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('profile')}
                className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Profil Perusahaan</span>
              </button>
            </div>
          </div>

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
