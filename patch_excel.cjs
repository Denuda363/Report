const fs = require('fs');
const file = 'src/lib/excel.ts';
let code = fs.readFileSync(file, 'utf-8');

const tplSearch1 = `        return {
          Name: p.name,
          Unit: p.unit,
          Supplier: supplier?.name || '',
          'Butom Stok': p.bottomStock !== undefined ? p.bottomStock : ''
        };`;
const tplReplace1 = `        return {
          Name: p.name,
          Unit: p.unit,
          Supplier: supplier?.name || '',
          'Butom Stok': p.bottomStock !== undefined ? p.bottomStock : '',
          'Stok': p.stock !== undefined ? p.stock : '',
          'Lokasi': p.location || ''
        };`;
code = code.replace(tplSearch1, tplReplace1);

const tplSearch2 = `    : [
        { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier', 'Butom Stok': 30 },
        { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya', 'Butom Stok': 10 }
      ];`;
const tplReplace2 = `    : [
        { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier', 'Butom Stok': 30, 'Stok': 100, 'Lokasi': 'Rak A1' },
        { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya', 'Butom Stok': 10, 'Stok': 50, 'Lokasi': 'Gudang' }
      ];`;
code = code.replace(tplSearch2, tplReplace2);

const impSearch1 = `parseMasterDataImport = async (file: File) => {
  return new Promise<{ suppliers: { name: string }[], products: { name: string, unit: string, supplierName: string, bottomStock?: number }[], errors: string[] }>((resolve, reject) => {`;
const impReplace1 = `parseMasterDataImport = async (file: File) => {
  return new Promise<{ suppliers: { name: string }[], products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string }[], errors: string[] }>((resolve, reject) => {`;
code = code.replace(impSearch1, impReplace1);

const impSearch2 = `const products: { name: string, unit: string, supplierName: string, bottomStock?: number }[] = [];
        parsedProducts.forEach((p, index) => {
          const name = p.Name || p.name || '';
          const unit = p.Unit || p.unit || 'pcs';
          const supplierName = p.Supplier || p.supplierName || p['Supplier Name'] || '';
          const rawBottomStock = p['Butom Stok'] !== undefined ? p['Butom Stok'] : (p.bottomStock !== undefined ? p.bottomStock : (p.BottomStock !== undefined ? p.BottomStock : undefined));
          
          let bottomStock: number | undefined = undefined;
          if (rawBottomStock !== undefined && rawBottomStock !== '' && rawBottomStock !== null) {
            bottomStock = Number(rawBottomStock);
            if (isNaN(bottomStock)) bottomStock = undefined;
          }`;
const impReplace2 = `const products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string }[] = [];
        parsedProducts.forEach((p, index) => {
          const name = p.Name || p.name || '';
          const unit = p.Unit || p.unit || 'pcs';
          const supplierName = p.Supplier || p.supplierName || p['Supplier Name'] || '';
          const rawBottomStock = p['Butom Stok'] !== undefined ? p['Butom Stok'] : (p.bottomStock !== undefined ? p.bottomStock : (p.BottomStock !== undefined ? p.BottomStock : undefined));
          const rawStock = p.Stok !== undefined ? p.Stok : (p.stock !== undefined ? p.stock : undefined);
          const location = p.Lokasi || p.lokasi || p.location || '';
          
          let bottomStock: number | undefined = undefined;
          if (rawBottomStock !== undefined && rawBottomStock !== '' && rawBottomStock !== null) {
            bottomStock = Number(rawBottomStock);
            if (isNaN(bottomStock)) bottomStock = undefined;
          }
          
          let stock: number | undefined = undefined;
          if (rawStock !== undefined && rawStock !== '' && rawStock !== null) {
            stock = Number(rawStock);
            if (isNaN(stock)) stock = undefined;
          }`;
code = code.replace(impSearch2, impReplace2);

const impSearch3 = `          if (name && supplierName) {
            products.push({ name, unit, supplierName, bottomStock });
          }`;
const impReplace3 = `          if (name && supplierName) {
            products.push({ name, unit, supplierName, bottomStock, stock, location });
          }`;
code = code.replace(impSearch3, impReplace3);

fs.writeFileSync(file, code);
