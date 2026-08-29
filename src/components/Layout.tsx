import React, { useState } from 'react';
import { LayoutDashboard, Package, FileText, Settings, Menu, X, Download, LogOut, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { MasterData } from './MasterData';
import { DailyReport } from './DailyReport';
import { useAppContext } from '../store/AppContext';

export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { logout, resetAllData } = useAppContext();

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'report', label: 'Daily Report', icon: FileText },
  ];

  return (
    <div className="flex h-screen bg-[#F9FAF6] text-[#3A3D32] font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-neutral-900/50 z-20 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 left-0 z-30 w-64 bg-[#E9EDDE] border-r border-[#D9DED0] transform transition-transform duration-200 ease-in-out flex flex-col p-4 md:p-6",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
      )}>
        <div className="flex items-center justify-between md:mb-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B9D77] rounded-xl flex items-center justify-center text-white font-bold text-xl">R</div>
            <span className="font-bold text-lg tracking-tight">ReportPro</span>
          </div>
          <button className="md:hidden p-2 -mr-2 text-neutral-500 hover:text-neutral-700" onClick={() => setIsSidebarOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setIsSidebarOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-colors",
                activeTab === tab.id 
                  ? "bg-[#DCE2CD] text-[#556B2F] font-medium" 
                  : "text-[#7A7F6E] hover:bg-[#F1F3E9]"
              )}
            >
              <tab.icon className={cn("w-5 h-5", activeTab !== tab.id && "opacity-70")} />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-[#D9DED0] hidden md:block">
          <div className="bg-[#8B9D77] text-white p-4 rounded-2xl flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase opacity-80">Workspace</span>
            <p className="text-sm leading-tight">Manage daily reports and track active suppliers.</p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-[#E2E4D8] bg-white shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="md:hidden p-2 -ml-2 text-neutral-500 hover:text-neutral-700 rounded-lg hover:bg-neutral-100"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-[#2D3025] capitalize">
                {activeTab.replace('-', ' ')}
              </h1>
              <p className="text-sm text-[#7A7F6E] hidden sm:block">Welcome back. Here is your current view.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                if (window.confirm("Are you sure you want to reset ALL data? This will permanently delete your products, suppliers, and reports.")) {
                  resetAllData();
                }
              }}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Reset All Data"
            >
              <span className="hidden sm:inline font-medium">Reset Data</span>
              <Trash2 className="w-4 h-4" />
            </button>
            <button 
              onClick={logout}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-[#7A7F6E] hover:text-[#2D3025] hover:bg-[#F1F3E9] rounded-lg transition-colors"
              title="Sign out"
            >
              <span className="hidden sm:inline font-medium">Sign Out</span>
              <LogOut className="w-4 h-4" />
            </button>
            <div className="w-10 h-10 bg-[#E9EDDE] rounded-full border border-[#D9DED0] flex items-center justify-center text-[#556B2F] font-bold">
              U
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-6xl mx-auto h-full">
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'master' && <MasterData />}
            {activeTab === 'report' && <DailyReport />}
          </div>
        </div>
      </main>
    </div>
  );
};
