const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(
  "import { Product, ReportEntry, Supplier, UserSettings, AutoDeleteMode } from '../types';",
  "import { Product, ReportEntry, Supplier, UserSettings, AutoDeleteMode, StockOutEntry } from '../types';"
);

code = code.replace(
  "  reports: ReportEntry[];",
  "  reports: ReportEntry[];\n  stockOuts: StockOutEntry[];"
);

code = code.replace(
  "  updateSettings: (settings: UserSettings) => Promise<void>;",
  "  updateSettings: (settings: UserSettings) => Promise<void>;\n  addStockOut: (entry: Omit<StockOutEntry, 'id'>) => Promise<void>;\n  deleteStockOut: (id: string) => Promise<void>;"
);

code = code.replace(
  "  reports: [],",
  "  reports: [],\n  stockOuts: [],"
);

const onSnapshotSearch = `    const reportsRef = collection(db, 'reports');
    const settingsRef = doc(db, 'settings', 'public');`;

const onSnapshotReplace = `    const reportsRef = collection(db, 'reports');
    const stockOutsRef = collection(db, 'stock_outs');
    const settingsRef = doc(db, 'settings', 'public');`;

code = code.replace(onSnapshotSearch, onSnapshotReplace);

const onSnapshotSubSearch = `    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportEntry));
      setState(prev => ({ ...prev, reports }));
    });`;

const onSnapshotSubReplace = `    const unsubReports = onSnapshot(reportsRef, (snapshot) => {
      const reports = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReportEntry));
      setState(prev => ({ ...prev, reports }));
    });

    const unsubStockOuts = onSnapshot(stockOutsRef, (snapshot) => {
      const stockOuts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StockOutEntry));
      setState(prev => ({ ...prev, stockOuts }));
    });`;

code = code.replace(onSnapshotSubSearch, onSnapshotSubReplace);

const unsubscribeSearch = `      unsubReports();
      unsubSettings();`;

const unsubscribeReplace = `      unsubReports();
      unsubStockOuts();
      unsubSettings();`;

code = code.replace(unsubscribeSearch, unsubscribeReplace);

const methodsSearch = `  const deleteReportsByDateRange = async (startDate: string, endDate: string) => {`;

const methodsReplace = `
  const addStockOut = async (entry: Omit<StockOutEntry, 'id'>) => {
    if (!userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await addDoc(collection(db, 'stock_outs'), { ...cleanData, createdAt: Date.now(), userId });
  };

  const deleteStockOut = async (id: string) => {
    if (!id || !userId) return;
    await deleteDoc(doc(db, 'stock_outs', id));
  };

  const deleteReportsByDateRange = async (startDate: string, endDate: string) => {`;

code = code.replace(methodsSearch, methodsReplace);

const exportSearch = `resetAllData, updateSettings
    }}>`;

const exportReplace = `resetAllData, updateSettings, addStockOut, deleteStockOut
    }}>`;

code = code.replace(exportSearch, exportReplace);

fs.writeFileSync(file, code);
