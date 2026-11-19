import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Package, FileText, Settings, Menu, X, PackageOpen, 
  ChevronLeft, ChevronRight, Factory, CalendarClock, PackageMinus, 
  AlertTriangle, LayoutGrid, Search, CheckCircle2, Sparkles, ChevronDown
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { MasterData } from './MasterData';
import { DailyReport } from './DailyReport';
import { ArrivedRecap } from './ArrivedRecap';
import { StockOut } from './StockOut';
import { KosongPabrikRecap } from './KosongPabrikRecap';
import { LowStockRecap } from './LowStockRecap';
import { NearExpiredRecap } from './NearExpiredRecap';
import { SettingsView } from './SettingsView';
import { Clock } from './Clock';
import { useAppContext } from '../store/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ChatBox } from './ChatBox';
import { DbPinModal } from './common/DbPinModal';

export type TabId = 'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'expired' | 'settings';

const VALID_TABS: TabId[] = ['dashboard', 'master', 'report', 'arrived', 'stockout', 'kosong', 'lowstock', 'expired', 'settings'];
const ACTIVE_TAB_STORAGE_KEY = 'dailyreportpro_active_tab';

const getInitialTab = (): TabId => {
  try {
    const hashTab = window.location.hash.replace(/^#/, '') as TabId;
    if (VALID_TABS.includes(hashTab)) {
      return hashTab;
    }
    const saved = localStorage.getItem(ACTIVE_TAB_STORAGE_KEY) as TabId | null;
    if (saved && VALID_TABS.includes(saved)) {
      return saved;
    }
  } catch {
    // Ignore storage access errors
  }
  return 'dashboard';
};

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<TabId>(getInitialTab);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_TAB_STORAGE_KEY, activeTab);
      if (window.location.hash.replace(/^#/, '') !== activeTab) {
        window.history.replaceState(null, '', `#${activeTab}`);
      }
    } catch {
      // Ignore storage/history access errors
    }
  }, [activeTab]);

  useEffect(() => {
    const handleHashChange = () => {
      const hashTab = window.location.hash.replace(/^#/, '') as TabId;
      if (VALID_TABS.includes(hashTab)) {
        setActiveTab(hashTab);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobileMenuSheetOpen, setIsMobileMenuSheetOpen] = useState(false);
  const [mobileMenuSearch, setMobileMenuSearch] = useState('');
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const [showLocalSwitchPinModal, setShowLocalSwitchPinModal] = useState(false);
  const { 
    settings, 
    quotaExceededInfo, 
    dismissQuotaAlert, 
    switchToLocalDb,
    nearExpiredList,
    products,
    dbProvider
  } = useAppContext();

  const navPos = settings?.navbarPosition || 'bottom'; // Default bottom for mobile
  const navStyle = settings?.navbarStyle || 'classic';
  const isIphoneNav = navStyle === 'iphone';
  const isWindows11Nav = navStyle === 'windows11';
  const isUbuntuNav = navStyle === 'ubuntu';
  const isFloatingMobileNav = isIphoneNav || isWindows11Nav || isUbuntuNav;

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
  }, [settings.theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-navbar-style', navStyle);
  }, [navStyle]);

  // Real-time notification badge counts
  const nearExpiredCount = useMemo(() => {
    return (nearExpiredList || []).filter(item => !item.status || item.status === 'pending').length;
  }, [nearExpiredList]);

  const lowStockCount = useMemo(() => {
    return (products || []).filter(
      p => p.stock !== undefined && p.stock !== null && p.bottomStock !== undefined && p.bottomStock !== null && p.stock < p.bottomStock
    ).length;
  }, [products]);

  const kosongPabrikCount = useMemo(() => {
    return (products || []).filter(p => p.isKosongPabrik).length;
  }, [products]);

  const tabs: {
    id: TabId;
    label: string;
    shortLabel: string;
    icon: any;
    category: 'Operasional Harian' | 'Peringatan & Rekap' | 'Master & Sistem';
    desc: string;
    badge?: number;
    badgeColor?: string;
  }[] = [
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      shortLabel: 'Beranda',
      icon: LayoutDashboard, 
      category: 'Master & Sistem',
      desc: 'Ringkasan performa & statistik stok' 
    },
    { 
      id: 'report', 
      label: 'Daily Report', 
      shortLabel: 'Daily',
      icon: FileText, 
      category: 'Operasional Harian',
      desc: 'Pencatatan laporan stok harian' 
    },
    { 
      id: 'arrived', 
      label: 'Barang Datang', 
      shortLabel: 'Datang',
      icon: PackageOpen, 
      category: 'Operasional Harian',
      desc: 'Penerimaan barang dari supplier' 
    },
    { 
      id: 'stockout', 
      label: 'Pengeluaran', 
      shortLabel: 'Keluar',
      icon: PackageMinus, 
      category: 'Operasional Harian',
      desc: 'Catat barang keluar gudang' 
    },
    { 
      id: 'expired', 
      label: 'Expired Dekat', 
      shortLabel: 'Expired',
      icon: CalendarClock, 
      category: 'Peringatan & Rekap',
      desc: 'Pencatatan batch & kadaluwarsa',
      badge: nearExpiredCount,
      badgeColor: 'bg-red-500 text-white'
    },
    { 
      id: 'lowstock', 
      label: 'Stok Menipis', 
      shortLabel: 'Menipis',
      icon: AlertTriangle, 
      category: 'Peringatan & Rekap',
      desc: 'Peringatan stok di bawah batas aman',
      badge: lowStockCount,
      badgeColor: 'bg-amber-500 text-white'
    },
    { 
      id: 'kosong', 
      label: 'Kosong Pabrik', 
      shortLabel: 'Kosong',
      icon: Factory, 
      category: 'Peringatan & Rekap',
      desc: 'Daftar barang kosong distributor',
      badge: kosongPabrikCount,
      badgeColor: 'bg-rose-500 text-white'
    },
    { 
      id: 'master', 
      label: 'Master Data', 
      shortLabel: 'Master',
      icon: Package, 
      category: 'Master & Sistem',
      desc: 'Kelola produk, satuan & supplier' 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      shortLabel: 'Setting',
      icon: Settings, 
      category: 'Master & Sistem',
      desc: 'Database, backup data & tema' 
    },
  ];

  const currentTab = tabs.find(t => t.id === activeTab) || tabs[0];

  // Mobile Bottom Bar Navigation tabs (Primary 4 items + Menu Button)
  const primaryMobileTabs: TabId[] = ['dashboard', 'report', 'arrived', 'stockout'];
  const isCurrentInSecondary = !primaryMobileTabs.includes(activeTab);

  const renderSidebar = () => (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className={cn(
            "fixed inset-0 z-40 md:hidden transition-opacity",
            isIphoneNav ? "bg-neutral-950/35 backdrop-blur-md" : "bg-neutral-900/60 backdrop-blur-xs"
          )}
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside className={cn(
        "fixed md:static inset-y-0 z-40 bg-theme-100 transform transition-all duration-300 ease-in-out flex flex-col shrink-0",
        isDesktopSidebarCollapsed ? "md:w-20 w-72" : "w-72 md:w-56 lg:w-64 xl:w-72",
        isIphoneNav
          ? cn(
              "p-3.5 md:p-4 lg:p-5 md:my-3 md:h-[calc(100vh-1.5rem)] md:rounded-[2.25rem] border border-white/80",
              navPos === 'right'
                ? "right-0 md:mr-3 rounded-l-[2.25rem]"
                : "left-0 md:ml-3 rounded-r-[2.25rem]"
            )
          : isWindows11Nav
            ? cn(
                "p-3.5 md:p-4 lg:p-5 md:my-2.5 md:h-[calc(100vh-1.25rem)] md:rounded-2xl border border-neutral-200/80",
                navPos === 'right'
                  ? "right-0 md:mr-2.5 rounded-l-2xl"
                  : "left-0 md:ml-2.5 rounded-r-2xl"
              )
            : isUbuntuNav
              ? cn(
                  "p-3.5 md:p-4 lg:p-5 text-white",
                  navPos === 'right'
                    ? "right-0 border-l border-white/10 rounded-l-2xl md:rounded-none"
                    : "left-0 border-r border-white/10 rounded-r-2xl md:rounded-none"
                )
              : cn(
                  "p-4 md:p-4 lg:p-6",
                  navPos === 'right' ? "right-0 border-l border-theme-300" : "left-0 border-r border-theme-300"
                ),
        isSidebarOpen 
          ? "translate-x-0 shadow-2xl" 
          : (navPos === 'right' ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0")
      )}>
        {/* iOS Dynamic Pill Accent on Mobile Slide Sidebar */}
        {isIphoneNav && (
          <div className="md:hidden flex justify-center mb-3">
            <span className="w-10 h-1 rounded-full bg-neutral-400/50" />
          </div>
        )}

        {/* Ubuntu Yaru Header Accent Dots */}
        {isUbuntuNav && !isDesktopSidebarCollapsed && (
          <div className="hidden md:flex items-center gap-1.5 mb-3 px-1">
            <span className="w-2.5 h-2.5 rounded-full bg-[#E95420] shadow-xs" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
            <span className="w-2.5 h-2.5 rounded-full bg-white/25" />
          </div>
        )}

        <div className={cn("flex items-start gap-2", (isIphoneNav || isWindows11Nav || isUbuntuNav) ? "md:mb-6 mb-5" : "md:mb-8 mb-6", isDesktopSidebarCollapsed ? "md:justify-center justify-between" : "justify-between")}>
          <div className={cn("flex gap-3 min-w-0 flex-1", isDesktopSidebarCollapsed ? "md:justify-center items-center" : "items-start")}>
            {settings.companyIcon ? (
              <div className={cn(
                "w-10 h-10 bg-white flex items-center justify-center overflow-hidden shadow-md shrink-0 mt-0.5",
                isIphoneNav
                  ? "rounded-[14px] ring-2 ring-white/70 border border-theme-200"
                  : isWindows11Nav
                    ? "rounded-xl ring-1 ring-neutral-200/80 border border-neutral-200"
                    : isUbuntuNav
                      ? "rounded-xl ring-2 ring-white/20 border border-white/20"
                      : "rounded-2xl ring-2 ring-white/70 border border-theme-200"
              )}>
                <img src={settings.companyIcon} alt={settings.companyName || 'Logo Perusahaan'} className="w-full h-full object-contain p-0.5" />
              </div>
            ) : (
              <div className={cn(
                "w-10 h-10 flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 mt-0.5",
                isIphoneNav
                  ? "bg-theme-500 rounded-[14px] ring-2 ring-white/50"
                  : isWindows11Nav
                    ? "bg-theme-500 rounded-xl ring-1 ring-white/60"
                    : isUbuntuNav
                      ? "bg-[#E95420] rounded-xl ring-2 ring-white/20"
                      : "bg-theme-500 rounded-2xl ring-2 ring-white/50"
              )}>
                {(settings.companyName?.trim() || 'ReportPro').charAt(0).toUpperCase()}
              </div>
            )}
            <div className={cn("transition-opacity duration-300 min-w-0 flex-1", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>
              <span className={cn(
                "font-bold tracking-tight block whitespace-normal break-words leading-snug",
                isUbuntuNav ? "text-white" : "text-theme-900",
                (settings.companyName?.trim() || 'ReportPro').length > 36
                  ? "text-xs sm:text-sm"
                  : (settings.companyName?.trim() || 'ReportPro').length > 22
                    ? "text-sm sm:text-base"
                    : "text-base sm:text-lg"
              )}>
                {settings.companyName?.trim() || 'ReportPro'}
              </span>
              <span className={cn(
                "text-[10px] font-medium uppercase tracking-wider block whitespace-normal break-words leading-tight mt-0.5",
                isUbuntuNav ? "text-white/70" : "text-theme-600-text"
              )}>
                {settings.companyTagline?.trim() || 'Manajemen Stok'}
              </span>
            </div>
          </div>
          <button 
            className={cn(
              "md:hidden p-2 transition-colors shrink-0",
              isIphoneNav
                ? "rounded-full bg-neutral-200/60 hover:bg-neutral-300/60 text-neutral-500 hover:text-neutral-900"
                : isWindows11Nav
                  ? "rounded-lg bg-white/80 hover:bg-white text-neutral-600 hover:text-neutral-900 border border-neutral-200/80"
                  : isUbuntuNav
                    ? "rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                    : "rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-theme-200"
            )}
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-1.5">
          {tabs.map(tab => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setIsSidebarOpen(false);
                }}
                title={isDesktopSidebarCollapsed ? tab.label : undefined}
                className={cn(
                  "group w-full flex items-center text-sm transition-all duration-200 relative",
                  isIphoneNav
                    ? cn(
                        "rounded-[18px]",
                        isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-2.5 px-3 py-2.5" : "px-3 py-2.5 gap-3",
                        isActive
                          ? "bg-theme-500 text-white font-semibold shadow-md"
                          : "text-neutral-700 hover:bg-white/75 hover:text-neutral-950 active:scale-[0.97]"
                      )
                    : isWindows11Nav
                      ? cn(
                          "rounded-lg",
                          isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-2.5 px-3 py-2.5" : "px-3 py-2.5 gap-3",
                          isActive
                            ? "bg-white/95 text-neutral-900 font-semibold shadow-xs border border-neutral-200/80"
                            : "text-neutral-700 hover:bg-white/65 hover:text-neutral-950 border border-transparent active:scale-[0.98]"
                        )
                      : isUbuntuNav
                        ? cn(
                            "rounded-xl",
                            isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-2.5 px-3 py-2.5" : "px-3 py-2.5 gap-3",
                            isActive
                              ? "bg-white/15 text-white font-semibold border border-white/15 shadow-xs"
                              : "text-white/80 hover:bg-white/10 hover:text-white border border-transparent active:scale-[0.98]"
                          )
                        : cn(
                            "rounded-2xl",
                            isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-3.5 px-4 py-3" : "px-4 py-3 gap-3",
                            isActive 
                              ? "bg-theme-500 text-white font-semibold shadow-sm" 
                              : "text-theme-700 hover:bg-theme-200/70 hover:text-theme-900 active:scale-[0.98]"
                          )
                )}
              >
                {/* Windows 11 Left Fluent Pill Indicator */}
                {isWindows11Nav && isActive && (
                  <span className={cn(
                    "absolute w-[3.5px] h-4 rounded-full bg-theme-600",
                    navPos === 'right' ? "right-1" : "left-1"
                  )} />
                )}

                {/* Ubuntu Orange Edge Indicator Dot/Bar */}
                {isUbuntuNav && isActive && (
                  <span className={cn(
                    "absolute w-1 h-4 rounded-full bg-[#E95420] shadow-[0_0_8px_rgba(233,84,32,0.85)]",
                    navPos === 'right' ? "right-1" : "left-1"
                  )} />
                )}

                {isIphoneNav ? (
                  <div className={cn(
                    "w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0 transition-transform duration-200",
                    isActive
                      ? "bg-white/25 text-white shadow-inner scale-105"
                      : "bg-white/90 text-theme-700 border border-white shadow-xs group-hover:scale-105"
                  )}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                ) : isWindows11Nav ? (
                  <div className={cn(
                    "w-7 h-7 rounded-md flex items-center justify-center shrink-0 transition-colors",
                    isActive
                      ? "bg-theme-100 text-theme-700"
                      : "text-neutral-600 group-hover:text-theme-700"
                  )}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                ) : isUbuntuNav ? (
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all",
                    isActive
                      ? "bg-[#E95420] text-white shadow-sm"
                      : "bg-white/10 text-white/85 group-hover:bg-white/15 group-hover:text-white"
                  )}>
                    <tab.icon className="w-4 h-4" />
                  </div>
                ) : (
                  <tab.icon className={cn(
                    "w-5 h-5 transition-transform duration-200 shrink-0", 
                    isActive ? "text-white" : "opacity-80 group-hover:scale-110"
                  )} />
                )}

                <span className={cn("whitespace-nowrap transition-opacity duration-300 flex-1 text-left", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>
                  {tab.label}
                </span>

                {/* Badge if available */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all",
                    isWindows11Nav
                      ? (isActive ? "bg-theme-600 text-white" : (tab.badgeColor || "bg-amber-500 text-white"))
                      : isUbuntuNav
                        ? (isActive ? "bg-[#E95420] text-white" : (tab.badgeColor || "bg-amber-500 text-white"))
                        : (isActive ? "bg-white text-theme-800" : (tab.badgeColor || "bg-amber-500 text-white")),
                    isDesktopSidebarCollapsed ? "md:absolute md:top-1.5 md:right-1.5 md:p-1 md:w-2.5 md:h-2.5 md:rounded-full md:text-[0px]" : ""
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        
        <div className={cn(
          "mt-auto pt-4 hidden md:flex md:flex-col md:items-center",
          isIphoneNav
            ? "border-t border-neutral-200/60"
            : isWindows11Nav
              ? "border-t border-neutral-200/80"
              : isUbuntuNav
                ? "border-t border-white/10"
                : "border-t border-theme-300"
        )}>
          <button 
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className={cn(
              "w-full flex items-center justify-center p-2.5 transition-all duration-300 mb-3",
              isIphoneNav
                ? "rounded-full bg-white/80 hover:bg-white text-neutral-700 border border-white/90 shadow-xs"
                : isWindows11Nav
                  ? "rounded-lg bg-white/80 hover:bg-white text-neutral-700 border border-neutral-200/80 shadow-2xs"
                  : isUbuntuNav
                    ? "rounded-xl bg-white/10 hover:bg-white/15 text-white border border-white/10"
                    : "p-3 text-theme-600-text hover:bg-theme-200 hover:text-theme-900 rounded-xl bg-theme-100"
            )}
            title={isDesktopSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {isDesktopSidebarCollapsed ? (navPos === 'right' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />) : (navPos === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
          </button>
          
          <div className={cn(
            "flex flex-col gap-1 shadow-sm transition-all duration-300 overflow-hidden",
            isIphoneNav
              ? "bg-theme-500 text-white rounded-[18px]"
              : isWindows11Nav
                ? "bg-white/90 text-neutral-800 border border-neutral-200/80 rounded-xl"
                : isUbuntuNav
                  ? "bg-white/10 text-white border border-white/15 rounded-xl"
                  : "bg-theme-500 text-white rounded-2xl gap-1.5",
            isDesktopSidebarCollapsed ? "h-0 p-0 opacity-0 border-0" : "p-3.5 h-auto opacity-100 w-full"
          )}>
            <span className={cn(
              "text-[11px] font-semibold uppercase tracking-wider",
              isWindows11Nav ? "text-theme-700" : isUbuntuNav ? "text-[#F89B7A]" : "opacity-85"
            )}>
              Database Status
            </span>
            <p className="text-xs font-medium leading-relaxed">
              {dbProvider === 'firebase' ? 'Google Firestore Online' : dbProvider === 'supabase' ? 'Supabase Online' : 'Penyimpanan Lokal Offline'}
            </p>
          </div>
          {!isDesktopSidebarCollapsed && (
            <div className={cn(
              "mt-2.5 text-center text-[10px] font-medium",
              isUbuntuNav ? "text-white/65" : "text-theme-600-text/80"
            )}>
              Daily Report Pro{' '}
              <span className={cn(
                "font-bold px-1.5 py-0.2 rounded",
                isUbuntuNav ? "text-white bg-[#E95420]/90" : "text-emerald-800 bg-emerald-100"
              )}>
                v3.2.0
              </span>{' '}
              • © 2026 <strong className={cn("font-bold", isUbuntuNav ? "text-white" : "text-theme-900")}>Denuda</strong>
            </div>
          )}
        </div>

        {/* Mobile iPhone Home Indicator inside slide sidebar */}
        {isIphoneNav && (
          <div className="md:hidden mt-3 pt-1 flex justify-center">
            <span className="w-28 h-1 rounded-full bg-neutral-900/20" />
          </div>
        )}
      </aside>
    </>
  );

  // Modern Ergonomic Mobile Bottom Nav (Classic / iPhone / Windows 11 / Ubuntu)
  const renderBottomNav = () => (
    <nav 
      aria-label="Mobile Navigation"
      className={cn(
        "md:hidden fixed z-30 transition-all duration-300",
        isIphoneNav
          ? "bottom-2.5 left-3 right-3 mx-auto max-w-md rounded-[2rem] px-2 pt-1.5 pb-1.5"
          : isWindows11Nav
            ? "bottom-2.5 left-3 right-3 mx-auto max-w-md rounded-2xl px-2 py-1"
            : isUbuntuNav
              ? "bottom-2.5 left-3 right-3 mx-auto max-w-md rounded-[1.35rem] px-2 py-1.5"
              : "bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-theme-200 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-1 py-1 pb-safe"
      )}
    >
      <div className="grid grid-cols-5 items-center justify-items-stretch max-w-lg mx-auto">
        {/* Primary 4 slots */}
        {(['dashboard', 'report', 'arrived', 'stockout'] as TabId[]).map((tabId) => {
          const tab = tabs.find(t => t.id === tabId)!;
          const isActive = activeTab === tabId;
          return (
            <button
              key={`mobile-${tabId}`}
              onClick={() => setActiveTab(tabId)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] px-0.5 transition-all duration-200 active:scale-90 relative",
                isIphoneNav
                  ? "py-1 rounded-2xl"
                  : isWindows11Nav
                    ? cn(
                        "py-1 rounded-xl",
                        isActive ? "bg-white/95 text-theme-700 shadow-xs border border-neutral-200/70" : "text-neutral-600 hover:bg-white/60 hover:text-neutral-900"
                      )
                    : isUbuntuNav
                      ? cn(
                          "py-1 rounded-xl",
                          isActive ? "bg-white/15 text-white shadow-xs" : "text-white/75 hover:bg-white/10 hover:text-white"
                        )
                      : "py-1.5 rounded-xl",
                !isWindows11Nav && !isUbuntuNav && (isActive ? "text-theme-800" : "text-neutral-500 hover:text-neutral-800")
              )}
            >
              <div className={cn(
                "transition-all duration-200",
                isIphoneNav
                  ? cn(
                      "px-3 py-1 rounded-full",
                      isActive ? "bg-theme-500 text-white shadow-md scale-105" : "bg-transparent text-neutral-600"
                    )
                  : isWindows11Nav
                    ? "p-1 rounded-lg"
                    : isUbuntuNav
                      ? cn(
                          "p-1.5 rounded-xl",
                          isActive ? "bg-[#E95420] text-white shadow-sm" : "bg-transparent text-white/80"
                        )
                      : cn(
                          "p-1.5 rounded-xl",
                          isActive ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-transparent"
                        )
              )}>
                <tab.icon className={cn("w-5 h-5 transition-transform", !isIphoneNav && !isWindows11Nav && !isUbuntuNav && isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5",
                isUbuntuNav
                  ? (isActive ? "font-bold text-white" : "font-medium text-white/75")
                  : isWindows11Nav
                    ? (isActive ? "font-bold text-theme-800" : "font-medium text-neutral-600")
                    : (isActive ? "font-bold text-theme-900" : "font-medium")
              )}>
                {tab.shortLabel}
              </span>

              {/* Windows 11 active bottom taskbar pill */}
              {isWindows11Nav && isActive && (
                <span className="w-4 h-[3px] rounded-full bg-theme-600 mt-0.5" />
              )}

              {/* Ubuntu Orange active indicator dot */}
              {isUbuntuNav && isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E95420] mt-0.5 shadow-[0_0_6px_rgba(233,84,32,0.9)]" />
              )}
            </button>
          );
        })}

        {/* Slot 5: Semua Menu / Active Secondary Tab */}
        {(() => {
          const totalAlerts = nearExpiredCount + lowStockCount + kosongPabrikCount;
          const displayIcon = isCurrentInSecondary ? currentTab.icon : LayoutGrid;
          const displayLabel = isCurrentInSecondary ? currentTab.shortLabel : 'Menu';

          return (
            <button
              key="mobile-menu-more"
              onClick={() => setIsMobileMenuSheetOpen(true)}
              className={cn(
                "flex flex-col items-center justify-center min-h-[44px] px-0.5 transition-all duration-200 active:scale-90 relative",
                isIphoneNav
                  ? "py-1 rounded-2xl"
                  : isWindows11Nav
                    ? cn(
                        "py-1 rounded-xl",
                        isCurrentInSecondary ? "bg-white/95 text-theme-700 shadow-xs border border-neutral-200/70" : "text-neutral-600 hover:bg-white/60 hover:text-neutral-900"
                      )
                    : isUbuntuNav
                      ? cn(
                          "py-1 rounded-xl",
                          isCurrentInSecondary ? "bg-white/15 text-white shadow-xs" : "text-white/80 hover:bg-white/10 hover:text-white"
                        )
                      : "py-1.5 rounded-xl",
                !isWindows11Nav && !isUbuntuNav && (isCurrentInSecondary ? "text-theme-800" : "text-neutral-600 hover:text-neutral-900")
              )}
            >
              <div className={cn(
                "transition-all duration-200 relative",
                isIphoneNav
                  ? cn(
                      "px-3 py-1 rounded-full",
                      isCurrentInSecondary ? "bg-theme-500 text-white shadow-md scale-105" : "bg-neutral-200/70 text-neutral-700"
                    )
                  : isWindows11Nav
                    ? cn("p-1 rounded-lg", isCurrentInSecondary ? "text-theme-700" : "bg-neutral-200/60 text-neutral-700")
                    : isUbuntuNav
                      ? cn(
                          "p-1.5 rounded-xl",
                          isCurrentInSecondary ? "bg-[#E95420] text-white shadow-sm" : "bg-white/12 text-white"
                        )
                      : cn(
                          "p-1.5 rounded-xl",
                          isCurrentInSecondary ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-neutral-100"
                        )
              )}>
                {React.createElement(displayIcon, {
                  className: cn("w-5 h-5 transition-transform", !isIphoneNav && !isWindows11Nav && !isUbuntuNav && isCurrentInSecondary ? "scale-110" : "")
                })}
                {/* Total alert dot badge */}
                {totalAlerts > 0 && (
                  <span className={cn(
                    "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 border-2 rounded-full animate-pulse",
                    isUbuntuNav ? "border-[#241623]" : "border-white"
                  )} />
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5 flex items-center gap-0.5",
                isUbuntuNav
                  ? (isCurrentInSecondary ? "font-bold text-white" : "font-medium text-white/80")
                  : isWindows11Nav
                    ? (isCurrentInSecondary ? "font-bold text-theme-800" : "font-medium text-neutral-600")
                    : (isCurrentInSecondary ? "font-bold text-theme-900" : "font-medium")
              )}>
                {displayLabel}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </span>

              {isWindows11Nav && isCurrentInSecondary && (
                <span className="w-4 h-[3px] rounded-full bg-theme-600 mt-0.5" />
              )}
              {isUbuntuNav && isCurrentInSecondary && (
                <span className="w-1.5 h-1.5 rounded-full bg-[#E95420] mt-0.5 shadow-[0_0_6px_rgba(233,84,32,0.9)]" />
              )}
            </button>
          );
        })()}
      </div>

      {/* Subtle iPhone Home Indicator Pill */}
      {isIphoneNav && (
        <div className="flex justify-center pt-1 pb-0.5 pointer-events-none">
          <span className="w-24 h-1 rounded-full bg-neutral-900/20" />
        </div>
      )}
    </nav>
  );

  // Full Mobile Navigation Sheet / Drawer Modal
  const renderMobileMenuSheet = () => {
    if (!isMobileMenuSheetOpen) return null;

    const filteredTabs = tabs.filter(tab => {
      if (!mobileMenuSearch.trim()) return true;
      const q = mobileMenuSearch.toLowerCase();
      return tab.label.toLowerCase().includes(q) || tab.desc.toLowerCase().includes(q) || tab.category.toLowerCase().includes(q);
    });

    const categories: ('Operasional Harian' | 'Peringatan & Rekap' | 'Master & Sistem')[] = [
      'Operasional Harian',
      'Peringatan & Rekap',
      'Master & Sistem'
    ];

    return (
      <div className="fixed inset-0 z-50 flex flex-col justify-end md:hidden animate-in fade-in duration-200">
        {/* Backdrop */}
        <div 
          className={cn(
            "fixed inset-0 transition-opacity",
            isIphoneNav ? "bg-neutral-950/45 backdrop-blur-md" : "bg-neutral-950/60 backdrop-blur-xs"
          )}
          onClick={() => {
            setIsMobileMenuSheetOpen(false);
            setMobileMenuSearch('');
          }}
        />

        {/* Sheet Content */}
        <div className={cn(
          "relative border-t shadow-2xl max-h-[85vh] flex flex-col z-10 overflow-hidden",
          isIphoneNav
            ? "bg-white/92 backdrop-blur-2xl rounded-t-[2.25rem] border-white/90"
            : isWindows11Nav
              ? "bg-[#F3F6FA]/95 backdrop-blur-2xl rounded-t-2xl border-white/90"
              : isUbuntuNav
                ? "bg-[#FAF7F5] rounded-t-3xl border-[#300A24]/30"
                : "bg-white rounded-t-3xl border-theme-200"
        )}>
          {/* Drag Handle & Header */}
          <div className={cn(
            "p-4 pb-2 border-b shrink-0",
            isIphoneNav
              ? "border-neutral-200/60 bg-white/50"
              : isWindows11Nav
                ? "border-neutral-200/80 bg-white/60"
                : isUbuntuNav
                  ? "border-white/10 bg-[#300A24] text-white"
                  : "border-theme-200/80 bg-theme-50/70"
          )}>
            <div className={cn("mx-auto mb-3 rounded-full", isIphoneNav ? "w-10 h-1 bg-neutral-400/60" : "w-12 h-1.5 bg-neutral-300")} />
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-2.5 min-w-0 flex-1 pr-2">
                {settings.companyIcon ? (
                  <div className={cn(
                    "w-9 h-9 bg-white border border-theme-200 flex items-center justify-center overflow-hidden shadow-sm shrink-0 mt-0.5",
                    isIphoneNav ? "rounded-[12px]" : "rounded-2xl"
                  )}>
                    <img src={settings.companyIcon} alt={settings.companyName || 'Logo'} className="w-full h-full object-contain p-0.5" />
                  </div>
                ) : (
                  <div className={cn(
                    "w-9 h-9 bg-theme-500 text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0 mt-0.5",
                    isIphoneNav ? "rounded-[12px]" : "rounded-2xl"
                  )}>
                    <LayoutGrid className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className={cn("font-bold text-base leading-tight", isUbuntuNav ? "text-white" : "text-neutral-900")}>Semua Fitur & Menu</h3>
                  <p className={cn("text-[11px] font-semibold whitespace-normal break-words leading-snug mt-0.5", isUbuntuNav ? "text-white/75" : "text-neutral-600")}>
                    {settings.companyName?.trim() || 'ReportPro'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsMobileMenuSheetOpen(false);
                  setMobileMenuSearch('');
                }}
                className={cn(
                  "p-2 transition-colors",
                  isIphoneNav
                    ? "rounded-full bg-neutral-200/60 hover:bg-neutral-300/60 text-neutral-400 hover:text-neutral-700"
                    : isUbuntuNav
                      ? "rounded-full bg-white/10 hover:bg-white/20 text-white/80 hover:text-white"
                      : "rounded-xl hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700"
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Search inside Drawer */}
            <div className="relative mt-3">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input 
                type="text"
                placeholder="Cari fitur / menu..."
                value={mobileMenuSearch}
                onChange={(e) => setMobileMenuSearch(e.target.value)}
                className={cn(
                  "w-full pl-9 pr-8 py-2 bg-white border border-theme-200 text-xs font-medium text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-theme-500 focus:ring-2 focus:ring-theme-100 transition-all",
                  isIphoneNav ? "rounded-2xl bg-neutral-100/80" : isWindows11Nav ? "rounded-lg" : "rounded-xl"
                )}
              />
              {mobileMenuSearch && (
                <button 
                  onClick={() => setMobileMenuSearch('')}
                  className="absolute right-2.5 top-2.5 text-neutral-400 hover:text-neutral-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Categorized List */}
          <div className="overflow-y-auto p-4 space-y-5">
            {categories.map(category => {
              const catTabs = filteredTabs.filter(t => t.category === category);
              if (catTabs.length === 0) return null;

              return (
                <div key={category} className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
                      {category}
                    </span>
                    <span className="text-[10px] text-neutral-400 font-medium">
                      {catTabs.length} Menu
                    </span>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {catTabs.map(tab => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          onClick={() => {
                            setActiveTab(tab.id);
                            setIsMobileMenuSheetOpen(false);
                            setMobileMenuSearch('');
                          }}
                          className={cn(
                            "w-full flex items-center justify-between p-3 text-left transition-all active:scale-[0.98] border",
                            isIphoneNav ? "rounded-[20px]" : "rounded-2xl",
                            isActive 
                              ? "bg-theme-100/90 border-theme-300 text-theme-900 shadow-xs" 
                              : "bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-800"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-10 h-10 flex items-center justify-center shrink-0 transition-all",
                              isIphoneNav ? "rounded-[13px]" : "rounded-xl",
                              isActive 
                                ? "bg-theme-500 text-white shadow-xs" 
                                : "bg-neutral-100 text-neutral-700"
                            )}>
                              <tab.icon className="w-5 h-5" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                                <span className="truncate">{tab.label}</span>
                                {isActive && (
                                  <span className="px-1.5 py-0.5 rounded bg-theme-200 text-theme-800 text-[10px] font-bold">
                                    Aktif
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-neutral-500 truncate mt-0.5">
                                {tab.desc}
                              </p>
                            </div>
                          </div>

                          {/* Right Badge / Arrow */}
                          <div className="flex items-center gap-2 shrink-0 pl-2">
                            {tab.badge !== undefined && tab.badge > 0 ? (
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[11px] font-bold shadow-xs",
                                tab.badgeColor || "bg-amber-500 text-white"
                              )}>
                                {tab.badge}
                              </span>
                            ) : (
                              <ChevronRight className="w-4 h-4 text-neutral-400" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sheet Footer */}
          <div className="p-3 border-t border-theme-200 bg-neutral-50 flex items-center justify-between text-xs text-neutral-600 shrink-0">
            <span className="font-medium text-[11px]">
              Daily Report Pro <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">v3.2.0</span> · © 2026 Denuda
            </span>
            <button
              onClick={() => {
                setActiveTab('settings');
                setIsMobileMenuSheetOpen(false);
                setMobileMenuSearch('');
              }}
              className="text-[11px] font-bold text-theme-700 hover:underline flex items-center gap-1"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Pengaturan & Hak Cipta</span>
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={cn(
      "flex h-screen bg-theme-50 text-theme-800 font-sans",
      navPos === 'right' ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Sidebar Desktop & Mobile (left/right mode) */}
      {(navPos === 'left' || navPos === 'right') ? renderSidebar() : (
        <div className="hidden md:block h-full">
          {renderSidebar()}
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative",
        navPos === 'bottom'
          ? (isFloatingMobileNav ? 'pb-24 md:pb-0' : 'pb-20 md:pb-0')
          : 'pb-16 md:pb-0'
      )}>
        {/* Header (Fully Responsive on Mobile, Tablet & Desktop) */}
        <header className={cn(
          "min-h-14 sm:min-h-16 md:min-h-18 h-auto py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-3 lg:gap-4 px-3 sm:px-5 lg:px-8 border-b border-theme-200 bg-white shrink-0 shadow-xs z-20 transition-all duration-300",
          isIphoneNav && "md:mx-3 md:mt-3 md:rounded-[1.75rem] md:border",
          isWindows11Nav && "md:mx-2.5 md:mt-2.5 md:rounded-2xl md:border",
          isUbuntuNav && "md:border-b"
        )}>
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            {/* Hamburger / Menu button on mobile */}
            <button 
              className={cn(
                "md:hidden p-2 min-w-[40px] min-h-[40px] flex items-center justify-center active:scale-95 transition-all shrink-0",
                isIphoneNav
                  ? "rounded-2xl text-theme-800 bg-theme-100/70 hover:bg-theme-200"
                  : isWindows11Nav
                    ? "rounded-lg text-neutral-700 bg-neutral-100/90 hover:bg-neutral-200/80 border border-neutral-200"
                    : isUbuntuNav
                      ? "rounded-xl text-white bg-[#300A24] hover:bg-[#461136]"
                      : "rounded-xl text-theme-800 bg-theme-100/70 hover:bg-theme-200"
              )}
              onClick={() => {
                if (navPos === 'left' || navPos === 'right') {
                  setIsSidebarOpen(true);
                } else {
                  setIsMobileMenuSheetOpen(true);
                }
              }}
              aria-label="Buka Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Logo on tablet/desktop */}
            <div className="hidden md:flex items-center gap-2 mr-0.5 shrink-0">
              {settings.companyIcon ? (
                <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center overflow-hidden shadow-sm border border-theme-200 shrink-0">
                  <img src={settings.companyIcon} alt={settings.companyName || 'Logo'} className="w-full h-full object-contain p-0.5" />
                </div>
              ) : (
                <div className="w-9 h-9 bg-theme-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
                  {(settings.companyName?.trim() || 'ReportPro').charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Current Active Page Title & Unclipped Company Name */}
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <div className="p-1.5 bg-theme-100 text-theme-800 rounded-xl hidden sm:flex shrink-0">
                <currentTab.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0 flex-1">
                {settings.companyName?.trim() && (
                  <span className="block text-[10px] sm:text-xs font-extrabold text-theme-700 leading-snug whitespace-normal break-words mb-0.5">
                    {settings.companyName.trim()}
                  </span>
                )}
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <h1 className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold text-neutral-900 leading-tight break-words">
                    {currentTab.label}
                  </h1>
                  {currentTab.badge !== undefined && currentTab.badge > 0 && (
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0",
                      currentTab.badgeColor || "bg-amber-500 text-white"
                    )}>
                      {currentTab.badge}
                    </span>
                  )}
                </div>
                <p className="text-[11px] lg:text-xs text-neutral-500 hidden sm:block whitespace-normal break-words">
                  {currentTab.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Utilities: Alert Badges, PWA Install, Clock */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 shrink-0">
            {/* Quick alert badge shortcut if items expired/low stock */}
            {(nearExpiredCount > 0 || lowStockCount > 0) && (
              <button
                onClick={() => setActiveTab(nearExpiredCount > 0 ? 'expired' : 'lowstock')}
                className="flex items-center gap-1 px-2 py-1.5 sm:py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-[11px] sm:text-xs font-bold transition-all shadow-2xs active:scale-95 shrink-0"
                title="Lihat peringatan stok"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                <span className="hidden lg:inline">Peringatan:</span>
                <span>{nearExpiredCount + lowStockCount}</span>
              </button>
            )}

            <PWAInstallButton />
            <Clock />
          </div>
        </header>

        {/* Quota Exceeded Notification Banner */}
        {quotaExceededInfo?.isExceeded && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs shrink-0 z-10">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-amber-100 text-amber-800 rounded-lg shrink-0 mt-0.5 sm:mt-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-900">
                  Batas Kuota Harian Firebase Firestore Tercapai (Free Tier)
                </h4>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  Batas penulisan gratis harian (20.000 unit tulis/hari) untuk Firebase Firestore telah habis hari ini dan akan di-reset otomatis besok. Anda dapat beralih ke Mode Lokal Offline agar tetap dapat menambah atau memperbarui data hari ini.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              <button
                type="button"
                onClick={() => setShowLocalSwitchPinModal(true)}
                className="px-3 py-1.5 bg-amber-700 hover:bg-amber-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
              >
                Beralih ke Offline
              </button>
              <a
                href={quotaExceededInfo.upgradeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-50 text-amber-900 rounded-xl text-xs font-semibold transition-all"
              >
                Upgrade Project
              </a>
              <button
                type="button"
                onClick={dismissQuotaAlert}
                className="p-1.5 text-amber-700 hover:text-amber-900 rounded-lg hover:bg-amber-100 transition-colors"
                title="Tutup pemberitahuan"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-4 md:p-5 lg:p-6 xl:p-8 relative">
          <div className="max-w-[1600px] 2xl:max-w-none mx-auto sm:h-full min-w-0">
            <div className={cn("h-full", activeTab === 'dashboard' ? "block" : "hidden")}>
              <Dashboard />
            </div>
            <div className={cn("h-full", activeTab === 'master' ? "block" : "hidden")}>
              <MasterData />
            </div>
            <div className={cn("sm:h-full", activeTab === 'report' ? "block" : "hidden")}>
              <DailyReport />
            </div>
            <div className={cn("h-full", activeTab === 'arrived' ? "block" : "hidden")}>
              <ArrivedRecap />
            </div>
            <div className={cn("h-full", activeTab === 'stockout' ? "block" : "hidden")}>
              <StockOut />
            </div>
            <div className={cn("h-full", activeTab === 'kosong' ? "block" : "hidden")}>
              <KosongPabrikRecap />
            </div>
            <div className={cn("h-full", activeTab === 'lowstock' ? "block" : "hidden")}>
              <LowStockRecap />
            </div>
            <div className={cn("h-full", activeTab === 'expired' ? "block" : "hidden")}>
              <NearExpiredRecap />
            </div>
            <div className={cn("h-full", activeTab === 'settings' ? "block" : "hidden")}>
              <SettingsView onNavigateTab={setActiveTab} />
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Nav for mobile */}
      {navPos === 'bottom' && renderBottomNav()}

      {/* Slide-up Mobile Navigation Drawer */}
      {renderMobileMenuSheet()}

      <ChatBox />

      <DbPinModal
        isOpen={showLocalSwitchPinModal}
        targetProviderName="Offline / Lokal Browser (IndexedDB)"
        storedPinHash={settings.dbPinHash}
        onSuccess={() => {
          setShowLocalSwitchPinModal(false);
          switchToLocalDb();
        }}
        onCancel={() => setShowLocalSwitchPinModal(false)}
      />
    </div>
  );
};

