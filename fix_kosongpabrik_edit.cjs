const fs = require('fs');
let code = fs.readFileSync('src/components/KosongPabrikRecap.tsx', 'utf8');

// Add states
const importRegex = /import React, \{ useState, useMemo, useRef, useEffect \} from 'react';/;
code = code.replace(importRegex, "import React, { useState, useMemo, useRef, useEffect } from 'react';"); // just to be sure it matches
const iconRegex = /import \{ Search, X, Factory, Trash2, Maximize2, Minimize2 \} from 'lucide-react';/;
code = code.replace(iconRegex, "import { Search, X, Factory, Trash2, Maximize2, Minimize2, Edit2, Save } from 'lucide-react';");

const stateInsert = `  const [listSearchQuery, setListSearchQuery] = useState('');
  const [isListFullscreen, setIsListFullscreen] = useState(false);

  // Edit State
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editSupplierId, setEditSupplierId] = useState('');`;

code = code.replace(`  const [listSearchQuery, setListSearchQuery] = useState('');\n  const [isListFullscreen, setIsListFullscreen] = useState(false);`, stateInsert);

const handlersInsert = `  const handleRemoveKosong = async (product: any) => {
    if (!window.confirm(\`Hapus \${product.name} dari daftar Kosong Pabrik?\`)) return;
    await updateProduct(product.id, { 
      ...product,
      isKosongPabrik: false,
      kosongPabrikDate: undefined
    });
  };

  const handleEditClick = (product: any) => {
    setEditingProduct(product);
    setEditName(product.name);
    setEditSupplierId(product.supplierId);
  };

  const handleSaveEdit = async () => {
    if (!editingProduct) return;
    await updateProduct(editingProduct.id, {
      ...editingProduct,
      name: editName,
      supplierId: editSupplierId
    });
    setEditingProduct(null);
  };`;

code = code.replace(`  const handleRemoveKosong = async (product: any) => {
    if (!window.confirm(\`Hapus \${product.name} dari daftar Kosong Pabrik?\`)) return;
    await updateProduct(product.id, { 
      ...product,
      isKosongPabrik: false,
      kosongPabrikDate: undefined
    });
  };`, handlersInsert);


// Now inject the UI for edit. We find the card mapping.
const cardStartRegex = /<div className="flex justify-between items-start mb-2 pl-2">/;
const newCardStart = `<div className="flex justify-between items-start mb-2 pl-2">
                      <h4 className="font-bold text-[#2D3025] line-clamp-2 pr-6 leading-tight">{p.name}</h4>
                      <div className="flex gap-1 shrink-0 -mt-1 -mr-1">
                        <button 
                          onClick={() => handleEditClick(p)}
                          className="text-[#7A7F6E] hover:text-[#556B2F] hover:bg-[#F1F3E9] p-1.5 rounded-lg transition-colors"
                          title="Edit Produk"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleRemoveKosong(p)}
                          className="text-[#7A7F6E] hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                          title="Hapus dari daftar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>`;

// Actually we replace the whole <div className="flex justify-between... to </div></div> with the new one
const oldCardHeader = `<div className="flex justify-between items-start mb-2 pl-2">
                      <h4 className="font-bold text-[#2D3025] line-clamp-2 pr-6 leading-tight">{p.name}</h4>
                      <button 
                        onClick={() => handleRemoveKosong(p)}
                        className="text-[#7A7F6E] hover:text-rose-500 hover:bg-rose-50 p-1.5 rounded-lg transition-colors shrink-0 -mt-1 -mr-1"
                        title="Hapus dari daftar"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>`;

code = code.replace(oldCardHeader, newCardStart);


// Append Modal at the very end before last </div>); }
const modalUI = `
      {/* Edit Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl border border-[#E2E4D8] shadow-2xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-lg text-[#2D3025]">Edit Produk</h3>
              <button 
                onClick={() => setEditingProduct(null)}
                className="text-[#7A7F6E] hover:text-rose-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Nama Produk</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Supplier</label>
                <select
                  value={editSupplierId}
                  onChange={(e) => setEditSupplierId(e.target.value)}
                  className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
                >
                  <option value="">Pilih Supplier</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={() => setEditingProduct(null)}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-50 transition-colors"
              >
                <X className="w-4 h-4" /> Batal
              </button>
              <button 
                onClick={handleSaveEdit}
                className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
              >
                <Save className="w-4 h-4" /> Simpan
              </button>
            </div>
          </div>
        </div>
      )}`;

code = code.replace(/    <\/div>\n  \);\n};\n?$/g, modalUI + '\n    </div>\n  );\n};');

fs.writeFileSync('src/components/KosongPabrikRecap.tsx', code);
