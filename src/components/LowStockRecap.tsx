import React, { useMemo } from 'react';
import { useAppContext } from '../store/AppContext';
import { AlertTriangle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';

export const LowStockRecap = () => {
  const { products, suppliers } = useAppContext();

  const lowStockData = useMemo(() => {
    // 1. Filter products where stock < bottomStock
    const filtered = products.filter(
      p => p.stock !== undefined && p.bottomStock !== undefined && p.stock < p.bottomStock
    );

    // 2. Group by primary supplierId
    const grouped = filtered.reduce((acc, product) => {
      const sId = product.supplierId || 'unknown';
      if (!acc[sId]) {
        acc[sId] = [];
      }
      acc[sId].push(product);
      return acc;
    }, {} as Record<string, typeof products>);

    return grouped;
  }, [products]);

  const handleExportExcel = () => {
    const wsData = [];
    
    // Header
    wsData.push(['Supplier Utama', 'Produk', 'Sisa Stok', 'Batas Minimum', 'Kategori', 'Lokasi', 'Alternatif Supplier']);
    
    Object.entries(lowStockData as Record<string, any[]>).forEach(([supplierId, prods]) => {
      const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
      prods.forEach(p => {
        const altSuppliers = (p.alternativeSupplierIds || [])
          .map(altId => suppliers.find(s => s.id === altId)?.name || altId)
          .join(', ');
        
        wsData.push([
          supplierName,
          p.name,
          p.stock,
          p.bottomStock,
          p.category || '-',
          p.location || '-',
          altSuppliers || '-'
        ]);
      });
    });

    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Stok Menipis');
    XLSX.writeFile(wb, 'Rekap_Stok_Menipis.xlsx');
  };

  const handleExportTxt = () => {
    let txtContent = 'REKAP STOK MENIPIS\n';
    txtContent += '===================\n\n';

    Object.entries(lowStockData as Record<string, any[]>).forEach(([supplierId, prods]) => {
      const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
      txtContent += `SUPPLIER: ${supplierName}\n`;
      txtContent += `-------------------------------------------------\n`;
      
      prods.forEach(p => {
        const altSuppliers = (p.alternativeSupplierIds || [])
          .map(altId => suppliers.find(s => s.id === altId)?.name || altId)
          .join(', ');
        
        txtContent += `- ${p.name}\n`;
        txtContent += `  Stok: ${p.stock} (Batas: ${p.bottomStock})\n`;
        if (p.category) txtContent += `  Kategori: ${p.category}\n`;
        if (p.location) txtContent += `  Lokasi: ${p.location}\n`;
        if (altSuppliers) txtContent += `  Alternatif Supplier: ${altSuppliers}\n`;
        txtContent += '\n';
      });
      txtContent += '\n';
    });

    const blob = new Blob([txtContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Rekap_Stok_Menipis.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasData = Object.keys(lowStockData).length > 0;

  return (
    <div className="h-full flex flex-col w-full max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-theme-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-rose-500" />
            Rekap Stok Menipis
          </h1>
          <p className="text-sm text-theme-600-text mt-1">Daftar produk dengan stok kurang dari batas minimum (Bottom Stock)</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={handleExportExcel}
            disabled={!hasData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-theme-900 text-white rounded-xl hover:bg-theme-800 transition-colors disabled:opacity-50 text-sm font-bold"
          >
            <Download className="w-4 h-4" /> Excel
          </button>
          <button 
            onClick={handleExportTxt}
            disabled={!hasData}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white text-theme-900 border border-theme-200 rounded-xl hover:bg-theme-50 transition-colors disabled:opacity-50 text-sm font-bold shadow-sm"
          >
            <Download className="w-4 h-4" /> Txt
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {!hasData ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white rounded-3xl border border-theme-200 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-theme-50 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-theme-300" />
            </div>
            <h3 className="text-xl font-bold text-theme-900 mb-2">Stok Aman</h3>
            <p className="text-theme-600-text max-w-md">Tidak ada produk yang stoknya berada di bawah batas minimum saat ini.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {Object.entries(lowStockData as Record<string, any[]>).map(([supplierId, prods]) => {
              const supplierName = suppliers.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
              
              return (
                <div key={supplierId} className="bg-white rounded-3xl border border-theme-200 shadow-sm overflow-hidden">
                  <div className="bg-theme-50 border-b border-theme-100 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-lg font-bold text-theme-900">{supplierName}</h2>
                    <span className="bg-white text-theme-600-text px-3 py-1 rounded-full text-xs font-bold border border-theme-200 shadow-sm">
                      {prods.length} Produk
                    </span>
                  </div>
                  
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                      {prods.map(p => {
                        const altSuppliers = (p.alternativeSupplierIds || [])
                          .map(altId => suppliers.find(s => s.id === altId)?.name || altId);

                        return (
                          <div key={p.id} className="border border-rose-100 bg-rose-50/30 rounded-2xl p-4 flex flex-col gap-3 relative">
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex flex-col">
                                <span className="font-bold text-theme-900">{p.name}</span>
                                {p.category && (
                                  <span className="text-[10px] uppercase font-bold text-theme-500 tracking-wider mt-0.5">{p.category}</span>
                                )}
                              </div>
                              <div className="flex flex-col items-end shrink-0">
                                <div className="bg-rose-100 text-rose-700 font-bold px-2 py-1 rounded-lg text-sm shadow-sm border border-rose-200">
                                  {p.stock} {p.unit}
                                </div>
                                <span className="text-[10px] text-rose-500 font-medium mt-1">Batas: {p.bottomStock}</span>
                              </div>
                            </div>
                            
                            {(p.location || altSuppliers.length > 0) && (
                              <div className="flex flex-col gap-2 pt-3 border-t border-rose-100/50 mt-1">
                                {p.location && (
                                  <div className="flex items-center gap-2 text-xs">
                                    <span className="font-bold text-theme-500">Lokasi:</span>
                                    <span className="text-theme-700">{p.location}</span>
                                  </div>
                                )}
                                {altSuppliers.length > 0 && (
                                  <div className="flex flex-col gap-1 text-xs">
                                    <span className="font-bold text-theme-500">Alternatif Supplier:</span>
                                    <div className="flex flex-wrap gap-1">
                                      {altSuppliers.map((altName, i) => (
                                        <span key={i} className="bg-white border border-theme-200 text-theme-700 px-2 py-0.5 rounded-md text-[10px] font-medium shadow-sm">
                                          {altName}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
