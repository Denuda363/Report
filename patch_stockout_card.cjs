const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

const search = `                      <>
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
                        <div className="absolute top-3 right-3 flex gap-1 transition-opacity">
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
                      </>`;

const replace = `                      <>
                        <div className="flex justify-between items-start">
                          <div className="flex flex-col pr-2">
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
                        
                        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-theme-100">
                          <button
                            onClick={() => handleEditStockOut(s)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-theme-600-text rounded-lg hover:bg-theme-50 hover:text-theme-900 transition-all border border-theme-200 shadow-sm text-xs font-bold"
                            title="Edit Catatan"
                          >
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteStockOut(s, product)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-500 rounded-lg hover:bg-rose-50 hover:text-rose-600 transition-all border border-rose-200 shadow-sm text-xs font-bold"
                            title="Hapus Catatan"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Hapus
                          </button>
                        </div>
                      </>`;

code = code.replace(search, replace);
fs.writeFileSync(file, code);
