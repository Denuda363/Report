const fs = require('fs');
const file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Imports
const importSearch = `import { KosongPabrikRecap } from './KosongPabrikRecap';`;
const importReplace = `import { KosongPabrikRecap } from './KosongPabrikRecap';
import { LowStockRecap } from './LowStockRecap';
import { AlertTriangle } from 'lucide-react';`;
if (!code.includes('LowStockRecap')) {
  code = code.replace(importSearch, importReplace);
}

// Tabs
const tabsSearch = `    { id: 'stockout', label: 'Pengeluaran', icon: PackageMinus },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'settings', label: 'Settings', icon: Settings },`;
const tabsReplace = `    { id: 'stockout', label: 'Pengeluaran', icon: PackageMinus },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },
    { id: 'lowstock', label: 'Stok Menipis', icon: AlertTriangle },
    { id: 'settings', label: 'Settings', icon: Settings },`;
code = code.replace(tabsSearch, tabsReplace);

// Route switch
const routeSearch = `            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'settings' && <SettingsView />}`;
const routeReplace = `            {activeTab === 'kosong' && <KosongPabrikRecap />}
            {activeTab === 'lowstock' && <LowStockRecap />}
            {activeTab === 'settings' && <SettingsView />}`;
code = code.replace(routeSearch, routeReplace);

fs.writeFileSync(file, code);
