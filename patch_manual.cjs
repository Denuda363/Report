const fs = require('fs');
const file = 'src/components/KosongPabrikRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const insertFunc = `
  const handleAddManualProduct = async (name: string) => {
    if (!name.trim()) return;
    try {
      await addProduct({
        name: name.trim(),
        unit: 'Pcs',
        supplierId: '',
        isKosongPabrik: true,
        kosongPabrikDate: Date.now()
      });
      setSearchQuery('');
      setIsDropdownOpen(false);
    } catch (e) {
      console.error('Failed to add manual product:', e);
    }
  };
`;

code = code.replace(
  /const handleSelectProduct = async \(product: any\) => \{[\s\S]*?setIsDropdownOpen\(false\);\n\s*\};/,
  match => match + "\n" + insertFunc
);

// also replace the dropdown empty state and append the add manual item
const searchDropdownTarget = `) : (
                  <div className="px-4 py-4 text-sm text-[#7A7F6E] text-center">
                    Tidak ada produk ditemukan.
                  </div>
                )}`;

const searchDropdownReplacement = `) : (
                  <div className="px-4 py-4 text-sm text-[#7A7F6E] text-center">
                    Tidak ada produk ditemukan.
                  </div>
                )}
                
                {searchQuery.trim().length > 0 && (
                  <div
                    className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer border-t border-[#E2E4D8] flex items-center gap-2 text-[#556B2F]"
                    onClick={() => handleAddManualProduct(searchQuery.trim())}
                  >
                    <Plus className="w-4 h-4" />
                    <div className="flex-1 text-left">
                      <div className="font-bold text-sm">Tambah "{searchQuery.trim()}"</div>
                      <div className="text-xs opacity-80 mt-0.5">Input manual ke daftar kosong pabrik</div>
                    </div>
                  </div>
                )}`;

code = code.replace(searchDropdownTarget, searchDropdownReplacement);

fs.writeFileSync(file, code);
