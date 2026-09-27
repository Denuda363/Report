const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const notesSearch = `            <input
              type="text"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-theme-200 rounded-xl bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs text-theme-800 mb-3"
              placeholder="Catatan untuk produk..."
            />`;

const notesReplace = `            <div className="flex gap-2 mb-3">
              <input
                type="number"
                value={currentArrivedQty}
                onChange={(e) => setCurrentArrivedQty(e.target.value ? Number(e.target.value) : '')}
                className="w-1/3 px-3 py-2 border border-theme-200 rounded-xl bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs text-theme-800"
                placeholder="Qty (+Stok)"
              />
              <input
                type="text"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="w-2/3 px-3 py-2 border border-theme-200 rounded-xl bg-white focus:ring-2 focus:ring-theme-500 focus:border-theme-500 outline-none transition-all text-xs text-theme-800"
                placeholder="Catatan..."
              />
            </div>`;

code = code.replace(notesSearch, notesReplace);

fs.writeFileSync(file, code);
