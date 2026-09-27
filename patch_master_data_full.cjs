const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add productCategory state
const stateSearch = `  const [productLocation, setProductLocation] = useState('');`;
const stateReplace = `  const [productLocation, setProductLocation] = useState('');
  const [productCategory, setProductCategory] = useState('');`;
if (!code.includes('setProductCategory')) {
  code = code.replace(stateSearch, stateReplace);
}

// 2. handleEditProduct
const handleEditProductSearch = `    setProductStock(product.stock ?? '');
    setProductLocation(product.location || '');`;
const handleEditProductReplace = `    setProductStock(product.stock ?? '');
    setProductLocation(product.location || '');
    setProductCategory(product.category || '');`;
code = code.replace(handleEditProductSearch, handleEditProductReplace);

// 3. Clear fields in handleSubmitProduct and cancel edit
const clearSearch = `    setProductBottomStock('');
    setProductStock('');
    setProductLocation('');`;
const clearReplace = `    setProductBottomStock('');
    setProductStock('');
    setProductLocation('');
    setProductCategory('');`;
code = code.split(clearSearch).join(clearReplace);

// 4. handleSubmitProduct (updateProduct / addProduct calls)
const handleSubmitSearch = `      updateProduct({
        id: editingProductId,
        name: productName.trim(),
        supplierId: productSupplierId,
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit.trim(),
        bottomStock: productBottomStock === '' ? undefined : productBottomStock
      });
      setEditingProductId(null);
    } else {
      addProduct({
        name: productName.trim(),
        supplierId: productSupplierId,
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit.trim(),
        bottomStock: productBottomStock === '' ? undefined : productBottomStock
      });
    }`;

const handleSubmitReplace = `      const existingProduct = products.find(p => p.id === editingProductId);
      updateProduct({
        ...(existingProduct || {}),
        id: editingProductId,
        name: productName.trim(),
        supplierId: productSupplierId,
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit.trim(),
        bottomStock: productBottomStock === '' ? undefined : productBottomStock,
        stock: productStock === '' ? undefined : productStock,
        location: productLocation.trim() || undefined,
        category: productCategory.trim() || undefined
      });
      setEditingProductId(null);
    } else {
      addProduct({
        name: productName.trim(),
        supplierId: productSupplierId,
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit.trim(),
        bottomStock: productBottomStock === '' ? undefined : productBottomStock,
        stock: productStock === '' ? undefined : productStock,
        location: productLocation.trim() || undefined,
        category: productCategory.trim() || undefined
      });
    }`;
code = code.replace(handleSubmitSearch, handleSubmitReplace);

// 5. Add form UI
const addFormSearch = `              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Butom Stok</label>
                <input
                  type="number"
                  min="0"
                  value={productBottomStock}
                  onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. 30 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Supplier</label>`;
                
const addFormReplace = `              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Butom Stok</label>
                <input
                  type="number"
                  min="0"
                  value={productBottomStock}
                  onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. 30 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Stok Awal</label>
                <input
                  type="number"
                  min="0"
                  value={productStock}
                  onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. 100 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Lokasi Rak</label>
                <input
                  type="text"
                  value={productLocation}
                  onChange={(e) => setProductLocation(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. Rak A1 (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Kategori</label>
                <input
                  type="text"
                  value={productCategory}
                  onChange={(e) => setProductCategory(e.target.value)}
                  className="w-full px-4 py-3 border border-theme-200 rounded-2xl bg-theme-50 focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-sm text-theme-800"
                  placeholder="e.g. Minuman (Opsional)"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-500 uppercase tracking-wider mb-2">Supplier</label>`;
code = code.replace(addFormSearch, addFormReplace);

// 6. Table Header
const tableHeaderSearch = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Lokasi</th>`;
const tableHeaderReplace = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Kategori</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Lokasi</th>`;
code = code.replace(tableHeaderSearch, tableHeaderReplace);

// 7. Table Row (Edit)
const tableRowEditSearch = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="number"`;
const tableRowEditReplace = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Kategori:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="text"
                                value={productCategory}
                                onChange={(e) => setProductCategory(e.target.value)}
                                className="w-full px-2 py-1 border border-theme-200 rounded-md text-sm outline-none focus:border-theme-500 flex-1"
                                placeholder="Opsional"
                              />
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="number"`;
code = code.replace(tableRowEditSearch, tableRowEditReplace);

// 8. Table Row (Display)
const tableRowDisplaySearch = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden">`;
const tableRowDisplayReplace = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Kategori:'] before:mr-2 before:font-bold md:before:hidden">
                              {p.category || '-'}
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden">`;
code = code.replace(tableRowDisplaySearch, tableRowDisplayReplace);

fs.writeFileSync(file, code);
