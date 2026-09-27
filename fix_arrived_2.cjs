const fs = require('fs');
let code = fs.readFileSync('src/components/ArrivedRecap.tsx', 'utf8');

// 1. Add isFormFullscreen
code = code.replace(
  'const [isListFullscreen, setIsListFullscreen] = useState(false);',
  'const [isListFullscreen, setIsListFullscreen] = useState(false);\n  const [isFormFullscreen, setIsFormFullscreen] = useState(false);'
);

// 2. Modify handleProductSelect
const handleProductSelectOld = `  const handleProductSelect = (id: string, name: string) => {
    setCurrentProductId(id);
    setCurrentSearchQuery(name);
    setIsProductDropdownOpen(false);
  };`;

const handleProductSelectNew = `  const handleProductSelect = (id: string, name: string) => {
    setArrivedItems([...arrivedItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: id,
      productName: name,
      notes: currentNotes
    }]);
    
    setCurrentProductId('');
    setCurrentSearchQuery('');
    setCurrentNotes('');
    setIsProductDropdownOpen(false);
  };`;

code = code.replace(handleProductSelectOld, handleProductSelectNew);

// 3. Remove handleAddItem
const handleAddItemCode = `  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentProductId) return;
    
    const product = products.find(p => p.id === currentProductId);
    if (!product) return;
    
    setArrivedItems([...arrivedItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: currentProductId,
      productName: product.name,
      notes: currentNotes
    }]);
    
    setCurrentProductId('');
    setCurrentSearchQuery('');
    setCurrentNotes('');
  };`;

code = code.replace(handleAddItemCode, '');

// 4. Update the input form wrapper
const formWrapperOld = `      {/* Input Form */}
      <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm p-4 lg:p-6 h-fit transition-all duration-300">
        <h3 className="font-bold text-[#2D3025] mb-4">Input Barang Datang</h3>`;

const formWrapperNew = `      {/* Input Form */}
      <div className={
        isFormFullscreen
          ? "fixed inset-0 z-[100] bg-[#F9FAF6] p-4 sm:p-6 md:p-8 overflow-y-auto animate-in zoom-in-95 duration-200 shadow-2xl"
          : "w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm p-4 lg:p-6 h-fit transition-all duration-300"
      }>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#2D3025]">Input Barang Datang</h3>
          <button
            onClick={() => setIsFormFullscreen(!isFormFullscreen)}
            className="p-1.5 text-neutral-500 hover:text-[#556B2F] hover:bg-[#E2E4D8] rounded-md transition-colors active:scale-95 bg-white border border-[#E2E4D8] shadow-sm"
            title={isFormFullscreen ? "Perkecil (Minimize)" : "Layar Penuh (Maximize)"}
          >
            {isFormFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>`;

code = code.replace(formWrapperOld, formWrapperNew);

// 5. Update form element to normal div and remove Add Product button
const productFormOld = `            <form onSubmit={handleAddItem} className="space-y-3 bg-[#F9FAF6] p-3 rounded-2xl border border-[#E2E4D8] border-dashed">
              <div className="relative" ref={productDropdownRef}>
                <div className="relative flex items-center w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all">
                  <Search className="w-3.5 h-3.5 text-[#7A7F6E] mr-2 shrink-0" />
                  <input
                    type="text"
                    required={!currentProductId}
                    value={currentSearchQuery}
                    onChange={(e) => {
                      setCurrentSearchQuery(e.target.value);
                      setCurrentProductId('');
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="w-full outline-none bg-transparent text-xs text-[#3A3D32]"
                    placeholder="Cari produk..."
                  />`;

const productFormNew = `            <div className="space-y-3 bg-[#F9FAF6] p-3 rounded-2xl border border-[#E2E4D8] border-dashed">
              <div className="relative" ref={productDropdownRef}>
                <div className="relative flex items-center w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all">
                  <Search className="w-3.5 h-3.5 text-[#7A7F6E] mr-2 shrink-0" />
                  <input
                    type="text"
                    value={currentSearchQuery}
                    onChange={(e) => {
                      setCurrentSearchQuery(e.target.value);
                      setCurrentProductId('');
                      setIsProductDropdownOpen(true);
                    }}
                    onFocus={() => setIsProductDropdownOpen(true)}
                    className="w-full outline-none bg-transparent text-xs text-[#3A3D32]"
                    placeholder="Cari produk..."
                  />`;

code = code.replace(productFormOld, productFormNew);

const productNotesAndSubmitOld = `              <input
                type="text"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-xs text-[#3A3D32]"
                placeholder="Catatan..."
              />
              
              <button 
                type="submit"
                disabled={!currentProductId}
                className="w-full py-2 bg-[#E2E4D8] hover:bg-[#d5d7cb] text-[#2D3025] text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                + Tambah Produk
              </button>
            </form>`;

const productNotesAndSubmitNew = `              <input
                type="text"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-xs text-[#3A3D32]"
                placeholder="Catatan untuk produk berikutnya..."
              />
            </div>`;

code = code.replace(productNotesAndSubmitOld, productNotesAndSubmitNew);

fs.writeFileSync('src/components/ArrivedRecap.tsx', code);
