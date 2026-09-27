const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const importOld = `import { useState } from 'react';
import { Menu, X, LayoutDashboard, Package, FileText, Settings, Trash2, PackageOpen } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { MasterData } from './MasterData';
import { DailyReport } from './DailyReport';
import { ArrivedRecap } from './ArrivedRecap';
import { SettingsView } from './SettingsView';
import { Clock } from './Clock';
import { useAppContext } from '../store/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ChatBox } from './ChatBox';`;

const importNew = `import { useState } from 'react';
import { Menu, X, LayoutDashboard, Package, FileText, Settings, Trash2, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';
import { Dashboard } from './Dashboard';
import { MasterData } from './MasterData';
import { DailyReport } from './DailyReport';
import { ArrivedRecap } from './ArrivedRecap';
import { SettingsView } from './SettingsView';
import { Clock } from './Clock';
import { useAppContext } from '../store/AppContext';
import { PWAInstallButton } from './PWAInstallButton';
import { ChatBox } from './ChatBox';`;

code = code.replace(importOld, importNew);

const stateOld = `export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report' | 'arrived' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { settings, resetAllData } = useAppContext();`;

const stateNew = `export const Layout = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report' | 'arrived' | 'settings'>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const { settings, resetAllData } = useAppContext();`;

code = code.replace(stateOld, stateNew);

const sidebarOld = `      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 z-30 w-64 bg-[#E9EDDE] transform transition-transform duration-200 ease-in-out flex flex-col p-4 md:p-6",
        navPos === 'right' ? "right-0 border-l border-[#D9DED0]" : "left-0 border-r border-[#D9DED0]",
        isSidebarOpen 
          ? "translate-x-0" 
          : (navPos === 'right' ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0")
      )}>
        <div className="flex items-center justify-between md:mb-10 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B9D77] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm">R</div>
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
                "group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300",
                activeTab === tab.id 
                  ? "bg-[#DCE2CD] text-[#556B2F] font-medium shadow-sm" 
                  : "text-[#7A7F6E] hover:bg-[#F1F3E9] active:scale-[0.98]"
              )}
            >
              <tab.icon className={cn("w-5 h-5 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "opacity-70 group-hover:scale-110")} />
              {tab.label}
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-[#D9DED0] hidden md:block">
          <div className="bg-[#8B9D77] text-white p-4 rounded-2xl flex flex-col gap-2 shadow-sm">
            <span className="text-xs font-semibold uppercase opacity-80">Workspace</span>
            <p className="text-sm leading-tight">Manage daily reports and track active suppliers.</p>
          </div>
        </div>
      </aside>`;

const sidebarNew = `      {/* Sidebar */}
      <aside className={cn(
        "fixed md:static inset-y-0 z-30 bg-[#E9EDDE] transform transition-all duration-300 ease-in-out flex flex-col p-4 md:p-6 shrink-0",
        isDesktopSidebarCollapsed ? "md:w-24 w-64" : "w-64",
        navPos === 'right' ? "right-0 border-l border-[#D9DED0]" : "left-0 border-r border-[#D9DED0]",
        isSidebarOpen 
          ? "translate-x-0" 
          : (navPos === 'right' ? "translate-x-full md:translate-x-0" : "-translate-x-full md:translate-x-0")
      )}>
        <div className={cn("flex items-center md:mb-10 mb-6", isDesktopSidebarCollapsed ? "md:justify-center justify-between" : "justify-between")}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B9D77] rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-sm shrink-0">R</div>
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
                  ? "bg-[#DCE2CD] text-[#556B2F] font-medium shadow-sm" 
                  : "text-[#7A7F6E] hover:bg-[#F1F3E9] active:scale-[0.98]"
              )}
            >
              <tab.icon className={cn("w-5 h-5 transition-transform duration-300 shrink-0", activeTab === tab.id ? "scale-110" : "opacity-70 group-hover:scale-110")} />
              <span className={cn("whitespace-nowrap transition-opacity duration-300", isDesktopSidebarCollapsed ? "md:hidden" : "block")}>{tab.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="mt-auto pt-6 border-t border-[#D9DED0] hidden md:flex md:flex-col md:items-center">
          <button 
            onClick={() => setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed)}
            className="w-full flex items-center justify-center p-3 text-[#7A7F6E] hover:bg-[#DCE2CD] hover:text-[#556B2F] rounded-xl transition-all duration-300 mb-4 bg-[#F1F3E9]"
            title={isDesktopSidebarCollapsed ? "Perbesar Sidebar" : "Perkecil Sidebar"}
          >
            {isDesktopSidebarCollapsed ? (navPos === 'right' ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />) : (navPos === 'right' ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />)}
          </button>
          
          <div className={cn("bg-[#8B9D77] text-white rounded-2xl flex flex-col gap-2 shadow-sm transition-all duration-300 overflow-hidden", isDesktopSidebarCollapsed ? "h-0 p-0 opacity-0" : "p-4 h-auto opacity-100")}>
            <span className="text-xs font-semibold uppercase opacity-80 whitespace-nowrap">Workspace</span>
            <p className="text-sm leading-tight">Manage daily reports and track active suppliers.</p>
          </div>
        </div>
      </aside>`;

code = code.replace(sidebarOld, sidebarNew);

fs.writeFileSync('src/components/Layout.tsx', code);
