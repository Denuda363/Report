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

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
  }, [settings.theme]);

  const navPos = settings?.navbarPosition || 'bottom'; // Default bottom for mobile

  // Real-time notification badge counts
  const nearExpiredCount = useMemo(() => {
    return (nearExpiredList || []).filter(item => !item.status || item.status === 'pending').length;
  }, [nearExpiredList]);

  const lowStockCount = useMemo(() => {
    return (products || []).filter(p => (p.stock ?? 0) <= (p.minStock ?? 5)).length;
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
          className="fixed inset-0 bg-neutral-900/60 backdrop-blur-xs z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar Desktop & Mobile */}
      <aside className={cn(
        "fixed md:static inset-y-0 z-40 bg-theme-100 transform transition-all duration-300 ease-in-out flex flex-col p-4 md:p-6 shrink-0",
        isDesktopSidebarCollapsed ? "md:w-24 w-72" : "w-72",
        navPos === 'right' ? "right-0 border-l border-theme-300" : "left-0 border-r border-theme-300",
        isSidebarOpen 
          ? "translate-x-0 shadow-2xl" 
          : (navPos === 'right' ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0")
      )}>
        <div className={cn("flex items-center md:mb-8 mb-6", isDesktopSidebarCollapsed ? "md:justify-center justify-between" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md shrink-0 ring-2 ring-white/50">R</div>
            <div className={cn("transition-opacity duration-300", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>
              <span className="font-bold text-lg tracking-tight block text-theme-900">ReportPro</span>
              <span className="text-[10px] text-theme-600-text font-medium uppercase tracking-wider block">Manajemen Stok</span>
            </div>
          </div>
          <button 
            className="md:hidden p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-theme-200 transition-colors" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden pr-1">
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
                  "group w-full flex items-center rounded-2xl text-sm transition-all duration-200 relative",
                  isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-3.5 px-4 py-3" : "px-4 py-3 gap-3",
                  isActive 
                    ? "bg-theme-500 text-white font-semibold shadow-sm" 
                    : "text-theme-700 hover:bg-theme-200/70 hover:text-theme-900 active:scale-[0.98]"
                )}
              >
                <tab.icon className={cn(
                  "w-5 h-5 transition-transform duration-200 shrink-0", 
                  isActive ? "text-white" : "opacity-80 group-hover:scale-110"
                )} />
                <span className={cn("whitespace-nowrap transition-opacity duration-300 flex-1 text-left", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>
                  {tab.label}
                </span>

                {/* Badge if available */}
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 transition-all",
                    isActive ? "bg-white text-theme-800" : (tab.badgeColor || "bg-amber-500 text-white"),
                    isDesktopSidebarCollapsed ? "md:absolute md:top-2 md:right-2 md:p-1 md:w-2 md:h-2 md:rounded-full md:text-[0px]" : ""
                  )}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        
        <div className="mt-auto pt-4 border-t border-theme-300 hidden md:flex md:flex-col md:items-center">
          <button 
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 text-theme-600-text hover:bg-theme-200 hover:text-theme-900 rounded-xl transition-all duration-300 mb-3 bg-theme-100"
            title={isDesktopSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {isDesktopSidebarCollapsed ? (navPos === 'right' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />) : (navPos === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
          </button>
          
          <div className={cn("bg-theme-500 text-white rounded-2xl flex flex-col gap-1.5 shadow-sm transition-all duration-300 overflow-hidden", isDesktopSidebarCollapsed ? "h-0 p-0 opacity-0" : "p-4 h-auto opacity-100 w-full")}>
            <span className="text-[11px] font-semibold uppercase tracking-wider opacity-85">Database Status</span>
            <p className="text-xs font-medium leading-relaxed">
              {dbProvider === 'firebase' ? 'Google Firestore Online' : dbProvider === 'supabase' ? 'Supabase Online' : 'Penyimpanan Lokal Offline'}
            </p>
          </div>
          {!isDesktopSidebarCollapsed && (
            <div className="mt-2.5 text-center text-[10px] text-theme-600-text/80 font-medium">
              Daily Report Pro <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded">v3.2.0</span> • © 2026 <strong className="text-theme-900 font-bold">Denuda</strong>
            </div>
          )}
        </div>
      </aside>
    </>
  );

  // Modern Ergonomic Mobile Bottom Nav
  const renderBottomNav = () => (
    <nav 
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-theme-200 z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.08)] px-1 py-1 pb-safe"
    >
      <div className="grid grid-cols-5 items-center justify-items-stretch max-w-lg mx-auto">
        {/* Slot 1: Dashboard */}
        {(() => {
          const tab = tabs.find(t => t.id === 'dashboard')!;
          const isActive = activeTab === 'dashboard';
          return (
            <button
              key="mobile-dashboard"
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 active:scale-90 relative",
                isActive ? "text-theme-800" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-transparent"
              )}>
                <tab.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5",
                isActive ? "font-bold text-theme-900" : "font-medium"
              )}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })()}

        {/* Slot 2: Daily Report */}
        {(() => {
          const tab = tabs.find(t => t.id === 'report')!;
          const isActive = activeTab === 'report';
          return (
            <button
              key="mobile-report"
              onClick={() => setActiveTab('report')}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 active:scale-90 relative",
                isActive ? "text-theme-800" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-transparent"
              )}>
                <tab.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5",
                isActive ? "font-bold text-theme-900" : "font-medium"
              )}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })()}

        {/* Slot 3: Barang Datang */}
        {(() => {
          const tab = tabs.find(t => t.id === 'arrived')!;
          const isActive = activeTab === 'arrived';
          return (
            <button
              key="mobile-arrived"
              onClick={() => setActiveTab('arrived')}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 active:scale-90 relative",
                isActive ? "text-theme-800" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-transparent"
              )}>
                <tab.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5",
                isActive ? "font-bold text-theme-900" : "font-medium"
              )}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })()}

        {/* Slot 4: Pengeluaran */}
        {(() => {
          const tab = tabs.find(t => t.id === 'stockout')!;
          const isActive = activeTab === 'stockout';
          return (
            <button
              key="mobile-stockout"
              onClick={() => setActiveTab('stockout')}
              className={cn(
                "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 active:scale-90 relative",
                isActive ? "text-theme-800" : "text-neutral-500 hover:text-neutral-800"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all",
                isActive ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-transparent"
              )}>
                <tab.icon className={cn("w-5 h-5 transition-transform", isActive ? "scale-110" : "")} />
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5",
                isActive ? "font-bold text-theme-900" : "font-medium"
              )}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })()}

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
                "flex flex-col items-center justify-center py-1.5 px-0.5 rounded-xl transition-all duration-200 active:scale-90 relative",
                isCurrentInSecondary ? "text-theme-800" : "text-neutral-600 hover:text-neutral-900"
              )}
            >
              <div className={cn(
                "p-1.5 rounded-xl transition-all relative",
                isCurrentInSecondary ? "bg-theme-200 text-theme-900 shadow-xs" : "bg-neutral-100"
              )}>
                {React.createElement(displayIcon, {
                  className: cn("w-5 h-5 transition-transform", isCurrentInSecondary ? "scale-110" : "")
                })}
                {/* Total alert dot badge */}
                {totalAlerts > 0 && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full animate-pulse" />
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-0.5 tracking-tight transition-all truncate max-w-full px-0.5 flex items-center gap-0.5",
                isCurrentInSecondary ? "font-bold text-theme-900" : "font-medium"
              )}>
                {displayLabel}
                <ChevronDown className="w-2.5 h-2.5 opacity-60" />
              </span>
            </button>
          );
        })()}
      </div>
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
          className="fixed inset-0 bg-neutral-950/60 backdrop-blur-xs transition-opacity"
          onClick={() => {
            setIsMobileMenuSheetOpen(false);
            setMobileMenuSearch('');
          }}
        />

        {/* Sheet Content */}
        <div className="relative bg-white rounded-t-3xl border-t border-theme-200 shadow-2xl max-h-[85vh] flex flex-col z-10 overflow-hidden">
          {/* Drag Handle & Header */}
          <div className="p-4 pb-2 border-b border-theme-200/80 bg-theme-50/70 shrink-0">
            <div className="w-12 h-1.5 bg-neutral-300 rounded-full mx-auto mb-3" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-theme-500 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  <LayoutGrid className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-neutral-900 text-base leading-tight">Semua Fitur & Menu</h3>
                  <p className="text-[11px] text-neutral-500">Pilih menu navigasi cepat ReportPro</p>
                </div>
              </div>
              <button 
                onClick={() => {
                  setIsMobileMenuSheetOpen(false);
                  setMobileMenuSearch('');
                }}
                className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors"
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
                className="w-full pl-9 pr-8 py-2 bg-white border border-theme-200 rounded-xl text-xs font-medium placeholder:text-neutral-400 outline-none focus:border-theme-500 focus:ring-2 focus:ring-theme-100 transition-all"
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
                            "w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all active:scale-[0.98] border",
                            isActive 
                              ? "bg-theme-100/90 border-theme-300 text-theme-900 shadow-xs" 
                              : "bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-800"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all",
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
        navPos === 'bottom' ? 'pb-20 md:pb-0' : 'pb-16 md:pb-0'
      )}>
        {/* Header (Fully Responsive on Mobile & Desktop) */}
        <header className="h-16 md:h-20 flex items-center justify-between px-3 md:px-8 border-b border-theme-200 bg-white shrink-0 shadow-xs z-20">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            {/* Hamburger / Menu button on mobile */}
            <button 
              className="md:hidden p-2 rounded-xl text-theme-800 bg-theme-100/70 hover:bg-theme-200 active:scale-95 transition-all shrink-0"
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
            
            {/* Logo on desktop or when compact */}
            <div className="hidden md:flex items-center gap-2 mr-1">
              <div className="w-9 h-9 bg-theme-500 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-sm">
                R
              </div>
            </div>

            {/* Current Active Page Title with proper Indonesian label and icon */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 bg-theme-100 text-theme-800 rounded-xl hidden sm:flex shrink-0">
                <currentTab.icon className="w-4 h-4 md:w-5 md:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h1 className="text-base sm:text-xl md:text-2xl font-bold text-neutral-900 truncate">
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
                <p className="text-xs text-neutral-500 hidden sm:block truncate">
                  {currentTab.desc}
                </p>
              </div>
            </div>
          </div>

          {/* Right Header Utilities: Alert Badges, PWA Install, Clock */}
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            {/* Quick alert badge shortcut on mobile if items expired/low stock */}
            {(nearExpiredCount > 0 || lowStockCount > 0) && (
              <button
                onClick={() => setActiveTab(nearExpiredCount > 0 ? 'expired' : 'lowstock')}
                className="hidden xs:flex items-center gap-1 px-2 py-1 rounded-xl bg-red-50 border border-red-200 text-red-700 hover:bg-red-100 text-xs font-bold transition-all shadow-2xs active:scale-95"
                title="Lihat peringatan stok"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-600" />
                <span className="hidden sm:inline">Peringatan:</span>
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
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-8 relative">
          <div className="max-w-[1600px] 2xl:max-w-none mx-auto h-full">
            <div className={cn("h-full", activeTab === 'dashboard' ? "block" : "hidden")}>
              <Dashboard />
            </div>
            <div className={cn("h-full", activeTab === 'master' ? "block" : "hidden")}>
              <MasterData />
            </div>
            <div className={cn("h-full", activeTab === 'report' ? "block" : "hidden")}>
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

