const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `const { stockOuts, products, addStockOut, updateStockOut, deleteStockOut, updateProduct, userId } = useAppContext();`;
const importReplace = `const { stockOuts, products, addStockOut, updateStockOut, deleteStockOut, updateProduct, userId, addReport, reports } = useAppContext();`;
code = code.replace(importSearch, importReplace);

// We need to patch handleSaveAll
const handleSaveAllSearch = `        // Update product stock
        await updateProduct({
          ...product,
          stock: Math.max(0, (product.stock || 0) - item.qty)
        });`;
const handleSaveAllReplace = `        // Update product stock
        const newStock = Math.max(0, (product.stock || 0) - item.qty);
        await updateProduct({
          ...product,
          stock: newStock
        });
        
        // Auto add to daily report if stock is below bottomStock
        if (product.bottomStock !== undefined && newStock < product.bottomStock) {
          const existsToday = reports.some(r => r.date === date && r.productId === product.id);
          if (!existsToday) {
            await addReport({
              date,
              productId: product.id,
              quantity: 0,
              notes: 'Otomatis: Stok menipis',
              isWarningStock: true,
              isKosongPabrik: product.isKosongPabrik || false
            });
          }
        }`;
if (!code.includes('Otomatis: Stok menipis')) {
    code = code.replace(handleSaveAllSearch, handleSaveAllReplace);
}

// We also need to patch handleSaveStockOut in case it's edited and goes below bottom stock
const handleSaveStockOutSearch = `    // Calculate stock diff
    if (product && product.stock !== undefined) {
      const diff = s.quantity - Number(editQty);
      if (diff !== 0) {
        await updateProduct({ ...product, stock: product.stock + diff });
      }
    }`;
const handleSaveStockOutReplace = `    // Calculate stock diff
    if (product && product.stock !== undefined) {
      const diff = s.quantity - Number(editQty);
      if (diff !== 0) {
        const newStock = product.stock + diff;
        await updateProduct({ ...product, stock: newStock });
        
        // Auto add to daily report if stock is below bottomStock
        if (product.bottomStock !== undefined && newStock < product.bottomStock) {
          const existsToday = reports.some(r => r.date === s.date && r.productId === product.id);
          if (!existsToday) {
            await addReport({
              date: s.date,
              productId: product.id,
              quantity: 0,
              notes: 'Otomatis: Stok menipis (Edit)',
              isWarningStock: true,
              isKosongPabrik: product.isKosongPabrik || false
            });
          }
        }
      }
    }`;
if (!code.includes('Otomatis: Stok menipis (Edit)')) {
    code = code.replace(handleSaveStockOutSearch, handleSaveStockOutReplace);
}

fs.writeFileSync(file, code);
