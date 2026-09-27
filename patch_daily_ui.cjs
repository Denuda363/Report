const fs = require('fs');
const file = 'src/components/DailyReport.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Replace the submit button area with the dual buttons
const buttonSearch = `<button
              type="submit"
              className="group w-full flex items-center justify-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 text-sm active:scale-[0.98]"
              disabled={products.length === 0}
            >
              {editingReportId ? <><Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" /> Save Changes</> : <><Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Add Record</>}
            </button>`;

const buttonReplace = `{editingReportId ? (
              <button
                type="submit"
                className="group w-full flex items-center justify-center gap-2 bg-theme-900 hover:bg-theme-800 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 text-sm active:scale-[0.98]"
              >
                <Edit2 className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" /> Save Changes
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleAddToList}
                  className="group flex-1 flex items-center justify-center gap-2 bg-theme-100 hover:bg-theme-200 text-theme-800 border border-theme-300 px-4 py-2.5 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm active:scale-[0.98]"
                  disabled={products.length === 0}
                >
                  <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" /> Tambah ke List
                </button>
                <button
                  type="submit"
                  className="group flex-1 flex items-center justify-center gap-2 bg-theme-500 hover:bg-theme-600 text-white px-4 py-2.5 rounded-lg font-medium transition-all duration-300 text-xs sm:text-sm active:scale-[0.98] shadow-lg shadow-theme-500/20"
                  disabled={products.length === 0}
                >
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" /> Simpan Langsung
                </button>
              </div>
            )}`;

code = code.replace(buttonSearch, buttonReplace);

// 2. Add the Pending List rendering below the form
const formEndSearch = `</form>
        </>
        )}
      </div>`;

const pendingListReplace = `</form>
        
        {/* Pending List Area */}
        {pendingItems.length > 0 && !editingReportId && (
          <div className="mt-6 pt-4 border-t border-theme-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <h4 className="text-xs font-bold text-theme-500 uppercase tracking-wider mb-3">List Input ({pendingItems.length})</h4>
            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto pr-1">
              {pendingItems.map(item => (
                <div key={item.id} className="flex items-center justify-between bg-theme-50 p-3 rounded-xl border border-theme-200 text-sm">
                  <div className="flex-1 truncate pr-2">
                    <div className="font-bold text-theme-900 truncate">{item.productName}</div>
                    <div className="text-[10px] text-theme-600-text truncate flex gap-2">
                      <span>Qty: {item.quantity} {item.unit}</span>
                      {item.notes && <span>| {item.notes}</span>}
                    </div>
                  </div>
                  <button 
                    onClick={() => setPendingItems(pendingItems.filter(i => i.id !== item.id))} 
                    className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg shrink-0 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <button
              onClick={handleSaveAll}
              disabled={isSavingAll}
              className="group w-full flex items-center justify-center gap-2 bg-theme-500 hover:bg-theme-600 text-white px-4 py-3 rounded-xl font-bold transition-all duration-300 text-sm shadow-lg shadow-theme-500/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSavingAll ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                  Simpan Semua List ({pendingItems.length})
                </>
              )}
            </button>
          </div>
        )}

        </>
        )}
      </div>`;

code = code.replace(formEndSearch, pendingListReplace);

// 3. Import 'Check' icon
code = code.replace(/import \{ (.*?) \} from 'lucide-react';/, (match, p1) => {
  let imports = p1.split(',').map(s => s.trim());
  if (!imports.includes('Check')) imports.push('Check');
  if (!imports.includes('CheckCircle2')) imports.push('CheckCircle2');
  if (!imports.includes('AlertCircle')) imports.push('AlertCircle');
  return 'import { ' + imports.join(', ') + " } from 'lucide-react';";
});

// 4. Add the Save Summary Modal at the end of the file
const summaryModalReplace = `
      {/* Save Summary Modal */}
      <AnimatePresence>
        {saveSummary.isOpen && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-lg shadow-2xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-theme-900">Rincian Simpan Data</h3>
                <button
                  onClick={() => setSaveSummary({ isOpen: false, saved: [], failed: [] })}
                  className="p-2 text-theme-600-text hover:bg-theme-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-6 pr-2">
                {/* Saved Items */}
                <div>
                  <h4 className="flex items-center gap-2 font-bold text-theme-700 mb-3 text-sm">
                    <CheckCircle2 className="w-5 h-5" /> Berhasil Tersimpan ({saveSummary.saved.length})
                  </h4>
                  {saveSummary.saved.length > 0 ? (
                    <div className="space-y-2">
                      {saveSummary.saved.map((item, idx) => (
                        <div key={idx} className="bg-theme-50 p-3 rounded-xl border border-theme-200 text-sm flex justify-between">
                          <span className="font-bold text-theme-900">{item.productName}</span> 
                          <span className="text-theme-600-text ml-2">Qty: {item.quantity} {item.unit}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-theme-600-text">Tidak ada data yang berhasil disimpan.</p>
                  )}
                </div>
                
                {/* Failed Items */}
                {saveSummary.failed.length > 0 && (
                  <div>
                    <h4 className="flex items-center gap-2 font-bold text-rose-600 mb-3 text-sm">
                      <AlertCircle className="w-5 h-5" /> Gagal Tersimpan ({saveSummary.failed.length})
                    </h4>
                    <div className="space-y-2">
                      {saveSummary.failed.map((f, idx) => (
                        <div key={idx} className="bg-rose-50 p-3 rounded-xl border border-rose-200 text-sm">
                          <div className="font-bold text-rose-900">{f.item.productName}</div>
                          <div className="text-rose-600 text-xs mt-1">Alasan: {f.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="mt-6 pt-4 border-t border-theme-200">
                <button
                  onClick={() => setSaveSummary({ isOpen: false, saved: [], failed: [] })}
                  className="w-full bg-theme-100 hover:bg-theme-200 text-theme-800 font-bold py-3 rounded-xl transition-colors"
                >
                  Tutup
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};`;

code = code.replace(/    <\/div>\n  \);\n\};/, summaryModalReplace);

fs.writeFileSync(file, code);
