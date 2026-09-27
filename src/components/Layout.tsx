import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Package, FileText, Settings, Menu, X, Trash2, PackageOpen, ChevronLeft, ChevronRight, Factory } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { MasterData } from './MasterData';
import { DailyReport } from './DailyReport';
import { ArrivedRecap } from './ArrivedRecap';
import { StockOut } from './StockOut';
import { PackageMinus } from 'lucide-react';
import { KosongPabrikRecap } from './KosongPabrikRecap';
import { LowStockRecap } from './LowStockRecap';
import { AlertTriangle } from 'lucide-react';
import { SettingsView } from './SettingsView';
import { Clock } from './Clock';
import { useAppContext } from '../store/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ChatBox } from './ChatBox';

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'lowstock' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const { settings, resetAllData, quotaExceededInfo, dismissQuotaAlert, switchToLocalDb } = useAppContext();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme || 'default');
  }, [settings.theme]);

  const navPos = settings?.navbarPosition || 'bottom'; // Default bottom for mobile minimalist feel

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'report', label: 'Daily Report', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'stockout', label: 'Pengeluaran', icon: PackageMinus },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'lowstock', label: 'Stok Menipis', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderSidebar = () => (
    <>
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 z-30 bg-theme-100 transform transition-all duration-300 ease-in-out flex flex-col p-4 md:p-6 shrink-0",
        isDesktopSidebarCollapsed ? "md:w-24 w-64" : "w-64",
        navPos === 'right' ? "right-0 border-l border-theme-300" : "left-0 border-r border-theme-300",
        isSidebarOpen 
          ? "translate-x-0" 
          : (navPos === 'right' ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0")
      )}>
        <div className={cn("flex items-center md:mb-10 mb-6", isDesktopSidebarCollapsed ? "md:justify-center justify-between" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-theme-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">R</div>
            <span className={cn("font-bold text-lg tracking-tight transition-opacity duration-300 whitespace-nowrap", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>ReportPro</span>
          </div>
          <button className="md:hidden p-2 -mr-2 text-neutral-500 hover:text-neutral-700" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto overflow-x-hidden">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsSidebarOpen(false);
              }}
              title={isDesktopSidebarCollapsed ? tab.label : undefined}
              className={cn(
                "group w-full flex items-center rounded-xl text-sm transition-all duration-300",
                isDesktopSidebarCollapsed ? "md:justify-center md:px-0 md:py-3 px-4 py-3" : "px-4 py-3 gap-3",
                activeTab === tab.id 
                  ? "bg-theme-300 text-theme-700 font-medium shadow-sm" 
                  : "text-theme-600-text hover:bg-theme-100 active:scale-[0.98]"
              )}
            >
              <tab.icon className={cn("w-5 h-5 transition-transform duration-300 shrink-0", activeTab === tab.id ? "scale-110" : "opacity-70 group-hover:scale-110")} />
              <span className={cn("whitespace-nowrap transition-opacity duration-300", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-theme-300 hidden md:flex md:flex-col md:items-center">
          <button 
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 text-theme-600-text hover:bg-theme-300 hover:text-theme-700 rounded-xl transition-all duration-300 mb-4 bg-theme-100"
            title={isDesktopSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {isDesktopSidebarCollapsed ? (navPos === 'right' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />) : (navPos === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
          </button>
          
          <div className={cn("bg-theme-500 text-white rounded-2xl flex flex-col gap-2 shadow-sm transition-all duration-300 overflow-hidden", isDesktopSidebarCollapsed ? "h-0 p-0 opacity-0" : "p-4 h-auto opacity-100")}>
            <span className="text-xs font-semibold uppercase opacity-80 whitespace-nowrap">Workspace</span>
            <p className="text-sm leading-tight">Manage daily reports and track active suppliers.</p>
          </div>
        </div>
      </aside>
    </>
  );

  const renderBottomNav = () => (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-theme-200 z-30 flex justify-around items-center px-2 py-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as any)}
          className={cn(
            "group flex flex-col items-center justify-center w-16 h-14 rounded-2xl transition-all duration-300 active:scale-95",
            activeTab === tab.id ? "text-theme-700" : "text-theme-600-text"
          )}
        >
          <div className={cn(
            "p-1.5 rounded-xl transition-colors duration-300",
            activeTab === tab.id ? "bg-theme-300" : "bg-transparent group-hover:bg-theme-100"
          )}>
            <tab.icon className={cn(
              "w-5 h-5 transition-transform duration-300",
              activeTab === tab.id ? "scale-110" : "group-hover:scale-110"
            )} />
          </div>
          <span className={cn(
            "text-[10px] mt-1 font-medium transition-all",
            activeTab === tab.id ? "opacity-100 font-bold" : "opacity-70"
          )}>{tab.label.split(' ')[0]}</span>
        </button>
      ))}
    </nav>
  );

  return (
    <div className={cn(
      "flex h-screen bg-theme-50 text-theme-800 font-sans",
      navPos === 'right' ? 'flex-row-reverse' : 'flex-row'
    )}>
      {/* Sidebar - Show if left/right, OR show on desktop even if bottom (desktop always has sidebar) */}
      {(navPos === 'left' || navPos === 'right') ? renderSidebar() : (
        <div className="hidden md:block h-full">
          {renderSidebar()}
        </div>
      )}

      {/* Main Content */}
      <main className={cn(
        "flex-1 flex flex-col min-w-0 overflow-hidden relative",
        navPos === 'bottom' ? 'pb-16 md:pb-0' : ''
      )}>
        {/* Header */}
        <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-theme-200 bg-white shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3 md:gap-4">
            {/* Show hamburger only if not bottom nav on mobile */}
            {(navPos === 'left' || navPos === 'right') && (
              <button 
                className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100 active:scale-95 transition-transform"
                onClick={() => setIsSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            
            {/* If bottom nav on mobile, maybe show Logo in header on mobile? */}
            {navPos === 'bottom' && (
              <div className="md:hidden flex items-center gap-2 mr-2">
                <div className="w-8 h-8 bg-theme-500 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">R</div>
              </div>
            )}

            <div>
              <h1 className="text-xl md:text-2xl font-bold text-theme-900 capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-xs md:text-sm text-theme-600-text hidden sm:block">Welcome back. Here is your current view.</p>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
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
                onClick={switchToLocalDb}
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
        <div className="flex-1 overflow-y-auto p-3 md:p-8 relative">
          <div className="max-w-[1600px] 2xl:max-w-none mx-auto h-full">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'master' && <MasterData />}
            {activeTab === 'report' && <DailyReport />}
            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'stockout' && <StockOut />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'lowstock' && <LowStockRecap />}
            {activeTab === 'settings' && <SettingsView />}
          </div>
        </div>
      </main>

      {/* Bottom Nav for mobile */}
      {navPos === 'bottom' && renderBottomNav()}
      <ChatBox />
    </div>
  );
};
