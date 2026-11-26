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

export interface GuidePdfStep {
  title: string;
  description: string;
  details?: string[];
  tip?: string;
}

export interface GuidePdfSection {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  overview?: string;
  steps: GuidePdfStep[];
  proTip?: string;
}

export interface GuidePdfFaqItem {
  question: string;
  answer: string;
}

export interface GuidePdfShortcutItem {
  keys: string;
  description: string;
}

export type GuideBindingMode = 'standard' | 'mirrored';

export interface GuidePdfOptions {
  bindingMode?: GuideBindingMode;
  includeNotesPage?: boolean;
  versionLabel?: string;
  authorName?: string;
  authorRole?: string;
  faqs?: GuidePdfFaqItem[];
  shortcuts?: GuidePdfShortcutItem[];
}

export const exportUserGuideToPdf = (
  sections: GuidePdfSection[],
  filename: string = 'Buku_Panduan_ReportPro_A4',
  companyProfile?: PdfCompanyProfile,
  options?: GuidePdfOptions
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const topMargin = 20.5;
  const bottomMargin = 20.5;
  const bindingMode: GuideBindingMode = options?.bindingMode || 'standard';
  const includeNotesPage = options?.includeNotesPage !== false;
  const versionLabel = options?.versionLabel || 'v3.2.0 Pro';
  const authorName = options?.authorName?.trim() || 'Denuda';
  const authorRole = options?.authorRole?.trim() || 'Penyusun & Developer Aplikasi';

  const getMargins = (pageNum: number) => {
    // Cover (pageNum === 1) is full-bleed; content pages number from Kata Pengantar (bookPage = pageNum - 1)
    const bookPage = Math.max(1, pageNum - 1);
    if (bindingMode === 'mirrored' && pageNum > 1 && bookPage % 2 === 0) {
      return { left: 16, right: 24, contentWidth: 170 };
    }
    return { left: 24, right: 16, contentWidth: 170 };
  };

  const appBrand = companyProfile?.name?.trim() || 'ReportPro';
  const appTagline = companyProfile?.tagline?.trim() || 'Sistem Manajemen Stok, Laporan Harian & Gudang';
  const printedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const pageSectionNames: Record<number, string> = {};
  interface TocEntryItem {
    kind: 'main' | 'sub';
    badge?: string;
    code?: string;
    title: string;
    subtitle?: string;
    page: number;
  }
  const tocEntries: TocEntryItem[] = [];

  // =========================================================================
  // PAGE 1: FULL-PAPER COVER PAGE (SAMPUL BUKU RESMI - FULL BLEED A4)
  // =========================================================================
  const spineW = 18.5;
  const bodyX = spineW;
  const bodyW = pageWidth - spineW;
  const coverCenterX = bodyX + bodyW / 2;

  // Base full-paper gallery white canvas
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, pageHeight, 'F');

  // Full-bleed top midnight slate masthead (y = 0 to 84.5mm)
  const mastheadH = 84.5;
  doc.setFillColor(15, 23, 42);
  doc.rect(bodyX, 0, bodyW, mastheadH, 'F');

  // Subtle darker architectural band inside masthead for depth
  doc.setFillColor(19, 30, 52);
  doc.rect(bodyX, 58, bodyW, mastheadH - 58, 'F');

  // Gold crown strip along very top edge + emerald & gold masthead base
  doc.setFillColor(217, 119, 6);
  doc.rect(bodyX, 0, bodyW, 2.8, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(bodyX, mastheadH, bodyW, 2.0, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(bodyX, mastheadH + 2.0, bodyW, 0.5, 'F');

  // Full-bleed bottom dark slate imprint band (y = 256mm to 297mm)
  const coverFooterY = 256;
  doc.setFillColor(217, 119, 6);
  doc.rect(bodyX, coverFooterY - 2.5, bodyW, 0.5, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(bodyX, coverFooterY - 2.0, bodyW, 2.0, 'F');
  doc.setFillColor(15, 23, 42);
  doc.rect(bodyX, coverFooterY, bodyW, pageHeight - coverFooterY, 'F');

  // Full-bleed left architectural binding spine (x = 0 to 18.5mm, height = 297mm)
  doc.setFillColor(11, 19, 34);
  doc.rect(0, 0, 16.0, pageHeight, 'F');
  doc.setFillColor(16, 185, 129);
  doc.rect(16.0, 0, 1.7, pageHeight, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(17.7, 0, 0.8, pageHeight, 'F');

  // Vertical spine imprint label
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.4);
  doc.setTextColor(148, 163, 184);
  doc.text(
    `BUKU PANDUAN OPERASIONAL  •  ${appBrand.toUpperCase()}  •  ${versionLabel.toUpperCase()}`,
    9.8,
    pageHeight / 2,
    { align: 'center', angle: 90 }
  );

  // Subtle editorial border frame & corner brackets inside white field
  const innerX = bodyX + 7.5;
  const innerY = mastheadH + 8.5;
  const innerW = bodyW - 15;
  const innerH = coverFooterY - 2.5 - innerY - 6;
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.35);
  doc.rect(innerX, innerY, innerW, innerH, 'S');

  // Corner L-brackets (emerald accents)
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.7);
  const brLen = 6;
  // Top-left
  doc.line(innerX, innerY + brLen, innerX, innerY);
  doc.line(innerX, innerY, innerX + brLen, innerY);
  // Top-right
  doc.line(innerX + innerW - brLen, innerY, innerX + innerW, innerY);
  doc.line(innerX + innerW, innerY, innerX + innerW, innerY + brLen);
  // Bottom-left
  doc.line(innerX, innerY + innerH - brLen, innerX, innerY + innerH);
  doc.line(innerX, innerY + innerH, innerX + brLen, innerY + innerH);
  // Bottom-right
  doc.line(innerX + innerW - brLen, innerY + innerH, innerX + innerW, innerY + innerH);
  doc.line(innerX + innerW, innerY + innerH - brLen, innerX + innerW, innerY + innerH);

  // Framed centered company crest / monogram medallion inside masthead
  const crestSize = 22;
  const crestX = coverCenterX - crestSize / 2;
  const crestY = 12;
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.5);
  doc.roundedRect(crestX - 1.4, crestY - 1.4, crestSize + 2.8, crestSize + 2.8, 3.6, 3.6, 'S');

  if (companyProfile?.icon && companyProfile.icon.startsWith('data:image/')) {
    try {
      const formatType =
        companyProfile.icon.includes('image/jpeg') || companyProfile.icon.includes('image/jpg')
          ? 'JPEG'
          : 'PNG';
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(crestX, crestY, crestSize, crestSize, 2.8, 2.8, 'F');
      doc.addImage(companyProfile.icon, formatType, crestX + 1.5, crestY + 1.5, crestSize - 3, crestSize - 3);
    } catch {
      doc.setFillColor(16, 185, 129);
      doc.roundedRect(crestX, crestY, crestSize, crestSize, 2.8, 2.8, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(15, 23, 42);
      doc.text(appBrand.charAt(0).toUpperCase(), coverCenterX, crestY + 14.5, { align: 'center' });
    }
  } else {
    doc.setFillColor(16, 185, 129);
    doc.roundedRect(crestX, crestY, crestSize, crestSize, 2.8, 2.8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(appBrand.charAt(0).toUpperCase(), coverCenterX, crestY + 14.8, { align: 'center' });
  }

  // Centered brand name & tagline inside masthead
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(19.5);
  doc.setTextColor(255, 255, 255);
  doc.text(appBrand.toUpperCase(), coverCenterX, 46, {
    align: 'center',
    maxWidth: bodyW - 28
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(167, 243, 208);
  doc.text(appTagline, coverCenterX, 54, {
    align: 'center',
    maxWidth: bodyW - 28
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(203, 213, 225);
  doc.text(`EDISI RESMI ${versionLabel.toUpperCase()}  •  PEDOMAN STANDAR OPERASIONAL BAKU`, coverCenterX, 72.5, {
    align: 'center'
  });

  // Centered Hero Title & Abstract inside Architectural Center Field
  const kickerY = 112;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.8);
  doc.setTextColor(5, 150, 105);
  doc.text('MANUAL PENGGUNA & PROSEDUR OPERASIONAL', coverCenterX, kickerY, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(15, 23, 42);
  doc.text('BUKU PANDUAN', coverCenterX, kickerY + 16, { align: 'center' });
  doc.text('PENGGUNAAN APLIKASI', coverCenterX, kickerY + 28.5, { align: 'center' });

  // Symmetrical editorial ornament
  const ornY = kickerY + 37.5;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.line(coverCenterX - 56, ornY + 0.8, coverCenterX - 16, ornY + 0.8);
  doc.line(coverCenterX + 16, ornY + 0.8, coverCenterX + 56, ornY + 0.8);
  doc.setFillColor(16, 185, 129);
  doc.rect(coverCenterX - 13, ornY, 26, 1.6, 'F');

  // Centered balanced abstract
  const coverAbstract =
    'Panduan komprehensif yang membahas pengenalan sistem, alur kerja harian, pengelolaan Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, Multi-Database, serta penanganan masalah secara praktis dan terstruktur.';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.2);
  doc.setTextColor(71, 85, 105);
  doc.text(coverAbstract, coverCenterX, ornY + 12, {
    align: 'center',
    maxWidth: bodyW - 36,
    lineHeightFactor: 1.54
  });

  // 3-Column Editorial Scope Matrix
  const scopeY = 191;
  const scopeW = bodyW - 32;
  const scopeStartX = bodyX + 16;
  const colW = scopeW / 3;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.35);
  doc.roundedRect(scopeStartX, scopeY, scopeW, 23, 1.8, 1.8, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(scopeStartX, scopeY, scopeW, 1.1, 'F');
  doc.line(scopeStartX + colW, scopeY + 4, scopeStartX + colW, scopeY + 19.5);
  doc.line(scopeStartX + colW * 2, scopeY + 4, scopeStartX + colW * 2, scopeY + 19.5);

  [
    { title: '01 · PENGENALAN & MASTER', sub: 'Arsitektur & Bottom Stock' },
    { title: '02 · OPERASIONAL HARIAN', sub: 'Daily Report & Barang Datang' },
    { title: '03 · SISTEM & SOLUSI', sub: 'Cloud, PIN & Troubleshooting' }
  ].forEach((col, cIdx) => {
    const cx = scopeStartX + colW * cIdx + colW / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.3);
    doc.setTextColor(5, 150, 105);
    doc.text(col.title, cx, scopeY + 9.5, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.9);
    doc.setTextColor(51, 65, 85);
    doc.text(col.sub, cx, scopeY + 16, { align: 'center' });
  });

  // Author & Structure Editorial Plaque
  const plaqueY = 221.5;
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(coverCenterX - 60, plaqueY, 120, 17.5, 1.8, 1.8, 'FD');
  doc.setFillColor(16, 185, 129);
  doc.rect(coverCenterX - 60, plaqueY, 120, 1.2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(100, 116, 139);
  doc.text(authorRole.toUpperCase(), coverCenterX, plaqueY + 6.8, { align: 'center' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11.5);
  doc.setTextColor(15, 23, 42);
  doc.text(authorName, coverCenterX, plaqueY + 13.4, { align: 'center' });

  // Bottom Dark Slate Full-Bleed Imprint Typography
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.4);
  doc.setTextColor(255, 255, 255);
  doc.text(
    `DITERBITKAN UNTUK TIM OPERASIONAL & GUDANG  •  ${appBrand.toUpperCase()}`,
    coverCenterX,
    coverFooterY + 10.5,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.1);
  doc.setTextColor(110, 231, 183);
  doc.text(
    `Struktur Materi: Pembuka, ${sections.length} Bab Inti, Penutup & ${includeNotesPage ? '2 Lampiran' : '1 Lampiran'}  •  Edisi ${versionLabel}`,
    coverCenterX,
    coverFooterY + 16.8,
    { align: 'center' }
  );

  const contactInfo = [
    companyProfile?.address?.trim(),
    companyProfile?.phone?.trim() ? `Telp: ${companyProfile.phone.trim()}` : '',
    companyProfile?.email?.trim()
  ]
    .filter(Boolean)
    .join('  •  ');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.7);
  doc.setTextColor(203, 213, 225);
  doc.text(
    contactInfo ||
      'Dokumen pegangan kerja resmi berukuran A4 Portrait. Dirancang rapi untuk dicetak dan dijilid sebagai buku pedoman operasional.',
    coverCenterX,
    coverFooterY + 23.5,
    { align: 'center', maxWidth: bodyW - 30, lineHeightFactor: 1.38 }
  );

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.6);
  doc.setTextColor(148, 163, 184);
  doc.text(`Tanggal Penerbitan: ${printedDate}  •  Oleh ${authorName}`, coverCenterX, coverFooterY + 34.5, {
    align: 'center'
  });

  // =========================================================================
  // HALAMAN 1 (PDF Page 2): KATA PENGANTAR (PREFACE)
  // =========================================================================
  doc.addPage();
  const prefacePageNum = doc.getNumberOfPages();
  pageSectionNames[prefacePageNum] = 'Kata Pengantar';
  tocEntries.push({
    kind: 'main',
    badge: 'PEMBUKA',
    title: 'Kata Pengantar',
    subtitle: 'Sambutan penyusun, tujuan pedoman operasional, dan ruang lingkup buku panduan',
    page: prefacePageNum - 1
  });
  tocEntries.push({
    kind: 'sub',
    code: '0.1',
    title: 'Sambutan Penyusun & Gambaran Umum Pedoman',
    page: prefacePageNum - 1
  });
  tocEntries.push({
    kind: 'sub',
    code: '0.2',
    title: 'Tujuan Penyusunan & Harapan Penerapan Sistem',
    page: prefacePageNum - 1
  });

  {
    const m = getMargins(prefacePageNum);
    const centerX = m.left + m.contentWidth / 2;
    let y = topMargin + 3;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(5, 150, 105);
    doc.text('HALAMAN PEMBUKA', centerX, y, { align: 'center' });

    y += 7.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('KATA PENGANTAR', centerX, y, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(centerX - 44, y + 4.8, centerX - 14, y + 4.8);
    doc.line(centerX + 14, y + 4.8, centerX + 44, y + 4.8);
    doc.setFillColor(16, 185, 129);
    doc.rect(centerX - 11, y + 4, 22, 1.5, 'F');

    y += 15;

    const prefaceParagraphs = [
      `Dengan mengucapkan puji syukur ke hadirat Tuhan Yang Maha Esa, Buku Panduan Penggunaan Aplikasi ini disusun oleh ${authorName} selaku ${authorRole} sebagai pedoman standar operasional resmi bagi seluruh staf operasional, admin gudang, dan pengelola persediaan dalam mengoperasikan sistem ${appBrand}.`,
      'Ketepatan pencatatan stok, kecepatan tindak lanjut barang datang, serta pengendalian batas stok minimum (Bottom Stock) merupakan faktor kunci dalam menjaga kelancaran distribusi dan ketersediaan barang. Oleh karena itu, buku panduan ini menghadirkan penjelasan terperinci mulai dari pengenalan arsitektur aplikasi, pengelolaan Master Data, input antrean Daily Report, verifikasi kedatangan barang, pemantauan item Kosong Pabrik, pengamanan akses sistem menggunakan PIN, hingga pencadangan basis data.',
      'Materi dalam buku ini disusun secara sistematis menggunakan bahasa yang jelas agar mudah dipahami, baik oleh pengguna baru pada masa orientasi maupun oleh operator harian sebagai rujukan cepat di meja kerja. Buku ini juga dilengkapi bab khusus Penanganan Masalah (Troubleshooting) untuk membantu tim menyelesaikan kendala operasional maupun teknis secara mandiri dan aman.',
      'Kami berharap buku panduan ini dapat meningkatkan keseragaman prosedur kerja, meminimalkan kesalahan pencatatan, serta mendukung kelancaran aktivitas tim secara menyeluruh. Kritik dan saran yang membangun senantiasa terbuka demi penyempurnaan sistem dan panduan di masa mendatang.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.6);
    doc.setTextColor(30, 41, 59);

    prefaceParagraphs.forEach((para) => {
      const lines = doc.splitTextToSize(para, m.contentWidth);
      doc.text(para, m.left, y, {
        maxWidth: m.contentWidth,
        align: 'justify',
        lineHeightFactor: 1.45
      });
      y += lines.length * 4.8 + 3.8;
    });

    // Purpose Highlights Box
    y += 1.5;
    const purposeItems = [
      '1. Memperkenalkan fungsi utama dan alur kerja sistem agar mudah dipahami oleh pengguna baru.',
      '2. Menyeragamkan standar pencatatan laporan harian, kontrol Bottom Stock, dan verifikasi barang datang.',
      '3. Menyediakan panduan penanganan masalah (troubleshooting) operasional dan teknis yang cepat.',
      '4. Menjaga keamanan konfigurasi basis data dan integritas data melalui PIN serta cadangan berkala.'
    ];
    const purposeBoxH = 14 + purposeItems.length * 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(m.left, y, m.contentWidth, purposeBoxH, 2.2, 2.2, 'FD');
    doc.setFillColor(16, 185, 129);
    doc.rect(m.left, y, m.contentWidth, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.4);
    doc.setTextColor(15, 23, 42);
    doc.text('Tujuan Penyusunan Buku Panduan', m.left + 8, y + 7.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.7);
    doc.setTextColor(51, 65, 85);
    purposeItems.forEach((item, idx) => {
      doc.text(item, m.left + 8, y + 13.8 + idx * 5.8);
    });

    y += purposeBoxH + 6.5;

    // Centered Editorial Pull Quote
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(m.left, y, m.contentWidth, 14.5, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.4);
    doc.setTextColor(6, 95, 70);
    doc.text(
      '“Ketelitian pencatatan hari ini adalah fondasi kelancaran operasional hari esok.”',
      centerX,
      y + 8.8,
      { align: 'center' }
    );

    // Symmetrical Centered Signature Column at Bottom Right
    const sigY = Math.max(y + 21, pageHeight - bottomMargin - 36);
    const sigColCenterX = m.left + m.contentWidth - 35;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.1);
    doc.setTextColor(51, 65, 85);
    doc.text(`Diterbitkan pada ${printedDate}`, sigColCenterX, sigY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(authorRole, sigColCenterX, sigY + 5.5, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.line(sigColCenterX - 30, sigY + 20, sigColCenterX + 30, sigY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(authorName, sigColCenterX, sigY + 25.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(appBrand, sigColCenterX, sigY + 30, { align: 'center' });
  }

  // =========================================================================
  // HALAMAN 2 & 3 (PDF Page 3 & 4): PLACEHOLDER FOR DETAILED TABLE OF CONTENTS
  // =========================================================================
  doc.addPage();
  const tocPageNum1 = doc.getNumberOfPages();
  pageSectionNames[tocPageNum1] = 'Daftar Isi (Bagian I)';

  doc.addPage();
  const tocPageNum2 = doc.getNumberOfPages();
  pageSectionNames[tocPageNum2] = 'Daftar Isi (Bagian II)';

  // Helper to add a new page and track section header
  const startNewPage = (sectionHeaderLabel: string) => {
    doc.addPage();
    const p = doc.getNumberOfPages();
    pageSectionNames[p] = sectionHeaderLabel;
    return { pageNum: p, margins: getMargins(p), y: topMargin };
  };

  // =========================================================================
  // CHAPTER PAGES (BAB 1 .. BAB N)
  // =========================================================================
  sections.forEach((section, sIdx) => {
    const babLabel = `BAB ${sIdx + 1}`;
    let state = startNewPage(`${babLabel} • ${section.title}`);
    let y = state.y;
    let m = state.margins;
    const chapterCenterX = m.left + m.contentWidth / 2;

    tocEntries.push({
      kind: 'main',
      badge: babLabel,
      title: section.title,
      subtitle: section.subtitle,
      page: state.pageNum - 1
    });

    // Centered Chapter Masthead Banner
    const titleWrapped = doc.splitTextToSize(section.title, m.contentWidth - 18);
    const subtitleWrapped = doc.splitTextToSize(section.subtitle, m.contentWidth - 18);
    const headerH = 15 + titleWrapped.length * 6 + subtitleWrapped.length * 4.2;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(m.left, y, m.contentWidth, headerH, 2.2, 2.2, 'FD');

    doc.setFillColor(16, 185, 129);
    doc.rect(m.left + 0.5, y, m.contentWidth - 1, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(5, 150, 105);
    doc.text(`${babLabel}  •  ${section.steps.length} MATERI PEMBAHASAN`, chapterCenterX, y + 7, {
      align: 'center'
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42);
    doc.text(titleWrapped, chapterCenterX, y + 13.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(71, 85, 105);
    doc.text(subtitleWrapped, chapterCenterX, y + 13.5 + titleWrapped.length * 5.8, {
      align: 'center'
    });

    y += headerH + 4.5;

    // Optional Chapter Overview Box
    if (section.overview) {
      const overviewText = `Ringkasan Materi: ${section.overview}`;
      const overviewLines = doc.splitTextToSize(overviewText, m.contentWidth - 12);
      const overviewH = 6.5 + overviewLines.length * 4.2;
      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(m.left, y, m.contentWidth, overviewH, 1.8, 1.8, 'FD');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.7);
      doc.setTextColor(51, 65, 85);
      doc.text(overviewText, m.left + 6, y + 5.2, {
        maxWidth: m.contentWidth - 12,
        align: 'justify',
        lineHeightFactor: 1.38
      });
      y += overviewH + 4.5;
    }

    // Steps / Sub-Bab Cards with razor-sharp flush left & right internal edges
    section.steps.forEach((step, stepIdx) => {
      const subCode = `${sIdx + 1}.${stepIdx + 1}`;
      const innerPad = 6;
      const textWidth = m.contentWidth - innerPad * 2;
      const titleWidth = m.contentWidth - innerPad * 2 - 12;
      const stepHeadingText = step.title;
      const stepTitleLines = doc.splitTextToSize(stepHeadingText, titleWidth);
      const stepDescLines = doc.splitTextToSize(step.description, textWidth);

      const details = step.details || [];
      let detailsHeight = 0;
      const detailLineCounts = details.map((d) => {
        const lines = doc.splitTextToSize(d, textWidth - 5);
        detailsHeight += lines.length * 4 + 1.2;
        return lines.length;
      });
      if (details.length > 0) detailsHeight += 2.2;

      const tipLines = step.tip ? doc.splitTextToSize(`Tips Lapangan: ${step.tip}`, textWidth - 7) : [];
      const tipBoxH = tipLines.length > 0 ? 5 + tipLines.length * 4 : 0;

      const cardH =
        6 +
        Math.max(7, stepTitleLines.length * 4.6) +
        1.8 +
        stepDescLines.length * 4.3 +
        detailsHeight +
        (tipBoxH > 0 ? 2.5 + tipBoxH : 0) +
        4.5;

      if (y + cardH > pageHeight - bottomMargin) {
        state = startNewPage(`${babLabel} • ${section.title}`);
        y = state.y;
        m = state.margins;
      }

      // Record exact sub-chapter page number in TOC
      tocEntries.push({
        kind: 'sub',
        code: subCode,
        title: step.title,
        page: state.pageNum - 1
      });

      // Card container
      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(m.left, y, m.contentWidth, cardH, 2.2, 2.2, 'FD');

      // Sub-chapter pill aligned cleanly to left padding (m.left + 6)
      doc.setFillColor(15, 23, 42);
      doc.roundedRect(m.left + innerPad, y + 4.3, 9.5, 5.2, 1.6, 1.6, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(255, 255, 255);
      doc.text(subCode, m.left + innerPad + 4.75, y + 7.9, { align: 'center' });

      // Step title next to pill
      let curY = y + 8.1;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.8);
      doc.setTextColor(15, 23, 42);
      doc.text(stepTitleLines, m.left + innerPad + 12, curY);
      curY += Math.max(6.2, stepTitleLines.length * 4.6) + 1.4;

      // Step description flush from m.left + 6 to right edge (rata kanan-kiri)
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.9);
      doc.setTextColor(51, 65, 85);
      doc.text(step.description, m.left + innerPad, curY, {
        maxWidth: textWidth,
        align: 'justify',
        lineHeightFactor: 1.38
      });
      curY += stepDescLines.length * 4.3;

      // Detailed Sub-points aligned flush inside card
      if (details.length > 0) {
        curY += 1.8;
        details.forEach((detailItem, dIdx) => {
          doc.setFillColor(16, 185, 129);
          doc.circle(m.left + innerPad + 1.6, curY - 1, 0.8, 'F');
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(8.4);
          doc.setTextColor(30, 41, 59);
          doc.text(detailItem, m.left + innerPad + 4.5, curY, {
            maxWidth: textWidth - 4.5,
            align: 'justify',
            lineHeightFactor: 1.35
          });
          curY += detailLineCounts[dIdx] * 4 + 1.2;
        });
      }

      // Optional tip box flush to inner card edges
      if (tipLines.length > 0) {
        curY += 1.8;
        doc.setFillColor(236, 253, 245);
        doc.setDrawColor(167, 243, 208);
        doc.roundedRect(m.left + innerPad, curY, textWidth, tipBoxH, 1.5, 1.5, 'FD');

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(8.2);
        doc.setTextColor(6, 95, 70);
        doc.text(`Tips Lapangan: ${step.tip}`, m.left + innerPad + 3.5, curY + 4.5, {
          maxWidth: textWidth - 7,
          align: 'justify',
          lineHeightFactor: 1.36
        });
      }

      y += cardH + 3.8;
    });

    // Pro Tip Box
    if (section.proTip) {
      const proLines = doc.splitTextToSize(`Tips Master: ${section.proTip}`, m.contentWidth - 15);
      const proH = 8 + proLines.length * 4.4;

      if (y + proH > pageHeight - bottomMargin) {
        state = startNewPage(`${babLabel} • ${section.title}`);
        y = state.y;
        m = state.margins;
      }

      doc.setFillColor(255, 251, 235);
      doc.setDrawColor(252, 211, 77);
      doc.roundedRect(m.left, y + 1, m.contentWidth, proH, 2.2, 2.2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.8);
      doc.setTextColor(146, 64, 14);
      doc.text(`Tips Master: ${section.proTip}`, m.left + 6, y + 6.8, {
        maxWidth: m.contentWidth - 15,
        align: 'justify',
        lineHeightFactor: 1.38
      });
    }
  });

  // =========================================================================
  // HALAMAN PENUTUP (CLOSING PAGE RIGHT AFTER CORE CHAPTERS)
  // =========================================================================
  {
    const closingState = startNewPage('Penutup • Kesimpulan & Komitmen');
    const m = closingState.margins;
    const centerX = m.left + m.contentWidth / 2;
    let y = topMargin + 3;

    tocEntries.push({
      kind: 'main',
      badge: 'PENUTUP',
      title: 'Penutup',
      subtitle: 'Kesimpulan operasional, komitmen tim, pemeliharaan data, dan pengesahan',
      page: closingState.pageNum - 1
    });
    tocEntries.push({
      kind: 'sub',
      code: 'P.1',
      title: 'Ringkasan Akhir & Pilar Keberhasilan Operasional',
      page: closingState.pageNum - 1
    });
    tocEntries.push({
      kind: 'sub',
      code: 'P.2',
      title: 'Pemeliharaan Sistem, Dukungan & Pengesahan Penyusun',
      page: closingState.pageNum - 1
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.setTextColor(5, 150, 105);
    doc.text('HALAMAN PENUTUP', centerX, y, { align: 'center' });

    y += 7.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 23, 42);
    doc.text('PENUTUP', centerX, y, { align: 'center' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(centerX - 44, y + 4.8, centerX - 14, y + 4.8);
    doc.line(centerX + 14, y + 4.8, centerX + 44, y + 4.8);
    doc.setFillColor(16, 185, 129);
    doc.rect(centerX - 11, y + 4, 22, 1.5, 'F');

    y += 15;

    const closingParagraphs = [
      `Demikian Buku Panduan Penggunaan Aplikasi ${appBrand} ini disusun sebagai acuan menyeluruh bagi seluruh tim operasional, admin gudang, dan pengelola persediaan. Mulai dari pengenalan sistem, alur kerja harian, manajemen Master Data dan Bottom Stock, pencatatan Daily Report, verifikasi Barang Datang, pengamanan PIN, hingga penanganan masalah telah dirangkum agar dapat langsung dipraktikkan secara konsisten.`,
      'Keberhasilan penerapan sistem digital tidak hanya ditentukan oleh kelengkapan fitur aplikasi, melainkan juga oleh kedisiplinan setiap pengguna dalam menjaga ketertiban pencatatan. Pembiasaan memeriksa stok menipis di pagi hari, memverifikasi barang datang pada tanggal yang sama, serta menjaga kerapian katalog produk akan menghadirkan data persediaan yang akurat setiap saat.',
      'Untuk menjaga kelangsungan operasional jangka panjang, tim dianjurkan melakukan pencadangan basis data (Download Backup JSON) secara berkala serta mengaktifkan pemantauan cloud menggunakan Supabase sebagai basis data standar. Apabila ditemukan kendala teknis di luar prosedur rutin, rujuklah kembali Bab Penanganan Masalah atau berkoordinasi dengan supervisor maupun pengembang aplikasi.',
      'Akhir kata, penyusun menyampaikan terima kasih atas dedikasi seluruh tim yang senantiasa menjaga kualitas operasional kerja sehari-hari. Semoga panduan ini menjadi mitra kerja yang andal dalam mendukung kelancaran distribusi, ketepatan pelaporan, serta kemajuan usaha secara berkelanjutan.'
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);

    closingParagraphs.forEach((para) => {
      const lines = doc.splitTextToSize(para, m.contentWidth);
      doc.text(para, m.left, y, {
        maxWidth: m.contentWidth,
        align: 'justify',
        lineHeightFactor: 1.44
      });
      y += lines.length * 4.75 + 3.6;
    });

    y += 1.5;
    const commitmentItems = [
      '1. Tertib Master Data — Menjaga nama produk, supplier, satuan, dan batas Bottom Stock selalu mutakhir.',
      '2. Disiplin Verifikasi Harian — Mencatat Daily Report dan Barang Datang pada tanggal transaksi yang tepat.',
      '3. Keamanan & Cadangan Data — Melindungi pengaturan sistem dengan PIN serta mengunduh Backup JSON rutin.',
      '4. Kolaborasi & Evaluasi Berkala — Menyelesaikan kendala sesuai panduan dan melakukan evaluasi stok mingguan.'
    ];
    const commitmentBoxH = 14 + commitmentItems.length * 6;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(m.left, y, m.contentWidth, commitmentBoxH, 2.2, 2.2, 'FD');
    doc.setFillColor(16, 185, 129);
    doc.rect(m.left, y, m.contentWidth, 1.4, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.4);
    doc.setTextColor(15, 23, 42);
    doc.text('Komitmen & Pilar Keberhasilan Operasional', m.left + 8, y + 7.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.6);
    doc.setTextColor(51, 65, 85);
    commitmentItems.forEach((item, idx) => {
      doc.text(item, m.left + 8, y + 13.8 + idx * 5.8);
    });

    y += commitmentBoxH + 6.5;

    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(m.left, y, m.contentWidth, 14.5, 2, 2, 'FD');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9.1);
    doc.setTextColor(6, 95, 70);
    doc.text(
      '“Sistem yang tertata rapi bekerja paling maksimal ketika dijalankan oleh tim yang disiplin, cermat, dan saling mendukung.”',
      centerX,
      y + 8.8,
      { align: 'center', maxWidth: m.contentWidth - 12 }
    );

    const sigY = Math.max(y + 20, pageHeight - bottomMargin - 36);
    const sigColCenterX = m.left + m.contentWidth - 35;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.1);
    doc.setTextColor(51, 65, 85);
    doc.text('Disusun & Disahkan Oleh,', sigColCenterX, sigY, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    doc.text(authorRole, sigColCenterX, sigY + 5.5, { align: 'center' });

    doc.setDrawColor(148, 163, 184);
    doc.line(sigColCenterX - 30, sigY + 20, sigColCenterX + 30, sigY + 20);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text(authorName, sigColCenterX, sigY + 25.5, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(`${appBrand} • Edisi ${versionLabel}`, sigColCenterX, sigY + 30, { align: 'center' });
  }

  // =========================================================================
  // APPENDIX A: FAQ & KEYBOARD SHORTCUTS
  // =========================================================================
  const defaultFaqs: GuidePdfFaqItem[] = options?.faqs || [
    {
      question: 'Apakah data saya hilang jika ganti HP atau komputer?',
      answer:
        'Tidak, selama menggunakan Supabase Cloud atau Firebase Firestore, data tersimpan di cloud dan otomatis tersinkronisasi saat login di perangkat baru.'
    },
    {
      question: 'Bagaimana cara membagikan rekap laporan ke WhatsApp?',
      answer:
        'Klik "Ekspor TXT" di menu Daily Report. Format teks rapi tersusun per supplier (termasuk item Reorder Ulang) siap langsung di-paste ke grup WhatsApp.'
    },
    {
      question: 'Bagaimana cara mengubah batas Bottom Stock dan edit barang?',
      answer:
        'Batas Bottom Stock dapat diatur langsung dari Master Data (per item atau massal), pada form Tambah Produk, maupun langsung di halaman Daily Report.'
    },
    {
      question: 'Mengapa pengaturan Database dan Data & Sistem meminta PIN?',
      answer:
        'PIN melindungi konfigurasi database, migrasi cloud, dan reset data agar tidak berubah atau terhapus secara tidak sengaja oleh pengguna lain.'
    }
  ];

  const defaultShortcuts: GuidePdfShortcutItem[] = options?.shortcuts || [
    { keys: 'Enter (di Qty)', description: 'Masukkan item ke antrean (+ Ke List) pada Daily Report.' },
    { keys: 'Esc', description: 'Tutup mode Layar Penuh atau jendela dialog aktif.' },
    { keys: 'Panah Atas / Bawah', description: 'Navigasi cepat pada daftar rekomendasi autocomplete produk.' },
    { keys: 'Ctrl + P / Cmd + P', description: 'Buka dialog cetak browser langsung pada mode Pratinjau Buku A4.' }
  ];

  {
    let state = startNewPage('Lampiran A • Tanya Jawab & Pintasan');
    let y = state.y;
    let m = state.margins;
    const appACenterX = m.left + m.contentWidth / 2;

    tocEntries.push({
      kind: 'main',
      badge: 'LAMPIRAN A',
      title: 'Tanya Jawab Cepat (FAQ) & Pintasan Keyboard',
      subtitle: 'Solusi kendala operasional umum dan daftar tombol pintas aplikasi',
      page: state.pageNum - 1
    });

    tocEntries.push({
      kind: 'sub',
      code: 'A.1',
      title: 'Tanya Jawab Operasional & Kendala Umum (FAQ)',
      page: state.pageNum - 1
    });

    doc.setFillColor(15, 23, 42);
    doc.roundedRect(m.left, y, m.contentWidth, 18, 2.2, 2.2, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(110, 231, 183);
    doc.text('LAMPIRAN A', appACenterX, y + 6.5, { align: 'center' });
    doc.setFontSize(12.5);
    doc.setTextColor(255, 255, 255);
    doc.text('Tanya Jawab Cepat (FAQ) & Pintasan Keyboard', appACenterX, y + 13.5, {
      align: 'center'
    });
    y += 23;

    defaultFaqs.forEach((faq) => {
      const qLines = doc.splitTextToSize(`T: ${faq.question}`, m.contentWidth - 10);
      const aLines = doc.splitTextToSize(`J: ${faq.answer}`, m.contentWidth - 10);
      const boxH = 6.5 + qLines.length * 4.3 + aLines.length * 4.1 + 3.5;

      if (y + boxH > pageHeight - bottomMargin) {
        state = startNewPage('Lampiran A • Tanya Jawab & Pintasan');
        y = state.y;
        m = state.margins;
      }

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(m.left, y, m.contentWidth, boxH, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(15, 23, 42);
      doc.text(qLines, m.left + 5, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(71, 85, 105);
      doc.text(`J: ${faq.answer}`, m.left + 5, y + 6 + qLines.length * 4.3 + 0.8, {
        maxWidth: m.contentWidth - 10,
        align: 'justify',
        lineHeightFactor: 1.38
      });

      y += boxH + 3;
    });

    y += 3;
    if (y + 48 > pageHeight - bottomMargin) {
      state = startNewPage('Lampiran A • Tanya Jawab & Pintasan');
      y = state.y;
      m = state.margins;
    }

    tocEntries.push({
      kind: 'sub',
      code: 'A.2',
      title: 'Tabel Pintasan Keyboard & Navigasi Cepat',
      page: state.pageNum - 1
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Pintasan Keyboard & Navigasi Cepat', m.left, y);
    y += 3.5;

    autoTable(doc, {
      startY: y,
      head: [['Tombol / Aksi', 'Fungsi Operasional']],
      body: defaultShortcuts.map((s) => [s.keys, s.description]),
      theme: 'grid',
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8.8 },
      bodyStyles: { fontSize: 8.4, textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 46, fontStyle: 'bold' } },
      margin: { left: m.left, right: m.right }
    });
  }

  // =========================================================================
  // APPENDIX B: NOTES & TRAINING SIGN-OFF PAGE (HALAMAN CATATAN)
  // =========================================================================
  if (includeNotesPage) {
    const state = startNewPage('Lampiran B • Catatan Lapangan & Paraf');
    let y = state.y;
    const m = state.margins;
    const appBCenterX = m.left + m.contentWidth / 2;

    tocEntries.push({
      kind: 'main',
      badge: 'LAMPIRAN B',
      title: 'Lembar Catatan Lapangan & Paraf Pelatihan',
      subtitle: 'Halaman catatan fisik untuk tim operasional dan pengesahan penggunaan',
      page: state.pageNum - 1
    });

    tocEntries.push({
      kind: 'sub',
      code: 'B.1',
      title: 'Kolom Catatan SOP Internal & Daftar Kontak Penting',
      page: state.pageNum - 1
    });
    tocEntries.push({
      kind: 'sub',
      code: 'B.2',
      title: 'Lembar Paraf Pengesahan Pelatihan & Kolofon Penerbitan',
      page: state.pageNum - 1
    });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13.5);
    doc.setTextColor(15, 23, 42);
    doc.text('Catatan Lapangan & SOP Internal', appBCenterX, y + 2, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(100, 116, 139);
    doc.text(
      'Gunakan halaman ini untuk mencatat prosedur khusus gudang, daftar kontak supplier, atau jadwal cadangan berkala.',
      appBCenterX,
      y + 8,
      { align: 'center', maxWidth: m.contentWidth - 16 }
    );

    y += 18;
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    for (let i = 0; i < 18; i++) {
      doc.line(m.left, y, m.left + m.contentWidth, y);
      y += 9.7;
    }

    // Centered Sign-off boxes at bottom
    const signY = pageHeight - bottomMargin - 42;
    const boxW = (m.contentWidth - 8) / 2;
    [
      { role: 'Diterima Oleh (Staff / Operator)', line: 'Nama Lengkap & Tanda Tangan' },
      { role: 'Disahkan Oleh (Supervisor / Admin)', line: 'Nama Lengkap & Tanda Tangan' }
    ].forEach((sign, idx) => {
      const sx = m.left + idx * (boxW + 8);
      const sCenterX = sx + boxW / 2;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(sx, signY, boxW, 30, 2, 2, 'FD');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);
      doc.text(sign.role, sCenterX, signY + 6.5, { align: 'center' });

      doc.setDrawColor(148, 163, 184);
      doc.line(sx + 8, signY + 22.5, sx + boxW - 8, signY + 22.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(sign.line, sCenterX, signY + 27.2, { align: 'center' });
    });

    // Centered Colophon strip at bottom with Denuda attribution
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.4);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Kolofon: ${authorRole}: ${authorName} • Format A4 Portrait • ${appBrand} (${versionLabel}) • ${printedDate}`,
      appBCenterX,
      pageHeight - bottomMargin - 4,
      { align: 'center' }
    );
  }

  // =========================================================================
  // BACKFILL PAGES 3 & 4 (HALAMAN 2 & 3): DETAILED TABLE OF CONTENTS
  // =========================================================================
  const drawTocHeader = (pageNum: number, showHeading: boolean = true) => {
    doc.setPage(pageNum);
    const m = getMargins(pageNum);
    if (!showHeading) {
      return { m, y: topMargin + 2 };
    }
    const tocCenterX = m.left + m.contentWidth / 2;
    const y = topMargin + 4;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(15, 23, 42);
    doc.text('DAFTAR ISI', tocCenterX, y, {
      align: 'center'
    });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.35);
    doc.line(tocCenterX - 44, y + 5.2, tocCenterX - 14, y + 5.2);
    doc.line(tocCenterX + 14, y + 5.2, tocCenterX + 44, y + 5.2);
    doc.setFillColor(16, 185, 129);
    doc.rect(tocCenterX - 11, y + 4.5, 22, 1.5, 'F');

    return { m, y: y + 12.5 };
  };

  let currentTocPage = tocPageNum1;
  let tocCursor = drawTocHeader(tocPageNum1, true);

  tocEntries.forEach((entry, idx) => {
    const neededH = entry.kind === 'main' ? 11.5 : 4.8;
    // Prevent orphan main heading right at bottom of TOC page 1
    const nextEntry = tocEntries[idx + 1];
    const orphanGuard = entry.kind === 'main' && nextEntry?.kind === 'sub' ? 5.5 : 0;

    if (
      currentTocPage === tocPageNum1 &&
      tocCursor.y + neededH + orphanGuard > pageHeight - bottomMargin - 4
    ) {
      currentTocPage = tocPageNum2;
      tocCursor = drawTocHeader(tocPageNum2, false);
    }

    const m = tocCursor.m;
    let y = tocCursor.y;

    if (entry.kind === 'main') {
      if (y > topMargin + 22) y += 1.2;
      doc.setFillColor(241, 245, 249);
      doc.roundedRect(m.left, y - 3.8, 24, 5.8, 1.2, 1.2, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.1);
      doc.setTextColor(5, 150, 105);
      doc.text(entry.badge || '', m.left + 12, y + 0.2, { align: 'center' });

      const titleX = m.left + 27;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.setTextColor(15, 23, 42);
      const maxTocTitleW = m.contentWidth - 44;
      const clippedTitle = doc.splitTextToSize(entry.title, maxTocTitleW)[0] || entry.title;
      doc.text(clippedTitle, titleX, y);

      const pageLabel = `Hal. ${entry.page}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.2);
      doc.setTextColor(15, 23, 42);
      doc.text(pageLabel, m.left + m.contentWidth, y, { align: 'right' });

      const titleWidth = doc.getTextWidth(clippedTitle);
      const pageWidthTxt = doc.getTextWidth(pageLabel);
      const dotStart = titleX + titleWidth + 2.5;
      const dotEnd = m.left + m.contentWidth - pageWidthTxt - 2.5;
      if (dotEnd > dotStart + 5) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.2);
        doc.setTextColor(148, 163, 184);
        let dx = dotStart;
        while (dx < dotEnd) {
          doc.text('.', dx, y);
          dx += 2.1;
        }
      }

      if (entry.subtitle) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(100, 116, 139);
        const clippedSub = doc.splitTextToSize(entry.subtitle, maxTocTitleW)[0] || entry.subtitle;
        doc.text(clippedSub, titleX, y + 4);
        y += 8.4;
      } else {
        y += 5.5;
      }

      doc.setDrawColor(226, 232, 240);
      doc.line(m.left, y - 1.5, m.left + m.contentWidth, y - 1.5);
      tocCursor.y = y + 1.5;
    } else {
      const codeX = m.left + 27;
      const subTitleX = m.left + 36;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(5, 150, 105);
      doc.text(entry.code || '', codeX, y);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.1);
      doc.setTextColor(51, 65, 85);
      const maxSubW = m.contentWidth - 52;
      const clippedSubTitle = doc.splitTextToSize(entry.title, maxSubW)[0] || entry.title;
      doc.text(clippedSubTitle, subTitleX, y);

      const subPageLabel = `${entry.page}`;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(71, 85, 105);
      doc.text(subPageLabel, m.left + m.contentWidth, y, { align: 'right' });

      const subW = doc.getTextWidth(clippedSubTitle);
      const subPgW = doc.getTextWidth(subPageLabel);
      const dotStart = subTitleX + subW + 2.5;
      const dotEnd = m.left + m.contentWidth - subPgW - 2.5;
      if (dotEnd > dotStart + 5) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.6);
        doc.setTextColor(180, 190, 204);
        let dx = dotStart;
        while (dx < dotEnd) {
          doc.text('.', dx, y);
          dx += 2.1;
        }
      }

      tocCursor.y = y + 4.9;
    }
  });

  // =========================================================================
  // RUNNING HEADER & FOOTER FOR ALL CONTENT PAGES (PDF PAGE 2..N -> HALAMAN 1..N-1)
  // =========================================================================
  const totalPages = doc.getNumberOfPages();
  const totalBookPages = Math.max(1, totalPages - 1);
  for (let p = 2; p <= totalPages; p++) {
    doc.setPage(p);
    const m = getMargins(p);
    const bookPage = p - 1;

    // Symmetrical Header bar (12mm text, 14.5mm divider, content starts at 20.5mm)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`BUKU PANDUAN • ${appBrand.toUpperCase()}`, m.left, 12);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    const sectionLabel = pageSectionNames[p] || 'Panduan Aplikasi';
    doc.text(sectionLabel, m.left + m.contentWidth, 12, { align: 'right' });

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.line(m.left, 14.5, m.left + m.contentWidth, 14.5);

    // Symmetrical Footer bar (14.5mm from bottom divider, 10mm text baseline)
    doc.setDrawColor(203, 213, 225);
    doc.line(m.left, pageHeight - 14.5, m.left + m.contentWidth, pageHeight - 14.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text(`Dokumen Operasional Resmi • ${versionLabel} • Oleh ${authorName}`, m.left, pageHeight - 10);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`Halaman ${bookPage} dari ${totalBookPages}`, m.left + m.contentWidth, pageHeight - 10, {
      align: 'right'
    });
  }

  doc.save(`${filename}.pdf`);
};
