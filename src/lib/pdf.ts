import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Product, ReportEntry, Supplier } from '../types';

export interface PdfCompanyProfile {
  name?: string;
  tagline?: string;
  address?: string;
  phone?: string;
  email?: string;
  icon?: string;
}

export const exportReportsToPdf = (
  reports: ReportEntry[],
  products: Product[],
  suppliers: Supplier[],
  filename: string = 'Daily_Report',
  companyProfile?: PdfCompanyProfile
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

  let currentY = 20;
  const hasCompanyHeader = Boolean(
    companyProfile?.name?.trim() ||
    companyProfile?.address?.trim() ||
    companyProfile?.phone?.trim() ||
    companyProfile?.email?.trim() ||
    companyProfile?.icon
  );

  if (hasCompanyHeader) {
    let textStartX = 14;
    if (companyProfile?.icon && companyProfile.icon.startsWith('data:image/')) {
      try {
        const formatType = companyProfile.icon.includes('image/jpeg') || companyProfile.icon.includes('image/jpg') ? 'JPEG' : 'PNG';
        doc.addImage(companyProfile.icon, formatType, 14, 12, 16, 16);
        textStartX = 34;
      } catch {
        // Skip image if unsupported format in jsPDF
      }
    }

    const maxTextWidth = 196 - textStartX;
    let lineY = 17;

    doc.setFontSize(14);
    doc.setTextColor(20, 20, 20);
    const nameLines = doc.splitTextToSize(companyProfile?.name?.trim() || 'ReportPro', maxTextWidth);
    doc.text(nameLines, textStartX, lineY);
    lineY += nameLines.length * 5.5;

    const contactParts = [
      companyProfile?.tagline?.trim(),
      companyProfile?.phone?.trim() ? `Telp: ${companyProfile.phone.trim()}` : '',
      companyProfile?.email?.trim()
    ].filter(Boolean);

    if (contactParts.length > 0) {
      doc.setFontSize(9);
      doc.setTextColor(90, 90, 90);
      const contactLines = doc.splitTextToSize(contactParts.join(' • '), maxTextWidth);
      doc.text(contactLines, textStartX, lineY);
      lineY += contactLines.length * 4.2;
    }

    if (companyProfile?.address?.trim()) {
      doc.setFontSize(8.5);
      doc.setTextColor(100, 100, 100);
      const addressLines = doc.splitTextToSize(companyProfile.address.trim(), maxTextWidth);
      doc.text(addressLines, textStartX, lineY);
      lineY += addressLines.length * 4;
    }

    const dividerY = Math.max(31, lineY + 1);
    doc.setDrawColor(210, 210, 210);
    doc.line(14, dividerY, 196, dividerY);
    currentY = dividerY + 8;
  }

  doc.setFontSize(16);
  doc.setTextColor(15, 23, 42);
  doc.text(`Report Logistik tgl ${dateStr}`, 14, currentY);
  
  currentY += 10;

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
