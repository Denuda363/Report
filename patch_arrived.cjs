const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add arrivedQty to addReport
code = code.replace(/reorderReason: item\.reorderReason \|\| ''/g, "reorderReason: item.reorderReason || '', arrivedQty: item.arrivedQty || 0");

// 2. Allow editing item in selected list
code = code.replace(/<div className="font-bold text-theme-900 truncate">\{item\.productName\} \{item\.arrivedQty \? \`\(\$\{item\.arrivedQty\} Qty\)\` : ''\}<\/div>\n\s*\{item\.notes && <div className="text-\[10px\] text-theme-600-text truncate">\{item\.notes\}<\/div>\}/g, 
`<div className="font-bold text-theme-900 truncate mb-1">{item.productName}</div>
                      <div className="flex gap-2">
                        <input 
                          type="number" 
                          placeholder="Qty" 
                          value={item.arrivedQty || ''} 
                          onChange={(e) => {
                            const newItems = [...arrivedItems];
                            const idx = newItems.findIndex(i => i.id === item.id);
                            if (idx > -1) {
                              newItems[idx].arrivedQty = e.target.value ? Number(e.target.value) : undefined;
                              setArrivedItems(newItems);
                            }
                          }}
                          className="w-16 px-2 py-1 text-xs border border-theme-200 rounded"
                        />
                        <input 
                          type="text" 
                          placeholder="Keterangan" 
                          value={item.notes || ''} 
                          onChange={(e) => {
                            const newItems = [...arrivedItems];
                            const idx = newItems.findIndex(i => i.id === item.id);
                            if (idx > -1) {
                              newItems[idx].notes = e.target.value;
                              setArrivedItems(newItems);
                            }
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-theme-200 rounded"
                        />
                      </div>`);

// 3. Edit arrivedQty in the main list
// First, add state for editArrivedQty
const stateAdd = `const [editDate, setEditDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editArrivedQty, setEditArrivedQty] = useState<number | ''>('');`;
code = code.replace(/const \[editDate, setEditDate\] = useState\(''\);\n\s*const \[editNotes, setEditNotes\] = useState\(''\);/, stateAdd);

const editClickAdd = `const handleEditClick = (item: any) => {
    setEditingId(item.id);
    setEditDate(item.date);
    setEditNotes(item.notes || '');
    setEditArrivedQty(item.arrivedQty || '');
  };`;
code = code.replace(/const handleEditClick = \(item: any\) => \{\n\s*setEditingId\(item\.id\);\n\s*setEditDate\(item\.date\);\n\s*setEditNotes\(item\.notes \|\| ''\);\n\s*\};/, editClickAdd);

const saveEditAdd = `const handleSaveEdit = async () => {
    if (!editingId) return;
    const existingReport = reports.find(r => r.id === editingId);
    if (existingReport) {
      await updateReport({
        ...existingReport,
        date: editDate,
        notes: editNotes,
        arrivedQty: editArrivedQty ? Number(editArrivedQty) : 0
      });
      
      // Update stock of product if qty changed
      if (existingReport.productId && (editArrivedQty !== existingReport.arrivedQty)) {
        const p = products.find(prod => prod.id === existingReport.productId);
        if (p) {
           const diff = (editArrivedQty ? Number(editArrivedQty) : 0) - (existingReport.arrivedQty || 0);
           await updateProduct({...p, stock: (p.stock || 0) + diff});
        }
      }
    }
    setEditingId(null);
  };`;
code = code.replace(/const handleSaveEdit = async \(\) => \{\n\s*if \(\!editingId\) return;\n\s*const existingReport = reports\.find\(r => r\.id === editingId\);\n\s*if \(existingReport\) \{\n\s*await updateReport\(\{\n\s*\.\.\.existingReport,\n\s*date: editDate,\n\s*notes: editNotes\n\s*\}\);\n\s*\}\n\s*setEditingId\(null\);\n\s*\};/m, saveEditAdd);

const thReplace = `<th className="px-4 py-3 font-bold border-b border-theme-200">Keterangan</th>`;
code = code.replace(thReplace, `<th className="px-4 py-3 font-bold border-b border-theme-200">Qty Datang</th>\n                  <th className="px-4 py-3 font-bold border-b border-theme-200">Keterangan</th>`);

const tdEditReplace = `<td className="px-4 py-3">
                          <input 
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-2 py-1 border border-theme-200 rounded text-sm focus:border-theme-500 outline-none"
                            placeholder="Catatan..."
                          />
                        </td>`;
code = code.replace(tdEditReplace, `<td className="px-4 py-3">
                          <input 
                            type="number"
                            value={editArrivedQty}
                            onChange={(e) => setEditArrivedQty(e.target.value ? Number(e.target.value) : '')}
                            className="w-full px-2 py-1 border border-theme-200 rounded text-sm focus:border-theme-500 outline-none"
                            placeholder="Qty"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <input 
                            type="text"
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full px-2 py-1 border border-theme-200 rounded text-sm focus:border-theme-500 outline-none"
                            placeholder="Catatan..."
                          />
                        </td>`);

const tdViewReplace = `<td className="px-4 py-3">
                          <span className="text-theme-600-text">{item.notes || '-'}</span>
                          {item.isReorder && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              Reorder: {item.reorderQty}
                            </span>
                          )}
                        </td>`;
code = code.replace(tdViewReplace, `<td className="px-4 py-3 font-bold text-theme-900">
                          {item.arrivedQty || '-'}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-theme-600-text">{item.notes || '-'}</span>
                          {item.isReorder && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800">
                              Reorder: {item.reorderQty}
                            </span>
                          )}
                        </td>`);

// 4. Input qty directly from product search result
// We modify the dropdown to include an input for qty and a button
const dropDownReplace = `filteredProductsForForm.map(p => {
                      const s = suppliers.find(sup => sup.id === p.supplierId);
                      return (
                        <div 
                          key={p.id}
                          className="px-3 py-2 hover:bg-theme-100 cursor-pointer border-b border-theme-50 last:border-0"
                          onClick={() => handleProductSelect(p.id, p.name)}
                        >
                          <div className="font-bold text-xs text-theme-900">{p.name}</div>
                          <div className="text-[10px] text-theme-600-text mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                        </div>
                      );
                    })`;
code = code.replace(dropDownReplace, `filteredProductsForForm.map(p => {
                      const s = suppliers.find(sup => sup.id === p.supplierId);
                      return (
                        <div 
                          key={p.id}
                          className="px-3 py-2 hover:bg-theme-100 border-b border-theme-50 last:border-0 flex items-center justify-between gap-2"
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => handleProductSelect(p.id, p.name, 1)}>
                            <div className="font-bold text-xs text-theme-900">{p.name}</div>
                            <div className="text-[10px] text-theme-600-text mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                          </div>
                          <div className="flex items-center gap-1">
                             <input 
                               type="number"
                               placeholder="Qty"
                               className="w-14 px-1 py-1 text-xs border border-theme-200 rounded"
                               onClick={(e) => e.stopPropagation()}
                               onKeyDown={(e) => {
                                 if (e.key === 'Enter') {
                                   handleProductSelect(p.id, p.name, Number((e.target as HTMLInputElement).value) || 1);
                                 }
                               }}
                             />
                             <button
                               onClick={(e) => {
                                 const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                 handleProductSelect(p.id, p.name, Number(input.value) || 1);
                               }}
                               className="p-1 bg-theme-500 text-white rounded hover:bg-theme-600 text-xs"
                             >
                               +
                             </button>
                          </div>
                        </div>
                      );
                    })`);

// Modify handleProductSelect to take optional qty param
code = code.replace(/const handleProductSelect = \(id: string, name: string\) => \{/g, `const handleProductSelect = (id: string, name: string, qtyOverride?: number) => {`);
code = code.replace(/arrivedQty: currentArrivedQty \? Number\(currentArrivedQty\) : 0/g, `arrivedQty: qtyOverride !== undefined ? qtyOverride : (currentArrivedQty ? Number(currentArrivedQty) : 0)`);

fs.writeFileSync(file, code);
