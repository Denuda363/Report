const fs = require('fs');
let code = fs.readFileSync('src/components/ArrivedRecap.tsx', 'utf8');

const formContentOld = `        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Tanggal</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
            />
          </div>

          <div className="relative" ref={supplierDropdownRef}>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Datang Dari Supplier</label>
            <div className="relative flex items-center w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all">
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  setSupplierSearchQuery(e.target.value);
                  setArrivedSupplierId('');
                  setIsSupplierDropdownOpen(true);
                }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-[#3A3D32]"
                placeholder="Pilih supplier (opsional)..."
              />
              {supplierSearchQuery && (
                <X 
                  className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setArrivedSupplierId('');
                  }} 
                />
              )}
              <ChevronDown className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-[#3A3D32] transition-colors" onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} />
            </div>

            {isSupplierDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E4D8] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                {filteredSuppliersForForm.length > 0 ? (
                  filteredSuppliersForForm.map(s => (
                    <div 
                      key={s.id}
                      className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer text-sm font-bold text-[#2D3025] transition-colors border-b border-[#F9FAF6] last:border-0"
                      onClick={() => {
                        setArrivedSupplierId(s.id);
                        setSupplierSearchQuery(s.name);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      {s.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-[#7A7F6E] text-center">
                    Tidak ada supplier ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-[#E2E4D8]">
            <h4 className="text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-3">Daftar Produk ({arrivedItems.length})</h4>
            
            {arrivedItems.length > 0 && (
              <div className="mb-4 space-y-2">
                {arrivedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#F9FAF6] p-2 rounded-xl border border-[#E2E4D8] text-sm">
                    <div className="flex-1 truncate pr-2">
                      <div className="font-bold text-[#2D3025] truncate">{item.productName}</div>
                      {item.notes && <div className="text-[10px] text-[#7A7F6E] truncate">{item.notes}</div>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-3 bg-[#F9FAF6] p-3 rounded-2xl border border-[#E2E4D8] border-dashed">
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
                  />
                  {currentSearchQuery && (
                    <X 
                      className="w-3.5 h-3.5 text-[#7A7F6E] ml-1 shrink-0 cursor-pointer hover:text-rose-500" 
                      onClick={() => {
                        setCurrentSearchQuery('');
                        setCurrentProductId('');
                      }} 
                    />
                  )}
                </div>

                {isProductDropdownOpen && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E4D8] rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                    {filteredProductsForForm.length > 0 ? (
                      filteredProductsForForm.map(p => {
                        const s = suppliers.find(sup => sup.id === p.supplierId);
                        return (
                          <div 
                            key={p.id}
                            className="px-3 py-2 hover:bg-[#F1F3E9] cursor-pointer border-b border-[#F9FAF6] last:border-0"
                            onClick={() => handleProductSelect(p.id, p.name)}
                          >
                            <div className="font-bold text-xs text-[#2D3025]">{p.name}</div>
                            <div className="text-[10px] text-[#7A7F6E] mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="px-3 py-2 text-xs text-[#7A7F6E] text-center">
                        Tidak ada produk ditemukan.
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <input
                type="text"
                value={currentNotes}
                onChange={(e) => setCurrentNotes(e.target.value)}
                className="w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-xs text-[#3A3D32]"
                placeholder="Catatan untuk produk berikutnya..."
              />
            </div>
          </div>`;

const formContentNew = `        <div className="space-y-4">
          {/* SEARCH BAR PADA POSISI ATAS */}
          <div className="space-y-3 bg-[#F9FAF6] p-3 rounded-2xl border border-[#E2E4D8] border-dashed">
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
                />
                {currentSearchQuery && (
                  <X 
                    className="w-3.5 h-3.5 text-[#7A7F6E] ml-1 shrink-0 cursor-pointer hover:text-rose-500" 
                    onClick={() => {
                      setCurrentSearchQuery('');
                      setCurrentProductId('');
                    }} 
                  />
                )}
              </div>

              {isProductDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E4D8] rounded-xl shadow-xl max-h-48 overflow-y-auto py-1">
                  {filteredProductsForForm.length > 0 ? (
                    filteredProductsForForm.map(p => {
                      const s = suppliers.find(sup => sup.id === p.supplierId);
                      return (
                        <div 
                          key={p.id}
                          className="px-3 py-2 hover:bg-[#F1F3E9] cursor-pointer border-b border-[#F9FAF6] last:border-0"
                          onClick={() => handleProductSelect(p.id, p.name)}
                        >
                          <div className="font-bold text-xs text-[#2D3025]">{p.name}</div>
                          <div className="text-[10px] text-[#7A7F6E] mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-xs text-[#7A7F6E] text-center">
                      Tidak ada produk ditemukan.
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <input
              type="text"
              value={currentNotes}
              onChange={(e) => setCurrentNotes(e.target.value)}
              className="w-full px-3 py-2 border border-[#E2E4D8] rounded-xl bg-white focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-xs text-[#3A3D32]"
              placeholder="Catatan untuk produk berikutnya..."
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Tanggal</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
            />
          </div>

          <div className="relative" ref={supplierDropdownRef}>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Datang Dari Supplier</label>
            <div className="relative flex items-center w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all">
              <input
                type="text"
                value={supplierSearchQuery}
                onChange={(e) => {
                  setSupplierSearchQuery(e.target.value);
                  setArrivedSupplierId('');
                  setIsSupplierDropdownOpen(true);
                }}
                onFocus={() => setIsSupplierDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-[#3A3D32]"
                placeholder="Pilih supplier (opsional)..."
              />
              {supplierSearchQuery && (
                <X 
                  className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => {
                    setSupplierSearchQuery('');
                    setArrivedSupplierId('');
                  }} 
                />
              )}
              <ChevronDown className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-[#3A3D32] transition-colors" onClick={() => setIsSupplierDropdownOpen(!isSupplierDropdownOpen)} />
            </div>

            {isSupplierDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E4D8] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                {filteredSuppliersForForm.length > 0 ? (
                  filteredSuppliersForForm.map(s => (
                    <div 
                      key={s.id}
                      className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer text-sm font-bold text-[#2D3025] transition-colors border-b border-[#F9FAF6] last:border-0"
                      onClick={() => {
                        setArrivedSupplierId(s.id);
                        setSupplierSearchQuery(s.name);
                        setIsSupplierDropdownOpen(false);
                      }}
                    >
                      {s.name}
                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-[#7A7F6E] text-center">
                    Tidak ada supplier ditemukan.
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="pt-4 border-t border-[#E2E4D8]">
            <h4 className="text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-3">Daftar Produk Terpilih ({arrivedItems.length})</h4>
            
            {arrivedItems.length > 0 ? (
              <div className="mb-4 space-y-2">
                {arrivedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between bg-[#F9FAF6] p-2 rounded-xl border border-[#E2E4D8] text-sm">
                    <div className="flex-1 truncate pr-2">
                      <div className="font-bold text-[#2D3025] truncate">{item.productName}</div>
                      {item.notes && <div className="text-[10px] text-[#7A7F6E] truncate">{item.notes}</div>}
                    </div>
                    <button onClick={() => handleRemoveItem(item.id)} className="p-1 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-xs text-[#7A7F6E] py-4 bg-[#F9FAF6] rounded-xl border border-[#E2E4D8] border-dashed mb-4">
                Belum ada produk yang dipilih
              </div>
            )}
          </div>`;

code = code.replace(formContentOld, formContentNew);
fs.writeFileSync('src/components/ArrivedRecap.tsx', code);

