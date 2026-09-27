const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addProduct, updateProduct, deleteProduct, importMasterData } = useAppContext();`;
const importReplace = `const { suppliers, products, addSupplier, updateSupplier, deleteSupplier, addProduct, updateProduct, deleteProduct, importMasterData, resetAllProductStocks } = useAppContext();`;
code = code.replace(importSearch, importReplace);

const buttonSearch = `              {activeTab === 'products' && (
                <button
                  onClick={() => setIsListFullscreen(!isListFullscreen)}
                  className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-200 rounded-md transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm"
                  title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
                >
                  {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </button>
              )}`;
const buttonReplace = `              {activeTab === 'products' && (
                <>
                  <button
                    onClick={() => setIsListFullscreen(!isListFullscreen)}
                    className="p-1.5 text-neutral-500 hover:text-theme-700 hover:bg-theme-200 rounded-md transition-colors active:scale-95 bg-white border border-theme-200 shadow-sm"
                    title={isListFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
                  >
                    {isListFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={async () => {
                      if (window.confirm("AWAS: Apakah Anda yakin ingin mengatur SEMUA stok produk menjadi 0? Tindakan ini tidak dapat dibatalkan!")) {
                        await resetAllProductStocks();
                        alert("Semua stok produk berhasil di-nol-kan.");
                      }
                    }}
                    className="px-2 py-1.5 text-rose-600 hover:bg-rose-50 rounded-md transition-colors active:scale-95 bg-white border border-rose-200 shadow-sm flex items-center gap-1.5 text-xs font-bold"
                    title="Jadikan Semua Stok 0"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Reset Semua Stok
                  </button>
                </>
              )}`;
              
if(!code.includes('resetAllProductStocks()')) {
  code = code.replace(buttonSearch, buttonReplace);
}

fs.writeFileSync(file, code);
