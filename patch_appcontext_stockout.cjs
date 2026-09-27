const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const interfaceSearch = `  addStockOut: (entry: Omit<StockOutEntry, 'id'>) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;
}`;
const interfaceReplace = `  addStockOut: (entry: Omit<StockOutEntry, 'id'>) => Promise<void>;
  updateStockOut: (id: string, entry: Partial<StockOutEntry>) => Promise<void>;
  deleteStockOut: (id: string) => Promise<void>;
}`;
code = code.replace(interfaceSearch, interfaceReplace);

const implSearch = `  const addStockOut = async (entry: Omit<StockOutEntry, 'id'>) => {
    if (!userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await addDoc(collection(db, 'stock_outs'), { ...cleanData, createdAt: Date.now(), userId });
  };`;
const implReplace = `  const addStockOut = async (entry: Omit<StockOutEntry, 'id'>) => {
    if (!userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await addDoc(collection(db, 'stock_outs'), { ...cleanData, createdAt: Date.now(), userId });
  };

  const updateStockOut = async (id: string, entry: Partial<StockOutEntry>) => {
    if (!id || !userId) return;
    const cleanData = Object.fromEntries(Object.entries(entry).filter(([_, v]) => v !== undefined));
    await updateDoc(doc(db, 'stock_outs', id), cleanData);
  };`;
code = code.replace(implSearch, implReplace);

const exportSearch = `      resetAllData, updateSettings, addStockOut, deleteStockOut
    }}>`;
const exportReplace = `      resetAllData, updateSettings, addStockOut, updateStockOut, deleteStockOut
    }}>`;
code = code.replace(exportSearch, exportReplace);

fs.writeFileSync(file, code);
