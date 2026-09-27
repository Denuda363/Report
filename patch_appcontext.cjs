const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importsToAdd = `import { subscribeToCollection, addRecord, updateRecord, deleteRecord, executeBatch, setLocalDbSetting, isLocalDb } from '../lib/dbAdapter';\n`;
code = importsToAdd + code;

// Replace unsubscribes
code = code.replace(/    const suppliersRef = collection\(db, 'suppliers'\);[\s\S]*?    const unsubSettings = onSnapshot\(settingsRef, \(docSnap\) => {[\s\S]*?    }\);/m, 
`    const unsubSuppliers = subscribeToCollection('suppliers', (data) => {
      setState(prev => ({ ...prev, suppliers: data }));
    });
    const unsubProducts = subscribeToCollection('products', (data) => {
      setState(prev => ({ ...prev, products: data }));
    });
    const unsubReports = subscribeToCollection('reports', (data) => {
      setState(prev => ({ ...prev, reports: data }));
    });
    const unsubStockOuts = subscribeToCollection('stock_outs', (data) => {
      setState(prev => ({ ...prev, stockOuts: data }));
    });
    const unsubSettings = subscribeToCollection('settings', (data) => {
      if (data.length > 0) {
        setState(prev => ({ ...prev, settings: { ...data[0], useLocalDb: isLocalDb() } }));
      } else {
        setState(prev => ({ ...prev, settings: { autoDeleteMode: 'none', useLocalDb: isLocalDb() } }));
      }
    });`);

// Update add/update/delete methods
code = code.replace(/const batch = writeBatch\(db\);\s+reportsToDelete\.forEach\(r => {[\s\S]*?}\);\s+batch\.commit\(\)\.catch\(e => console\.error\("Auto delete failed", e\)\);/m, 
`      const ops = reportsToDelete.map(r => r.isArrived 
        ? { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } }
        : { type: 'delete', collection: 'reports', id: r.id }
      ) as any[];
      executeBatch(ops).catch(e => console.error("Auto delete failed", e));`);

code = code.replace(/const updateSettings = async \(settings: UserSettings\) => {[\s\S]*?await setDoc\(doc\(db, 'settings', 'public'\), settings\);[\s\S]*?};/m, 
`  const updateSettings = async (settings: UserSettings) => {
    if (settings.useLocalDb !== undefined) {
      const changed = isLocalDb() !== settings.useLocalDb;
      setLocalDbSetting(settings.useLocalDb);
      if (changed) {
        window.location.reload();
        return;
      }
    }
    await updateRecord('settings', 'public', settings);
  };`);

code = code.replace(/const docRef = await addDoc\(collection\(db, 'suppliers'\), { \.\.\.supplier, userId }\);\s+return docRef\.id;/m, 
`    const id = await addRecord('suppliers', { ...supplier, userId });
    return id;`);

code = code.replace(/await updateDoc\(doc\(db, 'suppliers', id\), data\);/m, `await updateRecord('suppliers', id, data);`);
code = code.replace(/await deleteDoc\(doc\(db, 'suppliers', id\)\);/m, `await deleteRecord('suppliers', id);`);

code = code.replace(/const docRef = await addDoc\(collection\(db, 'products'\), { \.\.\.cleanData, userId }\);\s+return docRef\.id;/m, 
`    const id = await addRecord('products', { ...cleanData, userId });
    return id;`);

code = code.replace(/await updateDoc\(doc\(db, 'products', id\), cleanData\);/m, `await updateRecord('products', id, cleanData);`);
code = code.replace(/await deleteDoc\(doc\(db, 'products', id\)\);/m, `await deleteRecord('products', id);`);

// resetAllProductStocks
code = code.replace(/const batches = \[\];\s+let currentBatch = writeBatch\(db\);[\s\S]*?await Promise\.all\(batches\);/m, 
`    const ops = state.products.filter(p => p.stock !== 0).map(p => ({
      type: 'update', collection: 'products', id: p.id, data: { stock: 0 }
    })) as any[];
    await executeBatch(ops);`);

code = code.replace(/await addDoc\(collection\(db, 'reports'\), { \.\.\.cleanData, createdAt: Date\.now\(\), userId }\);/m, 
`await addRecord('reports', { ...cleanData, createdAt: Date.now(), userId });`);

