const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add selectedProduct state
const stateSearch = `  const [currentQty, setCurrentQty] = useState<number | ''>('');`;
const stateReplace = `  const [selectedProduct, setSelectedProduct] = useState<{id: string, name: string, stock: number} | null>(null);
  const [currentQty, setCurrentQty] = useState<number | ''>('');`;
if(!code.includes('selectedProduct')) {
  code = code.replace(stateSearch, stateReplace);
}

// 2. Modify handleProductSelect
const handleProductSelectSearch = `  const handleProductSelect = (id: string, name: string, stock: number) => {
    if (!currentQty || Number(currentQty) <= 0) {
      alert("Masukkan qty pengeluaran terlebih dahulu");
      return;
    }
    
    setPendingItems([...pendingItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: id,
      productName: name,
      qty: Number(currentQty),
      notes: currentNotes,
      stock: stock
    }]);
    
    setSearchQuery('');
    setCurrentQty('');
    setCurrentNotes('');
    setIsProductDropdownOpen(false);
  };`;

const handleProductSelectReplace = `  const handleProductSelect = (id: string, name: string, stock: number) => {
    setSelectedProduct({ id, name, stock });
    setSearchQuery('');
    setIsProductDropdownOpen(false);
    setCurrentQty('');
    setCurrentNotes('');
  };

  const handleAddPending = () => {
    if (!selectedProduct) return;
    if (!currentQty || Number(currentQty) <= 0) {
      alert("Masukkan qty pengeluaran yang valid");
      return;
    }
    
    setPendingItems([...pendingItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: selectedProduct.id,
      productName: selectedProduct.name,
      qty: Number(currentQty),
      notes: currentNotes,
      stock: selectedProduct.stock
    }]);
    
    setSelectedProduct(null);
    setCurrentQty('');
    setCurrentNotes('');
  };
  
  const handleCancelSelected = () => {
    setSelectedProduct(null);
    setCurrentQty('');
    setCurrentNotes('');
  };`;

code = code.replace(handleProductSelectSearch, handleProductSelectReplace);

// 3. Update UI structure
const formUISearch = `            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-theme-900 mb-1">Qty Keluar</label>
                <input 
                  type="number" 
                  min="1"
                  value={currentQty}
                  onChange={(e) => setCurrentQty(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-theme-900 mb-1">Keterangan</label>
                <input 
                  type="text" 
                  value={currentNotes}
                  onChange={(e) => setCurrentNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
                  placeholder="Contoh: Rusak"
                />
              </div>
            </div>

            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-bold text-theme-900 mb-1">Cari Produk</label>`;

const formUIReplace = `            <div className="relative" ref={productDropdownRef}>
              <label className="block text-xs font-bold text-theme-900 mb-1">Pilih Produk</label>`;

code = code.replace(formUISearch, formUIReplace);

const afterDropdownSearch = `                </div>
              )}
            </div>
            
            {pendingItems.length > 0 && (`;
const afterDropdownReplace = `                </div>
              )}
            </div>
            
            {selectedProduct && (
              <div className="bg-theme-50 border border-theme-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center border-b border-theme-100 pb-2">
                  <div className="flex flex-col">
                    <span className="text-xs text-theme-500 font-bold uppercase tracking-wider">Produk Terpilih</span>
                    <span className="font-bold text-theme-900">{selectedProduct.name}</span>
                  </div>
                  <span className="text-xs bg-white px-2 py-1 rounded-lg border border-theme-200 text-theme-600-text font-bold shadow-sm">
                    Stok: {selectedProduct.stock}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-theme-500 uppercase mb-1">Qty Keluar</label>
                    <input 
                      type="number" 
                      min="1"
                      value={currentQty}
                      onChange={(e) => setCurrentQty(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white font-bold text-rose-600"
                      placeholder="0"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-theme-500 uppercase mb-1">Keterangan (Opsional)</label>
                    <input 
                      type="text" 
                      value={currentNotes}
                      onChange={(e) => setCurrentNotes(e.target.value)}
                      className="w-full px-3 py-2 border border-theme-200 rounded-xl text-sm outline-none focus:border-theme-500 bg-white"
                      placeholder="Rusak, dsb"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 mt-1">
                  <button 
                    onClick={handleAddPending}
                    className="flex-1 bg-theme-900 hover:bg-theme-800 text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Tambah ke Daftar
                  </button>
                  <button 
                    onClick={handleCancelSelected}
                    className="px-3 bg-white hover:bg-theme-100 border border-theme-200 text-theme-600-text py-2 rounded-xl text-xs font-bold transition-all shadow-sm"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            
            {pendingItems.length > 0 && (`;
            
code = code.replace(afterDropdownSearch, afterDropdownReplace);

// Also add 'animate-in' styles if lucide is imported, which it is. We can just use standard tailwind.
// Replace alert on saving with nothing to be silent, or better yet, a subtle UI feedback. But alert is fine for now.

fs.writeFileSync(file, code);
