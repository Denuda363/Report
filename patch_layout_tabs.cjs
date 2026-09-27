const fs = require('fs');
const file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `import { ArrivedRecap } from './ArrivedRecap';`;
const importReplace = `import { ArrivedRecap } from './ArrivedRecap';
import { StockOut } from './StockOut';
import { PackageMinus } from 'lucide-react';`;
code = code.replace(importSearch, importReplace);

const typeSearch = `type Tab = 'dashboard' | 'master' | 'daily' | 'arrived' | 'kosong' | 'settings';`;
const typeReplace = `type Tab = 'dashboard' | 'master' | 'daily' | 'arrived' | 'stockout' | 'kosong' | 'settings';`;
code = code.replace(typeSearch, typeReplace);

const navItemsSearch = `  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'daily', label: 'Order Harian', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;`;
const navItemsReplace = `  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'daily', label: 'Order Harian', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'stockout', label: 'Pengeluaran', icon: PackageMinus },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'settings', label: 'Pengaturan', icon: Settings },
  ] as const;`;
code = code.replace(navItemsSearch, navItemsReplace);

const contentSearch = `            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'master' && <MasterData />}
            {activeTab === 'daily' && <DailyReport />}
            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'settings' && <SettingsView />}`;
const contentReplace = `            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'master' && <MasterData />}
            {activeTab === 'daily' && <DailyReport />}
            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'stockout' && <StockOut />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'settings' && <SettingsView />}`;
code = code.replace(contentSearch, contentReplace);

fs.writeFileSync(file, code);
