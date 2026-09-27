const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const interfaceSearch = `  deleteProduct: (id: string) => Promise<void>;`;
const interfaceReplace = `  deleteProduct: (id: string) => Promise<void>;
  resetAllProductStocks: () => Promise<void>;`;
if(!code.includes('resetAllProductStocks:')) {
  code = code.replace(interfaceSearch, interfaceReplace);
}

const methodSearch = `  const deleteProduct = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    await deleteDoc(doc(db, 'products', id));
  };`;
const methodReplace = `  const deleteProduct = async (id: string) => {
    if (!id) return;
    if (!userId) return;
    await deleteDoc(doc(db, 'products', id));
  };

  const resetAllProductStocks = async () => {
    if (!userId || state.products.length === 0) return;
    
    // Batch updates (max 500 operations per batch)
    const batches = [];
    let currentBatch = writeBatch(db);
    let count = 0;
    
    for (const product of state.products) {
      if (product.stock === 0) continue; // skip if already 0
      
      const docRef = doc(db, 'products', product.id);
      currentBatch.update(docRef, { stock: 0 });
      count++;
      
      if (count === 500) {
        batches.push(currentBatch.commit());
        currentBatch = writeBatch(db);
        count = 0;
      }
    }
    
    if (count > 0) {
      batches.push(currentBatch.commit());
    }
    
    await Promise.all(batches);
  };`;
if(!code.includes('resetAllProductStocks = async')) {
  code = code.replace(methodSearch, methodReplace);
}

const exportSearch = `addProduct, updateProduct, deleteProduct,`;
const exportReplace = `addProduct, updateProduct, deleteProduct, resetAllProductStocks,`;
if(!code.includes('resetAllProductStocks,')) {
  code = code.replace(exportSearch, exportReplace);
}

fs.writeFileSync(file, code);
