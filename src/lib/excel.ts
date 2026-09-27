import * as XLSX from 'xlsx';
import { Product, ReportEntry, Supplier } from '../types';

export const exportReportsToTxt = (
  reports: ReportEntry[],
  products: Product[],
  suppliers: Supplier[],
  filename: string = 'Daily_Report'
) => {
  // Join data
  const joinedData = reports.map(report => {
    const product = products.find(p => p.id === report.productId);
    const supplier = product ? suppliers.find(s => s.id === product.supplierId) : null;
    const isKosongPabrik = !!report.isKosongPabrik || !!product?.isKosongPabrik;
    
    return {
      Date: report.date,
      Supplier: supplier?.name || 'Unknown Supplier',
      Product: product?.name || 'Unknown Product',
      Unit: product?.unit || '',
      Quantity: report.quantity,
      BottomStock: product?.bottomStock,
      'Sudah Order': report.isOrdered ? '[✓ Sudah Order]' : '[- Sudah Order]',
      'Sudah Datang': report.isArrived ? '[✓ Sudah Datang]' : '[- Sudah Datang]',
      KosongPabrik: isKosongPabrik,
      ReorderQty: report.isReorder ? report.reorderQty : undefined,
      ReorderReason: report.isReorder ? report.reorderReason : undefined,
      IsReorder: !!report.isReorder,
      IsWarningStock: !!report.isWarningStock,
      IsArrivedOnly: !!report.isArrivedOnly,
      Notes: report.notes || ''
    };
  });

  // Kosong Pabrik items ONLY go into the Kosong Pabrik section and never into any other list/section
  const normalItems = joinedData.filter(item => !item.KosongPabrik && !item.IsArrivedOnly);
  const kosongItems = joinedData.filter(item => item.KosongPabrik && !item.IsArrivedOnly);
  const reorderItems = joinedData.filter(item => item.IsReorder && !item.KosongPabrik && !item.IsArrivedOnly);
  const arrivedItems = joinedData.filter(item => item['Sudah Datang'] === '[✓ Sudah Datang]' && !item.KosongPabrik);
  const warningStockItems = joinedData.filter(item => item.IsWarningStock && !item.KosongPabrik && !item.IsArrivedOnly);

  // Group by supplier for normal order items
  const groupedBySupplier = normalItems.reduce((acc, curr) => {
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
    groupedBySupplier[supplierName].forEach((item, index) => {
      // Ensure no trailing space if unit is empty
      const unitStr = item.Unit ? ` ${item.Unit}` : '';
      const bottomStockStr = (item.BottomStock !== undefined && item.BottomStock !== null) 
        ? ` ( ${item.BottomStock}${unitStr} )` 
        : '';
      const statuses = [
        item['Sudah Order'] === '[✓ Sudah Order]' ? '✓ Sudah Order' : '',
      ].filter(Boolean).join(' | ');
      const statusStr = statuses ? ` [${statuses}]` : '';
      const notesStr = item.Notes ? ` (${item.Notes})` : '';
      
      textContent += ` ${index + 1}. ${item.Product} ${item.Quantity}${unitStr}${bottomStockStr}${statusStr}${notesStr}\n`;
    });
    textContent += `\n`; // blank line between suppliers
  });

  // Rekapan Produk Kosong Pabrik (deduplicated by product name)
  const allKosongProductNames = Array.from(new Set([
    ...kosongItems.map(item => item.Product),
    ...products.filter(p => p.isKosongPabrik).map(p => p.name)
  ])).filter(Boolean);

  if (allKosongProductNames.length > 0) {
    textContent += `Produk Kosong Pabrik\n`;
    allKosongProductNames.forEach((productName, index) => {
      const match = kosongItems.find(item => item.Product === productName);
      const notesStr = match?.Notes ? ` (${match.Notes})` : '';
      textContent += ` ${index + 1}. ${productName}${notesStr}\n`;
    });
    textContent += `\n`;
  }

  if (warningStockItems.length > 0) {
    textContent += `Warning stok\n`;
    
    // Group warning stock by supplier
    const warningBySupplier = warningStockItems.reduce((acc, curr) => {
      const sup = curr.Supplier;
      if (!acc[sup]) acc[sup] = [];
      acc[sup].push(curr);
      return acc;
    }, {} as Record<string, typeof warningStockItems>);

    Object.keys(warningBySupplier).sort().forEach(supplierName => {
      textContent += `${supplierName}\n`;
      warningBySupplier[supplierName].forEach((item, index) => {
        const unitStr = item.Unit ? ` ${item.Unit}` : '';
        const bottomStockStr = (item.BottomStock !== undefined && item.BottomStock !== null) 
          ? ` ( ${item.BottomStock}${unitStr} )` 
          : '';
        textContent += ` ${index + 1}. ${item.Product} ${item.Quantity}${unitStr}${bottomStockStr}\n`;
      });
    });
    textContent += `\n`;
  }

  if (reorderItems.length > 0) {
    textContent += `#Note Data Produk minta order ulang\n`;
    reorderItems.forEach((item, index) => {
      const unitStr = item.Unit ? ` ${item.Unit}` : '';
      const bottomStockStr = (item.BottomStock !== undefined && item.BottomStock !== null) 
        ? ` ( ${item.BottomStock}${unitStr} )` 
        : '';
      const reasonStr = item.ReorderReason ? ` { ${item.ReorderReason} }` : '';
      const notesStr = item.Notes ? ` (${item.Notes})` : '';
      const reorderQtyStr = item.ReorderQty ? `${item.ReorderQty}` : `${item.Quantity}`;
      
      textContent += ` ${index + 1}. ${item.Product} ${reorderQtyStr}${unitStr}${bottomStockStr}${reasonStr}${notesStr}\n`;
    });
    textContent += `\n`;
  }

  if (arrivedItems.length > 0) {
    textContent += `Produk Sudah Datang\n`;
    // Deduplicate by product name
    const uniqueArrived = Array.from(new Set(arrivedItems.map(item => item.Product)));
    uniqueArrived.forEach((productName, index) => {
      textContent += ` ${index + 1}. ${productName}\n`;
    });
    textContent += `\n`;
  }

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

export const exportReportsToExcel = (
  reports: ReportEntry[],
  products: Product[],
  suppliers: Supplier[],
  filename: string = 'Daily_Report'
) => {
  const dataToExport = reports.map(report => {
    const product = products.find(p => p.id === report.productId);
    const supplier = product ? suppliers.find(s => s.id === product.supplierId) : null;
    const isKosongPabrik = !!report.isKosongPabrik || !!product?.isKosongPabrik;
    
    return {
      Date: report.date,
      Supplier: supplier?.name || 'Unknown',
      Product: product?.name || 'Unknown',
      Unit: product?.unit || '',
      Quantity: report.quantity,
      BottomStock: (product?.bottomStock !== undefined && product?.bottomStock !== null) ? product.bottomStock : '',
      'Sudah Order': report.isOrdered ? '✓' : '-',
      'Sudah Datang': report.isArrived ? '✓' : '-',
      'Kosong Pabrik': isKosongPabrik ? '✓' : '-',
      'Order Ulang': report.isReorder ? '✓' : '-',
      'Qty Order Ulang': report.isReorder ? report.reorderQty : '',
      'Alasan Order Ulang': report.isReorder ? report.reorderReason || '' : '',
      'Keterangan': report.notes || '',
      _isKosongPabrik: isKosongPabrik,
      _isArrivedOnly: !!report.isArrivedOnly
    };
  });

  // Sheet 1 (Report): Active items ONLY, excluding Kosong Pabrik
  const normalData = dataToExport
    .filter(item => !item._isKosongPabrik && !item._isArrivedOnly)
    .map(item => ({
      'Tanggal': item.Date,
      'Supplier': item.Supplier,
      'Produk': item.Product,
      'Satuan': item.Unit,
      'Qty': item.Quantity,
      'Butom Stok': item.BottomStock,
      'Sudah Order': item['Sudah Order'],
      'Sudah Datang': item['Sudah Datang'],
      'Order Ulang': item['Order Ulang'],
      'Qty Order Ulang': item['Qty Order Ulang'],
      'Alasan Order Ulang': item['Alasan Order Ulang'],
      'Keterangan': item.Keterangan
    }));

  // Sheet 2 (Kosong Pabrik): Rekapan list Kosong Pabrik
  const kosongData = dataToExport
    .filter(item => item._isKosongPabrik && !item._isArrivedOnly)
    .map(item => ({
      'Tanggal': item.Date,
      'Supplier': item.Supplier,
      'Produk': item.Product,
      'Satuan': item.Unit,
      'Qty': item.Quantity,
      'Butom Stok': item.BottomStock,
      'Status': 'Kosong Pabrik',
      'Keterangan': item.Keterangan
    }));

  // Also include any master products that are marked isKosongPabrik if not already in kosongData
  const existingKosongProductNames = new Set(kosongData.map(k => k.Produk));
  products.filter(p => p.isKosongPabrik && !existingKosongProductNames.has(p.name)).forEach(p => {
    const supplier = suppliers.find(s => s.id === p.supplierId);
    kosongData.push({
      'Tanggal': reports[0]?.date || new Date().toISOString().split('T')[0],
      'Supplier': supplier?.name || 'Unknown',
      'Produk': p.name,
      'Satuan': p.unit || '',
      'Qty': 0,
      'Butom Stok': (p.bottomStock !== undefined && p.bottomStock !== null) ? p.bottomStock : '',
      'Status': 'Kosong Pabrik',
      'Keterangan': 'Master Kosong Pabrik'
    });
  });

  const workbook = XLSX.utils.book_new();

  // Sheet 1: Report (Only active non-kosong items)
  const worksheet = XLSX.utils.json_to_sheet(normalData.length > 0 ? normalData : [{ 'Info': 'Tidak ada data laporan' }]);
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');

  // Sheet 2: Kosong Pabrik (Rekapan list kosong pabrik)
  if (kosongData.length > 0) {
    const wsKosong = XLSX.utils.json_to_sheet(kosongData);
    XLSX.utils.book_append_sheet(workbook, wsKosong, 'Kosong_Pabrik');
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const downloadMasterDataTemplate = (existingSuppliers: Supplier[] = [], existingProducts: Product[] = []) => {
  const wb = XLSX.utils.book_new();
  
  const suppliersData = existingSuppliers.length > 0 
    ? existingSuppliers.map(s => ({ Name: s.name }))
    : [
        { Name: 'PT Contoh Supplier' },
        { Name: 'CV Makmur Jaya' }
      ];

  const suppliersSheet = XLSX.utils.json_to_sheet(suppliersData);
  XLSX.utils.book_append_sheet(wb, suppliersSheet, 'Suppliers');

  const productsData = existingProducts.length > 0
    ? existingProducts.map(p => {
        const supplier = existingSuppliers.find(s => s.id === p.supplierId);
        return {
          Name: p.name,
          Unit: p.unit,
          Supplier: supplier?.name || '',
          'Butom Stok': p.bottomStock !== undefined ? p.bottomStock : '',
          'Stok': p.stock !== undefined ? p.stock : '',
          'Lokasi': p.location || '',
          'Kategori': p.category || ''
        };
      })
    : [
        { Name: 'Kopi Arabika 1kg', Unit: 'pcs', Supplier: 'PT Contoh Supplier', 'Butom Stok': 30, 'Stok': 100, 'Lokasi': 'Rak A1', 'Kategori': 'Minuman' },
        { Name: 'Gula Aren Cair', Unit: 'Botol', Supplier: 'CV Makmur Jaya', 'Butom Stok': 10, 'Stok': 50, 'Lokasi': 'Gudang', 'Kategori': 'Minuman' }
      ];

  const productsSheet = XLSX.utils.json_to_sheet(productsData);
  XLSX.utils.book_append_sheet(wb, productsSheet, 'Products');

  XLSX.writeFile(wb, 'Master_Data_Template.xlsx');
};

export const exportArrivedToTxt = (
  arrivedData: any[],
  filename: string = 'Barang_Datang'
) => {
  let content = `Laporan Barang Datang\nTanggal Export: ${new Date().toLocaleDateString('id-ID')}\n\n`;

  // Group by date
  const groupedByDate = arrivedData.reduce((acc, curr) => {
    const d = curr.date;
    if (!acc[d]) acc[d] = [];
    acc[d].push(curr);
    return acc;
  }, {} as Record<string, any[]>);

  Object.entries(groupedByDate).sort((a, b) => b[0].localeCompare(a[0])).forEach(([date, items]) => {
    content += `=== Tanggal: ${date} ===\n`;
    (items as any[]).forEach((item, index) => {
      content += `${index + 1}. ${item.productName}\n`;
      content += `   Supplier: ${item.supplierName}\n`;
      if (item.notes) content += `   Keterangan: ${item.notes}\n`;
      content += `   Tipe: ${item.isArrivedOnly ? 'Tanpa Sales Report' : 'Sales Linked'}\n`;
    });
    content += '\n';
  });

  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filename}.txt`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const downloadDailyReportTemplate = () => {
  const wb = XLSX.utils.book_new();
  const templateData = [
    {
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Supplier': 'PT Contoh Supplier',
      'Produk': 'Kopi Arabika 1kg',
      'Qty': 5,
      'Keterangan': 'Pesan hari ini'
    },
    {
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Supplier': 'CV Makmur Jaya',
      'Produk': 'Gula Aren Cair',
      'Qty': 10,
      'Keterangan': ''
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Report');
  XLSX.writeFile(wb, 'Daily_Report_Import_Template.xlsx');
};

export const parseDailyReportImport = async (file: File) => {
  return new Promise<{ reports: { date: string, supplierName: string, productName: string, qty: number, notes: string }[], errors: string[] }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const errors: string[] = [];

        const sheetName = workbook.SheetNames[0]; // read first sheet
        if (!sheetName) {
          errors.push('File Excel kosong.');
          return resolve({ reports: [], errors });
        }

        const parsedData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
        const reports: { date: string, supplierName: string, productName: string, qty: number, notes: string }[] = [];

        parsedData.forEach((row, index) => {
          // Flexible key matching
          const date = row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || row['Date'] || '';
          const supplierName = row['Supplier'] || row['Nama Supplier'] || '';
          const productName = row['Produk'] || row['Product'] || row['Nama Produk'] || '';
          const qty = row['Qty'] || row['Quantity'] || row['Kuantitas'] || 0;
          const notes = row['Keterangan'] || row['Notes'] || row['Catatan'] || '';

          if (!date || !productName) {
            errors.push(`Baris ${index + 2} dilewati: Tanggal dan Produk harus diisi.`);
            return;
          }

          let parsedDate = String(date).trim();
          // if date is a serial number from excel
          if (typeof date === 'number') {
            const dateObj = XLSX.SSF.parse_date_code(date);
            parsedDate = `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
          }

          reports.push({
            date: parsedDate,
            supplierName: String(supplierName).trim(),
            productName: String(productName).trim(),
            qty: Number(qty) || 0,
            notes: String(notes).trim()
          });
        });

        resolve({ reports, errors });
      } catch (err: any) {
        resolve({ reports: [], errors: ['Gagal membaca file: ' + err.message] });
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Excel'));
    reader.readAsArrayBuffer(file);
  });
};

