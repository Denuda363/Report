const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. imports - ensure we have updateStockOut imported
const importSearch = `const { stockOuts, products, addStockOut, deleteStockOut, updateProduct, userId } = useAppContext();`;
const importReplace = `const { stockOuts, products, addStockOut, updateStockOut, deleteStockOut, updateProduct, userId } = useAppContext();`;
code = code.replace(importSearch, importReplace);

// 2. Add local state for editing
const editStateSearch = `  const [pendingItems, setPendingItems] = useState<PendingOutItem[]>([]);`;
const editStateReplace = `  const [pendingItems, setPendingItems] = useState<PendingOutItem[]>([]);

  const [editStockOutId, setEditStockOutId] = useState<string | null>(null);
  const [editQty, setEditQty] = useState<number | ''>('');
  const [editNotes, setEditNotes] = useState('');
  
  const handleEditStockOut = (s: StockOutEntry) => {
    setEditStockOutId(s.id);
    setEditQty(s.quantity);
    setEditNotes(s.notes || '');
  };
  
  const handleCancelEditStockOut = () => {
    setEditStockOutId(null);
    setEditQty('');
    setEditNotes('');
  };
  
  const handleSaveStockOut = async (s: StockOutEntry, product: any) => {
    if (!editQty || Number(editQty) <= 0) {
      alert("Qty pengeluaran tidak valid");
      return;
    }
    
    // Calculate stock diff
    if (product && product.stock !== undefined) {
      const diff = s.quantity - Number(editQty);
      if (diff !== 0) {
        await updateProduct({ ...product, stock: product.stock + diff });
      }
    }
    
    await updateStockOut(s.id, {
      quantity: Number(editQty),
      notes: editNotes
    });
    
    setEditStockOutId(null);
  };
  
  const handleDeleteStockOut = async (s: StockOutEntry, product: any) => {
    if (window.confirm("Hapus catatan ini? Stok akan dikembalikan sesuai qty yang dihapus.")) {
      if (product && product.stock !== undefined) {
        await updateProduct({ ...product, stock: product.stock + s.quantity });
      }
      await deleteStockOut(s.id);
    }
  };`;
code = code.replace(editStateSearch, editStateReplace);

// 3. Ensure lucide-react has Edit2 imported
if (!code.includes('Edit2')) {
  code = code.replace('Search, PackageMinus, Plus, ChevronDown, X, Check, Trash2, Calendar as CalendarIcon, PackageOpen', 'Search, PackageMinus, Plus, ChevronDown, X, Check, Trash2, Edit2, Calendar as CalendarIcon, PackageOpen');
}

// 4. Update the render loop for filteredStockOuts
const renderLoopSearch = `                  <div key={s.id} className="bg-white border border-theme-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative group hover:border-theme-300 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-theme-500 bg-theme-50 px-2 py-0.5 rounded w-fit mb-1">{s.date}</span>
                        <span className="font-bold text-theme-900 line-clamp-2">{product?.name || 'Produk dihapus'}</span>
                      </div>
                      <div className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-sm shrink-0 shadow-sm border border-rose-200">
                        - {s.quantity}
                      </div>
                    </div>
                    {s.notes && (
                      <div className="text-sm text-theme-600-text bg-theme-50 p-2 rounded-xl mt-1 border border-theme-100/50">
                        <span className="font-bold text-theme-700">Ket:</span> {s.notes}
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (window.confirm("Hapus catatan ini? Stok TIDAK akan kembali otomatis.")) {
                          deleteStockOut(s.id);
                        }
                      }}
                      className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-rose-50 transition-all border border-rose-100 shadow-sm"
                      title="Hapus Catatan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>`;
                  
const renderLoopReplace = `                  <div key={s.id} className="bg-white border border-theme-200 rounded-2xl p-4 shadow-sm flex flex-col gap-3 relative group hover:border-theme-300 hover:shadow-md transition-all">
                    {editStockOutId === s.id ? (
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-bold text-theme-500 bg-theme-50 px-2 py-0.5 rounded w-fit">{s.date}</span>
                          <span className="font-bold text-theme-900 text-sm line-clamp-1">{product?.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <div className="w-1/3">
                            <label className="text-[10px] font-bold text-theme-500 uppercase">Qty Keluar</label>
                            <input 
                              type="number" 
                              min="1"
                              value={editQty}
                              onChange={(e) => setEditQty(e.target.value ? Number(e.target.value) : '')}
                              className="w-full px-2 py-1.5 border border-theme-200 rounded-lg text-sm outline-none focus:border-theme-500 bg-white"
                            />
                          </div>
                          <div className="w-2/3">
                            <label className="text-[10px] font-bold text-theme-500 uppercase">Keterangan</label>
                            <input 
                              type="text" 
                              value={editNotes}
                              onChange={(e) => setEditNotes(e.target.value)}
                              className="w-full px-2 py-1.5 border border-theme-200 rounded-lg text-sm outline-none focus:border-theme-500 bg-white"
                            />
                          </div>
                        </div>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleSaveStockOut(s, product)} className="flex-1 bg-theme-900 text-white rounded-lg py-1.5 text-xs font-bold hover:bg-theme-800 transition-colors flex justify-center items-center gap-1">
                            <Check className="w-3 h-3" /> Simpan
                          </button>
                          <button onClick={handleCancelEditStockOut} className="flex-1 bg-white border border-theme-200 text-theme-600-text rounded-lg py-1.5 text-xs font-bold hover:bg-theme-50 transition-colors flex justify-center items-center gap-1">
                            <X className="w-3 h-3" /> Batal
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-12">
                            <span className="text-xs font-bold text-theme-500 bg-theme-50 px-2 py-0.5 rounded w-fit mb-1">{s.date}</span>
                            <span className="font-bold text-theme-900 line-clamp-2">{product?.name || 'Produk dihapus'}</span>
                          </div>
                          <div className="bg-rose-100 text-rose-700 font-bold px-2.5 py-1 rounded-lg text-sm shrink-0 shadow-sm border border-rose-200 z-10">
                            - {s.quantity}
                          </div>
                        </div>
                        {s.notes && (
                          <div className="text-sm text-theme-600-text bg-theme-50 p-2 rounded-xl mt-1 border border-theme-100/50">
                            <span className="font-bold text-theme-700">Ket:</span> {s.notes}
                          </div>
                        )}
                        <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleEditStockOut(s)}
                            className="p-1.5 bg-white text-theme-600-text rounded-lg hover:bg-theme-50 hover:text-theme-900 transition-all border border-theme-100 shadow-sm"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteStockOut(s, product)}
                            className="p-1.5 bg-white text-rose-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all border border-rose-100 shadow-sm"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>`;
code = code.replace(renderLoopSearch, renderLoopReplace);

fs.writeFileSync(file, code);
