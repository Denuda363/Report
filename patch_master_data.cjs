const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

const stateSearch = `  const [productBottomStock, setProductBottomStock] = useState<number | ''>('');`;
const stateReplace = `  const [productBottomStock, setProductBottomStock] = useState<number | ''>('');
  const [productStock, setProductStock] = useState<number | ''>('');
  const [productLocation, setProductLocation] = useState('');`;

code = code.replace(stateSearch, stateReplace);

const clearFieldsSearch = `    setProductBottomStock('');`;
const clearFieldsReplace = `    setProductBottomStock('');
    setProductStock('');
    setProductLocation('');`;

// global replace clearFields
code = code.split(clearFieldsSearch).join(clearFieldsReplace);

const handleEditProductSearch = `    setProductBottomStock(product.bottomStock ?? '');`;
const handleEditProductReplace = `    setProductBottomStock(product.bottomStock ?? '');
    setProductStock(product.stock ?? '');
    setProductLocation(product.location || '');`;

code = code.replace(handleEditProductSearch, handleEditProductReplace);

const addProductSearch = `      await addProduct({ 
        name: productName, 
        supplierId: productSupplierId, 
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit || 'pcs',
        bottomStock: productBottomStock !== '' ? Number(productBottomStock) : undefined
      });`;
const addProductReplace = `      await addProduct({ 
        name: productName, 
        supplierId: productSupplierId, 
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit || 'pcs',
        bottomStock: productBottomStock !== '' ? Number(productBottomStock) : undefined,
        stock: productStock !== '' ? Number(productStock) : undefined,
        location: productLocation.trim() || undefined
      });`;
code = code.replace(addProductSearch, addProductReplace);

const updateProductSearch = `      await updateProduct({ 
        id: editingProductId, 
        name: productName, 
        supplierId: productSupplierId, 
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit || 'pcs',
        bottomStock: productBottomStock !== '' ? Number(productBottomStock) : undefined,
        isKosongPabrik: p?.isKosongPabrik,
        kosongPabrikDate: p?.kosongPabrikDate
      });`;
const updateProductReplace = `      await updateProduct({ 
        id: editingProductId, 
        name: productName, 
        supplierId: productSupplierId, 
        alternativeSupplierIds: productAlternativeSupplierIds,
        unit: productUnit || 'pcs',
        bottomStock: productBottomStock !== '' ? Number(productBottomStock) : undefined,
        stock: productStock !== '' ? Number(productStock) : undefined,
        location: productLocation.trim() || undefined,
        isKosongPabrik: p?.isKosongPabrik,
        kosongPabrikDate: p?.kosongPabrikDate
      });`;
code = code.replace(updateProductSearch, updateProductReplace);

const addProductFormSearch = `            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-theme-900 mb-1">Bottom Stok (Opsional)</label>
              <input 
                type="number"
                min="0"
                value={productBottomStock}
                onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-theme-50"
                placeholder="0"
              />
            </div>
          </div>`;
const addProductFormReplace = `            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-theme-900 mb-1">Bottom Stok (Opsional)</label>
              <input 
                type="number"
                min="0"
                value={productBottomStock}
                onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-theme-50"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-1">
              <label className="block text-xs font-bold text-theme-900 mb-1">Stok Awal (Opsional)</label>
              <input 
                type="number"
                min="0"
                value={productStock}
                onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-theme-50"
                placeholder="0"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-theme-900 mb-1">Lokasi Rak (Opsional)</label>
              <input 
                type="text"
                value={productLocation}
                onChange={(e) => setProductLocation(e.target.value)}
                className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-theme-50"
                placeholder="Contoh: Rak A1"
              />
            </div>
          </div>`;
code = code.replace(addProductFormSearch, addProductFormReplace);

const tableHeaderSearch = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Supplier</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Bottom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;
const tableHeaderReplace = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Supplier</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Bottom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Lokasi</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;
code = code.replace(tableHeaderSearch, tableHeaderReplace);

const tableRowSearch = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="number"
                                min="0"
                                value={productBottomStock}
                                onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-2 py-1 border border-theme-200 rounded-md text-sm outline-none focus:border-theme-500 flex-1"
                                placeholder="Opsional"
                              />
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
const tableRowReplace = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="number"
                                min="0"
                                value={productBottomStock}
                                onChange={(e) => setProductBottomStock(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-2 py-1 border border-theme-200 rounded-md text-sm outline-none focus:border-theme-500 flex-1"
                                placeholder="Opsional"
                              />
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="number"
                                min="0"
                                value={productStock}
                                onChange={(e) => setProductStock(e.target.value ? Number(e.target.value) : '')}
                                className="w-full px-2 py-1 border border-theme-200 rounded-md text-sm outline-none focus:border-theme-500 flex-1"
                                placeholder="Opsional"
                              />
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell before:content-['Lokasi:'] before:mr-2 before:font-bold md:before:hidden flex items-center">
                              <input 
                                type="text"
                                value={productLocation}
                                onChange={(e) => setProductLocation(e.target.value)}
                                className="w-full px-2 py-1 border border-theme-200 rounded-md text-sm outline-none focus:border-theme-500 flex-1"
                                placeholder="Opsional"
                              />
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
code = code.replace(tableRowSearch, tableRowReplace);

const tableRowDisplaySearch = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden">{p.bottomStock !== undefined ? p.bottomStock : '-'}</td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
const tableRowDisplayReplace = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden">{p.bottomStock !== undefined ? p.bottomStock : '-'}</td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden">{p.stock !== undefined ? p.stock : '-'}</td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Lokasi:'] before:mr-2 before:font-bold md:before:hidden">{p.location || '-'}</td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
code = code.replace(tableRowDisplaySearch, tableRowDisplayReplace);

fs.writeFileSync(file, code);
