import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Sparkles, CheckCircle2, ArrowRight, Play, RotateCcw, 
  Package, FileText, PackageOpen, PackageMinus, Factory, AlertTriangle, 
  Database, Download, Upload, Search, ChevronDown, ChevronUp, 
  Layers, HelpCircle, Compass, Zap, Flame, Smartphone, ShieldCheck, 
  RefreshCw, X, Maximize2, Minimize2, Clock, Check, Eye, ChevronLeft, ArrowUp,
  Printer, FileDown, BookMarked, Keyboard
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAppContext } from '../store/AppContext';
import {
  exportUserGuideToPdf,
  GuideBindingMode,
  GuidePdfFaqItem,
  GuidePdfShortcutItem,
  PdfCompanyProfile
} from '../lib/pdf';

export interface UserGuideProps {
  onNavigateTab?: (tab: 'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'settings') => void;
  isEmbedded?: boolean;
  initialFullscreen?: boolean;
}

interface GuideSection {
  id: string;
  category: 'intro' | 'quickstart' | 'report' | 'arrived' | 'stock' | 'database' | 'tips' | 'troubleshooting';
  title: string;
  subtitle: string;
  overview: string;
  icon: any;
  color: string;
  bgLight: string;
  steps: {
    title: string;
    description: string;
    details: string[];
    tip?: string;
  }[];
  proTip?: string;
  demoType?: 'queue' | 'arrived' | 'copy' | 'database';
}

export const UserGuide: React.FC<UserGuideProps> = ({ onNavigateTab, isEmbedded = false, initialFullscreen = false }) => {
  const { settings } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string | null>('app-introduction');
  const [activeDemo, setActiveDemo] = useState<'queue' | 'arrived' | 'copy' | 'database'>('queue');
  const [demoStep, setDemoStep] = useState(0);
  const [isDemoPlaying, setIsDemoPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(initialFullscreen);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showPrintBookModal, setShowPrintBookModal] = useState(false);
  const [bindingMode, setBindingMode] = useState<GuideBindingMode>('standard');
  const [includeNotesPage, setIncludeNotesPage] = useState(true);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const companyProfile: PdfCompanyProfile = useMemo(
    () => ({
      name: settings?.companyName,
      tagline: settings?.companyTagline,
      address: settings?.companyAddress,
      phone: settings?.companyPhone,
      email: settings?.companyEmail,
      icon: settings?.companyIcon
    }),
    [
      settings?.companyName,
      settings?.companyTagline,
      settings?.companyAddress,
      settings?.companyPhone,
      settings?.companyEmail,
      settings?.companyIcon
    ]
  );

  // Guide topics database (8 comprehensive chapters)
  const guideSections: GuideSection[] = [
    {
      id: 'app-introduction',
      category: 'intro',
      title: 'Pengenalan Aplikasi & Gambaran Umum Sistem',
      subtitle: 'Mengenal fungsi utama, peta menu navigasi, siklus data, dan pembagian peran pengguna',
      overview:
        'ReportPro adalah aplikasi manajemen stok, pencatatan laporan harian, dan kontrol gudang terpadu yang dirancang agar pekerjaan operasional terasa lebih cepat, rapi, dan akurat. Seluruh modul saling terhubung secara otomatis sehingga operator tidak perlu mencatat ulang data yang sama di banyak tempat.',
      icon: BookMarked,
      color: 'text-emerald-700',
      bgLight: 'bg-emerald-50',
      demoType: 'queue',
      steps: [
        {
          title: 'Apa Itu ReportPro & Manfaat Utamanya bagi Tim',
          description:
            'ReportPro hadir untuk menggantikan pencatatan manual di kertas atau spreadsheet terpisah dengan satu sistem digital yang praktis. Aplikasi ini membantu tim memantau stok kritis, mencatat kebutuhan barang harian, memverifikasi kiriman supplier, hingga mencetak laporan resmi dalam hitungan detik.',
          details: [
            'Kecepatan input tinggi: puluhan item harian dapat dimasukkan ke antrean lalu disimpan sekaligus dalam satu klik.',
            'Minim salah catat: status kedatangan barang dan batas aman stok (Bottom Stock) diperbarui secara otomatis antar menu.',
            'Siap lintas perangkat: dapat dibuka melalui komputer kasir, laptop admin, maupun ponsel staf gudang dengan data seragam.'
          ],
          tip: 'Luangkan waktu 10 menit bagi staf baru untuk membaca bab ini sebelum mulai menginput transaksi harian.'
        },
        {
          title: 'Mengenal Peta Menu & Fungsi Setiap Halaman',
          description:
            'Setiap menu pada bilah navigasi mewakili satu tahapan kerja yang jelas sehingga pengguna pemula langsung memahami tempat melakukan tugasnya masing-masing tanpa merasa bingung.',
          details: [
            'Dashboard & Master Data: ringkasan kondisi gudang, pendaftaran supplier, katalog produk, satuan unit, serta batas Bottom Stock.',
            'Daily Report, Barang Datang & Pengeluaran: pusat pencatatan laporan harian, penerimaan surat jalan, dan mutasi barang keluar.',
            'Kosong Pabrik, Stok Menipis & Kadaluarsa: halaman pemantauan khusus untuk barang bermasalah, stok kritis, dan kontrol tanggal kedaluwarsa.'
          ],
          tip: 'Menu Pengaturan dan Panduan selalu tersedia di bagian bawah navigasi untuk konfigurasi sistem maupun rujukan SOP.'
        },
        {
          title: 'Siklus Alur Data Terpadu dari Awal hingga Pelaporan',
          description:
            'Memahami bagaimana data mengalir dari satu menu ke menu lain akan membuat penggunaan aplikasi terasa sangat mudah. Semua berawal dari data induk produk, bergerak ke transaksi harian, lalu bermuara pada laporan siap kirim.',
          details: [
            'Tahap 1 (Persiapan): daftar produk dan supplier dicatat sekali di Master Data sebagai kamus utama sistem.',
            'Tahap 2 (Transaksi): Daily Report mencatat kebutuhan/stok harian, sementara Barang Datang otomatis menandai pesanan yang telah tiba.',
            'Tahap 3 (Keluaran): rekap akhir langsung dapat diekspor ke format TXT untuk WhatsApp, Excel untuk olah data, dan PDF berkop perusahaan.'
          ],
          tip: 'Hindari membuat nama produk baru yang sama persis di luar Master Data agar histori laporan tidak terpecah.'
        },
        {
          title: 'Pembagian Peran Pengguna, Keamanan PIN & Cloud Bawaan',
          description:
            'Secara bawaan sejak pertama kali dijalankan, aplikasi sudah aktif terhubung ke Supabase Cloud (PostgreSQL) sebagai basis data standar. Untuk menjaga kerapian kerja tim, tanggung jawab pengguna dibagi secara jelas antara operator harian dan admin pengelola.',
          details: [
            'Operator Gudang/Kasir: fokus pada input Daily Report, pencatatan Barang Datang, mutasi Pengeluaran, dan pengecekan stok menipis.',
            'Supervisor/Admin: mengelola Master Data, memantau Kosong Pabrik, mengunduh Backup JSON, serta memegang PIN keamanan tab Database & Sistem.',
            'Dukungan fleksibel: selain Supabase Cloud, sistem tetap siap beralih ke Firebase Firestore maupun Mode Offline Lokal saat dibutuhkan.'
          ],
          tip: 'Catat siapa pemegang PIN utama di kantor agar perubahan konfigurasi server tetap terkendali dan aman.'
        }
      ],
      proTip:
        'Kunci kemudahan memakai ReportPro adalah menjaga kebersihan Master Data di awal; setelah katalog rapi, seluruh pekerjaan harian menjadi jauh lebih ringan.'
    },
    {
      id: 'quickstart-flow',
      category: 'quickstart',
      title: 'Alur Kerja Dasar & Orientasi Operasional',
      subtitle: 'Urutan kerja harian yang baku dari persiapan pagi, pencatatan, hingga tutup laporan',
      overview:
        'Bab ini merangkum langkah kerja praktis dari pagi hingga sore hari agar seluruh anggota tim menjalankan prosedur yang sama. Dengan mengikuti urutan baku ini, tidak ada barang kritis yang terlewat atau terpesan dua kali.',
      icon: Compass,
      color: 'text-emerald-600',
      bgLight: 'bg-emerald-50',
      demoType: 'queue',
      steps: [
        {
          title: 'Pemeriksaan Koneksi & Kondisi Stok Pagi Hari',
          description:
            'Sebelum memulai transaksi harian, buka aplikasi dan pastikan data terbaru sudah termuat dengan baik. Biasakan meninjau Dashboard, tab Stok Menipis, serta tab Kosong Pabrik sebagai bahan acuan order hari berjalan.',
          details: [
            'Pastikan indikator koneksi basis data aktif di Pengaturan berjalan normal (bawaan utama menggunakan Supabase Cloud).',
            'Catat daftar barang yang masuk kategori kritis pada tab Stok Menipis agar segera diprioritaskan pada pesanan hari ini.'
          ],
          tip: 'Pastikan seluruh perangkat operasional di toko atau gudang mengakses alamat aplikasi dan proyek database yang sama.'
        },
        {
          title: 'Melengkapi Supplier & Katalog di Master Data',
          description:
            'Apabila terdapat barang baru yang belum terdaftar, masuk ke menu Master Data lalu daftarkan supplier serta produk beserta satuan unit (pcs, dus, botol) dan batas minimum stok (Bottom Stock).',
          details: [
            'Setiap produk wajib terikat ke satu supplier agar pengelompokan laporan TXT, Excel, dan PDF tersusun otomatis per pabrik.',
            'Jika ingin menambahkan puluhan hingga ratusan barang sekaligus, manfaatkan tombol Import Excel agar jauh lebih cepat.'
          ],
          tip: 'Menetapkan Bottom Stock sejak awal produk didaftarkan membantu sistem memberi peringatan otomatis sebelum barang benar-benar habis.'
        },
        {
          title: 'Menyusun Antrean Laporan pada Menu Daily Report',
          description:
            'Pilih tanggal kerja pada Daily Report, ketik sebagian nama barang pada kolom pencarian cerdas, isi kuantitas (Qty), lalu masukkan ke antrean daftar sementara sebelum menyimpannya serentak ke database.',
          details: [
            'Tekan tombol "+ Ke List" atau langsung tekan tombol Enter pada papan ketik setelah mengisi kolom Qty agar kursor siap untuk barang berikutnya.',
            'Periksa ulang daftar antrean di layar; Anda masih bebas mengubah angka atau menghapus baris sebelum menekan "Simpan Semua".'
          ],
          tip: 'Apabila daftar barang yang dipesan hampir sama dengan hari sebelumnya, gunakan tombol "Salin Data Kemarin" untuk menghemat waktu.'
        },
        {
          title: 'Verifikasi Barang Datang, Penyesuaian & Ekspor Akhir',
          description:
            'Saat armada supplier tiba membawa kiriman, input jumlah penerimaan di menu Barang Datang agar status pada Daily Report otomatis tercentang. Di penghujung hari, ekspor laporan ke TXT, Excel, atau PDF.',
          details: [
            'Format TXT menghasilkan daftar rapi yang terkelompok per supplier dan siap langsung ditempel ke grup pesan WhatsApp.',
            'Format PDF otomatis menyertakan kop perusahaan, logo, kontak, serta ringkasan jumlah item yang bersaldo kosong.'
          ],
          tip: 'Selalu selesaikan verifikasi Barang Datang pada hari yang sama supaya daftar pesanan hari esok tetap akurat.'
        }
      ],
      proTip:
        'Jadikan rutinitas 5 menit di pagi hari untuk memeriksa Stok Menipis dan Mendekati Kadaluarsa sebagai kebiasaan wajib sebelum membuka layanan.'
    },
    {
      id: 'daily-report-mastery',
      category: 'report',
      title: 'Pencatatan Cepat, Antrean & Ekspor Daily Report',
      subtitle: 'Penguasaan antrean input, Bottom Stock langsung, Reorder Ulang, dan ekspor multi-format',
      overview:
        'Daily Report dirancang untuk memproses puluhan hingga ratusan item dalam hitungan detik melalui mekanisme antrean lokal, pengeditan langsung pada tabel, serta ekspor otomatis ke berbagai format kerja.',
      icon: FileText,
      color: 'text-blue-600',
      bgLight: 'bg-blue-50',
      demoType: 'queue',
      steps: [
        {
          title: 'Input Antrean (+ Ke List) & Pengaturan Bottom Stock Langsung',
          description:
            'Ketik nama produk lalu pilih menggunakan klik atau tombol Panah Atas/Bawah, isi Qty, kemudian tekan Enter. Pada formulir input ini juga tersedia kolom Bottom Stock sehingga batas stok aman produk dapat langsung diatur atau disesuaikan.',
          details: [
            'Setiap perubahan nilai Bottom Stock di formulir Daily Report otomatis memperbarui data induk produk di Master Data.',
            'Sistem menampilkan daftar antrean sementara di bawah form agar operator dapat mengoreksi jumlah tanpa bolak-balik mengedit database.'
          ],
          tip: 'Klik tombol riwayat pencarian cepat untuk memanggil barang yang paling sering dicatat setiap hari.'
        },
        {
          title: 'Penyimpanan Serentak (Atomic Batch Write) & Progres Instan',
          description:
            'Menekan tombol "Simpan Semua" akan mengirim seluruh antrean ke server secara serentak dalam satu transaksi aman. Tampilan tabel langsung diperbarui seketika (0 ms) sementara bilah progres memantau proses penulisan hingga tuntas.',
          details: [
            'Untuk antrean berjumlah besar, layar menampilkan persentase kemajuan serta perkiraan sisa waktu penyelesaian.',
            'Penyimpanan serentak mencegah data tersimpan setengah jalan apabila koneksi internet tiba-tiba melambat.'
          ],
          tip: 'Tunggu beberapa detik hingga pemberitahuan "Selesai" tampil sebelum menutup peramban atau berpindah perangkat.'
        },
        {
          title: 'Salin Data Kemarin & Pengaturan Reorder Ulang',
          description:
            'Tombol "Salin Data Kemarin" menyalin item yang belum berstatus datang dari tanggal sebelumnya ke hari ini. Jika suatu barang sudah datang tetapi perlu dipesan lagi, centang "Reorder Ulang" dan isi kuantitas tambahannya.',
          details: [
            'Barang yang sudah berstatus "Sudah Datang" tanpa centang Reorder Ulang otomatis dilewati agar tidak terjadi pemesanan ganda.',
            'Semua item yang dicentang Reorder Ulang akan masuk kembali ke dalam daftar permintaan order saat Anda mengekspor TXT atau Excel.'
          ],
          tip: 'Gunakan fitur Reorder Ulang untuk produk cepat laku (fast moving) yang pengirimannya datang bertahap.'
        },
        {
          title: 'Ekspor Laporan Harian (TXT WhatsApp, Excel & PDF Berkop)',
          description:
            'Satu klik di menu ekspor memungkinkan Anda membagikan hasil laporan sesuai kebutuhan penerima: format TXT ringkas untuk pesan WhatsApp, file Excel untuk rekapitulasi administrasi, atau dokumen PDF resmi berkop perusahaan.',
          details: [
            'Produk dengan status Kosong Pabrik dipisahkan otomatis ke bagian tersendiri agar tim pembelian mudah mengenalinya.',
            'Penghitungan jumlah produk bersaldo nol dilakukan unik per nama barang dan otomatis mengecualikan item yang sudah datang.'
          ],
          tip: 'Tinjau sekilas pratinjau teks pada kotak Ekspor TXT sebelum menyalin dan mengirimkannya ke grup supplier.'
        }
      ],
      proTip:
        'Jika suatu barang sudah diinput lebih dulu pada menu Barang Datang di tanggal yang sama, pencatatan produk tersebut di Daily Report otomatis berstatus "Sudah Datang".'
    },
    {
      id: 'arrived-goods-sync',
      category: 'arrived',
      title: 'Manajemen Barang Datang & Auto-Sync',
      subtitle: 'Input kiriman berulang tanpa menutup form, sinkronisasi otomatis, impor Excel & keluar',
      overview:
        'Menu Barang Datang memastikan setiap barang masuk dari supplier tercatat rapi per tanggal kedatangan sekaligus langsung menyinkronkan status pesanan di tabel Daily Report tanpa perlu dicentang satu per satu.',
      icon: PackageOpen,
      color: 'text-amber-600',
      bgLight: 'bg-amber-50',
      demoType: 'arrived',
      steps: [
        {
          title: 'Input Kiriman Berkelanjutan dengan Formulir Tetap Terbuka',
          description:
            'Saat membongkar kiriman berisi banyak produk, pilih barang dan masukkan jumlah riil yang diterima lalu klik Simpan. Formulir input sengaja tetap terbuka setelah penyimpanan sehingga Anda dapat langsung menginput barang selanjutnya.',
          details: [
            'Alur tanpa buka-tutup jendela ini memangkas waktu input surat jalan yang panjang secara signifikan.',
            'Barang yang datang di luar daftar pesanan Daily Report tetap terekam aman sebagai catatan kedatangan khusus.'
          ],
          tip: 'Hitung dan cocokkan jumlah fisik barang terlebih dahulu dengan nota/surat jalan sebelum menekan Simpan.'
        },
        {
          title: 'Sinkronisasi Otomatis Status ke Tabel Daily Report',
          description:
            'Setiap transaksi yang tersimpan di Barang Datang langsung mencocokkan ID produk dan tanggal laporan pada Daily Report. Jika cocok, kolom "Sudah Datang" otomatis terceklis seketika tanpa penyuntingan manual.',
          details: [
            'Menghindari kesalahpahaman antar shift mengenai barang mana yang sudah tiba di gudang dan mana yang masih tertunda.',
            'Tanda centang otomatis juga langsung tercermin dalam hasil ekspor PDF dan Excel.'
          ],
          tip: 'Pastikan tanggal pada formulir Barang Datang sama dengan tanggal laporan Daily Report yang ingin disinkronkan.'
        },
        {
          title: 'Impor Rekap Surat Jalan dari Berkas Excel',
          description:
            'Apabila menerima daftar kedatangan dalam jumlah puluhan hingga ratusan baris dari file spreadsheet, gunakan tombol "Import Excel" di Barang Datang lengkap dengan panduan kolom serta indikator progres impor.',
          details: [
            'Format tanggal serial Excel maupun format teks DD/MM/YYYY otomatis dikonversi menjadi tanggal kalender yang benar.',
            'Nama produk yang belum ada di Master Data akan terdeteksi dengan jelas agar dapat ditambahkan terlebih dahulu.'
          ],
          tip: 'Samakan urutan judul kolom Excel sesuai petunjuk pada jendela Import Excel sebelum mengunggah file.'
        },
        {
          title: 'Penanganan Kiriman Parsial & Pencatatan Pengeluaran',
          description:
            'Jika jumlah barang yang datang lebih sedikit dari pesanan (parsial), catat jumlah sebenarnya di Barang Datang lalu centang "Reorder Ulang" di Daily Report. Untuk barang keluar non-penjualan, catat pada menu Pengeluaran.',
          details: [
            'Menu Pengeluaran (Stock Out) digunakan mencatat pemakaian internal, barang rusak, sampel promosi, retur pabrik, atau kiriman cabang.',
            'Pemisahan catatan keluar menjaga perhitungan saldo stok gudang tetap jujur dan mudah diaudit.'
          ],
          tip: 'Tulis keterangan singkat yang jelas (misalnya: "Retur dus penyok") pada setiap catatan Pengeluaran.'
        }
      ],
      proTip:
        'Selalu gunakan tanggal penerimaan fisik yang sebenarnya di menu Barang Datang agar riwayat mutasi masuk mudah dilacak saat audit bulanan.'
    },
    {
      id: 'factory-stock-warning',
      category: 'stock',
      title: 'Master Data, Bottom Stock & Kosong Pabrik',
      subtitle: 'Edit produk langsung pada daftar, kontrol batas stok aman & pantau kadaluarsa',
      overview:
        'Stabilitas ketersediaan barang bergantung pada kelengkapan katalog Master Data, ketepatan penentuan batas Bottom Stock, serta kedisiplinan memperbarui status Kosong Pabrik dan tanggal kedaluwarsa.',
      icon: Factory,
      color: 'text-rose-600',
      bgLight: 'bg-rose-50',
      demoType: 'copy',
      steps: [
        {
          title: 'Tambah Produk Baru & Penetapan Bottom Stock Awal',
          description:
            'Pada formulir Tambah Produk di Master Data, selain mengisi nama barang, supplier, dan satuan unit, Anda dapat langsung menetapkan angka Bottom Stock (batas minimum stok aman) sejak awal pembuatan item.',
          details: [
            'Contoh mudah: jika rata-rata pemakaian 5 pcs/hari dan pengiriman supplier butuh 3 hari, tetapkan Bottom Stock di angka 15–20 pcs.',
            'Produk yang stoknya turun di bawah angka Bottom Stock otomatis masuk ke daftar pantauan Stok Menipis.'
          ],
          tip: 'Tinjau ulang angka Bottom Stock secara berkala saat memasuki musim ramai penjualan atau hari libur panjang.'
        },
        {
          title: 'Edit Item Langsung pada Daftar Produk (Inline Editing)',
          description:
            'Untuk memperbarui nama barang, satuan unit, supplier, atau Bottom Stock, klik langsung kontrol edit pada baris item di daftar produk Master Data tanpa perlu berpindah ke jendela terpisah.',
          details: [
            'Perubahan langsung tersimpan dan otomatis memperbarui tampilan di seluruh menu lain termasuk Daily Report.',
            'Untuk memperbarui puluhan item sekaligus, tersedia fitur "Atur Bottom Stock Massal" berdasarkan filter supplier.'
          ],
          tip: 'Gunakan kotak pencarian atau filter supplier terlebih dahulu supaya penyuntingan massal lebih terarah.'
        },
        {
          title: 'Pengelolaan Status Kosong Pabrik & Tab Stok Menipis',
          description:
            'Aktifkan penanda "Kosong Pabrik" apabila barang sedang mengalami kekosongan produksi dari pabrik atau distributor utama. Sementara itu, barang bersaldo kritis otomatis terkumpul dalam tab Stok Menipis.',
          details: [
            'Item berstatus Kosong Pabrik dipisahkan dari antrean order reguler agar tim tidak terus-menerus memesan barang yang belum tersedia.',
            'Tab Stok Menipis berfungsi sebagai daftar belanja prioritas bagi admin pembelian setiap kali akan menerbitkan PO.'
          ],
          tip: 'Segera matikan status Kosong Pabrik begitu mendapat kepastian suplai dari pabrik kembali normal.'
        },
        {
          title: 'Pemantauan Barang Mendekati Kadaluarsa (FEFO)',
          description:
            'Catat tanggal kedaluwarsa (expired date) batch produk pada menu Mendekati Kadaluarsa agar tim gudang dapat menjalankan prinsip FEFO (First Expired, First Out — yang lebih cepat kedaluwarsa dikeluarkan lebih dulu).',
          details: [
            'Daftar otomatis menandai item yang mendekati batas kedaluwarsa sehingga mudah disusun rencana promo atau pengajuan retur.',
            'Mencegah kerugian finansial akibat barang melewati masa berlaku di dalam rak penyimpanan.'
          ],
          tip: 'Lakukan pemeriksaan tab Mendekati Kadaluarsa secara rutin setiap awal minggu bersama kepala gudang.'
        }
      ],
      proTip:
        'Pertahankan nilai Bottom Stock sedikit lebih tinggi daripada kebutuhan minimum harian sebagai penyangga saat terjadi keterlambatan armada pengiriman.'
    },
    {
      id: 'cloud-database-guide',
      category: 'database',
      title: 'Multi-Database, Keamanan PIN & Pencadangan',
      subtitle: 'Pengelolaan Supabase PostgreSQL, Firebase Firestore, Offline Lokal, PIN & Backup JSON',
      overview:
        'ReportPro mendukung tiga pilihan mesin penyimpanan dengan Supabase Cloud sebagai standar utama sejak pertama kali digunakan. Seluruh konfigurasi sensitif dilindungi oleh PIN dan dilengkapi fitur Backup JSON penuh.',
      icon: Database,
      color: 'text-indigo-600',
      bgLight: 'bg-indigo-50',
      demoType: 'database',
      steps: [
        {
          title: 'Supabase Cloud Default & Buat Tabel Otomatis',
          description:
            'Sejak pertama kali dijalankan, aplikasi langsung aktif menggunakan Supabase Cloud (PostgreSQL) agar siap dipakai bersama antar perangkat. Jika menghubungkan proyek Supabase baru, klik "Cek & Buat Semua Tabel Otomatis" untuk menyiapkan tabel tanpa menulis kode SQL.',
          details: [
            'Tersedia tombol "Reset ke Proyek Default" apabila ingin mengembalikan konfigurasi ke proyek standar bawaan aplikasi.',
            'Panel status akan memverifikasi lima tabel utama: suppliers, products, reports, stock_outs, dan settings.'
          ],
          tip: 'Selalu jalankan pemeriksaan tabel otomatis setiap kali mengganti URL atau Anon Key proyek Supabase.'
        },
        {
          title: 'Peralihan Mesin ke Firebase Firestore atau Offline Lokal',
          description:
            'Pada tab Database & Cloud di Pengaturan, admin dapat beralih menggunakan Google Cloud Firestore (Firebase) atau Mode Offline Lokal (IndexedDB) sesuai kebutuhan jaringan gudang, lengkap dengan tombol Uji Koneksi.',
          details: [
            'Mode Offline Lokal menyimpan seluruh data di dalam peramban perangkat sehingga aplikasi tetap bekerja cepat meski tanpa internet.',
            'Tombol "Migrasikan Data" memungkinkan pemindahan seluruh data lokal atau Firebase ke Supabase secara aman dalam satu klik.'
          ],
          tip: 'Gunakan Mode Offline Lokal sebagai cadangan sementara hanya saat jaringan internet gudang mengalami gangguan total.'
        },
        {
          title: 'Proteksi PIN Keamanan pada Pengaturan Sensitif',
          description:
            'Tab "Database & Cloud" serta tab "Data & Sistem" di Pengaturan dikunci dengan PIN keamanan (4 hingga 8 digit angka) agar kredensial cloud, migrasi data, dan tombol penghapusan massal tidak diakses sembarangan.',
          details: [
            'Setelah PIN dimasukkan dengan benar, akses terbuka selama sesi aktif hingga peramban ditutup atau dikunci kembali.',
            'Admin atau Supervisor dapat memperbarui kode PIN melalui menu ubah PIN di dalam tab Database & Cloud.'
          ],
          tip: 'Gunakan kombinasi PIN yang mudah diingat tim inti namun tidak mudah ditebak (hindari 1234), lalu ganti saat ada pergantian admin.'
        },
        {
          title: 'Backup JSON, Restore Data & Pembersihan Harian Otomatis',
          description:
            'Di tab Data & Sistem, klik "Download Backup" untuk mengunduh salinan utuh seluruh database ke dalam satu file JSON. File ini dapat dipulihkan kapan saja melalui "Restore Data", serta tersedia opsi pembersihan otomatis data harian.',
          details: [
            'Aturan pembersihan otomatis menyediakan 3 pilihan: Nonaktif (simpan semua histori), Hanya Hari Ini, atau Simpan 2 Hari.',
            'File backup JSON bersifat portabel sehingga aman disimpan sebagai arsip di komputer kantor maupun Google Drive.'
          ],
          tip: 'Lakukan "Download Backup" secara rutin setiap akhir pekan atau sebelum menjalankan pembersihan data.'
        }
      ],
      proTip:
        'Selalu unduh file Backup JSON sebelum memindahkan sumber database atau melakukan pemulihan data (Restore) demi menjamin nol risiko kehilangan data.'
    },
    {
      id: 'pro-tips-and-pwa',
      category: 'tips',
      title: 'Kustomisasi Antarmuka, PWA & Cetak Buku A4',
      subtitle: 'Identitas perusahaan, tata letak menu, instalasi layar penuh & pencetakan buku A4',
      overview:
        'Bab ini memandu pengguna menyesuaikan tampilan aplikasi agar nyaman dipakai seharian, memasang aplikasi di ponsel maupun desktop (PWA), serta mencetak Buku Panduan berukuran A4 siap jilid.',
      icon: Zap,
      color: 'text-amber-500',
      bgLight: 'bg-amber-50',
      steps: [
        {
          title: 'Pengaturan Profil Perusahaan & Kop Laporan Resmi',
          description:
            'Masukkan nama perusahaan, tagline, alamat, telepon, email, serta unggah logo usaha melalui menu Pengaturan. Identitas ini otomatis diterapkan ke Sampul Buku Panduan dan bagian atas setiap ekspor PDF laporan harian.',
          details: [
            'Unggah file logo berformat PNG atau JPG dengan ukuran jelas agar terlihat tajam saat dicetak.',
            'Perubahan profil langsung aktif di seluruh aplikasi tanpa perlu memuat ulang halaman secara manual.'
          ],
          tip: 'Gunakan logo berlatar transparan atau putih bersih supaya menyatu rapi pada kop laporan dan sampul buku.'
        },
        {
          title: 'Pengaturan Posisi, Warna Tema & Perkecil Sidebar',
          description:
            'Setiap pengguna dapat menyesuaikan posisi bilah menu (Kiri, Kanan, atau Bawah layar), memilih palet tema warna aplikasi, serta mengaktifkan mode Sidebar Diperkecil agar ruang kerja tabel menjadi lebih luas.',
          details: [
            'Pada layar ponsel atau tablet, penempatan menu di sisi Bawah sangat memudahkan jangkauan ibu jari.',
            'Mode Sidebar Diperkecil mempertahankan ikon navigasi yang jelas sembari memberi ruang tambahan bagi kolom angka tabel.'
          ],
          tip: 'Aktifkan mode Sidebar Diperkecil pada layar laptop kecil supaya seluruh kolom Daily Report tampil tanpa terpotong.'
        },
        {
          title: 'Instalasi Aplikasi Layar Penuh (PWA) di HP & Komputer',
          description:
            'Karena dibangun dengan teknologi Progressive Web App (PWA), ReportPro dapat dipasang ke layar utama ponsel maupun desktop layaknya aplikasi bawaan tanpa bilah alamat peramban yang mengganggu.',
          details: [
            'Klik tombol "Install App" atau pilih "Add to Home Screen / Install" pada menu peramban Chrome, Edge, atau Safari.',
            'Membuka aplikasi lewat ikon hasil instalasi mempercepat akses halaman dan menjaga fokus penuh selama bekerja.'
          ],
          tip: 'Gunakan ikon aplikasi hasil instalasi PWA agar staf tidak salah menekan atau menutup tab pekerjaan.'
        },
        {
          title: 'Pratinjau, Download PDF & Cetak Buku Panduan Ukuran A4',
          description:
            'Pada bagian atas halaman Panduan, tekan "Cetak / Bukukan A4" untuk membuka jendela pratinjau cetak atau tekan "PDF Buku A4" untuk langsung mengunduh dokumen buku siap jilid dengan margin jilid 24 mm dan Daftar Isi terperinci.',
          details: [
            'Tersedia pilihan mode Jilid Kiri (cetak 1 sisi) maupun Timbal-Balik (Margin Cermin otomatis untuk cetak bolak-balik).',
            'Penomoran halaman dimulai dari Halaman 1 pada Kata Pengantar sehingga Sampul Depan tampil bersih tanpa angka halaman.'
          ],
          tip: 'Gunakan kertas A4 (210 × 297 mm) dengan skala cetak 100% (Actual Size) saat mencetak melalui printer kantor.'
        }
      ],
      proTip:
        'Apabila setelah pembaruan sistem tampilan antarmuka terasa belum berubah, klik "Hapus Cache" di Pengaturan untuk menyegarkan aset tanpa menghapus data.'
    },
    {
      id: 'troubleshooting-guide',
      category: 'troubleshooting',
      title: 'Penanganan Masalah (Troubleshooting)',
      subtitle: 'Panduan langkah cepat mengatasi kendala koneksi cloud, stok, impor Excel & cetak A4',
      overview:
        'Bab ini menyediakan langkah diagnostik dan solusi praktis saat terjadi kendala teknis maupun ketidaksesuaian data operasional. Ikuti solusi secara berurutan agar masalah selesai cepat tanpa mengganggu integritas database.',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgLight: 'bg-red-50',
      steps: [
        {
          title: 'Koneksi Supabase Gagal, Tabel Belum Siap atau Data Kosong',
          description:
            'Gejala: Daftar produk atau laporan tidak muncul saat membuka aplikasi di perangkat baru, atau tampil peringatan kegagalan koneksi. Umumnya hal ini disebabkan kredensial proyek belum sesuai, tabel belum terbentuk, atau data lama masih berada di mode lokal.',
          details: [
            'Langkah 1: Buka Pengaturan → Database & Cloud (masukkan PIN), pastikan URL & Key benar atau klik "Reset ke Proyek Default".',
            'Langkah 2: Klik "Cek & Buat Semua Tabel Otomatis" agar sistem memeriksa dan membentuk seluruh tabel yang dibutuhkan di Supabase.',
            'Langkah 3: Jika data sebelumnya tersimpan di perangkat lama (Mode Offline Lokal), jalankan tombol "Migrasikan Data" ke Supabase.'
          ],
          tip: 'Pastikan koneksi internet perangkat dalam keadaan aktif sebelum menekan tombol Uji Koneksi atau Reset Proyek.'
        },
        {
          title: 'Batas Kuota Firebase Penuh atau Sinkronisasi Lambat',
          description:
            'Gejala: Muncul notifikasi kuota baca/tulis harian Firebase Firestore tercapai saat menggunakan penyedia Firebase, atau perubahan stok dari perangkat lain terlambat muncul di layar.',
          details: [
            'Langkah 1: Pindahkan penyedia database aktif ke "Supabase Cloud (PostgreSQL)" melalui Pengaturan agar kapasitas transaksi lebih leluasa.',
            'Langkah 2: Untuk situasi darurat agar pekerjaan gudang tidak terhenti, alihkan sementara ke mode "Offline Lokal (IndexedDB)".',
            'Langkah 3: Setelah kondisi kembali stabil, klik "Download Backup" dan sinkronkan kembali data ke server cloud.'
          ],
          tip: 'Menjadikan Supabase Cloud sebagai database utama sangat disarankan untuk pemakaian tim multi-perangkat.'
        },
        {
          title: 'Selisih Stok, Status Datang Belum Tercentang & Gagal Impor Excel',
          description:
            'Gejala: Barang fisik sudah diterima di gudang tetapi kolom "Sudah Datang" di Daily Report masih kosong, jumlah stok berbeda dari fisik rak, atau file Excel ditolak saat proses impor.',
          details: [
            'Langkah 1: Periksa apakah tanggal input pada Barang Datang sama persis dengan tanggal Daily Report agar Auto-Sync langsung cocok.',
            'Langkah 2: Pastikan barang rusak, sampel, atau retur ke pabrik sudah dicatat pada menu Pengeluaran (Stock Out).',
            'Langkah 3: Untuk file Excel yang gagal terbaca, pastikan kolom tanggal memakai format DD/MM/YYYY atau teks standar lalu ulangi impor.'
          ],
          tip: 'Gunakan fitur Edit Langsung di Master Data apabila menemukan dua nama produk hampir sama yang perlu dirapikan.'
        },
        {
          title: 'Lupa PIN Pengaturan, Cache Usang & Hasil Cetak A4 Terpotong',
          description:
            'Gejala: Operator terkunci dari tab Pengaturan karena lupa PIN, tampilan tombol terasa tertinggal setelah pembaruan, atau hasil cetak buku panduan dari browser mengalami pemotongan margin.',
          details: [
            'Solusi Lupa PIN: Hubungi Supervisor atau Developer Aplikasi (Denuda) selaku pemegang otorisasi utama untuk membuka akses dan mengatur ulang PIN.',
            'Solusi Cache Usang: Masuk ke Pengaturan lalu klik tombol "Hapus Cache" untuk memuat ulang berkas antarmuka terbaru tanpa menghapus data.',
            'Solusi Cetak A4: Pada dialog print browser pilih Paper Size A4, Scale 100%, aktifkan "Background graphics", atau langsung gunakan tombol "PDF Buku A4".'
          ],
          tip: 'Mengunduh melalui "PDF Buku A4" lalu mencetak dari pembaca PDF memberikan hasil paling presisi di semua merek printer.'
        }
      ],
      proTip:
        'Biasakan mengunduh cadangan melalui tombol "Download Backup" sebelum melakukan pemulihan data atau tindakan reset apa pun.'
    }
  ];

  const guideFaqs: GuidePdfFaqItem[] = [
    {
      question: 'Apakah data saya hilang jika ganti HP atau komputer?',
      answer:
        'Tidak. Selama menggunakan Supabase Cloud atau Firebase Firestore, seluruh data tersimpan aman di server cloud dan otomatis termuat saat membuka aplikasi di perangkat baru.'
    },
    {
      question: 'Bagaimana cara membagikan rekap laporan ke WhatsApp?',
      answer:
        'Klik tombol "Ekspor TXT" pada halaman Daily Report. Sistem menyusun teks rapi per kategori supplier (termasuk item Reorder Ulang) yang siap langsung ditempel ke grup WhatsApp.'
    },
    {
      question: 'Bagaimana cara mengatur Bottom Stock dan mengedit data barang?',
      answer:
        'Batas Bottom Stock dapat diatur saat Tambah Produk, langsung pada baris daftar produk Master Data (satuan maupun massal), serta langsung melalui formulir Daily Report.'
    },
    {
      question: 'Mengapa tab Database dan Data & Sistem di Pengaturan meminta PIN?',
      answer:
        'Proteksi PIN mencegah perubahan sumber basis data, migrasi cloud, maupun penghapusan data terjadi tanpa sepengetahuan atau otorisasi admin/supervisor.'
    },
    {
      question: 'Apa langkah cepat jika kuota Firebase penuh atau koneksi cloud bermasalah?',
      answer:
        'Alihkan penyedia database aktif ke Supabase Cloud (default aplikasi) atau aktifkan sementara mode Offline Lokal di Pengaturan, lalu ikuti panduan lengkap pada Bab 8 Penanganan Masalah.'
    },
    {
      question: 'Mengapa hasil cetak langsung dari browser terpotong atau warnanya pudar?',
      answer:
        'Atur ukuran kertas printer ke A4 (210 × 297 mm), skala ke 100% (Actual Size), dan centang opsi "Background graphics", atau gunakan tombol "PDF Buku A4" untuk hasil cetak paling presisi.'
    }
  ];

  const guideShortcuts: GuidePdfShortcutItem[] = [
    { keys: 'Enter (di kolom Qty)', description: 'Memasukkan barang langsung ke antrean (+ Ke List) pada Daily Report.' },
    { keys: 'Esc', description: 'Menutup Pratinjau Buku A4, mode Layar Penuh, atau dialog modal aktif.' },
    { keys: 'Panah Atas / Bawah', description: 'Memilih produk secara cepat dari daftar rekomendasi autocomplete.' },
    { keys: 'Ctrl + P / Cmd + P', description: 'Membuka dialog cetak browser saat jendela Pratinjau Buku A4 aktif.' },
    { keys: 'Klik Edit Baris Produk', description: 'Menyunting nama, satuan, supplier, dan Bottom Stock langsung di Master Data.' },
    { keys: 'Download Backup', description: 'Mengunduh salinan penuh basis data dalam format JSON sebelum pembersihan data.' }
  ];

  // Categories list
  const categories = [
    { id: 'all', label: 'Semua Panduan', icon: BookOpen },
    { id: 'intro', label: 'Pengenalan', icon: BookMarked },
    { id: 'quickstart', label: 'Alur Dasar', icon: Compass },
    { id: 'report', label: 'Daily Report', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'stock', label: 'Stok & Pabrik', icon: Factory },
    { id: 'database', label: 'Database & Cloud', icon: Database },
    { id: 'tips', label: 'Tips & PWA', icon: Zap },
    { id: 'troubleshooting', label: 'Penanganan Masalah', icon: AlertTriangle }
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
      const inOverview = section.overview.toLowerCase().includes(q);
      const inSteps = section.steps.some(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.details.some(d => d.toLowerCase().includes(q))
      );
      return inTitle || inSubtitle || inOverview || inSteps;
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

  // Lock background scroll and listen for Escape key when in Fullscreen or Print Book Preview
  useEffect(() => {
    if (isFullscreen || showPrintBookModal) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (showPrintBookModal) {
            setShowPrintBookModal(false);
          } else {
            setIsFullscreen(false);
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);

      return () => {
        document.body.style.overflow = originalOverflow;
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isFullscreen, showPrintBookModal]);

  // Enable A4 Book Print mode attribute while Preview Modal is open (supports Ctrl+P)
  useEffect(() => {
    if (showPrintBookModal) {
      document.documentElement.setAttribute('data-print-book', 'true');
      return () => {
        document.documentElement.removeAttribute('data-print-book');
      };
    }
  }, [showPrintBookModal]);

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

  const authorName = 'Denuda';
  const authorRole = 'Penyusun & Developer Aplikasi';

  const handleDownloadBookPdf = () => {
    setIsExportingPdf(true);
    try {
      const sanitizedBrand = (companyProfile.name?.trim() || 'ReportPro')
        .replace(/[^a-zA-Z0-9_-]+/g, '_')
        .replace(/^_+|_+$/g, '');
      exportUserGuideToPdf(
        guideSections.map(({ id, category, title, subtitle, overview, steps, proTip }) => ({
          id,
          category,
          title,
          subtitle,
          overview,
          steps,
          proTip
        })),
        `Buku_Panduan_${sanitizedBrand || 'ReportPro'}_A4`,
        companyProfile,
        {
          bindingMode,
          includeNotesPage,
          versionLabel: 'v3.2.0 Pro',
          authorName,
          authorRole,
          faqs: guideFaqs,
          shortcuts: guideShortcuts
        }
      );
    } finally {
      setTimeout(() => setIsExportingPdf(false), 300);
    }
  };

  const brandTitleForPreface = companyProfile.name?.trim() || 'ReportPro';
  const prefaceParagraphs = [
    `Dengan mengucapkan puji syukur ke hadirat Tuhan Yang Maha Esa, Buku Panduan Penggunaan Aplikasi ini disusun oleh ${authorName} selaku ${authorRole} sebagai pedoman standar operasional resmi bagi seluruh staf operasional, admin gudang, dan pengelola persediaan dalam mengoperasikan sistem ${brandTitleForPreface}.`,
    'Ketepatan pencatatan stok, kecepatan tindak lanjut barang datang, serta pengendalian batas stok minimum (Bottom Stock) merupakan faktor kunci dalam menjaga kelancaran distribusi dan ketersediaan barang. Oleh karena itu, buku panduan ini menghadirkan penjelasan terperinci mulai dari pengenalan arsitektur aplikasi, pengelolaan Master Data, input antrean Daily Report, verifikasi kedatangan barang, pemantauan item Kosong Pabrik, pengamanan akses sistem menggunakan PIN, hingga pencadangan basis data.',
    'Materi dalam buku ini disusun secara sistematis menggunakan bahasa yang jelas agar mudah dipahami, baik oleh pengguna baru pada masa orientasi maupun oleh operator harian sebagai rujukan cepat di meja kerja. Buku ini juga dilengkapi bab khusus Penanganan Masalah (Troubleshooting) untuk membantu tim menyelesaikan kendala operasional maupun teknis secara mandiri dan aman.',
    'Kami berharap buku panduan ini dapat meningkatkan keseragaman prosedur kerja, meminimalkan kesalahan pencatatan, serta mendukung kelancaran aktivitas tim secara menyeluruh. Kritik dan saran yang membangun senantiasa terbuka demi penyempurnaan sistem dan panduan di masa mendatang.'
  ];
  const prefacePurposes = [
    { num: '1.', text: 'Memperkenalkan fungsi utama dan alur kerja sistem agar mudah dipahami oleh pengguna baru.' },
    { num: '2.', text: 'Menyeragamkan standar pencatatan laporan harian, kontrol Bottom Stock, dan verifikasi barang datang.' },
    { num: '3.', text: 'Menyediakan panduan penanganan masalah (troubleshooting) operasional dan teknis yang cepat.' },
    { num: '4.', text: 'Menjaga keamanan konfigurasi basis data dan integritas data melalui PIN serta cadangan berkala.' }
  ];
  const prefaceQuote = 'Ketelitian pencatatan hari ini adalah fondasi kelancaran operasional hari esok.';

  const closingParagraphs = [
    `Demikian Buku Panduan Penggunaan Aplikasi ${brandTitleForPreface} ini disusun sebagai acuan menyeluruh bagi seluruh tim operasional, admin gudang, dan pengelola persediaan. Mulai dari pengenalan sistem, alur kerja harian, manajemen Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, hingga penanganan masalah telah dirangkum agar dapat langsung dipraktikkan secara konsisten.`,
    'Keberhasilan penerapan sistem digital tidak hanya ditentukan oleh kelengkapan fitur aplikasi, melainkan juga oleh kedisiplinan setiap pengguna dalam menjaga ketertiban pencatatan. Pembiasaan memeriksa stok menipis di pagi hari, memverifikasi barang datang pada tanggal yang sama, serta menjaga kerapian katalog produk akan menghadirkan data persediaan yang akurat setiap saat.',
    'Untuk menjaga kelangsungan operasional jangka panjang, tim dianjurkan melakukan pencadangan basis data (Download Backup JSON) secara berkala serta mengaktifkan pemantauan cloud menggunakan Supabase sebagai basis data standar. Apabila ditemukan kendala teknis di luar prosedur rutin, rujuklah kembali Bab Penanganan Masalah atau berkoordinasi dengan supervisor maupun pengembang aplikasi.',
    'Akhir kata, penyusun menyampaikan terima kasih atas dedikasi seluruh tim yang senantiasa menjaga kualitas operasional kerja sehari-hari. Semoga panduan ini menjadi mitra kerja yang andal dalam mendukung kelancaran distribusi, ketepatan pelaporan, serta kemajuan usaha secara berkelanjutan.'
  ];
  const closingPillars = [
    { num: '1.', title: 'Tertib Master Data', text: 'Menjaga nama produk, supplier, satuan, dan batas Bottom Stock selalu mutakhir.' },
    { num: '2.', title: 'Disiplin Verifikasi Harian', text: 'Mencatat Daily Report dan Barang Datang pada tanggal transaksi yang tepat.' },
    { num: '3.', title: 'Keamanan & Cadangan Data', text: 'Melindungi pengaturan sistem dengan PIN serta mengunduh Backup JSON rutin.' },
    { num: '4.', title: 'Kolaborasi & Evaluasi Berkala', text: 'Menyelesaikan kendala sesuai panduan dan melakukan evaluasi stok mingguan.' }
  ];
  const closingQuote = 'Sistem yang tertata rapi bekerja paling maksimal ketika dijalankan oleh tim yang disiplin, cermat, dan saling mendukung.';

  // Pages: 1 = Kata Pengantar, 2-3 = Daftar Isi I & II, 4..(3+2*N) = Bab 1..N (2 hal/bab), next = Penutup, next = Lampiran A, next = Lampiran B
  const totalBookPages = 5 + guideSections.length * 2 + (includeNotesPage ? 1 : 0);
  const closingPageNum = 4 + guideSections.length * 2;
  const appendixAPageNum = 5 + guideSections.length * 2;
  const appendixBPageNum = 6 + guideSections.length * 2;

  const handlePrintBookA4 = () => {
    const escapeHtml = (value: string) =>
      value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const brandName = companyProfile.name?.trim() || 'ReportPro';
    const brandTagline = companyProfile.tagline?.trim() || 'Sistem Manajemen Stok, Laporan Harian & Gudang';
    const printedDate = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    const contactLine = [
      companyProfile.address?.trim(),
      companyProfile.phone?.trim() ? `Telp: ${companyProfile.phone.trim()}` : '',
      companyProfile.email?.trim()
    ]
      .filter(Boolean)
      .join(' • ');

    const getSheetSideClass = (pageNum: number) =>
      bindingMode === 'mirrored' && pageNum % 2 === 0 ? 'sheet-verso' : 'sheet-recto';

    const renderRunningHeader = (sectionLabel: string) => `
      <div class="sheet-running-header">
        <span class="running-brand">BUKU PANDUAN • ${escapeHtml(brandName.toUpperCase())}</span>
        <span class="running-section">${escapeHtml(sectionLabel)}</span>
      </div>`;

    const renderRunningFooter = (pageNum: number) => `
      <div class="sheet-running-footer">
        <span class="running-doc">Dokumen Operasional Resmi • v3.2.0 Pro • Oleh ${escapeHtml(authorName)}</span>
        <span class="running-folio">Halaman ${pageNum} dari ${totalBookPages}</span>
      </div>`;

    const logoHtml =
      companyProfile.icon && companyProfile.icon.startsWith('data:image/')
        ? `<img src="${companyProfile.icon}" alt="Logo" class="cover-crest-img" />`
        : `<div class="cover-crest-mono">${escapeHtml(brandName.charAt(0).toUpperCase())}</div>`;

    type DetailedTocGroup = {
      badge: string;
      title: string;
      subtitle: string;
      pageLabel: string;
      subs?: { code: string; title: string; page: number }[];
    };

    const allTocGroups: DetailedTocGroup[] = [
      {
        badge: 'PEMBUKA',
        title: 'Kata Pengantar',
        subtitle: 'Sambutan penyusun, tujuan pedoman operasional, dan ruang lingkup buku panduan',
        pageLabel: 'Hal. 1',
        subs: [
          { code: '0.1', title: 'Sambutan Penyusun & Gambaran Umum Pedoman', page: 1 },
          { code: '0.2', title: 'Tujuan Penyusunan & Harapan Penerapan Sistem', page: 1 }
        ]
      },
      ...guideSections.map((sec, idx) => {
        const p1 = 4 + idx * 2;
        const p2 = 5 + idx * 2;
        return {
          badge: `BAB ${idx + 1}`,
          title: sec.title,
          subtitle: sec.subtitle,
          pageLabel: `Hal. ${p1}–${p2}`,
          subs: sec.steps.map((st, stepIdx) => ({
            code: `${idx + 1}.${stepIdx + 1}`,
            title: st.title,
            page: stepIdx < 2 ? p1 : p2
          }))
        };
      }),
      {
        badge: 'PENUTUP',
        title: 'Penutup',
        subtitle: 'Kesimpulan operasional, komitmen tim, pemeliharaan data, dan pengesahan',
        pageLabel: `Hal. ${closingPageNum}`,
        subs: [
          { code: 'P.1', title: 'Ringkasan Akhir & Pilar Keberhasilan Operasional', page: closingPageNum },
          { code: 'P.2', title: 'Pemeliharaan Sistem, Dukungan & Pengesahan Penyusun', page: closingPageNum }
        ]
      },
      {
        badge: 'LAMPIRAN A',
        title: 'Tanya Jawab Cepat (FAQ) & Pintasan Keyboard',
        subtitle: 'Solusi kendala operasional umum dan daftar tombol pintas aplikasi',
        pageLabel: `Hal. ${appendixAPageNum}`,
        subs: [
          { code: 'A.1', title: 'Tanya Jawab Operasional & Kendala Umum (FAQ)', page: appendixAPageNum },
          { code: 'A.2', title: 'Tabel Pintasan Keyboard & Navigasi Cepat', page: appendixAPageNum }
        ]
      },
      ...(includeNotesPage
        ? [
            {
              badge: 'LAMPIRAN B',
              title: 'Lembar Catatan Lapangan & Paraf Pelatihan',
              subtitle: 'Halaman catatan fisik tim operasional, pengesahan & kolofon penerbitan',
              pageLabel: `Hal. ${appendixBPageNum}`,
              subs: [
                { code: 'B.1', title: 'Kolom Catatan SOP Internal & Daftar Kontak Penting', page: appendixBPageNum },
                { code: 'B.2', title: 'Lembar Paraf Pengesahan Pelatihan & Kolofon Penerbitan', page: appendixBPageNum }
              ]
            }
          ]
        : [])
    ];

    const renderTocGroupList = (groups: DetailedTocGroup[]) =>
      groups
        .map(
          (item) => `
        <div class="toc-group">
          <div class="toc-row">
            <span class="toc-badge">${escapeHtml(item.badge)}</span>
            <div class="toc-text">
              <div class="toc-title-line">
                <span class="toc-item-title">${escapeHtml(item.title)}</span>
                <span class="toc-leader"></span>
                <span class="toc-page">${escapeHtml(item.pageLabel)}</span>
              </div>
              <div class="toc-sub">${escapeHtml(item.subtitle)}</div>
            </div>
          </div>
          ${
            item.subs && item.subs.length > 0
              ? `<div class="toc-subitems">
                  ${item.subs
                    .map(
                      (sub) => `
                    <div class="toc-subrow">
                      <span class="toc-subcode">${escapeHtml(sub.code)}</span>
                      <span class="toc-subtitle">${escapeHtml(sub.title)}</span>
                      <span class="toc-subleader"></span>
                      <span class="toc-subpage">${sub.page}</span>
                    </div>`
                    )
                    .join('')}
                </div>`
              : ''
          }
        </div>`
        )
        .join('');

    const tocPart1Html = renderTocGroupList(allTocGroups.slice(0, 5)); // Pembuka + Bab 1..4
    const tocPart2Html = renderTocGroupList(allTocGroups.slice(5)); // Bab 5..8 + Lampiran A & B

    const renderStepCardHtml = (
      subCode: string,
      st: GuideSection['steps'][number]
    ) => `
      <div class="step-card">
        <div class="step-head">
          <span class="step-num">${escapeHtml(subCode)}</span>
          <h3>${escapeHtml(st.title)}</h3>
        </div>
        <p class="step-desc">${escapeHtml(st.description)}</p>
        ${
          st.details && st.details.length > 0
            ? `<ul class="step-details">
                ${st.details.map((d) => `<li>${escapeHtml(d)}</li>`).join('')}
              </ul>`
            : ''
        }
        ${st.tip ? `<div class="step-tip"><strong>Tips Lapangan:</strong> ${escapeHtml(st.tip)}</div>` : ''}
      </div>`;

    const chaptersHtml = guideSections
      .map((sec, sIdx) => {
        const page1 = 4 + sIdx * 2;
        const page2 = 5 + sIdx * 2;
        const firstHalf = sec.steps.slice(0, 2);
        const secondHalf = sec.steps.slice(2);
        return `
        <article class="sheet ${getSheetSideClass(page1)}">
          <div class="sheet-top">
            ${renderRunningHeader(`BAB ${sIdx + 1} • ${sec.title}`)}
            <div class="chapter-header">
              <div class="chapter-badge">BAB ${sIdx + 1}  •  ${sec.steps.length} MATERI PEMBAHASAN</div>
              <h2>${escapeHtml(sec.title)}</h2>
              <p>${escapeHtml(sec.subtitle)}</p>
            </div>
            <div class="chapter-overview">
              <strong>Ringkasan Materi:</strong> ${escapeHtml(sec.overview)}
            </div>
            <div class="steps-list">
              ${firstHalf.map((st, idx) => renderStepCardHtml(`${sIdx + 1}.${idx + 1}`, st)).join('')}
            </div>
          </div>
          ${renderRunningFooter(page1)}
        </article>
        <article class="sheet ${getSheetSideClass(page2)}">
          <div class="sheet-top">
            ${renderRunningHeader(`BAB ${sIdx + 1} (Lanjutan) • ${sec.title}`)}
            <div class="chapter-cont-header">
              <span class="chapter-cont-badge">BAB ${sIdx + 1} (LANJUTAN)</span>
              <span class="chapter-cont-title">${escapeHtml(sec.title)}</span>
            </div>
            <div class="steps-list">
              ${secondHalf.map((st, idx) => renderStepCardHtml(`${sIdx + 1}.${idx + 3}`, st)).join('')}
            </div>
            ${
              sec.proTip
                ? `<div class="pro-tip"><strong>Tips Master:</strong> ${escapeHtml(sec.proTip)}</div>`
                : ''
            }
          </div>
          ${renderRunningFooter(page2)}
        </article>`;
      })
      .join('');

    const closingHtml = `
      <article class="sheet ${getSheetSideClass(closingPageNum)}">
        <div class="sheet-top">
          ${renderRunningHeader('Penutup • Kesimpulan & Komitmen')}
          <div class="section-header-center">
            <div class="section-kicker">Halaman Penutup</div>
            <h1 class="section-heading">PENUTUP</h1>
            <div class="heading-rule-center">
              <span class="heading-rule-line"></span>
              <span class="heading-rule-accent"></span>
              <span class="heading-rule-line"></span>
            </div>
          </div>
          ${closingParagraphs.map((p) => `<p class="preface-para">${escapeHtml(p)}</p>`).join('')}
          <div class="purpose-box">
            <h4>Komitmen &amp; Pilar Keberhasilan Operasional</h4>
            ${closingPillars
              .map(
                (item) => `
              <div class="purpose-item">
                <span class="purpose-num">${escapeHtml(item.num)}</span>
                <span><strong>${escapeHtml(item.title)}</strong> — ${escapeHtml(item.text)}</span>
              </div>`
              )
              .join('')}
          </div>
          <div class="quote-box">
            “${escapeHtml(closingQuote)}”
          </div>
          <div class="preface-sign">
            <div>Disusun &amp; Disahkan Oleh,</div>
            <div style="font-weight:700;color:#0f172a;margin-top:2px;">${escapeHtml(authorRole)}</div>
            <div class="preface-sign-line"></div>
            <div style="font-weight:800;color:#059669;font-size:10.5pt;">${escapeHtml(authorName)}</div>
            <div style="font-size:8pt;color:#64748b;">${escapeHtml(brandName)} • Edisi v3.2.0 Pro</div>
          </div>
        </div>
        ${renderRunningFooter(closingPageNum)}
      </article>`;

    const notesHtml = includeNotesPage
      ? `
      <article class="sheet ${getSheetSideClass(appendixBPageNum)}">
        <div class="sheet-top">
          ${renderRunningHeader('Lampiran B • Catatan Lapangan & Paraf')}
          <div class="chapter-header">
            <div class="chapter-badge">LAMPIRAN B</div>
            <h2>Lembar Catatan Lapangan & Paraf Pelatihan</h2>
            <p>Gunakan halaman ini untuk mencatat SOP gudang internal, kontak supplier, atau jadwal cadangan berkala.</p>
          </div>
          <div class="notes-lines">
            ${Array.from({ length: 15 })
              .map(() => '<div class="note-line"></div>')
              .join('')}
          </div>
          <div class="sign-grid">
            <div class="sign-box">
              <div class="sign-role">Diterima Oleh (Staff / Operator)</div>
              <div class="sign-space"></div>
              <div class="sign-label">Nama Lengkap &amp; Tanda Tangan</div>
            </div>
            <div class="sign-box">
              <div class="sign-role">Disahkan Oleh (Supervisor / Admin)</div>
              <div class="sign-space"></div>
              <div class="sign-label">Nama Lengkap &amp; Tanda Tangan</div>
            </div>
          </div>
          <div class="colophon">
            Kolofon: ${escapeHtml(authorRole)}: ${escapeHtml(authorName)} • Format A4 Portrait • ${escapeHtml(brandName)} (v3.2.0 Pro) • ${escapeHtml(printedDate)}
          </div>
        </div>
        ${renderRunningFooter(appendixBPageNum)}
      </article>`
      : '';

    const printHtml = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Buku Panduan ${escapeHtml(brandName)}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 0;
    }
    * { box-sizing: border-box; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
    html, body {
      margin: 0;
      padding: 0;
      font-family: "Segoe UI", system-ui, -apple-system, Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      font-size: 9.8pt;
      line-height: 1.55;
      background: #ffffff;
    }
    .sheet {
      width: 210mm;
      height: 296.8mm;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      background: #ffffff;
      break-after: page;
      page-break-after: always;
      overflow: hidden;
    }
    .sheet:last-child {
      break-after: auto;
      page-break-after: auto;
    }
    .sheet-recto { padding: 15mm 16mm 15mm 24mm; }
    .sheet-verso { padding: 15mm 24mm 15mm 16mm; }
    .cover-sheet {
      padding: 0;
      position: relative;
      height: 297mm;
    }
    .sheet-top { flex: 1; display: flex; flex-direction: column; }

    .sheet-running-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid #cbd5e1;
      padding-bottom: 6px;
      margin-bottom: 13px;
      font-size: 7.5pt;
      color: #64748b;
    }
    .running-brand { font-weight: 700; letter-spacing: 0.04em; color: #475569; }
    .running-section { font-weight: 600; color: #64748b; }

    .sheet-running-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-top: 1px solid #cbd5e1;
      padding-top: 7px;
      margin-top: 10px;
      font-size: 7.8pt;
      color: #64748b;
    }
    .running-doc { font-weight: 500; }
    .running-folio {
      font-weight: 800;
      color: #0f172a;
      font-variant-numeric: tabular-nums;
    }

    /* FULL-PAPER EDGE-TO-EDGE EDITORIAL COVER */
    .cover-shell {
      position: relative;
      width: 100%;
      height: 100%;
      background: #ffffff;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding-left: 18.5mm;
      overflow: hidden;
    }
    .cover-spine-dark {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 16mm;
      background: #0b1322;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cover-spine-text {
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 7.4pt;
      font-weight: 700;
      letter-spacing: 0.22em;
      color: #94a3b8;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .cover-spine-emerald {
      position: absolute;
      left: 16mm;
      top: 0;
      bottom: 0;
      width: 1.7mm;
      background: #10b981;
    }
    .cover-spine-gold {
      position: absolute;
      left: 17.7mm;
      top: 0;
      bottom: 0;
      width: 0.8mm;
      background: #d97706;
    }
    .cover-top {
      background: linear-gradient(180deg, #0f172a 0%, #131e34 100%);
      color: #ffffff;
      padding: 13mm 16mm 11mm;
      border-top: 2.8mm solid #d97706;
      border-bottom: 2mm solid #10b981;
      box-shadow: 0 0.5mm 0 #d97706;
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .cover-crest-wrap {
      padding: 4.5px;
      border: 1.5px solid rgba(16, 185, 129, 0.78);
      border-radius: 15px;
      margin-bottom: 11px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }
    .cover-crest-img {
      width: 58px;
      height: 58px;
      object-fit: contain;
      background: #ffffff;
      border-radius: 11px;
      padding: 4px;
      display: block;
    }
    .cover-crest-mono {
      width: 58px;
      height: 58px;
      border-radius: 11px;
      background: #10b981;
      color: #0f172a;
      font-weight: 900;
      font-size: 27px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .cover-brand {
      font-size: 19.5pt;
      font-weight: 900;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      margin: 0;
    }
    .cover-tagline {
      font-size: 9.5pt;
      color: #a7f3d0;
      margin: 4px 0 0;
      max-width: 132mm;
    }
    .cover-edition-meta {
      margin-top: 11px;
      font-size: 7.5pt;
      letter-spacing: 0.16em;
      color: #cbd5e1;
      text-transform: uppercase;
      font-weight: 700;
    }
    .cover-body-wrap {
      flex: 1;
      padding: 7.5mm 8mm;
      display: flex;
      flex-direction: column;
    }
    .cover-body {
      position: relative;
      border: 1px solid #e2e8f0;
      padding: 10mm 12mm;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      background: #ffffff;
    }
    .cover-corner {
      position: absolute;
      width: 6.5mm;
      height: 6.5mm;
      border-color: #10b981;
      border-style: solid;
      border-width: 0;
    }
    .cover-corner-tl { top: -1px; left: -1px; border-top-width: 2px; border-left-width: 2px; }
    .cover-corner-tr { top: -1px; right: -1px; border-top-width: 2px; border-right-width: 2px; }
    .cover-corner-bl { bottom: -1px; left: -1px; border-bottom-width: 2px; border-left-width: 2px; }
    .cover-corner-br { bottom: -1px; right: -1px; border-bottom-width: 2px; border-right-width: 2px; }
    .cover-kicker {
      font-size: 8.6pt;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.18em;
      text-transform: uppercase;
    }
    .cover-title {
      font-size: 27pt;
      font-weight: 900;
      line-height: 1.16;
      letter-spacing: -0.01em;
      margin: 12px 0 12px;
      color: #0f172a;
      text-wrap: balance;
    }
    .cover-ornament {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 102mm;
      margin: 0 auto 14px;
    }
    .cover-orn-line {
      flex: 1;
      height: 1px;
      background: #cbd5e1;
    }
    .cover-orn-bar {
      width: 24mm;
      height: 3.5px;
      background: #10b981;
      border-radius: 2px;
    }
    .cover-sub {
      font-size: 10pt;
      color: #475569;
      max-width: 140mm;
      margin: 0 auto;
      line-height: 1.62;
      text-align: center;
      text-wrap: balance;
    }
    .cover-scope-grid {
      width: 100%;
      margin-top: 22px;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #10b981;
      border-radius: 7px;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      padding: 9px 0;
    }
    .cover-scope-item {
      padding: 2px 10px;
      text-align: center;
    }
    .cover-scope-item + .cover-scope-item {
      border-left: 1px solid #cbd5e1;
    }
    .cover-scope-label {
      font-size: 7.3pt;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.08em;
      text-transform: uppercase;
    }
    .cover-scope-desc {
      font-size: 8pt;
      color: #334155;
      margin-top: 2px;
      font-weight: 600;
    }
    .cover-author-plaque {
      margin-top: 16px;
      padding: 8px 30px;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #10b981;
      border-radius: 7px;
      background: #ffffff;
      text-align: center;
    }
    .cover-author-role {
      font-size: 7.1pt;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: #64748b;
    }
    .cover-author-name {
      font-size: 11.5pt;
      font-weight: 900;
      color: #0f172a;
      margin-top: 2px;
    }
    .cover-footer {
      padding: 9.5mm 16mm 10.5mm;
      background: #0f172a;
      border-top: 2mm solid #10b981;
      box-shadow: 0 -0.5mm 0 #d97706;
      text-align: center;
      font-size: 8.1pt;
      color: #cbd5e1;
      line-height: 1.5;
    }
    .cover-footer-title {
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.05em;
      margin-bottom: 2px;
    }
    .cover-footer-struct {
      font-weight: 700;
      color: #6ee7b7;
      margin-bottom: 2px;
    }
    .cover-footer-date {
      margin-top: 4px;
      font-size: 7.6pt;
      font-weight: 700;
      color: #94a3b8;
    }

    /* CENTERED SECTION HEADINGS & EDITORIAL RULES */
    .section-header-center {
      text-align: center;
    }
    .section-kicker {
      font-size: 8pt;
      font-weight: 800;
      color: #059669;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      margin: 0 0 4px;
      text-align: center;
    }
    .section-heading {
      font-size: 19pt;
      font-weight: 900;
      margin: 0 0 6px;
      color: #0f172a;
      text-align: center;
      letter-spacing: 0.02em;
    }
    .heading-rule-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      width: 90mm;
      margin: 8px auto 16px;
    }
    .heading-rule-accent { width: 22mm; height: 3.5px; background: #10b981; border-radius: 2px; }
    .heading-rule-line { flex: 1; height: 1px; background: #cbd5e1; }

    /* JUSTIFIED PREFACE PARAGRAPHS WITH FIRST-LINE INDENT */
    .preface-para {
      font-size: 9.8pt;
      color: #1e293b;
      text-align: justify;
      text-justify: inter-word;
      text-indent: 8mm;
      margin: 0 0 9px;
      line-height: 1.62;
    }
    .purpose-box {
      margin: 13px 0;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #10b981;
      border-radius: 8px;
      padding: 12px 16px;
    }
    .purpose-box h4 { margin: 0 0 8px; font-size: 9.6pt; color: #0f172a; }
    .purpose-item {
      display: flex;
      align-items: flex-start;
      gap: 7px;
      margin: 4px 0;
      font-size: 9pt;
      color: #334155;
      line-height: 1.5;
      text-align: justify;
    }
    .purpose-num { font-weight: 700; color: #059669; min-width: 14px; }
    .quote-box {
      margin: 13px 0;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      border-radius: 8px;
      padding: 11px 18px;
      text-align: center;
      font-family: Georgia, "Times New Roman", serif;
      font-style: italic;
      font-size: 9.8pt;
      color: #065f46;
      font-weight: 600;
    }
    .preface-sign {
      margin-top: auto;
      margin-left: auto;
      width: 66mm;
      padding-top: 14px;
      text-align: center;
      font-size: 9.2pt;
      color: #334155;
    }
    .preface-sign-line {
      width: 54mm;
      margin: 32px auto 5px;
      border-bottom: 1px solid #94a3b8;
    }

    .toc-lead { font-size: 8.4pt; color: #64748b; margin: 0 0 2px; text-align: center; }
    .toc-group { border-bottom: 1px solid #e2e8f0; padding: 2.5px 0 3px; }
    .toc-row {
      display: flex;
      align-items: flex-start;
      gap: 9px;
      padding: 1px 0;
    }
    .toc-badge {
      min-width: 78px;
      text-align: center;
      background: #f1f5f9;
      color: #059669;
      font-weight: 800;
      font-size: 6.9pt;
      padding: 2px 6px;
      border-radius: 5px;
      margin-top: 1px;
    }
    .toc-text { flex: 1; min-width: 0; }
    .toc-title-line { display: flex; align-items: baseline; gap: 6px; }
    .toc-item-title { font-size: 8.9pt; font-weight: 700; color: #0f172a; white-space: nowrap; }
    .toc-leader { flex: 1; border-bottom: 1px dotted #94a3b8; margin: 0 4px; }
    .toc-page { font-size: 8.5pt; font-weight: 800; color: #0f172a; font-variant-numeric: tabular-nums; white-space: nowrap; }
    .toc-sub { font-size: 7.2pt; color: #64748b; margin-top: 0.5px; }
    .toc-subitems { margin: 1.5px 0 0.5px 87px; display: flex; flex-direction: column; gap: 1px; }
    .toc-subrow { display: flex; align-items: baseline; gap: 6px; font-size: 7.6pt; color: #334155; }
    .toc-subcode { font-weight: 700; color: #059669; min-width: 24px; font-variant-numeric: tabular-nums; }
    .toc-subtitle { white-space: nowrap; }
    .toc-subleader { flex: 1; border-bottom: 1px dotted #cbd5e1; margin: 0 3px; }
    .toc-subpage { font-weight: 700; color: #475569; font-variant-numeric: tabular-nums; font-size: 7.6pt; }

    .chapter-header {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 3px solid #10b981;
      border-radius: 8px;
      padding: 10px 15px;
      margin-bottom: 9px;
      text-align: center;
    }
    .chapter-badge { font-size: 7.5pt; font-weight: 800; color: #059669; letter-spacing: 0.08em; }
    .chapter-header h2 { margin: 2px 0; font-size: 13pt; color: #0f172a; }
    .chapter-header p { margin: 0; font-size: 8.5pt; color: #475569; }
    .chapter-overview {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-radius: 7px;
      padding: 8px 13px;
      margin-bottom: 9px;
      font-size: 8.4pt;
      color: #334155;
      text-align: justify;
      text-justify: inter-word;
      line-height: 1.48;
    }
    .chapter-cont-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-top: 2.5px solid #10b981;
      border-radius: 7px;
      padding: 7px 13px;
      margin-bottom: 10px;
    }
    .chapter-cont-badge { font-size: 7.5pt; font-weight: 800; color: #059669; letter-spacing: 0.08em; }
    .chapter-cont-title { font-size: 9.5pt; font-weight: 800; color: #0f172a; }
    .steps-list { display: flex; flex-direction: column; gap: 8.5px; }
    .step-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 9.5px 13px;
      background: #ffffff;
    }
    .step-head { display: flex; align-items: center; gap: 8px; margin-bottom: 5px; }
    .step-num {
      min-width: 28px;
      height: 20px;
      padding: 0 6px;
      border-radius: 5px;
      background: #0f172a;
      color: #ffffff;
      font-size: 7.4pt;
      font-weight: 800;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-variant-numeric: tabular-nums;
    }
    .step-head h3 { margin: 0; font-size: 9.8pt; color: #0f172a; }
    .step-desc {
      margin: 0;
      font-size: 8.5pt;
      color: #334155;
      text-align: justify;
      text-justify: inter-word;
      line-height: 1.46;
    }
    .step-details {
      margin: 5px 0 0;
      padding-left: 15px;
      font-size: 8pt;
      color: #1e293b;
      line-height: 1.43;
      text-align: justify;
      text-justify: inter-word;
    }
    .step-details li { margin-bottom: 2px; text-align: justify; text-justify: inter-word; }
    .step-tip {
      margin: 5.5px 0 0;
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
      padding: 5px 10px;
      border-radius: 6px;
      font-size: 7.9pt;
      text-align: justify;
      text-justify: inter-word;
      line-height: 1.42;
    }
    .pro-tip {
      margin-top: 10px;
      background: #fffbeb;
      border: 1px solid #fcd34d;
      color: #92400e;
      padding: 9px 13px;
      border-radius: 8px;
      font-size: 8.5pt;
      text-align: justify;
      line-height: 1.48;
    }
    .faq-box {
      border: 1px solid #e2e8f0;
      background: #f8fafc;
      border-radius: 7px;
      padding: 6.5px 10px;
      margin-bottom: 5px;
    }
    .faq-q { font-weight: 700; font-size: 8.8pt; margin-bottom: 2px; color: #0f172a; }
    .faq-a { font-size: 8.1pt; color: #475569; margin: 0; text-align: justify; text-justify: inter-word; line-height: 1.42; }
    table { width: 100%; border-collapse: collapse; margin-top: 4px; font-size: 8.1pt; }
    th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
    th { background: #0f172a; color: #ffffff; }
    .notes-lines { margin-top: 6px; }
    .note-line { border-bottom: 1px solid #cbd5e1; height: 24px; }
    .sign-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px; }
    .sign-box { border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 8px; padding: 12px; text-align: center; }
    .sign-role { font-size: 8.3pt; font-weight: 700; color: #334155; }
    .sign-space { height: 38px; border-bottom: 1px solid #94a3b8; width: 78%; margin: 0 auto; }
    .sign-label { font-size: 7.4pt; color: #64748b; margin-top: 5px; }
    .colophon { margin-top: auto; padding-top: 10px; text-align: center; font-size: 7.6pt; color: #94a3b8; }
  </style>
</head>
<body>
  <article class="sheet cover-sheet">
    <div class="cover-shell">
      <div class="cover-spine-dark">
        <span class="cover-spine-text">BUKU PANDUAN OPERASIONAL &nbsp;•&nbsp; ${escapeHtml(brandName.toUpperCase())} &nbsp;•&nbsp; v3.2.0 PRO</span>
      </div>
      <div class="cover-spine-emerald"></div>
      <div class="cover-spine-gold"></div>
      <div class="cover-top">
        <div class="cover-crest-wrap">${logoHtml}</div>
        <div class="cover-brand">${escapeHtml(brandName)}</div>
        <div class="cover-tagline">${escapeHtml(brandTagline)}</div>
        <div class="cover-edition-meta">EDISI RESMI v3.2.0 PRO &nbsp;•&nbsp; PEDOMAN STANDAR OPERASIONAL BAKU</div>
      </div>
      <div class="cover-body-wrap">
        <div class="cover-body">
          <span class="cover-corner cover-corner-tl"></span>
          <span class="cover-corner cover-corner-tr"></span>
          <span class="cover-corner cover-corner-bl"></span>
          <span class="cover-corner cover-corner-br"></span>
          <div class="cover-kicker">Manual Pengguna &amp; Prosedur Operasional</div>
          <h1 class="cover-title">BUKU PANDUAN<br />PENGGUNAAN APLIKASI</h1>
          <div class="cover-ornament">
            <span class="cover-orn-line"></span>
            <span class="cover-orn-bar"></span>
            <span class="cover-orn-line"></span>
          </div>
          <p class="cover-sub">
            Panduan komprehensif yang membahas pengenalan sistem, alur kerja harian, pengelolaan Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, Multi-Database, serta penanganan masalah secara praktis dan terstruktur.
          </p>
          <div class="cover-scope-grid">
            <div class="cover-scope-item">
              <div class="cover-scope-label">01 · Pengenalan &amp; Master</div>
              <div class="cover-scope-desc">Arsitektur &amp; Bottom Stock</div>
            </div>
            <div class="cover-scope-item">
              <div class="cover-scope-label">02 · Operasional Harian</div>
              <div class="cover-scope-desc">Daily Report &amp; Barang Datang</div>
            </div>
            <div class="cover-scope-item">
              <div class="cover-scope-label">03 · Sistem &amp; Solusi</div>
              <div class="cover-scope-desc">Cloud, PIN &amp; Troubleshooting</div>
            </div>
          </div>
          <div class="cover-author-plaque">
            <div class="cover-author-role">${escapeHtml(authorRole)}</div>
            <div class="cover-author-name">${escapeHtml(authorName)}</div>
          </div>
        </div>
      </div>
      <div class="cover-footer">
        <div class="cover-footer-title">DITERBITKAN UNTUK TIM OPERASIONAL &amp; GUDANG &nbsp;•&nbsp; ${escapeHtml(brandName.toUpperCase())}</div>
        <div class="cover-footer-struct">Struktur Materi: Pembuka, ${guideSections.length} Bab Inti, Penutup &amp; ${includeNotesPage ? '2 Lampiran' : '1 Lampiran'} &nbsp;•&nbsp; Edisi v3.2.0 Pro</div>
        <div>${escapeHtml(contactLine || 'Dokumen pegangan kerja resmi berukuran A4 Portrait. Dirancang rapi untuk dicetak dan dijilid sebagai buku pedoman operasional.')}</div>
        <div class="cover-footer-date">Tanggal Penerbitan: ${escapeHtml(printedDate)} &nbsp;•&nbsp; Oleh ${escapeHtml(authorName)}</div>
      </div>
    </div>
  </article>

  <article class="sheet ${getSheetSideClass(1)}">
    <div class="sheet-top">
      ${renderRunningHeader('Kata Pengantar')}
      <div class="section-header-center">
        <div class="section-kicker">Halaman Pembuka</div>
        <h1 class="section-heading">KATA PENGANTAR</h1>
        <div class="heading-rule-center">
          <span class="heading-rule-line"></span>
          <span class="heading-rule-accent"></span>
          <span class="heading-rule-line"></span>
        </div>
      </div>
      ${prefaceParagraphs.map((p) => `<p class="preface-para">${escapeHtml(p)}</p>`).join('')}
      <div class="purpose-box">
        <h4>Tujuan Penyusunan Buku Panduan</h4>
        ${prefacePurposes
          .map(
            (item) => `
          <div class="purpose-item">
            <span class="purpose-num">${escapeHtml(item.num)}</span>
            <span>${escapeHtml(item.text)}</span>
          </div>`
          )
          .join('')}
      </div>
      <div class="quote-box">
        “${escapeHtml(prefaceQuote)}”
      </div>
      <div class="preface-sign">
        <div>Diterbitkan pada ${escapeHtml(printedDate)}</div>
        <div style="font-weight:700;color:#0f172a;margin-top:2px;">${escapeHtml(authorRole)}</div>
        <div class="preface-sign-line"></div>
        <div style="font-weight:800;color:#059669;font-size:10.5pt;">${escapeHtml(authorName)}</div>
        <div style="font-size:8pt;color:#64748b;">${escapeHtml(brandName)}</div>
      </div>
    </div>
    ${renderRunningFooter(1)}
  </article>

  <article class="sheet ${getSheetSideClass(2)}">
    <div class="sheet-top">
      ${renderRunningHeader('Daftar Isi • Bagian I')}
      <div class="section-header-center">
        <h1 class="section-heading">DAFTAR ISI</h1>
        <div class="heading-rule-center" style="margin:6px auto 11px;">
          <span class="heading-rule-line"></span>
          <span class="heading-rule-accent"></span>
          <span class="heading-rule-line"></span>
        </div>
      </div>
      ${tocPart1Html}
    </div>
    ${renderRunningFooter(2)}
  </article>

  <article class="sheet ${getSheetSideClass(3)}">
    <div class="sheet-top">
      ${renderRunningHeader('Daftar Isi • Bagian II')}
      ${tocPart2Html}
    </div>
    ${renderRunningFooter(3)}
  </article>

  ${chaptersHtml}

  ${closingHtml}

  <article class="sheet ${getSheetSideClass(appendixAPageNum)}">
    <div class="sheet-top">
      ${renderRunningHeader('Lampiran A • FAQ & Pintasan')}
      <div class="chapter-header" style="background:#0f172a;color:#ffffff;border-color:#0f172a;margin-bottom:8px;">
        <div class="chapter-badge" style="color:#6ee7b7;">LAMPIRAN A</div>
        <h2 style="color:#ffffff;">Tanya Jawab Cepat (FAQ) &amp; Pintasan Keyboard</h2>
        <p style="color:#cbd5e1;">Solusi kendala operasional umum serta daftar tombol pintas keyboard</p>
      </div>
      ${guideFaqs
        .map(
          (faq) => `
        <div class="faq-box">
          <div class="faq-q">T: ${escapeHtml(faq.question)}</div>
          <p class="faq-a">J: ${escapeHtml(faq.answer)}</p>
        </div>`
        )
        .join('')}
      <h3 style="margin:8px 0 4px;font-size:10pt;color:#0f172a;">Pintasan Keyboard &amp; Navigasi Cepat</h3>
      <table>
        <thead>
          <tr>
            <th style="width:155px;">Tombol / Aksi</th>
            <th>Fungsi Operasional</th>
          </tr>
        </thead>
        <tbody>
          ${guideShortcuts
            .map(
              (s) => `
            <tr>
              <td><strong>${escapeHtml(s.keys)}</strong></td>
              <td>${escapeHtml(s.description)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
    </div>
    ${renderRunningFooter(appendixAPageNum)}
  </article>

  ${notesHtml}
</body>
</html>`;

    let iframe = document.getElementById('user-guide-print-iframe') as HTMLIFrameElement | null;
    if (!iframe) {
      iframe = document.createElement('iframe');
      iframe.id = 'user-guide-print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document || iframe.contentDocument;
    if (doc) {
      doc.open();
      doc.write(printHtml);
      doc.close();
      setTimeout(() => {
        try {
          iframe?.contentWindow?.focus();
          iframe?.contentWindow?.print();
        } catch (err) {
          console.error('Iframe print fallback to window.print():', err);
          document.documentElement.setAttribute('data-print-book', 'true');
          window.print();
        }
      }, 300);
    } else {
      document.documentElement.setAttribute('data-print-book', 'true');
      window.print();
    }
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
                type="button"
                onClick={() => setShowPrintBookModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/15 active:scale-95"
                title="Pratinjau & Cetak Buku Panduan Ukuran A4"
              >
                <Printer className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">Cetak / Buku A4</span>
                <span className="sm:hidden">A4</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadBookPdf}
                disabled={isExportingPdf}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl text-xs transition-all border border-white/15 active:scale-95 disabled:opacity-60"
                title="Unduh File PDF Buku Panduan A4"
              >
                <FileDown className="w-3.5 h-3.5 text-emerald-400" />
                <span>{isExportingPdf ? 'Memproses...' : 'PDF A4'}</span>
              </button>

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
            isFullscreen ? "p-3.5 sm:p-5 lg:p-8 space-y-5 lg:space-y-6 pb-24 sm:pb-8" : "p-4 sm:p-5 lg:p-8 space-y-5 lg:space-y-8"
          )}
        >
          {/* Top Header Banner with Lively Animation */}
          <div className="relative bg-gradient-to-br from-theme-800 via-theme-900 to-neutral-900 text-white p-5 sm:p-6 lg:p-10 rounded-3xl overflow-hidden shadow-md">
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

            <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-5">
              <div className="flex items-start gap-3 sm:gap-4 lg:gap-5">
                <motion.div 
                  animate={{ rotate: [0, 8, -6, 0] }}
                  transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shrink-0 shadow-lg"
                >
                  <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 lg:w-8 lg:h-8 text-emerald-300" />
                </motion.div>
                <div>
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-xs font-bold tracking-wide uppercase text-emerald-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Panduan Lengkap & Interaktif
                    </span>
                    <span className="text-white/40">·</span>
                    <span className="text-xs text-white/80 font-medium">ReportPro v3.2.0 Pro</span>
                    <span className="text-white/40">·</span>
                    <span className="text-xs text-emerald-200 font-semibold">Penyusun &amp; Developer: {authorName}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
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
                  type="button"
                  onClick={() => setShowPrintBookModal(true)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white text-neutral-900 hover:bg-emerald-50 active:scale-95 font-bold rounded-xl text-xs transition-all shadow-md whitespace-nowrap"
                  title="Pratinjau & Cetak Buku Panduan Ukuran Kertas A4"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cetak / Bukukan A4</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadBookPdf}
                  disabled={isExportingPdf}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/15 text-xs font-bold whitespace-nowrap disabled:opacity-60"
                  title="Download Buku Panduan Format PDF A4"
                >
                  <FileDown className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{isExportingPdf ? 'Membuat PDF...' : 'PDF Buku A4'}</span>
                </button>

                <button
                  onClick={() => handleStartDemo('queue')}
                  className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-md whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Lihat Demo</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 active:scale-95 text-white rounded-xl transition-all border border-white/10 text-xs font-bold whitespace-nowrap"
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
              filteredSections.map((section, sectionIndex) => {
                const Icon = section.icon;
                const isExpanded = expandedSection === section.id;
                const chapterNum = guideSections.findIndex((g) => g.id === section.id) + 1 || sectionIndex + 1;

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
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-700">
                              BAB {chapterNum}
                            </span>
                            <span className="text-neutral-300">·</span>
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
                          {section.overview && (
                            <div className="p-3.5 rounded-xl bg-slate-100/80 border border-slate-200 text-xs text-slate-700 leading-relaxed text-justify">
                              <strong className="text-slate-900">Ringkasan Materi: </strong>
                              {section.overview}
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {section.steps.map((step, idx) => (
                              <div 
                                key={idx} 
                                className="bg-white p-4 rounded-xl border border-neutral-200/80 shadow-xs flex flex-col justify-between"
                              >
                                <div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="px-2 py-0.5 rounded-full bg-theme-100 text-theme-800 font-bold text-[11px] flex items-center justify-center shrink-0 tabular-nums">
                                      {chapterNum}.{idx + 1}
                                    </span>
                                    <h5 className="font-bold text-xs sm:text-sm text-neutral-900">{step.title}</h5>
                                  </div>
                                  <p className="text-xs text-neutral-600 leading-relaxed font-normal text-justify">
                                    {step.description}
                                  </p>
                                  {step.details && step.details.length > 0 && (
                                    <ul className="mt-2.5 pl-4 list-disc space-y-1 text-[11.5px] text-neutral-700 leading-relaxed text-justify">
                                      {step.details.map((detail, dIdx) => (
                                        <li key={dIdx}>{detail}</li>
                                      ))}
                                    </ul>
                                  )}
                                </div>
                                {step.tip && (
                                  <div className="mt-3 p-2.5 rounded-lg bg-emerald-50/80 border border-emerald-100 text-[11px] text-emerald-800 flex items-start gap-1.5 text-justify">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{step.tip}</span>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>

                          {/* Pro Tip Callout Box */}
                          {section.proTip && (
                            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5 text-justify">
                              <Zap className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                              <div className="leading-relaxed">
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
                                  if (section.category === 'intro') onNavigateTab('dashboard');
                                  else if (section.category === 'report') onNavigateTab('report');
                                  else if (section.category === 'arrived') onNavigateTab('arrived');
                                  else if (section.category === 'stock') onNavigateTab('kosong');
                                  else if (section.category === 'quickstart') onNavigateTab('master');
                                  else if (section.category === 'database' || section.category === 'troubleshooting') onNavigateTab('settings');
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

          {/* Quick FAQ / Penanganan Masalah Penting */}
          <div className="bg-theme-50/80 rounded-2xl border border-theme-200 p-5 sm:p-6">
            <h4 className="font-bold text-sm text-theme-900 mb-3 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-theme-600" />
              Tanya Jawab Cepat &amp; Penanganan Masalah Lazim
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-neutral-600">
              {guideFaqs.map((faq, idx) => (
                <div key={idx} className="bg-white p-3.5 rounded-xl border border-theme-100">
                  <p className="font-bold text-neutral-900 mb-1">T: {faq.question}</p>
                  <p className="leading-relaxed text-justify">J: {faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Halaman Penutup Materi (Closing & Komitmen Operasional) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-theme-900 text-white px-5 sm:px-7 py-5 border-b-2 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-emerald-300">
                  Halaman Penutup
                </p>
                <h4 className="text-lg sm:text-xl font-black tracking-tight mt-0.5">
                  Penutup &amp; Komitmen Operasional
                </h4>
              </div>
              <div className="px-3.5 py-2 rounded-xl bg-white/10 border border-white/15 text-xs">
                <span className="text-slate-300 block text-[10px] uppercase tracking-wider">{authorRole}</span>
                <span className="font-bold text-white">{authorName} · {brandTitleForPreface}</span>
              </div>
            </div>

            <div className="p-5 sm:p-7 space-y-5">
              <div className="space-y-3 text-xs sm:text-[13px] text-slate-700 leading-relaxed text-justify">
                {closingParagraphs.map((para, idx) => (
                  <p key={idx} className="indent-6">{para}</p>
                ))}
              </div>

              <div className="bg-slate-50 border border-slate-200 border-t-2 border-t-emerald-500 rounded-2xl p-4 sm:p-5">
                <h5 className="text-xs sm:text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Komitmen &amp; Pilar Keberhasilan Operasional</span>
                </h5>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {closingPillars.map((pillar, idx) => (
                    <div key={idx} className="bg-white p-3 rounded-xl border border-slate-200/80 flex items-start gap-2.5">
                      <span className="font-extrabold text-emerald-700 shrink-0 tabular-nums">{pillar.num}</span>
                      <div className="text-justify leading-relaxed">
                        <p className="font-bold text-slate-900">{pillar.title}</p>
                        <p className="text-slate-600 mt-0.5">{pillar.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-center">
                <p className="font-serif italic font-semibold text-xs sm:text-sm text-emerald-900">
                  “{closingQuote}”
                </p>
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
              onClick={() => setShowPrintBookModal(true)}
              className="py-2.5 px-3 bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-50 active:scale-[0.98] rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shrink-0 mr-2"
              title="Cetak Buku Panduan A4"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600" />
              <span>A4</span>
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

      {/* A4 BOOK PRINT PREVIEW MODAL */}
      {showPrintBookModal &&
        createPortal(
          <div className="fixed inset-0 z-[260] bg-neutral-950/85 backdrop-blur-md flex flex-col overflow-hidden no-print">
            {/* Modal Top Toolbar */}
            <div className="bg-neutral-900 text-white border-b border-neutral-800 px-3 sm:px-6 py-3 flex flex-col lg:flex-row lg:items-center justify-between gap-3 shrink-0 shadow-lg">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300 shrink-0">
                    <BookMarked className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-black text-white truncate">
                        Pratinjau Buku Panduan Cetak & Jilid
                      </h3>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                        Kertas A4 • {totalBookPages} Halaman
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      Lengkap dengan Halaman Sampul, Kata Pengantar, Daftar Isi bernomor halaman, seluruh Bab, Penutup, FAQ, Pintasan &amp; Lembar Catatan
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowPrintBookModal(false)}
                  className="lg:hidden p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Binding & Print Controls */}
              <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
                <div className="flex items-center gap-1 bg-white/10 p-1 rounded-xl border border-white/10 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setBindingMode('standard')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap',
                      bindingMode === 'standard'
                        ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                        : 'text-neutral-300 hover:text-white'
                    )}
                  >
                    Jilid Kiri (1 Sisi)
                  </button>
                  <button
                    type="button"
                    onClick={() => setBindingMode('mirrored')}
                    className={cn(
                      'px-2.5 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap',
                      bindingMode === 'mirrored'
                        ? 'bg-emerald-500 text-neutral-950 shadow-xs'
                        : 'text-neutral-300 hover:text-white'
                    )}
                  >
                    Timbal-Balik (Buku Cermin)
                  </button>
                </div>

                <label className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] text-neutral-200 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={includeNotesPage}
                    onChange={(e) => setIncludeNotesPage(e.target.checked)}
                    className="rounded border-white/30 text-emerald-500 focus:ring-emerald-400"
                  />
                  <span>Lembar Catatan</span>
                </label>

                <button
                  type="button"
                  onClick={handleDownloadBookPdf}
                  disabled={isExportingPdf}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95 disabled:opacity-60"
                >
                  <FileDown className="w-3.5 h-3.5" />
                  <span>{isExportingPdf ? 'Membuat PDF...' : 'Download PDF A4'}</span>
                </button>

                <button
                  type="button"
                  onClick={handlePrintBookA4}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-white text-neutral-900 hover:bg-neutral-100 font-bold rounded-xl text-xs transition-all shadow-sm active:scale-95"
                >
                  <Printer className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Cetak A4 Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowPrintBookModal(false)}
                  className="hidden lg:flex p-2 rounded-xl bg-white/10 hover:bg-white/20 text-neutral-300 hover:text-white transition-colors"
                  title="Tutup Pratinjau (Esc)"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable A4 Paper Preview Area */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-8 bg-neutral-800/90">
              {/* SHEET 1: FULL-PAPER COVER PAGE */}
              <div className="mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300 p-0 overflow-hidden">
                <div className="relative flex-1 flex flex-col justify-between bg-white pl-5 sm:pl-[18.5mm]">
                  {/* Full-bleed Left Architectural Binding Spine */}
                  <div className="hidden sm:flex absolute left-0 top-0 bottom-0 w-[16mm] bg-[#0b1322] items-center justify-center">
                    <span
                      className="text-[7.5pt] font-bold tracking-[0.22em] text-slate-400 uppercase whitespace-nowrap"
                      style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                    >
                      BUKU PANDUAN OPERASIONAL &nbsp;•&nbsp; {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()} &nbsp;•&nbsp; v3.2.0 PRO
                    </span>
                  </div>
                  <div className="sm:hidden absolute left-0 top-0 bottom-0 w-3.5 bg-[#0b1322]" />
                  <div className="absolute left-3.5 sm:left-[16mm] top-0 bottom-0 w-1 sm:w-[1.7mm] bg-emerald-500" />
                  <div className="absolute left-[18px] sm:left-[17.7mm] top-0 bottom-0 w-0.5 sm:w-[0.8mm] bg-amber-600" />

                  {/* Full-bleed Upper Midnight Slate Masthead */}
                  <div className="bg-gradient-to-b from-slate-900 to-[#131e34] text-white px-6 sm:px-[16mm] pt-8 sm:pt-[13mm] pb-7 sm:pb-[11mm] border-t-[10px] border-t-amber-600 border-b-[7px] border-b-emerald-500 shadow-[0_2px_0_#d97706] flex flex-col items-center text-center">
                    <div className="p-1 border border-emerald-500/80 rounded-[15px] mb-3 inline-flex items-center justify-center">
                      {companyProfile.icon && companyProfile.icon.startsWith('data:image/') ? (
                        <img
                          src={companyProfile.icon}
                          alt="Logo"
                          className="w-14 h-14 object-contain bg-white rounded-[11px] p-1"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-[11px] bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center">
                          {(companyProfile.name?.trim() || 'ReportPro').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <h4 className="text-xl sm:text-2xl font-black tracking-widest uppercase">
                      {companyProfile.name?.trim() || 'ReportPro'}
                    </h4>
                    <p className="text-xs text-emerald-300 font-medium mt-1 max-w-md">
                      {companyProfile.tagline?.trim() || 'Sistem Manajemen Stok, Laporan Harian & Gudang'}
                    </p>
                    <p className="text-[10px] tracking-[0.18em] text-slate-300 uppercase font-bold mt-3">
                      EDISI RESMI v3.2.0 PRO &nbsp;•&nbsp; PEDOMAN STANDAR OPERASIONAL BAKU
                    </p>
                  </div>

                  {/* Architectural Corner-Bracketed Center Field */}
                  <div className="flex-1 p-5 sm:px-[8mm] sm:py-[7.5mm] flex flex-col">
                    <div className="relative border border-slate-200 px-5 sm:px-[12mm] py-8 sm:py-[10mm] flex-1 flex flex-col items-center justify-center text-center bg-white">
                      <span className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-500" />
                      <span className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-500" />
                      <span className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-500" />
                      <span className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-500" />

                      <p className="text-[11px] font-extrabold text-emerald-700 tracking-[0.2em] uppercase">
                        Manual Pengguna &amp; Prosedur Operasional
                      </p>
                      <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight mt-3 text-balance">
                        BUKU PANDUAN<br />PENGGUNAAN APLIKASI
                      </h1>
                      <div className="flex items-center justify-center gap-2 w-72 my-4">
                        <div className="flex-1 h-px bg-slate-300" />
                        <div className="w-24 h-1 bg-emerald-500 rounded-full" />
                        <div className="flex-1 h-px bg-slate-300" />
                      </div>
                      <p className="text-sm text-slate-600 leading-relaxed max-w-lg text-center text-balance">
                        Panduan komprehensif yang membahas pengenalan sistem, alur kerja harian, pengelolaan Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, Multi-Database, serta penanganan masalah secara praktis dan terstruktur.
                      </p>

                      <div className="w-full mt-7 bg-slate-50 border border-slate-300 border-t-[3px] border-t-emerald-500 rounded-lg grid grid-cols-3 py-2.5 text-center">
                        <div className="px-2">
                          <p className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">01 · Pengenalan &amp; Master</p>
                          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">Arsitektur &amp; Bottom Stock</p>
                        </div>
                        <div className="px-2 border-l border-slate-300">
                          <p className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">02 · Operasional Harian</p>
                          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">Daily Report &amp; Barang Datang</p>
                        </div>
                        <div className="px-2 border-l border-slate-300">
                          <p className="text-[10px] font-extrabold text-emerald-700 tracking-wider uppercase">03 · Sistem &amp; Solusi</p>
                          <p className="text-[11px] font-semibold text-slate-700 mt-0.5">Cloud, PIN &amp; Troubleshooting</p>
                        </div>
                      </div>

                      <div className="mt-5 px-7 py-2 rounded-lg bg-white border border-slate-300 border-t-[3px] border-t-emerald-500">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                          {authorRole}
                        </p>
                        <p className="text-sm font-black text-slate-900 mt-0.5">{authorName}</p>
                      </div>
                    </div>
                  </div>

                  {/* Full-bleed Bottom Dark Slate Imprint Footer */}
                  <div className="px-6 sm:px-[16mm] py-6 sm:py-[9.5mm] bg-slate-900 border-t-[7px] border-t-emerald-500 shadow-[0_-2px_0_#d97706] text-center text-xs text-slate-300">
                    <p className="font-extrabold text-white tracking-wider mb-0.5">
                      DITERBITKAN UNTUK TIM OPERASIONAL &amp; GUDANG &nbsp;•&nbsp; {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}
                    </p>
                    <p className="font-bold text-emerald-300 text-[11px] mb-1">
                      Struktur Materi: Pembuka, {guideSections.length} Bab Inti, Penutup &amp; {includeNotesPage ? '2 Lampiran' : '1 Lampiran'} &nbsp;•&nbsp; Edisi v3.2.0 Pro
                    </p>
                    <p>
                      {[
                        companyProfile.address?.trim(),
                        companyProfile.phone?.trim() ? `Telp: ${companyProfile.phone.trim()}` : '',
                        companyProfile.email?.trim()
                      ]
                        .filter(Boolean)
                        .join(' • ') ||
                        'Dokumen pegangan kerja resmi berukuran A4 Portrait. Dirancang rapi untuk dicetak dan dijilid sebagai buku pedoman operasional.'}
                    </p>
                    <p className="text-[10px] font-bold text-slate-400 mt-1.5">
                      Tanggal Penerbitan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;•&nbsp; Oleh {authorName}
                    </p>
                  </div>
                </div>
              </div>

              {/* SHEET 2: KATA PENGANTAR (PREFACE - HALAMAN 1) */}
              <div
                className={cn(
                  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                  'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-7">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Kata Pengantar</span>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-[0.16em]">Halaman Pembuka</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">KATA PENGANTAR</h2>
                    <div className="flex items-center justify-center gap-2 w-72 mx-auto mt-2 mb-6">
                      <div className="flex-1 h-px bg-slate-200" />
                      <div className="w-16 h-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-3.5 text-[13px] text-slate-800 leading-relaxed text-justify">
                    {prefaceParagraphs.map((para, idx) => (
                      <p key={idx} className="indent-[8mm]">{para}</p>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-300 border-t-2 border-t-emerald-500">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Tujuan Penyusunan Buku Panduan</h4>
                    <div className="space-y-1.5 text-xs text-slate-700 text-justify">
                      {prefacePurposes.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-emerald-700 shrink-0">{item.num}</span>
                          <span>{item.text}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-serif italic font-semibold text-emerald-900">
                    “{prefaceQuote}”
                  </div>

                  <div className="mt-8 ml-auto w-64 text-center text-xs text-slate-700">
                    <p>
                      Diterbitkan pada{' '}
                      {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                    <p className="font-bold text-slate-900 mt-0.5">{authorRole}</p>
                    <div className="w-44 h-11 border-b border-slate-400 mx-auto" />
                    <p className="font-black text-slate-900 mt-1.5">{authorName}</p>
                    <p className="font-bold text-emerald-700 text-[11px]">{brandTitleForPreface}</p>
                  </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">Halaman 1 dari {totalBookPages}</span>
                </div>
              </div>

              {/* SHEET 3: TABLE OF CONTENTS PART I (HALAMAN 2) */}
              <div
                className={cn(
                  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                  bindingMode === 'mirrored'
                    ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                    : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-5">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Daftar Isi (Bagian I)</span>
                  </div>

                  <div className="text-center">
                    <h2 className="text-2xl font-black text-slate-900">DAFTAR ISI</h2>
                    <div className="flex items-center justify-center gap-2 w-72 mx-auto mt-3 mb-5">
                      <div className="flex-1 h-px bg-slate-200" />
                      <div className="w-16 h-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>

                  <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                    <div className="py-2">
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                          PEMBUKA
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 shrink-0">Kata Pengantar</p>
                            <div className="flex-1 border-b border-dotted border-slate-300" />
                            <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. 1</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Sambutan {authorName} ({authorRole}), tujuan pedoman operasional, dan ruang lingkup buku panduan
                          </p>
                          <div className="mt-1.5 pl-2.5 border-l-2 border-slate-200 space-y-1 text-[10.5px] text-slate-700">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">0.1</span>
                              <span className="truncate">Sambutan Penyusun &amp; Gambaran Umum Pedoman</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. 1</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">0.2</span>
                              <span className="truncate">Tujuan Penyusunan &amp; Harapan Penerapan Sistem</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. 1</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {guideSections.slice(0, 4).map((sec, idx) => {
                      const p1 = 4 + idx * 2;
                      const p2 = p1 + 1;
                      return (
                        <div key={sec.id} className="py-2">
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                              BAB {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{sec.title}</p>
                                <div className="flex-1 border-b border-dotted border-slate-300" />
                                <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. {p1}–{p2}</span>
                              </div>
                              <p className="text-[10.5px] text-slate-500 mt-0.5">{sec.subtitle}</p>
                              <div className="mt-1.5 pl-2.5 border-l-2 border-slate-200 space-y-1">
                                {sec.steps.map((st, stIdx) => (
                                  <div key={stIdx} className="flex items-baseline gap-1.5 text-[10.5px] text-slate-700">
                                    <span className="font-bold text-emerald-700 shrink-0 tabular-nums">{idx + 1}.{stIdx + 1}</span>
                                    <span className="truncate">{st.title}</span>
                                    <div className="flex-1 border-b border-dotted border-slate-200" />
                                    <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {stIdx < 2 ? p1 : p2}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">Halaman 2 dari {totalBookPages}</span>
                </div>
              </div>

              {/* SHEET 4: TABLE OF CONTENTS PART II (HALAMAN 3) */}
              <div
                className={cn(
                  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                  'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-5">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Daftar Isi (Bagian II)</span>
                  </div>

                  <div className="divide-y divide-slate-200 border-t border-b border-slate-200">
                    {guideSections.slice(4).map((sec, offset) => {
                      const idx = 4 + offset;
                      const p1 = 4 + idx * 2;
                      const p2 = p1 + 1;
                      return (
                        <div key={sec.id} className="py-1.5">
                          <div className="flex items-start gap-3">
                            <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                              BAB {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-baseline gap-2">
                                <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">{sec.title}</p>
                                <div className="flex-1 border-b border-dotted border-slate-300" />
                                <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. {p1}–{p2}</span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5">{sec.subtitle}</p>
                              <div className="mt-1 pl-2.5 border-l-2 border-slate-200 space-y-0.5">
                                {sec.steps.map((st, stIdx) => (
                                  <div key={stIdx} className="flex items-baseline gap-1.5 text-[10px] text-slate-700">
                                    <span className="font-bold text-emerald-700 shrink-0 tabular-nums">{idx + 1}.{stIdx + 1}</span>
                                    <span className="truncate">{st.title}</span>
                                    <div className="flex-1 border-b border-dotted border-slate-200" />
                                    <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {stIdx < 2 ? p1 : p2}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <div className="py-1.5">
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                          PENUTUP
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Penutup</p>
                            <div className="flex-1 border-b border-dotted border-slate-300" />
                            <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. {closingPageNum}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5">
                            Kesimpulan operasional, komitmen tim, pemeliharaan data, dan pengesahan
                          </p>
                          <div className="mt-1 pl-2.5 border-l-2 border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">P.1</span>
                              <span>Ringkasan Akhir &amp; Pilar Keberhasilan Operasional</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {closingPageNum}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">P.2</span>
                              <span>Pemeliharaan Sistem, Dukungan &amp; Pengesahan Penyusun</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {closingPageNum}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="py-2">
                      <div className="flex items-start gap-3">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                          LAMPIRAN A
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2">
                            <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Tanya Jawab Cepat (FAQ) &amp; Pintasan Keyboard</p>
                            <div className="flex-1 border-b border-dotted border-slate-300" />
                            <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. {appendixAPageNum}</span>
                          </div>
                          <p className="text-[10.5px] text-slate-500 mt-0.5">
                            Solusi kendala operasional umum dan daftar tombol pintas aplikasi
                          </p>
                          <div className="mt-1.5 pl-2.5 border-l-2 border-slate-200 space-y-1 text-[10.5px] text-slate-700">
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">A.1</span>
                              <span>Tanya Jawab Operasional &amp; Kendala Umum (FAQ)</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {appendixAPageNum}</span>
                            </div>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-bold text-emerald-700 shrink-0 tabular-nums">A.2</span>
                              <span>Tabel Pintasan Keyboard &amp; Navigasi Cepat</span>
                              <div className="flex-1 border-b border-dotted border-slate-200" />
                              <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {appendixAPageNum}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {includeNotesPage && (
                      <div className="py-2">
                        <div className="flex items-start gap-3">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-emerald-700 font-extrabold text-[10px] shrink-0 min-w-[74px] text-center">
                            LAMPIRAN B
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline gap-2">
                              <p className="text-xs sm:text-sm font-bold text-slate-900 truncate">Lembar Catatan Lapangan &amp; Paraf Pelatihan</p>
                              <div className="flex-1 border-b border-dotted border-slate-300" />
                              <span className="text-xs font-extrabold text-slate-800 shrink-0 tabular-nums">Hal. {appendixBPageNum}</span>
                            </div>
                            <p className="text-[10.5px] text-slate-500 mt-0.5">
                              Halaman catatan fisik tim operasional, pengesahan &amp; kolofon penerbitan
                            </p>
                            <div className="mt-1.5 pl-2.5 border-l-2 border-slate-200 space-y-1 text-[10.5px] text-slate-700">
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-emerald-700 shrink-0 tabular-nums">B.1</span>
                                <span>Kolom Catatan SOP Internal &amp; Daftar Kontak Penting</span>
                                <div className="flex-1 border-b border-dotted border-slate-200" />
                                <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {appendixBPageNum}</span>
                              </div>
                              <div className="flex items-baseline gap-1.5">
                                <span className="font-bold text-emerald-700 shrink-0 tabular-nums">B.2</span>
                                <span>Lembar Paraf Pengesahan Pelatihan &amp; Kolofon Penerbitan</span>
                                <div className="flex-1 border-b border-dotted border-slate-200" />
                                <span className="font-semibold text-slate-600 shrink-0 tabular-nums">Hal. {appendixBPageNum}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">Halaman 3 dari {totalBookPages}</span>
                </div>
              </div>

              {/* CHAPTER SHEETS (2 A4 SHEETS PER CHAPTER) */}
              {guideSections.map((sec, sIdx) => {
                const page1 = 4 + sIdx * 2;
                const page2 = page1 + 1;
                const firstHalf = sec.steps.slice(0, 2);
                const secondHalf = sec.steps.slice(2);
                return (
                  <React.Fragment key={sec.id}>
                    {/* Sheet A: Overview + Sub-Bab X.1 & X.2 */}
                    <div
                      className={cn(
                        'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                        bindingMode === 'mirrored' && page1 % 2 === 0
                          ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                          : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-4">
                          <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                          <span>BAB {sIdx + 1} • {sec.title}</span>
                        </div>

                        <div className="bg-slate-50 border border-slate-300 border-t-2 border-t-emerald-500 rounded-xl p-3.5 mb-3.5 text-center">
                          <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">
                            BAB {sIdx + 1} • {sec.steps.length} Sub-Bab Penjelasan • Halaman {page1}–{page2}
                          </span>
                          <h3 className="text-lg font-black text-slate-900 mt-0.5">{sec.title}</h3>
                          <p className="text-xs text-slate-600 mt-0.5">{sec.subtitle}</p>
                        </div>

                        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 mb-4 text-xs text-slate-700 leading-relaxed text-justify">
                          <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 mb-1">
                            Ringkasan Materi
                          </p>
                          <p>{sec.overview}</p>
                        </div>

                        <div className="space-y-3">
                          {firstHalf.map((st, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-white">
                              <div className="flex items-center gap-2.5 mb-1.5">
                                <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shrink-0 tabular-nums">
                                  {sIdx + 1}.{idx + 1}
                                </span>
                                <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.title}</h4>
                              </div>
                              <p className="text-xs text-slate-700 leading-relaxed text-justify">{st.description}</p>
                              {st.details && st.details.length > 0 && (
                                <ul className="mt-2 space-y-1 pl-4 list-disc text-[11px] text-slate-700 leading-relaxed text-justify">
                                  {st.details.map((detail, dIdx) => (
                                    <li key={dIdx}>{detail}</li>
                                  ))}
                                </ul>
                              )}
                              {st.tip && (
                                <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 text-justify">
                                  <strong>Tips Lapangan:</strong> {st.tip}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                        <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          Halaman {page1} dari {totalBookPages}
                        </span>
                      </div>
                    </div>

                    {/* Sheet B: Continuation + Sub-Bab X.3 & X.4 + Tips Master */}
                    <div
                      className={cn(
                        'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                        bindingMode === 'mirrored' && page2 % 2 === 0
                          ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                          : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                      )}
                    >
                      <div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-4">
                          <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                          <span>BAB {sIdx + 1} (Lanjutan) • {sec.title}</span>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 border-l-4 border-l-emerald-500 rounded-lg px-3.5 py-2 mb-4">
                          <span className="text-xs font-extrabold text-slate-800">
                            BAB {sIdx + 1} (Lanjutan) — {sec.title}
                          </span>
                          <span className="text-[10px] font-bold text-emerald-700 uppercase">
                            Sub-Bab {sIdx + 1}.3 – {sIdx + 1}.{sec.steps.length}
                          </span>
                        </div>

                        <div className="space-y-3">
                          {secondHalf.map((st, idx) => {
                            const subNum = 2 + idx + 1;
                            return (
                              <div key={subNum} className="border border-slate-200 rounded-xl p-3.5 bg-white">
                                <div className="flex items-center gap-2.5 mb-1.5">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white text-[10px] font-bold shrink-0 tabular-nums">
                                    {sIdx + 1}.{subNum}
                                  </span>
                                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">{st.title}</h4>
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed text-justify">{st.description}</p>
                                {st.details && st.details.length > 0 && (
                                  <ul className="mt-2 space-y-1 pl-4 list-disc text-[11px] text-slate-700 leading-relaxed text-justify">
                                    {st.details.map((detail, dIdx) => (
                                      <li key={dIdx}>{detail}</li>
                                    ))}
                                  </ul>
                                )}
                                {st.tip && (
                                  <div className="mt-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-[11px] text-emerald-900 text-justify">
                                    <strong>Tips Lapangan:</strong> {st.tip}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {sec.proTip && (
                          <div className="mt-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 text-justify leading-relaxed">
                            <strong>Tips Master Bab {sIdx + 1}:</strong> {sec.proTip}
                          </div>
                        )}
                      </div>

                      <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                        <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                        <span className="font-bold text-slate-800 tabular-nums">
                          Halaman {page2} dari {totalBookPages}
                        </span>
                      </div>
                    </div>
                  </React.Fragment>
                );
              })}

              {/* PENUTUP SHEET */}
              <div
                className={cn(
                  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                  bindingMode === 'mirrored' && closingPageNum % 2 === 0
                    ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                    : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-7">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Penutup • Kesimpulan &amp; Komitmen</span>
                  </div>

                  <div className="text-center">
                    <p className="text-[11px] font-extrabold text-emerald-700 uppercase tracking-[0.16em]">Halaman Penutup</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">PENUTUP</h2>
                    <div className="flex items-center justify-center gap-2 w-72 mx-auto mt-2 mb-6">
                      <div className="flex-1 h-px bg-slate-200" />
                      <div className="w-16 h-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 h-px bg-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-3.5 text-[13px] text-slate-800 leading-relaxed text-justify">
                    {closingParagraphs.map((para, idx) => (
                      <p key={idx} className="indent-[8mm]">{para}</p>
                    ))}
                  </div>

                  <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-300 border-t-2 border-t-emerald-500">
                    <h4 className="text-xs font-bold text-slate-900 mb-2">Komitmen &amp; Pilar Keberhasilan Operasional</h4>
                    <div className="space-y-1.5 text-xs text-slate-700 text-justify">
                      {closingPillars.map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <span className="font-bold text-emerald-700 shrink-0">{item.num}</span>
                          <span>
                            <strong className="text-slate-900">{item.title}</strong> — {item.text}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-center text-xs font-serif italic font-semibold text-emerald-900">
                    “{closingQuote}”
                  </div>

                  <div className="mt-8 ml-auto w-64 text-center text-xs text-slate-700">
                    <p>Disusun &amp; Disahkan Oleh,</p>
                    <p className="font-bold text-slate-900 mt-0.5">{authorRole}</p>
                    <div className="w-44 h-11 border-b border-slate-400 mx-auto" />
                    <p className="font-black text-slate-900 mt-1.5">{authorName}</p>
                    <p className="font-bold text-emerald-700 text-[11px]">{brandTitleForPreface} • Edisi v3.2.0 Pro</p>
                  </div>
                </div>

                <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">Halaman {closingPageNum} dari {totalBookPages}</span>
                </div>
              </div>

              {/* APPENDIX A SHEET */}
              <div
                className={cn(
                  'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                  bindingMode === 'mirrored' && appendixAPageNum % 2 === 0
                    ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                    : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                )}
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-4">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Lampiran A • FAQ &amp; Pintasan</span>
                  </div>

                  <div className="bg-slate-900 text-white rounded-xl p-3.5 mb-4 text-center">
                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider">LAMPIRAN A</span>
                    <h3 className="text-lg font-black mt-0.5">Tanya Jawab Cepat (FAQ) &amp; Pintasan Keyboard</h3>
                    <p className="text-xs text-slate-300 mt-0.5">Solusi kendala operasional umum serta daftar tombol pintas keyboard</p>
                  </div>

                  <div className="space-y-2 mb-4">
                    {guideFaqs.map((faq, idx) => (
                      <div key={idx} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px]">
                        <p className="font-bold text-slate-900 mb-0.5">T: {faq.question}</p>
                        <p className="text-slate-600 text-justify leading-relaxed">J: {faq.answer}</p>
                      </div>
                    ))}
                  </div>

                  <h4 className="text-xs font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-emerald-600" />
                    <span>A.2 Daftar Pintasan Keyboard &amp; Navigasi Cepat</span>
                  </h4>
                  <table className="w-full text-[11px] border-collapse border border-slate-300">
                    <thead>
                      <tr className="bg-slate-900 text-white">
                        <th className="p-1.5 text-left border border-slate-300 w-44">Tombol / Aksi</th>
                        <th className="p-1.5 text-left border border-slate-300">Fungsi Operasional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {guideShortcuts.map((s, idx) => (
                        <tr key={idx} className="odd:bg-white even:bg-slate-50">
                          <td className="p-1.5 border border-slate-300 font-bold text-slate-900">{s.keys}</td>
                          <td className="p-1.5 border border-slate-300 text-slate-700">{s.description}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-5 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">
                    Halaman {appendixAPageNum} dari {totalBookPages}
                  </span>
                </div>
              </div>

              {/* APPENDIX B SHEET (NOTES & COLOPHON) */}
              {includeNotesPage && (
                <div
                  className={cn(
                    'mx-auto w-full max-w-[210mm] min-h-[297mm] bg-white text-neutral-900 shadow-2xl rounded-sm relative flex flex-col justify-between border border-neutral-300',
                    bindingMode === 'mirrored' && appendixBPageNum % 2 === 0
                      ? 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pr-[24mm] sm:pl-[16mm]'
                      : 'p-5 sm:pt-[15mm] sm:pb-[15mm] sm:pl-[24mm] sm:pr-[16mm]'
                  )}
                >
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-slate-400 border-b border-slate-200 pb-2 mb-5">
                      <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                      <span>Lampiran B • Catatan Lapangan</span>
                    </div>

                    <div className="text-center mb-4">
                      <span className="text-[10px] font-extrabold text-emerald-700 uppercase tracking-wider">LAMPIRAN B</span>
                      <h3 className="text-lg font-black text-slate-900">Catatan Lapangan, Paraf Pelatihan &amp; Kolofon</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Gunakan halaman ini untuk mencatat prosedur khusus gudang, daftar kontak supplier, atau jadwal cadangan berkala.
                      </p>
                    </div>

                    <div className="space-y-6 my-4">
                      {Array.from({ length: 13 }).map((_, idx) => (
                        <div key={idx} className="border-b border-slate-300 h-3" />
                      ))}
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="border border-slate-300 bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-700">Diterima Oleh (Staff / Operator)</p>
                        <div className="w-4/5 mx-auto h-11 border-b border-slate-400" />
                        <p className="text-[10px] text-slate-500 mt-1.5">Nama Lengkap &amp; Tanda Tangan</p>
                      </div>
                      <div className="border border-slate-300 bg-slate-50 rounded-xl p-3 text-center">
                        <p className="text-[11px] font-bold text-slate-700">Disahkan Oleh (Supervisor / Admin)</p>
                        <div className="w-4/5 mx-auto h-11 border-b border-slate-400" />
                        <p className="text-[10px] text-slate-500 mt-1.5">Nama Lengkap &amp; Tanda Tangan</p>
                      </div>
                    </div>

                    <div className="mt-5 p-3 rounded-xl bg-slate-900 text-white text-center text-[11px]">
                      <p className="font-bold text-emerald-300 uppercase tracking-wider text-[10px]">Identitas Penyusunan Dokumen</p>
                      <p className="mt-0.5">
                        <strong>{authorRole}:</strong> {authorName} &nbsp;•&nbsp; Aplikasi {(companyProfile.name?.trim() || 'ReportPro')} v3.2.0 Pro
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-2 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                    <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                    <span className="font-bold text-slate-800 tabular-nums">
                      Halaman {appendixBPageNum} dari {totalBookPages}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* FALLBACK HIDDEN PRINT PORTAL FOR DIRECT CTRL+P WHEN BOOK PREVIEW IS OPEN */}
      {showPrintBookModal &&
        createPortal(
          <div id="user-guide-book-print-portal" className="hidden print:block text-black bg-white">
            <div className="book-print-sheet p-0 overflow-hidden">
              <div className="relative flex-1 flex flex-col justify-between bg-white pl-[18.5mm] h-full">
                <div className="absolute left-0 top-0 bottom-0 w-[16mm] bg-[#0b1322] flex items-center justify-center">
                  <span
                    className="text-[7.5pt] font-bold tracking-[0.22em] text-slate-400 uppercase whitespace-nowrap"
                    style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
                  >
                    BUKU PANDUAN OPERASIONAL &nbsp;•&nbsp; {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()} &nbsp;•&nbsp; v3.2.0 PRO
                  </span>
                </div>
                <div className="absolute left-[16mm] top-0 bottom-0 w-[1.7mm] bg-emerald-500" />
                <div className="absolute left-[17.7mm] top-0 bottom-0 w-[0.8mm] bg-amber-600" />
                <div className="bg-slate-900 text-white px-[16mm] pt-[13mm] pb-[11mm] border-t-[2.8mm] border-t-amber-600 border-b-[2mm] border-b-emerald-500 flex flex-col items-center text-center">
                  <div className="p-1 border border-emerald-500/80 rounded-[15px] mb-3 inline-flex items-center justify-center">
                    {companyProfile.icon && companyProfile.icon.startsWith('data:image/') ? (
                      <img
                        src={companyProfile.icon}
                        alt="Logo"
                        className="w-14 h-14 object-contain bg-white rounded-[11px] p-1"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-[11px] bg-emerald-500 text-slate-950 font-black text-2xl flex items-center justify-center">
                        {(companyProfile.name?.trim() || 'ReportPro').charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <h1 className="text-2xl font-black tracking-widest uppercase">{companyProfile.name?.trim() || 'ReportPro'}</h1>
                  <p className="text-xs text-emerald-300 mt-1">
                    {companyProfile.tagline?.trim() || 'Sistem Manajemen Stok, Laporan Harian & Gudang'}
                  </p>
                  <p className="text-[10px] tracking-[0.18em] text-slate-300 uppercase font-bold mt-3">
                    EDISI RESMI v3.2.0 PRO &nbsp;•&nbsp; PEDOMAN STANDAR OPERASIONAL BAKU
                  </p>
                </div>
                <div className="flex-1 px-[8mm] py-[7.5mm] flex flex-col">
                  <div className="relative border border-slate-200 px-[12mm] py-[10mm] flex-1 flex flex-col items-center justify-center text-center bg-white">
                    <span className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-emerald-500" />
                    <span className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-emerald-500" />
                    <span className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-emerald-500" />
                    <span className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-emerald-500" />
                    <p className="text-xs font-bold tracking-[0.2em] uppercase text-emerald-700">Manual Pengguna &amp; Prosedur Operasional</p>
                    <h2 className="text-3xl font-black mt-3 mb-3 leading-tight text-slate-900">
                      BUKU PANDUAN<br />PENGGUNAAN APLIKASI
                    </h2>
                    <div className="flex items-center justify-center gap-2 w-64 my-3">
                      <div className="flex-1 h-px bg-slate-300" />
                      <div className="w-20 h-1 bg-emerald-500 rounded-full" />
                      <div className="flex-1 h-px bg-slate-300" />
                    </div>
                    <p className="text-sm text-slate-600 max-w-lg leading-relaxed text-center">
                      Panduan komprehensif yang membahas pengenalan sistem, alur kerja harian, pengelolaan Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, Multi-Database, serta penanganan masalah secara praktis dan terstruktur.
                    </p>
                    <div className="w-full mt-6 bg-slate-50 border border-slate-300 border-t-[3px] border-t-emerald-500 rounded-lg grid grid-cols-3 py-2 text-center">
                      <div className="px-2">
                        <div className="text-[9.5px] font-extrabold text-emerald-700 uppercase">01 · Pengenalan &amp; Master</div>
                        <div className="text-[10px] font-semibold text-slate-700 mt-0.5">Arsitektur &amp; Bottom Stock</div>
                      </div>
                      <div className="px-2 border-l border-slate-300">
                        <div className="text-[9.5px] font-extrabold text-emerald-700 uppercase">02 · Operasional Harian</div>
                        <div className="text-[10px] font-semibold text-slate-700 mt-0.5">Daily Report &amp; Barang Datang</div>
                      </div>
                      <div className="px-2 border-l border-slate-300">
                        <div className="text-[9.5px] font-extrabold text-emerald-700 uppercase">03 · Sistem &amp; Solusi</div>
                        <div className="text-[10px] font-semibold text-slate-700 mt-0.5">Cloud, PIN &amp; Troubleshooting</div>
                      </div>
                    </div>
                    <div className="mt-5 px-7 py-2 rounded-lg bg-white border border-slate-300 border-t-[3px] border-t-emerald-500">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">{authorRole}</div>
                      <div className="text-sm font-black text-slate-900 mt-0.5">{authorName}</div>
                    </div>
                  </div>
                </div>
                <div className="px-[16mm] py-[9.5mm] bg-slate-900 border-t-[2mm] border-t-emerald-500 text-center text-xs text-slate-300">
                  <div className="font-bold text-white">
                    DITERBITKAN UNTUK TIM OPERASIONAL &amp; GUDANG &nbsp;•&nbsp; {(companyProfile.name?.trim() || 'ReportPro').toUpperCase()}
                  </div>
                  <div className="text-[10.5px] font-bold text-emerald-300 mt-0.5">
                    Struktur Materi: Pembuka, {guideSections.length} Bab Inti, Penutup &amp; {includeNotesPage ? '2 Lampiran' : '1 Lampiran'} &nbsp;•&nbsp; Edisi v3.2.0 Pro
                  </div>
                  <div className="text-[10px] font-semibold text-slate-400 mt-1">
                    Tanggal Penerbitan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })} &nbsp;•&nbsp; Oleh {authorName}
                  </div>
                </div>
              </div>
            </div>

            <div className="book-print-sheet pt-[15mm] pb-[15mm] pl-[24mm] pr-[16mm]">
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-4">
                  <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                  <span>Kata Pengantar</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.16em]">Halaman Pembuka</p>
                  <h2 className="text-xl font-black mt-0.5">KATA PENGANTAR</h2>
                  <div className="flex items-center justify-center gap-2 w-60 mx-auto mt-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <div className="w-14 h-1 bg-emerald-500 rounded-full" />
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-slate-800 text-justify leading-relaxed">
                  {prefaceParagraphs.map((para, idx) => (
                    <p key={idx} className="indent-[8mm]">{para}</p>
                  ))}
                </div>
                <div className="border border-slate-300 border-t-2 border-t-emerald-500 bg-slate-50 rounded-lg p-3 mt-4 text-xs text-justify">
                  <div className="font-bold mb-1">Tujuan Penyusunan Buku Panduan</div>
                  {prefacePurposes.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-700 shrink-0">{item.num}</span>
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
                <p className="font-serif italic text-xs text-emerald-900 mt-4 text-center">“{prefaceQuote}”</p>
                <div className="mt-6 ml-auto w-56 text-center text-[11px] text-slate-700">
                  <div>Diterbitkan pada {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div className="font-bold text-slate-900 mt-0.5">{authorRole}</div>
                  <div className="w-40 h-10 border-b border-slate-400 mx-auto" />
                  <div className="font-black text-slate-900 mt-1">{authorName}</div>
                  <div className="font-bold text-emerald-700 text-[10px]">{brandTitleForPreface}</div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                <span className="font-bold text-slate-800 tabular-nums">Halaman 1 dari {totalBookPages}</span>
              </div>
            </div>

            <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-4">
                  <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                  <span>Daftar Isi (Bagian I)</span>
                </div>
                <div className="text-center mb-3">
                  <h2 className="text-xl font-black">DAFTAR ISI</h2>
                  <div className="flex items-center justify-center gap-2 w-60 mx-auto mt-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <div className="w-14 h-1 bg-emerald-500 rounded-full" />
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
                <div className="py-1.5 border-b border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span><strong>PEMBUKA:</strong> Kata Pengantar</span>
                    <span className="font-bold tabular-nums">Hal. 1</span>
                  </div>
                  <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                    <div className="flex justify-between gap-2">
                      <span>0.1 Sambutan Penyusun &amp; Gambaran Umum Pedoman</span>
                      <span className="shrink-0 tabular-nums">Hal. 1</span>
                    </div>
                    <div className="flex justify-between gap-2">
                      <span>0.2 Tujuan Penyusunan &amp; Harapan Penerapan Sistem</span>
                      <span className="shrink-0 tabular-nums">Hal. 1</span>
                    </div>
                  </div>
                </div>
                {guideSections.slice(0, 4).map((sec, idx) => {
                  const p1 = 4 + idx * 2;
                  const p2 = p1 + 1;
                  return (
                    <div key={sec.id} className="py-1.5 border-b border-slate-200 text-xs">
                      <div className="flex justify-between gap-4">
                        <span><strong>BAB {idx + 1}:</strong> {sec.title}</span>
                        <span className="font-bold shrink-0 tabular-nums">Hal. {p1}–{p2}</span>
                      </div>
                      <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                        {sec.steps.map((st, stIdx) => (
                          <div key={stIdx} className="flex justify-between gap-2">
                            <span>{idx + 1}.{stIdx + 1} {st.title}</span>
                            <span className="shrink-0 tabular-nums">Hal. {stIdx < 2 ? p1 : p2}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                <span className="font-bold text-slate-800 tabular-nums">Halaman 2 dari {totalBookPages}</span>
              </div>
            </div>

            <div className="book-print-sheet pt-[15mm] pb-[15mm] pl-[24mm] pr-[16mm]">
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-4">
                  <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                  <span>Daftar Isi (Bagian II)</span>
                </div>
                {guideSections.slice(4).map((sec, offset) => {
                  const idx = 4 + offset;
                  const p1 = 4 + idx * 2;
                  const p2 = p1 + 1;
                  return (
                    <div key={sec.id} className="py-1.5 border-b border-slate-200 text-xs">
                      <div className="flex justify-between gap-4">
                        <span><strong>BAB {idx + 1}:</strong> {sec.title}</span>
                        <span className="font-bold shrink-0 tabular-nums">Hal. {p1}–{p2}</span>
                      </div>
                      <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                        {sec.steps.map((st, stIdx) => (
                          <div key={stIdx} className="flex justify-between gap-2">
                            <span>{idx + 1}.{stIdx + 1} {st.title}</span>
                            <span className="shrink-0 tabular-nums">Hal. {stIdx < 2 ? p1 : p2}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
                <div className="py-1.5 border-b border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span><strong>PENUTUP:</strong> Penutup</span>
                    <span className="font-bold tabular-nums">Hal. {closingPageNum}</span>
                  </div>
                  <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                    <div className="flex justify-between"><span>P.1 Ringkasan Akhir &amp; Pilar Keberhasilan Operasional</span><span>Hal. {closingPageNum}</span></div>
                    <div className="flex justify-between"><span>P.2 Pemeliharaan Sistem, Dukungan &amp; Pengesahan Penyusun</span><span>Hal. {closingPageNum}</span></div>
                  </div>
                </div>
                <div className="py-1.5 border-b border-slate-200 text-xs">
                  <div className="flex justify-between">
                    <span><strong>LAMPIRAN A:</strong> Tanya Jawab Cepat (FAQ) &amp; Pintasan Keyboard</span>
                    <span className="font-bold tabular-nums">Hal. {appendixAPageNum}</span>
                  </div>
                  <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                    <div className="flex justify-between"><span>A.1 Tanya Jawab Operasional &amp; Kendala Umum (FAQ)</span><span>Hal. {appendixAPageNum}</span></div>
                    <div className="flex justify-between"><span>A.2 Tabel Pintasan Keyboard &amp; Navigasi Cepat</span><span>Hal. {appendixAPageNum}</span></div>
                  </div>
                </div>
                {includeNotesPage && (
                  <div className="py-1.5 border-b border-slate-200 text-xs">
                    <div className="flex justify-between">
                      <span><strong>LAMPIRAN B:</strong> Lembar Catatan Lapangan &amp; Paraf Pelatihan</span>
                      <span className="font-bold tabular-nums">Hal. {appendixBPageNum}</span>
                    </div>
                    <div className="mt-1 pl-3 border-l border-slate-200 space-y-0.5 text-[10px] text-slate-700">
                      <div className="flex justify-between"><span>B.1 Kolom Catatan SOP Internal &amp; Daftar Kontak Penting</span><span>Hal. {appendixBPageNum}</span></div>
                      <div className="flex justify-between"><span>B.2 Lembar Paraf Pengesahan Pelatihan &amp; Kolofon Penerbitan</span><span>Hal. {appendixBPageNum}</span></div>
                    </div>
                  </div>
                )}
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                <span className="font-bold text-slate-800 tabular-nums">Halaman 3 dari {totalBookPages}</span>
              </div>
            </div>

            {guideSections.map((sec, sIdx) => {
              const page1 = 4 + sIdx * 2;
              const page2 = page1 + 1;
              const firstHalf = sec.steps.slice(0, 2);
              const secondHalf = sec.steps.slice(2);
              return (
                <React.Fragment key={sec.id}>
                  <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' && page1 % 2 === 0 ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-3">
                        <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                        <span>BAB {sIdx + 1} • {sec.title}</span>
                      </div>
                      <div className="border border-slate-300 border-t-2 border-t-emerald-500 bg-slate-50 rounded-lg p-3 mb-2.5 text-center">
                        <div className="text-[10px] font-bold text-emerald-700">BAB {sIdx + 1} • Halaman {page1}–{page2}</div>
                        <h3 className="text-base font-black">{sec.title}</h3>
                        <p className="text-xs text-slate-600">{sec.subtitle}</p>
                      </div>
                      <div className="border border-emerald-200 bg-emerald-50/70 rounded-lg p-2.5 mb-2.5 text-[11px] text-justify leading-relaxed">
                        <strong className="text-emerald-800 uppercase text-[9.5px] block mb-0.5">Ringkasan Materi</strong>
                        {sec.overview}
                      </div>
                      {firstHalf.map((st, idx) => (
                        <div key={idx} className="border border-slate-300 rounded-lg p-2.5 mb-2">
                          <div className="text-xs font-bold mb-1">
                            {sIdx + 1}.{idx + 1} {st.title}
                          </div>
                          <p className="text-xs text-slate-700 text-justify leading-relaxed">{st.description}</p>
                          {st.details && st.details.length > 0 && (
                            <ul className="mt-1.5 pl-4 list-disc text-[10.5px] text-slate-700 space-y-0.5 leading-snug text-justify">
                              {st.details.map((d, dIdx) => (
                                <li key={dIdx}>{d}</li>
                              ))}
                            </ul>
                          )}
                          {st.tip && <p className="text-[10.5px] text-emerald-800 mt-1 text-justify"><strong>Tips Lapangan:</strong> {st.tip}</p>}
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                      <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                      <span className="font-bold text-slate-800 tabular-nums">Halaman {page1} dari {totalBookPages}</span>
                    </div>
                  </div>

                  <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' && page2 % 2 === 0 ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
                    <div>
                      <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-3">
                        <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                        <span>BAB {sIdx + 1} (Lanjutan) • {sec.title}</span>
                      </div>
                      <div className="flex justify-between items-center bg-slate-50 border border-slate-200 border-l-4 border-l-emerald-500 rounded px-3 py-1.5 mb-3 text-xs font-bold">
                        <span>BAB {sIdx + 1} (Lanjutan) — {sec.title}</span>
                        <span className="text-[10px] text-emerald-700">Sub-Bab {sIdx + 1}.3 – {sIdx + 1}.{sec.steps.length}</span>
                      </div>
                      {secondHalf.map((st, idx) => {
                        const subNum = 2 + idx + 1;
                        return (
                          <div key={subNum} className="border border-slate-300 rounded-lg p-2.5 mb-2">
                            <div className="text-xs font-bold mb-1">
                              {sIdx + 1}.{subNum} {st.title}
                            </div>
                            <p className="text-xs text-slate-700 text-justify leading-relaxed">{st.description}</p>
                            {st.details && st.details.length > 0 && (
                              <ul className="mt-1.5 pl-4 list-disc text-[10.5px] text-slate-700 space-y-0.5 leading-snug text-justify">
                                {st.details.map((d, dIdx) => (
                                  <li key={dIdx}>{d}</li>
                                ))}
                              </ul>
                            )}
                            {st.tip && <p className="text-[10.5px] text-emerald-800 mt-1 text-justify"><strong>Tips Lapangan:</strong> {st.tip}</p>}
                          </div>
                        );
                      })}
                      {sec.proTip && (
                        <div className="border border-amber-300 bg-amber-50 rounded-lg p-2.5 text-xs mt-2 text-justify">
                          <strong>Tips Master Bab {sIdx + 1}:</strong> {sec.proTip}
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                      <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                      <span className="font-bold text-slate-800 tabular-nums">Halaman {page2} dari {totalBookPages}</span>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}

            <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' && closingPageNum % 2 === 0 ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-4">
                  <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                  <span>Penutup • Kesimpulan &amp; Komitmen</span>
                </div>
                <div className="text-center mb-4">
                  <p className="text-[10px] font-bold text-emerald-700 uppercase tracking-[0.16em]">Halaman Penutup</p>
                  <h2 className="text-xl font-black mt-0.5">PENUTUP</h2>
                  <div className="flex items-center justify-center gap-2 w-60 mx-auto mt-2">
                    <div className="flex-1 h-px bg-slate-200" />
                    <div className="w-14 h-1 bg-emerald-500 rounded-full" />
                    <div className="flex-1 h-px bg-slate-200" />
                  </div>
                </div>
                <div className="space-y-2.5 text-xs text-slate-800 text-justify leading-relaxed">
                  {closingParagraphs.map((para, idx) => (
                    <p key={idx} className="indent-[8mm]">{para}</p>
                  ))}
                </div>
                <div className="border border-slate-300 border-t-2 border-t-emerald-500 bg-slate-50 rounded-lg p-3 mt-4 text-xs text-justify">
                  <div className="font-bold mb-1">Komitmen &amp; Pilar Keberhasilan Operasional</div>
                  {closingPillars.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5">
                      <span className="font-bold text-emerald-700 shrink-0">{item.num}</span>
                      <span><strong>{item.title}</strong> — {item.text}</span>
                    </div>
                  ))}
                </div>
                <p className="font-serif italic text-xs text-emerald-900 mt-4 text-center">“{closingQuote}”</p>
                <div className="mt-6 ml-auto w-56 text-center text-[11px] text-slate-700">
                  <div>Disusun &amp; Disahkan Oleh,</div>
                  <div className="font-bold text-slate-900 mt-0.5">{authorRole}</div>
                  <div className="w-40 h-10 border-b border-slate-400 mx-auto" />
                  <div className="font-black text-slate-900 mt-1">{authorName}</div>
                  <div className="font-bold text-emerald-700 text-[10px]">{brandTitleForPreface} • Edisi v3.2.0 Pro</div>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                <span className="font-bold text-slate-800 tabular-nums">Halaman {closingPageNum} dari {totalBookPages}</span>
              </div>
            </div>

            <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' && appendixAPageNum % 2 === 0 ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
              <div>
                <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-3">
                  <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                  <span>Lampiran A • FAQ &amp; Pintasan</span>
                </div>
                <div className="bg-slate-900 text-white rounded-lg p-2.5 mb-2.5 text-center">
                  <div className="text-[10px] font-bold text-emerald-300 uppercase">Lampiran A</div>
                  <h3 className="text-base font-black">Tanya Jawab Cepat &amp; Pintasan Keyboard</h3>
                </div>
                {guideFaqs.map((faq, idx) => (
                  <div key={idx} className="border border-slate-300 rounded-lg p-2 mb-1.5 text-[11px]">
                    <div className="font-bold">T: {faq.question}</div>
                    <div className="text-justify leading-snug">J: {faq.answer}</div>
                  </div>
                ))}
                <table className="w-full text-[11px] border-collapse border border-slate-300 mt-2">
                  <thead>
                    <tr>
                      <th className="border border-slate-300 p-1.5 text-left">Tombol / Aksi</th>
                      <th className="border border-slate-300 p-1.5 text-left">Fungsi Operasional</th>
                    </tr>
                  </thead>
                  <tbody>
                    {guideShortcuts.map((s, idx) => (
                      <tr key={idx}>
                        <td className="border border-slate-300 p-1.5 font-bold">{s.keys}</td>
                        <td className="border border-slate-300 p-1.5">{s.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                <span className="font-bold text-slate-800 tabular-nums">Halaman {appendixAPageNum} dari {totalBookPages}</span>
              </div>
            </div>

            {includeNotesPage && (
              <div className={cn('book-print-sheet pt-[15mm] pb-[15mm]', bindingMode === 'mirrored' && appendixBPageNum % 2 === 0 ? 'pr-[24mm] pl-[16mm]' : 'pl-[24mm] pr-[16mm]')}>
                <div>
                  <div className="flex justify-between text-[9px] text-slate-500 border-b border-slate-200 pb-2 mb-4">
                    <span className="font-bold">BUKU PANDUAN • {(companyProfile.name?.trim() || 'REPORTPRO').toUpperCase()}</span>
                    <span>Lampiran B • Catatan Lapangan</span>
                  </div>
                  <h3 className="text-base font-black mb-2 text-center">LAMPIRAN B — Catatan Lapangan, Paraf Pelatihan &amp; Kolofon</h3>
                  {Array.from({ length: 13 }).map((_, idx) => (
                    <div key={idx} className="border-b border-slate-300 h-6" />
                  ))}
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    <div className="border border-slate-300 bg-slate-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-bold">Diterima Oleh (Staff / Operator)</div>
                      <div className="w-4/5 mx-auto h-10 border-b border-slate-400" />
                      <div className="text-[9px] text-slate-500 mt-1">Nama Lengkap &amp; Tanda Tangan</div>
                    </div>
                    <div className="border border-slate-300 bg-slate-50 rounded-lg p-2.5 text-center">
                      <div className="text-[10px] font-bold">Disahkan Oleh (Supervisor / Admin)</div>
                      <div className="w-4/5 mx-auto h-10 border-b border-slate-400" />
                      <div className="text-[9px] text-slate-500 mt-1">Nama Lengkap &amp; Tanda Tangan</div>
                    </div>
                  </div>
                  <div className="mt-4 p-2.5 rounded-lg bg-slate-900 text-white text-center text-[10px]">
                    <strong>{authorRole}:</strong> {authorName} &nbsp;•&nbsp; Aplikasi {(companyProfile.name?.trim() || 'ReportPro')} v3.2.0 Pro
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-slate-500 border-t border-slate-200 pt-2">
                  <span>Dokumen Operasional Resmi • v3.2.0 Pro • Oleh {authorName}</span>
                  <span className="font-bold text-slate-800 tabular-nums">Halaman {appendixBPageNum} dari {totalBookPages}</span>
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
