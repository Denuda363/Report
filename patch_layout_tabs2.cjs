const fs = require('fs');
const file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `import { ArrivedRecap } from './ArrivedRecap';`;
const importReplace = `import { ArrivedRecap } from './ArrivedRecap';\nimport { StockOut } from './StockOut';\nimport { PackageMinus } from 'lucide-react';`;
if (!code.includes('import { StockOut }')) {
  code = code.replace(importSearch, importReplace);
}

const typeSearch = `useState<'dashboard' | 'master' | 'report' | 'arrived' | 'kosong' | 'settings'>('dashboard');`;
const typeReplace = `useState<'dashboard' | 'master' | 'report' | 'arrived' | 'stockout' | 'kosong' | 'settings'>('dashboard');`;
code = code.replace(typeSearch, typeReplace);

const navSearch = `    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },`;
const navReplace = `    { id: 'arrived', label: 'Barang Datang', icon: PackageOpen },
    { id: 'stockout', label: 'Pengeluaran', icon: PackageMinus },
    { id: 'kosong', label: 'Kosong Pabrik', icon: Factory },`;
code = code.replace(navSearch, navReplace);

const contentSearch = `            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}`;
const contentReplace = `            {activeTab === 'arrived' && <ArrivedRecap />}
            {activeTab === 'stockout' && <StockOut />}
            {activeTab === 'kosong' && <KosongPabrikRecap />}`;
code = code.replace(contentSearch, contentReplace);

fs.writeFileSync(file, code);
console.log("Patched successfully");