export const parseMasterDataImport = async (file: File) => {
  return new Promise<{ suppliers: { name: string }[], products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string, category?: string }[], errors: string[] }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const errors: string[] = [];

        let parsedSuppliers: any[] = [];
        if (workbook.Sheets['Suppliers']) {
          parsedSuppliers = XLSX.utils.sheet_to_json(workbook.Sheets['Suppliers']);
        } else {
          errors.push('Missing "Suppliers" sheet.');
        }

        let parsedProducts: any[] = [];
        if (workbook.Sheets['Products']) {
          parsedProducts = XLSX.utils.sheet_to_json(workbook.Sheets['Products']);
        } else {
          errors.push('Missing "Products" sheet.');
        }

        const suppliers: { name: string }[] = [];
        parsedSuppliers.forEach((s, index) => {
          const name = s.Name || s.name || '';
          if (!name) {
            errors.push(`Row ${index + 2} in Suppliers sheet missing name.`);
          } else {
            suppliers.push({ name });
          }
        });

        const products: { name: string, unit: string, supplierName: string, bottomStock?: number, stock?: number, location?: string, category?: string }[] = [];
        parsedProducts.forEach((p, index) => {
          const name = p.Name || p.name || '';
          const unit = p.Unit || p.unit || 'pcs';
          const supplierName = p.Supplier || p.supplierName || p['Supplier Name'] || '';
          const rawBottomStock = p['Butom Stok'] !== undefined ? p['Butom Stok'] : (p.bottomStock !== undefined ? p.bottomStock : (p.BottomStock !== undefined ? p.BottomStock : undefined));
          const rawStock = p.Stok !== undefined ? p.Stok : (p.stock !== undefined ? p.stock : undefined);
          const location = p.Lokasi || p.lokasi || p.location || '';
          const category = p.Kategori || p.kategori || p.Category || p.category || '';
          
          let bottomStock: number | undefined = undefined;
          if (rawBottomStock !== undefined && rawBottomStock !== '' && rawBottomStock !== null) {
            bottomStock = Number(rawBottomStock);
            if (isNaN(bottomStock)) bottomStock = undefined;
          }
          
          let stock: number | undefined = undefined;
          if (rawStock !== undefined && rawStock !== '' && rawStock !== null) {
            stock = Number(rawStock);
            if (isNaN(stock)) stock = undefined;
          }
          
          if (!name) {
            errors.push(`Row ${index + 2} in Products sheet missing name.`);
          }
          if (!supplierName) {
            errors.push(`Row ${index + 2} in Products sheet missing supplier.`);
          }
          if (name && supplierName) {
            products.push({ name, unit, supplierName, bottomStock, stock, location, category });
          }
        });

        resolve({ suppliers, products, errors });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};

