const fs = require('fs');
const fileContext = 'src/store/AppContext.tsx';

let code = fs.readFileSync(fileContext, 'utf-8');

code = code.replace(/importMasterData: \([\s\S]*?\) => Promise<string\[\]>;/m,
`  importMasterData: (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string; category?: string }[]
  ) => Promise<string[]>;
  exportData: () => void;
  importData: (jsonData: string) => Promise<void>;`);

code = code.replace(/const resetAllData = async \(\) => {/m,
`  const exportData = () => {
    const data = {
      suppliers: state.suppliers,
      products: state.products,
      reports: state.reports,
      stockOuts: state.stockOuts,
      settings: state.settings,
      exportDate: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = \`DailyReportPro_Backup_\${new Date().toISOString().split('T')[0]}.json\`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (!data.suppliers || !data.products) throw new Error("Format cadangan tidak valid (kurang dari versi terbaru).");
      
      const ops: any[] = [];
      
      const queueOps = (collection: string, items: any[]) => {
        if (Array.isArray(items)) {
          items.forEach(item => {
            const { id, ...rest } = item;
            if (id) {
              ops.push({ type: 'set', collection, id, data: rest });
            }
          });
        }
      };
      
      queueOps('suppliers', data.suppliers);
      queueOps('products', data.products);
      queueOps('reports', data.reports);
      queueOps('stock_outs', data.stockOuts);
      
      if (data.settings) {
        ops.push({ type: 'set', collection: 'settings', id: 'public', data: data.settings });
      }
      
      await executeBatch(ops);
      alert("Restore Data berhasil diselesaikan!");
    } catch (error) {
      console.error("Import failed", error);
      alert("Gagal memulihkan (restore) data. Pastikan file JSON yang dipilih adalah cadangan yang valid.");
    }
  };

  const resetAllData = async () => {`);

code = code.replace(/addReport, updateReport, deleteReport, deleteMultipleReports, deleteReportsByDateRange, importMasterData,/m,
`addReport, updateReport, deleteReport, deleteMultipleReports, deleteReportsByDateRange, importMasterData, exportData, importData,`);

fs.writeFileSync(fileContext, code);

