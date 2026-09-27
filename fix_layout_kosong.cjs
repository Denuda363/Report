const fs = require('fs');
let code = fs.readFileSync('src/components/Layout.tsx', 'utf8');

const importOld = `import { ArrivedRecap } from './ArrivedRecap';
import { SettingsView } from './SettingsView';`;

const importNew = `import { ArrivedRecap } from './ArrivedRecap';
import { KosongPabrikRecap } from './KosongPabrikRecap';
import { SettingsView } from './SettingsView';`;

code = code.replace(importOld, importNew);

const iconImportOld = `import { LayoutDashboard, Package, FileText, Settings, Menu, X, Trash2, PackageOpen, ChevronLeft, ChevronRight } from 'lucide-react';`;
const iconImportNew = `import { LayoutDashboard, Package, FileText, Settings, Menu, X, Trash2, PackageOpen, ChevronLeft, ChevronRight, Factory } from 'lucide-react';`;

code = code.replace(iconImportOld, iconImportNew);

const stateOld = `  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report' | 'arrived' | 'settings'>('dashboard');`;
const stateNew = `  const [activeTab, setActiveTab] = useState<'dashboard' | 'master' | 'report' | 'arrived' | 'kosong' | 'settings'>('dashboard');`;

code = code.replace(stateOld, stateNew);

const tabsOld = `  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'report', label: 'Daily Report', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];`;

const tabsNew = `  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'master', label: 'Master Data', icon: Package },
    { id: 'report', label: 'Daily Report', icon: FileText },
    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];`;

code = code.replace(tabsOld, tabsNew);

const routeOld = `            {activeTab === 'report' && <DailyReport />}
            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'settings' && <SettingsView />}`;

const routeNew = `            {activeTab === 'report' && <DailyReport />}
            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'settings' && <SettingsView />}`;

code = code.replace(routeOld, routeNew);

fs.writeFileSync('src/components/Layout.tsx', code);