export const exportArrivedToExcel = (
  arrivedData: any[],
  filename: string = 'Barang_Datang'
) => {
  const dataToExport = arrivedData.map(item => ({
    'Tanggal': item.date,
    'Supplier': item.supplierName || 'Unknown',
    'Produk': item.productName || 'Unknown',
    'Satuan': item.unit || 'pcs',
    'Qty Datang': item.arrivedQty !== undefined && item.arrivedQty !== null ? item.arrivedQty : (item.quantity || 0),
    'Keterangan': item.notes || '',
    'Order Ulang': item.isReorder ? 'Ya' : 'Tidak',
    'Qty Order Ulang': item.isReorder && item.reorderQty ? item.reorderQty : '',
    'Alasan Order Ulang': item.isReorder && item.reorderReason ? item.reorderReason : '',
    'Tipe': item.isArrivedOnly ? 'Tanpa Sales Report' : 'Sales Linked'
  }));

  const worksheet = XLSX.utils.json_to_sheet(dataToExport);
  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 22 },
    { wch: 28 },
    { wch: 10 },
    { wch: 12 },
    { wch: 30 },
    { wch: 14 },
    { wch: 16 },
    { wch: 25 },
    { wch: 20 }
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Barang_Datang');
  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

export const downloadArrivedTemplate = () => {
  const wb = XLSX.utils.book_new();
  const templateData = [
    {
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Supplier': 'PT Contoh Supplier',
      'Produk': 'Kopi Arabika 1kg',
      'Qty Datang': 10,
      'Keterangan': 'Kemasan aman tidak bocor',
      'Order Ulang (Ya/Tidak)': 'Tidak',
      'Qty Order Ulang': '',
      'Alasan Order Ulang': ''
    },
    {
      'Tanggal (YYYY-MM-DD)': new Date().toISOString().split('T')[0],
      'Supplier': 'CV Makmur Jaya',
      'Produk': 'Gula Aren Cair',
      'Qty Datang': 5,
      'Keterangan': 'Barang tiba siang hari',
      'Order Ulang (Ya/Tidak)': 'Ya',
      'Qty Order Ulang': 10,
      'Alasan Order Ulang': 'Stok cepat habis'
    }
  ];

  const ws = XLSX.utils.json_to_sheet(templateData);
  ws['!cols'] = [
    { wch: 22 },
    { wch: 22 },
    { wch: 28 },
    { wch: 14 },
    { wch: 30 },
    { wch: 22 },
    { wch: 16 },
    { wch: 25 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Import_Barang_Datang');
  XLSX.writeFile(wb, 'Template_Import_Barang_Datang.xlsx');
};

export const formatExcelDate = (date: any): string => {
  if (!date) return '';
  if (typeof date === 'number') {
    const dateObj = XLSX.SSF.parse_date_code(date);
    return `${dateObj.y}-${String(dateObj.m).padStart(2, '0')}-${String(dateObj.d).padStart(2, '0')}`;
  }
  const str = String(date).trim();
  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }
  // YYYY/MM/DD
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(str)) {
    const [y, m, d] = str.split('/');
    return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
  }
  // DD/MM/YYYY or DD-MM-YYYY
  const dmy = str.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (dmy) {
    return `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  return str;
};

export interface ArrivedImportRow {
  date: string;
  supplierName: string;
  productName: string;
  arrivedQty: number;
  notes: string;
  isReorder: boolean;
  reorderQty?: number;
  reorderReason?: string;
}

export const parseArrivedImport = async (file: File) => {
  return new Promise<{ items: ArrivedImportRow[], errors: string[] }>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const errors: string[] = [];

        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          errors.push('File Excel kosong.');
          return resolve({ items: [], errors });
        }

        const parsedData = XLSX.utils.sheet_to_json<any>(workbook.Sheets[sheetName]);
        const items: ArrivedImportRow[] = [];

        parsedData.forEach((row, index) => {
          const date = row['Tanggal (YYYY-MM-DD)'] || row['Tanggal'] || row['Date'] || '';
          const supplierName = row['Supplier'] || row['Nama Supplier'] || '';
          const productName = row['Produk'] || row['Product'] || row['Nama Produk'] || '';
          const qty = row['Qty Datang'] || row['Qty'] || row['Quantity'] || row['Jumlah Datang'] || row['Kuantitas'] || 0;
          const notes = row['Keterangan'] || row['Notes'] || row['Catatan'] || '';
          
          const rawReorder = row['Order Ulang (Ya/Tidak)'] || row['Order Ulang'] || row['Reorder'] || row['Is Reorder'] || '';
          const isReorder = typeof rawReorder === 'boolean' 
            ? rawReorder 
            : /^(ya|yes|true|1|y|✓)$/i.test(String(rawReorder).trim());

          const reorderQty = row['Qty Order Ulang'] || row['Reorder Qty'] || row['Qty Reorder'] || undefined;
          const reorderReason = row['Alasan Order Ulang'] || row['Reorder Reason'] || row['Alasan Reorder'] || '';

          if (!date || !productName) {
            errors.push(`Baris ${index + 2} dilewati: Tanggal dan Nama Produk harus diisi.`);
            return;
          }

          const parsedDate = formatExcelDate(date);

          items.push({
            date: parsedDate,
            supplierName: String(supplierName).trim(),
            productName: String(productName).trim(),
            arrivedQty: Math.max(0, Number(qty) || 0),
            notes: String(notes).trim(),
            isReorder,
            reorderQty: reorderQty ? Math.max(0, Number(reorderQty) || 0) : undefined,
            reorderReason: String(reorderReason).trim()
          });
        });

        resolve({ items, errors });
      } catch (err: any) {
        resolve({ items: [], errors: ['Gagal membaca file: ' + err.message] });
      }
    };
    reader.onerror = () => reject(new Error('Gagal membaca file Excel'));
    reader.readAsArrayBuffer(file);
  });
};

