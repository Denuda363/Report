import * as XLSX from 'xlsx';
import { Product, ReportEntry, Supplier } from '../types';

export const exportReportsToExcel = (
  reports: ReportEntry[],
  products: Product[],
  suppliers: Supplier[],
  filename: string = 'Daily_Report'
) => {
  // Join data
  const joinedData = reports.map(report => {
    const product = products.find(p => p.id === report.productId);
    const supplier = product ? suppliers.find(s => s.id === product.supplierId) : null;
    
    return {
      Date: report.date,
      Supplier: supplier?.name || 'Unknown Supplier',
      Product: product?.name || 'Unknown Product',
      Unit: product?.unit || '',
      Quantity: report.quantity,
    };
  });

  // Group by supplier
  const groupedBySupplier = joinedData.reduce((acc, curr) => {
    const sup = curr.Supplier;
    if (!acc[sup]) acc[sup] = [];
    acc[sup].push(curr);
    return acc;
  }, {} as Record<string, typeof joinedData>);
  
  // Format the text
  // Find a common date or just use today for the title if multiple dates exist
  const uniqueDates = [...new Set(reports.map(r => r.date))];
  const dateStr = uniqueDates.length === 1 
    ? new Date(uniqueDates[0]).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  let textContent = `Report Logistik tgl ${dateStr}\n\n`;

  Object.keys(groupedBySupplier).sort().forEach(supplierName => {
    textContent += `${supplierName}\n`;
    groupedBySupplier[supplierName].forEach(item => {
      // Ensure no trailing space if unit is empty
      const unitStr = item.Unit ? ` ${item.Unit}` : '';
      textContent += `- ${item.Product} ${item.Quantity}${unitStr}\n`;
    });
    textContent += `\n`; // blank line between suppliers
  });

  // Download as text file
  const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${filename}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const downloadMasterDataTemplate = () => {
  const wb = XLSX.utils.book_new();
  
  const suppliersSheet = XLSX.utils.json_to_sheet([
    { Name: 'PT Contoh Supplier' },
    { Name: 'CV Makmur Jaya' }
  ]);
  XLSX.utils.book_append_sheet(wb, suppliersSheet, 'Suppliers');

  const productsSheet = XLSX.utils.json_to_sheet([
    { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier' },
    { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya' }
  ]);
  XLSX.utils.book_append_sheet(wb, productsSheet, 'Products');

  XLSX.writeFile(wb, 'Master_Data_Template.xlsx');
};

export const parseMasterDataImport = async (file: File) => {
  return new Promise<{ suppliers: { name: string }[], products: { name: string, unit: string, supplierName: string }[] }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });

        let parsedSuppliers: any[] = [];
        if (workbook.Sheets['Suppliers']) {
          parsedSuppliers = XLSX.utils.sheet_to_json(workbook.Sheets['Suppliers']);
        }

        let parsedProducts: any[] = [];
        if (workbook.Sheets['Products']) {
          parsedProducts = XLSX.utils.sheet_to_json(workbook.Sheets['Products']);
        }

        const suppliers = parsedSuppliers
          .map(s => ({ name: s.Name || s.name || '' }))
          .filter(s => s.name);

        const products = parsedProducts
          .map(p => ({
            name: p.Name || p.name || '',
            unit: p.Unit || p.unit || 'pcs',
            supplierName: p.Supplier || p.supplierName || p['Supplier Name'] || ''
          }))
          .filter(p => p.name && p.supplierName);

        resolve({ suppliers, products });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
