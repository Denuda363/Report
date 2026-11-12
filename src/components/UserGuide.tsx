import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Sparkles, CheckCircle2, ArrowRight, Play, RotateCcw, 
  Package, FileText, PackageOpen, PackageMinus, Factory, AlertTriangle, 
  Database, Download, Upload, Search, ChevronDown, ChevronUp, 
  Layers, HelpCircle, Compass, Zap, Flame, Smartphone, ShieldCheck, 
  RefreshCw, X, Maximize2, Minimize2, Clock, Check, Eye, ChevronLeft, ArrowUp
} from 'lucide-react';
import { cn } from '../lib/utils';

export interface UserGuideProps {
  onNavigateTab?: (tab: 'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'settings') => void;
  isEmbedded?: boolean;
  initialFullscreen?: boolean;
}

interface GuideSection {
  id: string;
  category: 'quickstart' | 'report' | 'arrived' | 'stock' | 'database' | 'tips';
  title: string;
  subtitle: string;
  icon: any;
  color: string;
  bgLight: string;
  steps: {
    title: string;
    description: string;
    tip?: string;
  }[];
  proTip?: string;
  demoType?: 'queue' | 'arrived' | 'copy' | 'database';
}

export const UserGuide: React.FC<UserGuideProps> = ({ onNavigateTab, isEmbedded = false, initialFullscreen = false }) => {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('quickstart-flow');
  const [activeDemo, setActiveDemo] = useState<'queue' | 'arrived' | 'copy' | 'database'>('queue');
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Guide topics database
  const guideSections: GuideSection[] = [
    {
      id: 'quickstart-flow',
      category: 'quickstart',
      title: 'Alur Kerja Dasar 3 Langkah',
      subtitle: 'Cara paling cepat dan efektif mengoperasikan ReportPro dari awal',
      icon: Compass,
      color: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      demoType: 'queue',
      steps: [
        {
          title: '1. Daftarkan Supplier & Produk di Master Data',
          description: 'Masuk ke menu Master Data. Tambahkan nama pabrik/supplier utama dan daftar barang dengan satuan (pcs, dus, botol) serta batas stok aman (Bottom Stock). Anda juga bisa langsung import dari Excel.',
          tip: 'Batas Bottom Stock akan memberi peringatan otomatis saat stok menipis.'
        },
        {
          title: '2. Catat Transaksi di Daily Report',
          description: 'Pilih tanggal, ketik nama barang (manfaatkan autocomplete dan riwayat), masukkan jumlah (Qty). Klik "+ Ke List" untuk mengumpulkan banyak item, lalu klik "Simpan Semua" sekali jalan.',
          tip: 'Fitur Simpan Semua dilengkapi estimasi waktu dan animasi progres real-time.'
        },
        {
          title: '3. Pantau Barang Datang & Ekspor Laporan',
          description: 'Ketika kiriman fisik sampai, catat di menu Barang Datang. Daily Report otomatis terintegrasi dan terceklis. Ekspor laporan harian ke Excel, PDF, atau TXT kapan pun dibutuhkan.',
          tip: 'Ekspor TXT sangat praktis untuk langsung dibagikan ke grup WhatsApp.'
        }
      ],
      proTip: 'Gunakan fitur "Salin dari Kemarin" jika sebagian besar produk hari ini sama dengan laporan kemarin.'
    },
    {
      id: 'daily-report-mastery',
      category: 'report',
      title: 'Pencatatan Cepat & Antrean Daily Report',
      subtitle: 'Kuasai input antrean, mode edit instan, dan kalkulasi otomatis',
      icon: FileText,
      color: 'text-blue-600',
      bgLight: 'bg-blue-50',
      demoType: 'queue',
      steps: [
        {
          title: 'Input Cepat dengan Antrean (+ Ke List)',
          description: 'Jangan simpan satu per satu jika sedang merekap banyak barang. Masukkan Qty lalu tekan Enter atau klik "+ Ke List". Semua item akan tersusun rapi di daftar antrean sebelum disimpan.',
          tip: 'Anda bisa menghapus atau mengecek ulang item di antrean sebelum menekan Simpan Semua.'
        },
        {
          title: 'Simpan Semua Super Cepat (Atomic Batch Write)',
          description: 'Saat tombol "Simpan Semua" ditekan, seluruh data antrean diproses dengan sistem Atomic Batch Write dalam sekejap tanpa jeda berbelit. Dilengkapi visual progres kilat dan konfirmasi instan.',
          tip: 'Penyimpanan berkecepatan tinggi dengan latensi 0ms pada antarmuka (optimistic update).'
        },
        {
          title: 'Salin Data dari Kemarin (Copy Yesterday)',
          description: 'Klik tombol "Salin Data Kemarin" di toolbar. Pilih produk mana saja yang ingin disalin atau pilih semua. Data kemarin akan langsung masuk ke tanggal hari ini dengan status yang bersih.',
          tip: 'Item yang sudah datang kemarin tidak akan disalin ulang kecuali ditandai reorder.'
        },
        {
          title: 'Filter & Pencarian Instan',
          description: 'Gunakan chips riwayat pencarian di bawah kolom search untuk filter 1-klik tanpa perlu mengetik ulang kata kunci yang sering dicari.',
        }
      ],
      proTip: 'Jika ada produk yang sudah Anda catat di Barang Datang, saat diinput di Daily Report otomatis status "Sudah Datang" terceklis tanpa memunculkan error ganda!'
    },
    {
      id: 'arrived-goods-sync',
      category: 'arrived',
      title: 'Manajemen Barang Datang & Auto-Sync',
      subtitle: 'Sinkronisasi cerdas antara kiriman supplier dan laporan harian',
      icon: PackageOpen,
      color: 'text-amber-600',
      bgLight: 'bg-amber-50',
      demoType: 'arrived',
      steps: [
        {
          title: 'Pencatatan Kiriman Fisik',
          description: 'Buka menu Barang Datang saat kiriman dari supplier tiba. Masukkan produk, jumlah kedatangan, dan nama supplier pengirim.',
          tip: 'Jika ada barang yang datang tanpa laporan sebelumnya, sistem tetap mencatatnya dengan aman.'
        },
        {
          title: 'Checklist Otomatis di Daily Report',
          description: 'Sistem secara otomatis menghubungkan data Barang Datang dengan Daily Report pada tanggal yang sama. Anda tidak perlu lagi menceklis manual satu per satu di tabel harian.',
        },
        {
          title: 'Impor Rekap Kedatangan dari Excel',
          description: 'Punya rekap surat jalan dalam file Excel? Gunakan tombol "Import Excel" di menu Barang Datang. Terdapat panduan kolom dan animasi progres impor lengkap dengan estimasi waktu penyelesaian.',
          tip: 'Format tanggal Excel DD/MM/YYYY otomatis diselaraskan secara presisi.'
        }
      ],
      proTip: 'Jika barang datang hanya sebagian atau butuh order ulang, gunakan fitur Reorder agar status barang tetap dipantau.'
    },
    {
      id: 'factory-stock-warning',
      category: 'stock',
      title: 'Kosong Pabrik, Stok Keluar & Stok Menipis',
      subtitle: 'Kendalikan ketersediaan barang agar tidak kecolongan stok kosong',
      icon: Factory,
      color: 'text-rose-600',
      bgLight: 'bg-rose-50',
      demoType: 'copy',
      steps: [
        {
          title: 'Menandai Status Kosong Pabrik',
          description: 'Aktifkan tanda "Kosong Pabrik" pada produk yang produksinya sedang libur atau stok distributor habis. Status ini otomatis menempel di laporan harian agar tim tidak mencari barang tersebut.',
        },
        {
          title: 'Menu Khusus Rekap Kosong Pabrik',
          description: 'Buka tab "Kosong Pabrik" di navigasi untuk melihat rekap komprehensif seluruh produk yang sedang vakum dari semua supplier lengkap dengan tanggal dan riwayatnya.',
        },
        {
          title: 'Pemantauan Stok Menipis (Bottom Stock)',
          description: 'Sistem secara otomatis membandingkan stok aktual dengan batas minimum (Bottom Stock). Begitu stok menyentuh batas bawah, produk akan muncul di tab "Stok Menipis" dengan tanda peringatan.',
          tip: 'Gunakan tab ini sebagai panduan utama saat membuat Surat Pesanan (PO) ke supplier.'
        },
        {
          title: 'Pencatatan Pengeluaran Stok (Stock Out)',
          description: 'Catat setiap mutasi keluar (penjualan luar kota, barang rusak/retur, sample) di menu Pengeluaran agar sisa stok di database selalu akurat.',
        }
      ],
      proTip: 'Setel angka Bottom Stock sedikit di atas rata-rata penjualan 3 hari untuk memberi waktu jeda pengiriman dari pabrik.'
    },
    {
      id: 'cloud-database-guide',
      category: 'database',
      title: 'Multi-Database, Cloud Sync & Backup',
      subtitle: 'Kelola penyimpanan Supabase PostgreSQL, Firebase, dan Offline Lokal',
      icon: Database,
      color: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
      demoType: 'database',
      steps: [
        {
          title: 'Fleksibilitas 3 Sumber Database',
          description: 'ReportPro mendukung 3 mesin database: Supabase Cloud (PostgreSQL), Firebase Firestore (Google Cloud), dan Offline Lokal (IndexedDB browser). Anda dapat berpindah sumber kapan pun di menu Pengaturan.',
          tip: 'Mode Offline Lokal memungkinkan aplikasi digunakan tanpa koneksi internet sama sekali.'
        },
        {
          title: 'Otomatis Buat Tabel (Auto-Create Tables)',
          description: 'Jika menghubungkan database Supabase baru, cukup klik tombol "Cek & Buat Semua Tabel Otomatis" di Pengaturan. Semua tabel, relasi, dan kolom dibuat secara instan tanpa perlu coding SQL manual.',
        },
        {
          title: 'Cadangkan & Pulihkan (Backup & Restore JSON)',
          description: 'Unduh file cadangan secara berkala dengan tombol "Download Backup". File JSON ini memuat seluruh data Master, Laporan Harian, Barang Datang, dan Pengeluaran. Bisa di-restore kembali kapan saja.',
          tip: 'Sangat disarankan melakukan backup mingguan sebelum pembersihan data rutin.'
        },
        {
          title: 'Pembersihan Data Otomatis',
          description: 'Di Pengaturan, Anda dapat mengatur pembersihan data otomatis: "Nonaktif" (simpan selamanya), "Hanya Hari Ini", atau "Simpan 2 Hari" untuk menjaga aplikasi tetap ringan.',
        }
      ],
      proTip: 'Gunakan fitur "Migrasikan Data" di Pengaturan untuk memindahkan seluruh data dari IndexedDB lokal ke Supabase Cloud hanya dalam satu kali klik!'
    },
    {
      id: 'pro-tips-and-pwa',
      category: 'tips',
      title: 'Tips Pintas & Instalasi Aplikasi di HP (PWA)',
      subtitle: 'Trik efisiensi kerja harian dan penggunaan seperti aplikasi native',
      icon: Zap,
      color: 'text-amber-500',
      bgLight: 'bg-amber-50',
      steps: [
        {
          title: 'Pasang di Layar Utama HP / Laptop (PWA)',
          description: 'ReportPro adalah Progressive Web App. Di browser Chrome/Safari, tekan tombol "Install App" di menu atas atau pilih "Add to Home Screen". Aplikasi akan terbuka fullscreen tanpa bilah browser.',
          tip: 'Bisa dibuka cepat dari ikon di homescreen smartphone selayaknya aplikasi dari Play Store.'
        },
        {
          title: 'Pilih Posisi Navigasi Sesuai Kebiasaan',
          description: 'Di menu Pengaturan, Anda dapat mengatur posisi navigasi: "Bawah" (sangat ergonomis untuk jempol di smartphone), "Kiri" (standar dashboard desktop), atau "Kanan".',
        },
        {
          title: 'Ganti Tema Warna Sesuai Mood',
          description: 'Tersedia 7 pilihan tema warna: Sage Green, Ocean Blue, Rose Red, Warm Amber, Royal Purple, Cyan Breeze, dan Colorful gradient.',
        },
        {
          title: 'Bersihkan Cache Jika Mengalami Gangguan Tampilan',
          description: 'Jika browser menyimpan versi lama, gunakan tombol "Hapus Cache" di Zona Pengaturan. Aplikasi akan menyegarkan file sistem tanpa menghapus data produk atau laporan.',
        }
      ],
      proTip: 'Di keyboard komputer, Anda bisa menekan tombol Enter pada kolom kuantitas untuk langsung memasukkan barang ke daftar antrean.'
    }
  ];

  // Categories list
  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: BookOpen },
    { id: 'quickstart', label: 'Mulai Cepat', icon: Compass },
    { id: 'report', label: 'Daily Report', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'stock', label: 'Stok & Pabrik', icon: Factory },
    { id: 'database', label: 'Database & Cloud', icon: Database },
    { id: 'tips', label: 'Tips & PWA', icon: Zap }
  ];

  // Filter sections
  const filteredSections = useMemo(() => {
    return guideSections.filter(section => {
      const matchCategory = activeCategory === 'all' || section.category === activeCategory;
      if (!matchCategory) return false;
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const inTitle = section.title.toLowerCase().includes(q);
      const inSubtitle = section.subtitle.toLowerCase().includes(q);
      const inSteps = section.steps.some(s => 
        s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      );
      return inTitle || inSubtitle || inSteps;
    });
  }, [activeCategory, searchQuery]);

  // Demo Simulation Controller
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isDemoPlaying) {
      timer = setInterval(() => {
        setDemoStep(prev => (prev >= 3 ? 0 : prev + 1));
      }, 2400);
    }
    return () => clearInterval(timer);
  }, [isDemoPlaying]);

  // Lock background scroll and listen for Escape key when in Fullscreen mode
  useEffect(() => {
    if (isFullscreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setIsFullscreen(false);
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setShowBackToTop(scrollTop > 220);
  };

  const scrollToTop = () => {
    scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToDemo = () => {
    const demoElement = document.getElementById('user-guide-demo-section');
    if (demoElement) {
      demoElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleStartDemo = (type: 'queue' | 'arrived' | 'copy' | 'database') => {
    setActiveDemo(type);
    setDemoStep(0);
    setIsDemoPlaying(true);
    scrollToDemo();
  };

  return (
    <div className={cn(
      "w-full flex flex-col transition-all duration-300",
      isFullscreen 
        ? "fixed inset-0 z-[200] bg-neutral-950/85 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden sm:p-4 md:p-6" 
        : isEmbedded 
        ? "space-y-6" 
        : "space-y-8"
    )}>
      <div className={cn(
        "bg-white flex flex-col transition-all overflow-hidden relative shadow-2xl",
        isFullscreen 
          ? "w-full h-full sm:h-[92vh] sm:max-w-5xl sm:rounded-[2rem] sm:border sm:border-neutral-200" 
          : "w-full rounded-[2rem] border border-theme-200 shadow-sm"
      )}>
        {/* Fullscreen Sticky Mobile-Friendly App Bar */}
        {isFullscreen && (
          <header className="h-14 sm:h-16 px-3 sm:px-6 bg-neutral-900 text-white flex items-center justify-between shrink-0 border-b border-neutral-800 z-30 shadow-md">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <button
                onClick={() => setIsFullscreen(false)}
                className="flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs transition-all shrink-0"
                title="Tutup Mode Layar Penuh"
              >
                <ChevronLeft className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Tutup</span>
              </button>
              
              <div className="flex items-center gap-2 border-l border-white/10 pl-2 sm:pl-3 min-w-0">
                <BookOpen className="w-4 h-4 text-emerald-400 hidden xs:block shrink-0" />
                <h3 className="font-bold text-xs sm:text-sm text-white truncate">
                  Panduan Lengkap
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30 shrink-0">
                  Layar Penuh
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={scrollToDemo}
                className="hidden xs:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
              >
                <Play className="w-3 h-3 fill-current" />
                <span>Simulasi Demo</span>
              </button>

              <button
                onClick={() => setIsFullscreen(false)}
                className="p-2 bg-white/10 hover:bg-white/20 active:scale-95 text-neutral-300 hover:text-white rounded-xl transition-colors"
                title="Tutup (Esc)"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>
        )}

        {/* Category Filter Tabs - Sticky on Mobile and Desktop */}
        <div className={cn(
          "px-3 sm:px-6 py-2 sm:py-3 border-b border-theme-200 bg-neutral-50/95 backdrop-blur-md flex items-center gap-1.5 sm:gap-2 overflow-x-auto scrollbar-none shrink-0 z-20",
          isFullscreen ? "sticky top-0 shadow-xs" : ""
        )}>
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex items-center gap-1.5 sm:gap-2 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 active:scale-95",
                  isSelected
                    ? "bg-theme-900 text-white shadow-sm ring-1 ring-theme-900"
                    : "bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/90 hover:bg-neutral-100"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", isSelected ? "text-emerald-400" : "text-neutral-500")} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Scrollable Content Body */}
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className={cn(
            "flex-1 overflow-y-auto overflow-x-hidden scroll-smooth",
            isFullscreen ? "p-3.5 sm:p-6 md:p-8 space-y-6 pb-24 sm:pb-8" : "p-4 sm:p-8 space-y-8"
          )}
        >
          {/* Top Header Banner with Lively Animation */}
          <div className="relative bg-gradient-to-br from-theme-800 via-theme-900 to-neutral-900 text-white p-5 sm:p-8 md:p-10 rounded-3xl overflow-hidden shadow-md">
            {/* Animated Ambient Backlight Orbs */}
            <motion.div 
              animate={{ 
                scale: [1, 1.25, 1],
                opacity: [0.2, 0.45, 0.2],
                x: [0, 20, 0],
                y: [0, -10, 0]
              }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="absolute -top-16 -right-16 w-80 h-80 bg-theme-500 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div 
              animate={{ 
                scale: [1.1, 0.9, 1.1],
                opacity: [0.15, 0.35, 0.15],
                x: [0, -25, 0]
              }}
              transition={{ repeat: Infinity, duration: 7, ease: "easeInOut" }}
              className="absolute -bottom-20 -left-20 w-80 h-80 bg-emerald-500 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 sm:gap-6">
              <div className="flex items-start gap-3 sm:gap-5">
                <motion.div 
                  animate={{ rotate: [0, 8, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg"
                >
                  <BookOpen className="w-6 h-6 sm:w-8 sm:h-8 text-emerald-300" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold tracking-wide uppercase text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                      Panduan Lengkap & Interaktif
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="text-xs text-white/70 font-medium">ReportPro v2.6</span>
                  </div>
                  <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    Cara Penggunaan Aplikasi
                  </h2>
                  <p className="text-xs sm:text-sm text-neutral-300 mt-1 max-w-xl font-medium leading-relaxed">
                    Pelajari semua fitur unggulan, mulai dari input antrean kilat, otomatisasi checklist barang datang, hingga manajemen multi-database.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end flex-wrap">
                <button
                  onClick={() => handleStartDemo('queue')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lihat Demo</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/10 text-xs font-bold"
                  title={isFullscreen ? "Kecilkan Tampilan" : "Perbesar ke Layar Penuh"}
                >
                  {isFullscreen ? (
                    <>
                      <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="hidden xs:inline">Kecilkan</span>
                    </>
                  ) : (
                    <>
                      <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Layar Penuh</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Search Box inside Banner */}
            <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-white/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari fitur, tips, atau kendala (misal: 'import', 'antrean', 'bottom stock')..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white/10 hover:bg-white/15 focus:bg-white/20 focus:outline-none border border-white/15 focus:border-emerald-400 rounded-xl text-white text-xs sm:text-sm placeholder:text-white/40 transition-all"
                />
                {searchQuery && (
                  <button 
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs text-white/80 scrollbar-none">
                <span className="text-[11px] text-white/50 shrink-0">Cepat:</span>
                {['Simpan Semua', 'Barang Datang', 'Salin Kemarin', 'Supabase'].map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setSearchQuery(tag)}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-[11px] font-medium transition-colors shrink-0"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interactive Live Animated Simulation Widget */}
          <div id="user-guide-demo-section" className="bg-gradient-to-br from-neutral-900 via-neutral-900 to-neutral-950 rounded-3xl p-4 sm:p-7 text-white shadow-xl border border-neutral-800 relative overflow-hidden scroll-mt-20">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white flex items-center gap-2">
                    Simulasi Fitur Hidup (Live Demo)
                    <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                      Interaktif
                    </span>
                  </h4>
                  <p className="text-xs text-neutral-400">Pilih skenario di bawah untuk melihat animasi cara kerja fitur secara otomatis</p>
                </div>
              </div>

              {/* Demo Tabs */}
              <div className="flex items-center gap-1.5 bg-white/5 p-1 rounded-xl border border-white/10 overflow-x-auto w-full sm:w-auto">
                {[
                  { id: 'queue', label: 'Antrean & Simpan' },
                  { id: 'arrived', label: 'Checklist Datang' },
                  { id: 'copy', label: 'Salin Kemarin' },
                  { id: 'database', label: 'Sync Cloud' }
                ].map((demo) => (
                  <button
                    key={demo.id}
                    onClick={() => {
                      setActiveDemo(demo.id as any);
                      setDemoStep(0);
                      setIsDemoPlaying(true);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap",
                      activeDemo === demo.id
                        ? "bg-emerald-500 text-neutral-950 shadow-sm"
                        : "text-neutral-300 hover:text-white hover:bg-white/10"
                    )}
                  >
                    {demo.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Screen Simulation Frame */}
            <div className="bg-neutral-950/80 rounded-2xl border border-white/10 p-4 sm:p-6 min-h-[220px] flex flex-col justify-between relative overflow-hidden">
              {/* Demo Content Renderer based on activeDemo */}
              <AnimatePresence mode="wait">
                {activeDemo === 'queue' && (
                  <motion.div
                    key={`queue-${demoStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-emerald-400">Skenario 1: Menambah ke Antrean & Simpan dengan Progres Waktu</span>
                      <span>Langkah {demoStep + 1} dari 4</span>
                    </div>

                    {demoStep === 0 && (
                      <div className="bg-white/5 border border-white/10 p-3.5 sm:p-4 rounded-xl flex flex-col xs:flex-row items-start xs:items-center justify-between gap-3">
                        <div className="space-y-1">
                          <p className="text-xs text-neutral-400 font-mono">1. Pilih Produk & Isi Kuantitas</p>
                          <p className="text-sm font-bold text-white">Aqua Botol 600ml · Qty: 24 pcs</p>
                        </div>
                        <div className="px-3 py-1.5 bg-emerald-500 text-neutral-950 rounded-lg text-xs font-bold animate-pulse shrink-0">
                          + Ke List (Antrean)
                        </div>
                      </div>
                    )}

                    {demoStep === 1 && (
                      <div className="bg-white/5 border border-emerald-500/30 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-300 font-bold">✓ 3 Produk Siap Disimpan di Antrean</span>
                          <span className="text-neutral-400">Total: 84 pcs</span>
                        </div>
                        <div className="grid grid-cols-1 xs:grid-cols-3 gap-2 text-[11px] text-neutral-300">
                          <div className="bg-white/5 p-2 rounded-lg truncate">Aqua 600ml (24)</div>
                          <div className="bg-white/5 p-2 rounded-lg truncate">Indomie Grg (40)</div>
                          <div className="bg-white/5 p-2 rounded-lg truncate">Minyak 2L (20)</div>
                        </div>
                      </div>
                    )}

                    {demoStep === 2 && (
                      <div className="bg-emerald-950/60 border border-emerald-500/50 p-4 rounded-xl space-y-3">
                        <div className="flex justify-between items-center text-xs">
                          <span className="text-emerald-400 font-bold flex items-center gap-1.5 truncate">
                            <Clock className="w-3.5 h-3.5 animate-spin shrink-0" /> Menyimpan Data Laporan ke Database...
                          </span>
                          <span className="text-emerald-300 font-mono font-bold shrink-0">66%</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2.5 overflow-hidden">
                          <motion.div 
                            className="bg-emerald-400 h-full rounded-full"
                            initial={{ width: '20%' }}
                            animate={{ width: '66%' }}
                            transition={{ duration: 0.8 }}
                          />
                        </div>
                        <div className="flex flex-col xs:flex-row justify-between text-[11px] text-neutral-400 gap-1">
                          <span className="truncate">Sedang memproses: <strong className="text-white">Indomie Goreng</strong></span>
                          <span className="text-emerald-300 font-medium shrink-0">⏱️ Sisa waktu: 3 detik lagi</span>
                        </div>
                      </div>
                    )}

                    {demoStep === 3 && (
                      <div className="bg-emerald-900/40 border border-emerald-400 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-7 h-7 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">Selesai! 3 Laporan Berhasil Disimpan</p>
                          <p className="text-xs text-neutral-300">Tabel harian otomatis diperbarui dan sinkron ke seluruh perangkat secara instan.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeDemo === 'arrived' && (
                  <motion.div
                    key={`arrived-${demoStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-amber-400">Skenario 2: Otomatisasi Checklist Barang Datang di Daily Report</span>
                      <span>Langkah {demoStep + 1} dari 3</span>
                    </div>

                    {demoStep === 0 && (
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1.5">
                        <p className="text-xs text-neutral-400 font-mono">1. Kiriman Masuk di Menu Barang Datang</p>
                        <p className="text-sm font-bold text-white">Catat: Teh Pucuk Harum 350ml · Qty Datang: 50 dus</p>
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-semibold">Tersimpan di Rekap Kedatangan</span>
                      </div>
                    )}

                    {demoStep === 1 && (
                      <div className="bg-white/5 border border-amber-500/40 p-4 rounded-xl space-y-2">
                        <p className="text-xs text-neutral-400 font-mono">2. Buka Daily Report pada Tanggal yang Sama</p>
                        <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
                          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span>Notifikasi: <strong>Barang Datang terdeteksi!</strong> Status "Sudah Datang" otomatis terceklis.</span>
                        </div>
                      </div>
                    )}

                    {(demoStep >= 2) && (
                      <div className="bg-emerald-950/40 border border-emerald-400 p-4 rounded-xl flex items-center justify-between">
                        <div className="space-y-1">
                          <span className="text-xs text-emerald-400 font-bold uppercase">Hasil Integrasi Mulus</span>
                          <p className="text-sm font-bold text-white">Teh Pucuk Harum · [✓ Sudah Datang] [✓ Bebas Peringatan Ganda]</p>
                        </div>
                        <div className="px-3 py-1 bg-emerald-500 text-neutral-950 rounded-lg text-xs font-bold">
                          100% Terintegrasi
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeDemo === 'copy' && (
                  <motion.div
                    key={`copy-${demoStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-blue-400">Skenario 3: Salin Data dari Kemarin (Copy Yesterday)</span>
                      <span>Langkah {demoStep + 1} dari 3</span>
                    </div>

                    {demoStep === 0 && (
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl">
                        <p className="text-xs text-neutral-400 mb-2">Klik tombol "Salin Data Kemarin" di atas tabel Daily Report</p>
                        <div className="flex items-center gap-2 text-sm font-bold text-white">
                          <RotateCcw className="w-4 h-4 text-blue-400" />
                          <span>Membaca data laporan kemarin (26 item ditemukan)...</span>
                        </div>
                      </div>
                    )}

                    {demoStep === 1 && (
                      <div className="bg-blue-950/40 border border-blue-500/40 p-4 rounded-xl space-y-2">
                        <div className="flex justify-between text-xs text-blue-300 font-bold">
                          <span>Menyalin data ke tanggal hari ini...</span>
                          <span className="font-mono">18 / 26 item</span>
                        </div>
                        <div className="w-full bg-neutral-800 rounded-full h-2">
                          <div className="bg-blue-500 h-full rounded-full w-[70%]" />
                        </div>
                        <p className="text-[11px] text-neutral-400">Barang yang sudah tuntas datang kemarin otomatis disaring agar tidak redundan.</p>
                      </div>
                    )}

                    {(demoStep >= 2) && (
                      <div className="bg-blue-900/40 border border-blue-400 p-4 rounded-xl flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">Laporan Hari Ini Siap Dipakai!</p>
                          <p className="text-xs text-neutral-300">Hanya butuh beberapa detik untuk mempersiapkan laporan harian lengkap.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeDemo === 'database' && (
                  <motion.div
                    key={`db-${demoStep}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="flex flex-col gap-4"
                  >
                    <div className="flex items-center justify-between text-xs text-neutral-400">
                      <span className="font-semibold text-purple-400">Skenario 4: Multi-Database & Cloud Auto Sync</span>
                      <span>Langkah {demoStep + 1} dari 3</span>
                    </div>

                    {demoStep === 0 && (
                      <div className="bg-white/5 border border-white/10 p-4 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="text-xs text-neutral-400">Pilih Mesin Database di Pengaturan:</p>
                          <p className="text-sm font-bold text-white">Supabase Cloud (PostgreSQL) ↔ Firebase ↔ Offline</p>
                        </div>
                        <div className="px-2.5 py-1 bg-purple-500/30 text-purple-300 rounded text-xs font-semibold">
                          Bebas Pilih
                        </div>
                      </div>
                    )}

                    {demoStep === 1 && (
                      <div className="bg-purple-950/40 border border-purple-500/40 p-4 rounded-xl space-y-2">
                        <p className="text-xs text-purple-300 font-bold">1-Klik "Buat Semua Tabel Otomatis"</p>
                        <p className="text-xs text-neutral-300">
                          Sistem memverifikasi tabel <code className="text-white">reports</code>, <code className="text-white">products</code>, <code className="text-white">suppliers</code>, dan <code className="text-white">stock_outs</code> tanpa perlu setup manual.
                        </p>
                      </div>
                    )}

                    {(demoStep >= 2) && (
                      <div className="bg-emerald-950/40 border border-emerald-400 p-4 rounded-xl flex items-center gap-3">
                        <Database className="w-6 h-6 text-emerald-400 shrink-0" />
                        <div>
                          <p className="text-sm font-bold text-white">Data Aman & Tersinkronisasi Antar Device</p>
                          <p className="text-xs text-neutral-300">Data Anda selalu tersimpan dengan aman, cepat, dan siap di-backup ke file JSON kapan saja.</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Step Dots & Manual Controls */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/10 text-xs">
                <div className="flex items-center gap-1.5">
                  {[0, 1, 2, 3].map((stepIdx) => (
                    <button
                      key={stepIdx}
                      onClick={() => {
                        setDemoStep(stepIdx);
                        setIsDemoPlaying(false);
                      }}
                      className={cn(
                        "w-2.5 h-2.5 rounded-full transition-all",
                        demoStep === stepIdx ? "bg-emerald-400 w-6" : "bg-neutral-700 hover:bg-neutral-600"
                      )}
                    />
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsDemoPlaying(!isDemoPlaying)}
                    className="flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-neutral-300 hover:text-white transition-colors text-xs"
                  >
                    {isDemoPlaying ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        <span>Jeda</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3 h-3 fill-current text-emerald-400" />
                        <span>Mulai Putar</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setDemoStep(prev => (prev >= 3 ? 0 : prev + 1))}
                    className="px-2.5 py-1 bg-white/10 hover:bg-white/20 rounded-lg text-neutral-300 hover:text-white transition-colors"
                  >
                    Lanjut ➔
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Guide Sections Accordion List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold text-neutral-900 flex items-center gap-2">
                <span>Daftar Modul & Panduan Langkah Demi Langkah</span>
                <span className="text-xs font-normal text-neutral-500">({filteredSections.length} topik)</span>
              </h3>
              {expandedSection ? (
                <button
                  onClick={() => setExpandedSection(null)}
                  className="text-xs text-theme-600 font-semibold hover:underline"
                >
                  Tutup Semua
                </button>
              ) : (
                <button
                  onClick={() => setExpandedSection(filteredSections[0]?.id || null)}
                  className="text-xs text-theme-600 font-semibold hover:underline"
                >
                  Buka Pertama
                </button>
              )}
            </div>

            {filteredSections.length === 0 ? (
              <div className="p-8 text-center bg-neutral-50 rounded-2xl border border-neutral-200">
                <HelpCircle className="w-10 h-10 text-neutral-400 mx-auto mb-2" />
                <p className="font-bold text-neutral-700">Topik panduan tidak ditemukan</p>
                <p className="text-xs text-neutral-500 mt-1">Coba gunakan kata kunci lain seperti "laporan", "stok", atau "excel".</p>
                <button
                  onClick={() => { setSearchQuery(''); setActiveCategory('all'); }}
                  className="mt-4 px-4 py-2 bg-theme-600 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Tampilkan Semua Panduan
                </button>
              </div>
            ) : (
              filteredSections.map((section) => {
                const Icon = section.icon;
                const isExpanded = expandedSection === section.id;

                return (
                  <motion.div
                    key={section.id}
                    layout
                    className={cn(
                      "rounded-2xl border transition-all duration-300 overflow-hidden bg-white",
                      isExpanded 
                        ? "border-theme-400 shadow-md ring-1 ring-theme-200" 
                        : "border-neutral-200 hover:border-neutral-300 hover:shadow-sm"
                    )}
                  >
                    {/* Header bar of section */}
                    <div
                      onClick={() => setExpandedSection(isExpanded ? null : section.id)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer select-none hover:bg-neutral-50/70 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border border-neutral-100", section.bgLight, section.color)}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-bold text-base text-neutral-900">{section.title}</h4>
                          </div>
                          <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">{section.subtitle}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {section.demoType && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartDemo(section.demoType as any);
                            }}
                            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-neutral-100 hover:bg-theme-100 text-neutral-700 hover:text-theme-900 rounded-lg text-xs font-bold transition-colors"
                          >
                            <Play className="w-3 h-3 fill-current text-emerald-600" />
                            <span>Lihat Demo</span>
                          </button>
                        )}
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center transition-transform duration-300",
                          isExpanded ? "bg-theme-100 text-theme-800 rotate-180" : "bg-neutral-100 text-neutral-500"
                        )}>
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Steps View */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.28, ease: "easeInOut" }}
                          className="border-t border-neutral-100 p-4 sm:p-6 bg-gradient-to-b from-neutral-50/50 to-white space-y-4"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.steps.map((step, idx) => (
                              <div 
                                key={idx} 
                                className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="w-5 h-5 rounded-full bg-theme-100 text-theme-800 font-bold text-xs flex items-center justify-center shrink-0">
                                      {idx + 1}
                                    </span>
                                    <h5 className="font-bold text-xs sm:text-sm text-neutral-900">{step.title}</h5>
                                  </div>
                                  <p className="text-xs text-neutral-600 leading-relaxed font-normal">
                                    {step.description}
                                  </p>
                                </div>
                                {step.tip && (
                                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{step.tip}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Pro Tip Callout Box */}
                          {section.proTip && (
                            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="leading-tight">
                                <span className="font-bold">Tips Master: </span>
                                <span>{section.proTip}</span>
                              </div>
                            </div>
                          )}

                          {/* Action Navigation Link if supplied */}
                          {onNavigateTab && (
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={() => {
                                  if (section.category === 'report') onNavigateTab('report');
                                  else if (section.category === 'arrived') onNavigateTab('arrived');
                                  else if (section.category === 'stock') onNavigateTab('kosong');
                                  else if (section.category === 'quickstart') onNavigateTab('master');
                                }}
                                className="text-xs font-bold text-theme-600 hover:text-theme-700 flex items-center gap-1.5 hover:underline"
                              >
                                <span>Buka Halaman Terkait</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Quick FAQ / Pintasan Penting */}
          <div className="bg-theme-50/80 rounded-2xl border border-theme-200 p-5 sm:p-6">
            <h4 className="font-bold text-sm text-theme-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-theme-600" />
              Tanya Jawab Cepat & Solusi Masalah Lazim
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
              <div className="bg-white p-3.5 rounded-xl border border-theme-100">
                <p className="font-bold text-neutral-900 mb-1">Q: Apakah data saya hilang jika ganti HP atau komputer?</p>
                <p>Tidak, selama Anda menggunakan <strong>Supabase Cloud</strong> atau <strong>Firebase Firestore</strong>, data tersimpan aman di cloud dan langsung sinkron ketika login.</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-theme-100">
                <p className="font-bold text-neutral-900 mb-1">Q: Bagaimana cara membagikan rekap ke WhatsApp?</p>
                <p>Klik tombol <strong>"Ekspor TXT"</strong> di Daily Report. Format teks rapi akan otomatis tersalin ke clipboard atau terunduh dan siap di-paste langsung ke chat WhatsApp.</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-theme-100">
                <p className="font-bold text-neutral-900 mb-1">Q: Mengapa muncul peringatan kuota Firebase?</p>
                <p>Jika kuota baca/tulis harian Firebase Free Tier tercapai, Anda bisa langsung beralih ke <strong>Supabase Cloud</strong> atau <strong>Offline Lokal</strong> di menu Pengaturan.</p>
              </div>
              <div className="bg-white p-3.5 rounded-xl border border-theme-100">
                <p className="font-bold text-neutral-900 mb-1">Q: Apakah aplikasi bisa dibuka offline tanpa internet?</p>
                <p>Ya! Ubah sumber database ke <strong>"Offline Lokal"</strong> di Pengaturan. Seluruh data tersimpan di IndexedDB browser Anda dan tetap berjalan cepat tanpa internet.</p>
              </div>
            </div>
          </div>

        </div>

        {/* Floating Back to Top Button */}
        <AnimatePresence>
          {isFullscreen && showBackToTop && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 10 }}
              onClick={scrollToTop}
              className="fixed bottom-16 sm:bottom-6 right-4 sm:right-8 z-40 p-3 bg-neutral-900/90 hover:bg-neutral-900 active:scale-95 text-white rounded-2xl shadow-xl border border-neutral-700 backdrop-blur-md flex items-center gap-1.5 text-xs font-bold"
              title="Kembali ke Atas"
            >
              <ArrowUp className="w-4 h-4 text-emerald-400" />
              <span className="hidden xs:inline">Ke Atas</span>
            </motion.button>
          )}
        </AnimatePresence>

        {/* Mobile Fullscreen Sticky Bottom Action Bar */}
        {isFullscreen && (
          <div 
            className="sm:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-neutral-200/90 p-2.5 px-3 flex items-center justify-between z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
            style={{ paddingBottom: 'max(0.625rem, env(safe-area-inset-bottom))' }}
          >
            <button
              onClick={() => setIsFullscreen(false)}
              className="flex-1 mr-2 py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 active:scale-[0.98] text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
            >
              <X className="w-3.5 h-3.5 text-emerald-400" />
              <span>Tutup Mode Fullscreen</span>
            </button>

            <button
              onClick={scrollToDemo}
              className="py-2.5 px-3.5 bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 active:scale-[0.98] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0"
              title="Lihat Simulasi Demo"
            >
              <Play className="w-3.5 h-3.5 fill-current text-emerald-600" />
              <span>Demo</span>
            </button>
          </div>
        )}

        {/* Desktop Footer info & close if fullscreen */}
        {isFullscreen && (
          <div className="hidden sm:flex p-4 border-t border-neutral-100 bg-neutral-50 items-center justify-between shrink-0">
            <span className="text-xs text-neutral-500 font-medium">Tekan tombol Tutup atau tombol Esc pada keyboard untuk keluar.</span>
            <button
              onClick={() => setIsFullscreen(false)}
              className="px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              Tutup Panduan Fullscreen
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
