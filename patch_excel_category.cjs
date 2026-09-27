const fs = require('fs');
const file = 'src/lib/excel.ts';
let code = fs.readFileSync(file, 'utf-8');

const tplSearch1 = `          'Stok': p.stock !== undefined ? p.stock : '',
          'Lokasi': p.location || ''`;
const tplReplace1 = `          'Stok': p.stock !== undefined ? p.stock : '',
          'Lokasi': p.location || '',
          'Kategori': p.category || ''`;
code = code.replace(tplSearch1, tplReplace1);

const tplSearch2 = `        { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier', 'Butom Stok': 30, 'Stok': 100, 'Lokasi': 'Rak A1' },
        { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya', 'Butom Stok': 10, 'Stok': 50, 'Lokasi': 'Gudang' }`;
const tplReplace2 = `        { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier', 'Butom Stok': 30, 'Stok': 100, 'Lokasi': 'Rak A1', 'Kategori': 'Minuman' },
        { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya', 'Butom Stok': 10, 'Stok': 50, 'Lokasi': 'Gudang', 'Kategori': 'Minuman' }`;
code = code.replace(tplSearch2, tplReplace2);

const impSearch1 = `products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string }[]`;
const impReplace1 = `products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string, category?: string }[]`;
// This appears twice, so let's do global replace
code = code.split(impSearch1).join(impReplace1);

const impSearch2 = `const location = p.Lokasi || p.lokasi || p.location || '';`;
const impReplace2 = `const location = p.Lokasi || p.lokasi || p.location || '';
          const category = p.Kategori || p.kategori || p.Category || p.category || '';`;
code = code.replace(impSearch2, impReplace2);

const impSearch3 = `products.push({ name, unit, supplierName, bottomStock, stock, location });`;
const impReplace3 = `products.push({ name, unit, supplierName, bottomStock, stock, location, category });`;
code = code.replace(impSearch3, impReplace3);

fs.writeFileSync(file, code);
