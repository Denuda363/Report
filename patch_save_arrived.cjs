const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const searchProductUpdate = `          if (product.isKosongPabrik) {
            updatedProduct.isKosongPabrik = false;
            updatedProduct.kosongPabrikDate = undefined;
            needsUpdate = true;
          }

          if (needsUpdate) {`;

const replaceProductUpdate = `          if (product.isKosongPabrik) {
            updatedProduct.isKosongPabrik = false;
            updatedProduct.kosongPabrikDate = undefined;
            needsUpdate = true;
          }
          
          if (item.arrivedQty && item.arrivedQty > 0) {
            updatedProduct.stock = (product.stock || 0) + item.arrivedQty;
            needsUpdate = true;
          }

          if (needsUpdate) {`;

code = code.replace(searchProductUpdate, replaceProductUpdate);

const searchReportUpdate = `          await updateReport({
            ...existingReport,
            isArrived: true,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote,`;

const replaceReportUpdate = `          await updateReport({
            ...existingReport,
            isArrived: true,
            arrivedAt: Date.now(),
            arrivedQty: (existingReport.arrivedQty || 0) + (item.arrivedQty || 0),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote,`;

code = code.replace(searchReportUpdate, replaceReportUpdate);

const searchReportAdd = `        await addReport({
          date,
          productId: item.productId,
          quantity: 0, // No daily report order quantity
          isArrived: true,
          isArrivedOnly: true,
          arrivedAt: Date.now(),
          arrivedSupplierId: arrivedSupplierId,
          isReorder: item.isReorder,
          reorderQty: item.reorderQty,
          reorderReason: item.reorderReason,
          notes: item.notes
        });`;

const replaceReportAdd = `        await addReport({
          date,
          productId: item.productId,
          quantity: 0, // No daily report order quantity
          isArrived: true,
          isArrivedOnly: true,
          arrivedAt: Date.now(),
          arrivedQty: item.arrivedQty,
          arrivedSupplierId: arrivedSupplierId,
          isReorder: item.isReorder,
          reorderQty: item.reorderQty,
          reorderReason: item.reorderReason,
          notes: item.notes
        });`;

code = code.replace(searchReportAdd, replaceReportAdd);

const inputQtySearch = `                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-theme-900 mb-1">Catatan Tambahan (Opsional)</label>
                      <input 
                        type="text"
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        className="w-full px-2 py-1.5 border border-theme-200 rounded-lg text-sm outline-none focus:border-theme-500 bg-white"
                        placeholder="Contoh: Titipan..."
                      />
                    </div>`;

const inputQtyReplace = `                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-theme-900 mb-1">Qty Datang (Stok +)</label>
                      <input 
                        type="number"
                        min="0"
                        value={currentArrivedQty}
                        onChange={(e) => setCurrentArrivedQty(e.target.value ? Number(e.target.value) : '')}
                        className="w-full px-2 py-1.5 border border-theme-200 rounded-lg text-sm outline-none focus:border-theme-500 bg-white"
                        placeholder="Qty"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <label className="block text-[10px] font-bold text-theme-900 mb-1">Catatan Tambahan (Opsional)</label>
                      <input 
                        type="text"
                        value={currentNotes}
                        onChange={(e) => setCurrentNotes(e.target.value)}
                        className="w-full px-2 py-1.5 border border-theme-200 rounded-lg text-sm outline-none focus:border-theme-500 bg-white"
                        placeholder="Contoh: Titipan..."
                      />
                    </div>`;
code = code.replace(inputQtySearch, inputQtyReplace);

const displayItemSearch = `                    return (
                      <div key={item.id} className="p-3 bg-white border border-theme-200 rounded-xl flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-900 text-sm">{product?.name || item.productName}</span>`;

const displayItemReplace = `                    return (
                      <div key={item.id} className="p-3 bg-white border border-theme-200 rounded-xl flex items-center justify-between group">
                        <div className="flex flex-col">
                          <span className="font-bold text-theme-900 text-sm">{product?.name || item.productName} {item.arrivedQty ? \` (Qty: \${item.arrivedQty})\` : ''}</span>`;
code = code.replace(displayItemSearch, displayItemReplace);


fs.writeFileSync(file, code);