code = code.replace(/await updateDoc\(doc\(db, 'reports', id\), cleanData\);/m, `await updateRecord('reports', id, cleanData);`);

code = code.replace(/await updateDoc\(doc\(db, 'reports', id\), {\s+quantity: 0,\s+isKosongPabrik: false,\s+isArrivedOnly: true\s+}\);\s+return;\s+}\s+}\s+await deleteDoc\(doc\(db, 'reports', id\)\);/m, 
`await updateRecord('reports', id, {
          quantity: 0,
          isKosongPabrik: false,
          isArrivedOnly: true
        });
        return;
      }
    }
    
    await deleteRecord('reports', id);`);

code = code.replace(/const batch = writeBatch\(db\);\s+ids\.forEach\(id => {[\s\S]*?}\);\s+batch\.delete\(doc\(db, 'reports', id\)\);\s+}\);\s+await batch\.commit\(\);/m, 
`      const ops = ids.map(id => {
        if (!forceDeleteArrived) {
          const report = state.reports.find(r => r.id === id);
          if (report && report.isArrived) {
            return { type: 'update', collection: 'reports', id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
          }
        }
        return { type: 'delete', collection: 'reports', id };
      }) as any[];
      await executeBatch(ops);`);

code = code.replace(/await addDoc\(collection\(db, 'stock_outs'\), { \.\.\.cleanData, createdAt: Date\.now\(\), userId }\);/m, 
`await addRecord('stock_outs', { ...cleanData, createdAt: Date.now(), userId });`);

code = code.replace(/await updateDoc\(doc\(db, 'stock_outs', id\), cleanData\);/m, `await updateRecord('stock_outs', id, cleanData);`);
code = code.replace(/await deleteDoc\(doc\(db, 'stock_outs', id\)\);/m, `await deleteRecord('stock_outs', id);`);

code = code.replace(/const batch = writeBatch\(db\);\s+reportsToDelete\.forEach\(r => {[\s\S]*?}\);\s+await batch\.commit\(\);/m, 
`      const ops = reportsToDelete.map(r => {
        if (r.isArrived) {
          return { type: 'update', collection: 'reports', id: r.id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
        }
        return { type: 'delete', collection: 'reports', id: r.id };
      }) as any[];
      await executeBatch(ops);`);

// importMasterData
code = code.replace(/const docRef = await addDoc\(collection\(db, 'suppliers'\), { name: ns\.name, userId }\);\s+addedSuppliers\.set\(key, docRef\.id\);/m, 
`const id = await addRecord('suppliers', { name: ns.name, userId });
            addedSuppliers.set(key, id);`);
code = code.replace(/const docRef = await addDoc\(collection\(db, 'suppliers'\), { name: np\.supplierName, userId }\);\s+addedSuppliers\.set\(key, docRef\.id\);/m, 
`const id = await addRecord('suppliers', { name: np.supplierName, userId });
            addedSuppliers.set(key, id);`);
code = code.replace(/await updateDoc\(doc\(db, 'products', existingProduct\.id\), {[\s\S]*?}\);/m, 
`await updateRecord('products', existingProduct.id, {
                  unit: np.unit,
                  supplierId: supplierId,
                  bottomStock: newBottomStock
                });`);
code = code.replace(/await addDoc\(collection\(db, 'products'\), {[\s\S]*?userId\s+}\);/m, 
`await addRecord('products', {
                name: np.name,
                unit: np.unit,
                supplierId: supplierId,
                bottomStock: newBottomStock,
                userId
              });`);

code = code.replace(/const supplierPromises = state\.suppliers\.map\(s => deleteDoc\(doc\(db, 'suppliers', s\.id\)\)\);\s+const productPromises = state\.products\.map\(p => deleteDoc\(doc\(db, 'products', p\.id\)\)\);\s+const reportPromises = state\.reports\.map\(r => deleteDoc\(doc\(db, 'reports', r\.id\)\)\);/m, 
`const supplierPromises = state.suppliers.map(s => deleteRecord('suppliers', s.id));
      const productPromises = state.products.map(p => deleteRecord('products', p.id));
      const reportPromises = state.reports.map(r => deleteRecord('reports', r.id));`);


fs.writeFileSync(file, code);
