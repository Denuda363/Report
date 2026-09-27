const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const replacement = `
            <input
              type="text"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-xs text-[#3A3D32] mb-3"
              placeholder="Catatan untuk produk..."
            />
            
            <div className="flex flex-col gap-2 p-3 bg-[#F9FAF6] border border-[#E2E4D8] rounded-xl">
              <label className="flex items-center gap-2 text-xs font-bold text-[#8B9D77] cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentIsReorder}
                  onChange={(e) => setCurrentIsReorder(e.target.value === 'true' || e.target.checked)}
                  className="w-4 h-4 text-amber-500 rounded border-[#E2E4D8] focus:ring-amber-500 cursor-pointer"
                />
                Ajukan Permintaan Order Ulang
              </label>
              
              {currentIsReorder && (
                <div className="flex gap-2 mt-1">
                  <input
                    type="number"
                    min="1"
                    value={currentReorderQty}
                    onChange={(e) => setCurrentReorderQty(e.target.value ? parseInt(e.target.value) : '')}
                    className="w-20 px-2 py-1 border border-[#E2E4D8] rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    placeholder="Qty"
                  />
                  <input
                    type="text"
                    value={currentReorderReason}
                    onChange={(e) => setCurrentReorderReason(e.target.value)}
                    className="flex-1 px-2 py-1 border border-[#E2E4D8] rounded-lg bg-white focus:ring-2 focus:ring-amber-500 outline-none text-xs"
                    placeholder="Alasan / Ket (opsional)"
                  />
                </div>
              )}
            </div>
          </div>
`;

code = code.replace(
  /<input\n\s*type="text"\n\s*value=\{currentNotes\}\n\s*onChange=\{\(e\) => setCurrentNotes\(e\.target\.value\)\}\n\s*className="w-full px-3 py-2 border border-\[#E2E4D8\] rounded-xl bg-white focus:ring-2 focus:ring-\[#8B9D77\] focus:border-\[#8B9D77\] outline-none transition-all text-xs text-\[#3A3D32\]"\n\s*placeholder="Catatan untuk produk berikutnya\.\.\."\n\s*\/>\n\s*<\/div>/,
  replacement
);

fs.writeFileSync(file, code);
