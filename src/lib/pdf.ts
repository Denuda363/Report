import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, ReportEntry, Supplier } from '../types';

export const exportReportsToPdf = (
  reports: ReportEntry[],
  products: Product[],
  suppliers: Supplier[],
  filename: string = 'Daily_Report'
) => {
  const doc = new jsPDF();
  
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
      'Sudah Order': report.isOrdered ? '✓' : '-',
      'Sudah Datang': report.isArrived ? '✓' : '-',
      'Sudah Dicek': report.isChecked ? '✓' : '-',
      'Kosong Pabrik': isKosongPabrik ? '✓' : '-',
      'Order Ulang': report.isReorder ? `✓ (${report.reorderQty})` : '-',
      isKosongPabrik,
      isArrivedOnly: !!report.isArrivedOnly
    };
  });

  // Normal items exclude Kosong Pabrik
  const normalItems = joinedData.filter(item => !item.isKosongPabrik && !item.isArrivedOnly);
  const kosongItems = joinedData.filter(item => item.isKosongPabrik && !item.isArrivedOnly);

  // Group by supplier (category)
  const groupedBySupplier = normalItems.reduce((acc, curr) => {
    const sup = curr.Supplier;
    if (!acc[sup]) acc[sup] = [];
    acc[sup].push(curr);
    return acc;
  }, {} as Record<string, typeof normalItems>);

  const uniqueDates = [...new Set(reports.map(r => r.date))];
  const dateStr = uniqueDates.length === 1 
    ? new Date(uniqueDates[0]).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  doc.setFontSize(16);
  doc.text(`Report Logistik tgl ${dateStr}`, 14, 20);
  
  let currentY = 30;

  Object.keys(groupedBySupplier).sort().forEach(supplierName => {
    doc.setFontSize(12);
    // Add text for category/supplier
    doc.text(`Kategori: ${supplierName}`, 14, currentY);
    currentY += 5;
    
    // Prepare table data for this category
    const tableData = groupedBySupplier[supplierName].map(item => [
      item.Date,
      item.Product,
      item.Quantity.toString(),
      item.Unit,
      item['Sudah Order'],
      item['Sudah Datang'],
      item['Sudah Dicek'],
      item['Order Ulang']
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Tanggal', 'Nama Produk', 'Kuantitas', 'Satuan', 'Sudah Order', 'Sudah Datang', 'Sudah Dicek', 'Order Ulang']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [139, 157, 119] },
      margin: { left: 14, right: 14 },
    });
    
    currentY = (doc as any).lastAutoTable.finalY + 15;
    
    // Check if we need to add a new page
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  });

  // Dedicated section for Kosong Pabrik
  const allKosongProductNames = Array.from(new Set([
    ...kosongItems.map(item => item.Product),
    ...products.filter(p => p.isKosongPabrik).map(p => p.name)
  ])).filter(Boolean);

  if (allKosongProductNames.length > 0) {
    if (currentY > 230) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFontSize(13);
    doc.setTextColor(190, 18, 60);
    doc.text('Daftar Produk Kosong Pabrik', 14, currentY);
    currentY += 5;

    const kosongTableData = allKosongProductNames.map(pName => {
      const match = kosongItems.find(item => item.Product === pName);
      const prod = products.find(p => p.name === pName);
      const sup = prod ? suppliers.find(s => s.id === prod.supplierId) : null;
      return [
        match?.Date || uniqueDates[0] || '-',
        sup?.name || match?.Supplier || '-',
        pName,
        match?.Quantity?.toString() || '0',
        match?.Unit || prod?.unit || 'pcs',
        'Kosong Pabrik'
      ];
    });

    autoTable(doc, {
      startY: currentY,
      head: [['Tanggal', 'Supplier', 'Nama Produk', 'Kuantitas', 'Satuan', 'Status']],
      body: kosongTableData,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] },
      margin: { left: 14, right: 14 },
    });
  }

  // Deduplicate products with qty 0: item yang sama terinput berulang tetap dihitung 1
  // Jika pada report stok 0 namun masuk dalam barang datang (arrived), jangan dihitung stok 0
  const arrivedProductNames = new Set<string>();
  reports.forEach(r => {
    if (r.isArrived || r.isArrivedOnly) {
      const prod = products.find(p => p.id === r.productId);
      const name = (prod?.name || '').trim().toLowerCase();
      if (name) arrivedProductNames.add(name);
    }
  });

  const zeroQtyProductSet = new Set<string>();
  normalItems.forEach(item => {
    if (Number(item.Quantity) === 0) {
      const cleanName = (item.Product || '').trim().toLowerCase();
      const isArrived = item['Sudah Datang'] === '[✓ Sudah Datang]' || arrivedProductNames.has(cleanName);
      if (cleanName && !isArrived) zeroQtyProductSet.add(cleanName);
    }
  });
  const zeroQtyCount = zeroQtyProductSet.size;

  const lastTableY = (doc as any).lastAutoTable?.finalY;
  const noteY = lastTableY ? lastTableY + 12 : currentY + 10;
  if (noteY > 270) {
    doc.addPage();
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Produk Stok Kosong : ${zeroQtyCount} Item`, 14, 20);
  } else {
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    doc.text(`Produk Stok Kosong : ${zeroQtyCount} Item`, 14, noteY);
  }

  doc.save(`${filename}.pdf`);
};
