const fs = require('fs');
let code = fs.readFileSync('src/components/ArrivedRecap.tsx', 'utf8');

const stateBlockOld = `  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState('');
  const [searchQueryForm, setSearchQueryForm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const [notes, setNotes] = useState('');
  
  const [arrivedSupplierId, setArrivedSupplierId] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  // Edit State`;

const stateBlockNew = `  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [arrivedSupplierId, setArrivedSupplierId] = useState('');
  const [supplierSearchQuery, setSupplierSearchQuery] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);
  const supplierDropdownRef = useRef<HTMLDivElement>(null);

  interface ArrivedItem {
    id: string; // temp id
    productId: string;
    productName: string;
    notes: string;
  }
  const [arrivedItems, setArrivedItems] = useState<ArrivedItem[]>([]);
  
  const [currentProductId, setCurrentProductId] = useState('');
  const [currentSearchQuery, setCurrentSearchQuery] = useState('');
  const [isProductDropdownOpen, setIsProductDropdownOpen] = useState(false);
  const productDropdownRef = useRef<HTMLDivElement>(null);
  const [currentNotes, setCurrentNotes] = useState('');

  // Edit State`;

code = code.replace(stateBlockOld, stateBlockNew);

const refsOld = `  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;

const refsNew = `  // Handle click outside for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (productDropdownRef.current && !productDropdownRef.current.contains(event.target as Node)) {
        setIsProductDropdownOpen(false);
      }
      if (supplierDropdownRef.current && !supplierDropdownRef.current.contains(event.target as Node)) {
        setIsSupplierDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);`;

code = code.replace(refsOld, refsNew);

const filterOld = `  const filteredProductsForForm = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQueryForm.toLowerCase()));
  }, [products, searchQueryForm]);`;

const filterNew = `  const filteredProductsForForm = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(currentSearchQuery.toLowerCase()));
  }, [products, currentSearchQuery]);`;

code = code.replace(filterOld, filterNew);

const addLogicOld = `  const handleProductSelect = (id: string, name: string) => {
    setProductId(id);
    setSearchQueryForm(name);
    setIsDropdownOpen(false);

    const product = products.find(p => p.id === id);
    if (product) {
       const supplier = suppliers.find(s => s.id === product.supplierId);
       if (supplier) {
         setArrivedSupplierId(supplier.id);
         setSupplierSearchQuery(supplier.name);
       }
    }
  };

  const handleAddArrived = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !productId) return;

    if (arrivedSupplierId && productId) {
      const product = products.find(p => p.id === productId);
      if (product && product.supplierId !== arrivedSupplierId) {
        if (!product.alternativeSupplierIds?.includes(arrivedSupplierId)) {
           updateProduct({
             ...product,
             alternativeSupplierIds: [...(product.alternativeSupplierIds || []), arrivedSupplierId]
           });
        }
      }
    }

    // Check if report exists for this date and product
    const existingReport = reports.find(r => r.date === date && r.productId === productId);

    if (existingReport) {
      if (!existingReport.isArrivedOnly) {
        // Exists in daily report!
        const arrivalNote = notes ? \`Datang (\${notes})\` : \`Barang Datang\`;
        await updateReport({
          ...existingReport,
          isArrived: true,
          arrivedAt: Date.now(),
          arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
          notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote
        });
      } else {
        // It's already an "arrived only" item. Just add to it.
        await updateReport({
          ...existingReport,
          arrivedAt: Date.now(),
          arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
          notes: notes ? (existingReport.notes ? \`\${existingReport.notes} | \${notes}\` : notes) : existingReport.notes
        });
      }
    } else {
      // Doesn't exist, create an arrived-only record
      await addReport({
        date,
        productId,
        quantity: 0, // No quantity for arrived only
        notes,
        isArrived: true,
        isArrivedOnly: true,
        arrivedAt: Date.now(),
        arrivedSupplierId,
        isBottomStock: false
      });
    }

    // Reset Form
    setProductId('');
    setSearchQueryForm('');
    setNotes('');
    setArrivedSupplierId('');
    setSupplierSearchQuery('');
  };`;

const addLogicNew = `  const handleProductSelect = (id: string, name: string) => {
    setCurrentProductId(id);
    setCurrentSearchQuery(name);
    setIsProductDropdownOpen(false);
  };

  const handleAddItem = (e: React.FormEvent) => {
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
  };
  
  const handleRemoveItem = (id: string) => {
    setArrivedItems(arrivedItems.filter(item => item.id !== id));
  };

  const handleSaveAllArrived = async () => {
    if (!date || arrivedItems.length === 0) return;

    for (const item of arrivedItems) {
      if (arrivedSupplierId && item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!product.supplierId) {
            await updateProduct({
              ...product,
              supplierId: arrivedSupplierId
            });
          } else if (product.supplierId !== arrivedSupplierId) {
            if (!product.alternativeSupplierIds?.includes(arrivedSupplierId)) {
               await updateProduct({
                 ...product,
                 alternativeSupplierIds: [...(product.alternativeSupplierIds || []), arrivedSupplierId]
               });
            }
          }
        }
      }

      // Check if report exists for this date and product
      const existingReport = reports.find(r => r.date === date && r.productId === item.productId);

      if (existingReport) {
        if (!existingReport.isArrivedOnly) {
          // Exists in daily report!
          const arrivalNote = item.notes ? \`Datang (\${item.notes})\` : \`Barang Datang\`;
          await updateReport({
            ...existingReport,
            isArrived: true,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote
          });
        } else {
          // It's already an "arrived only" item. Just add to it.
          await updateReport({
            ...existingReport,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: item.notes ? (existingReport.notes ? \`\${existingReport.notes} | \${item.notes}\` : item.notes) : existingReport.notes
          });
        }
      } else {
        // Doesn't exist, create an arrived-only record
        await addReport({
          date,
          productId: item.productId,
          quantity: 0,
          notes: item.notes,
          isArrived: true,
          isArrivedOnly: true,
          arrivedAt: Date.now(),
          arrivedSupplierId,
          isBottomStock: false
        });
      }
    }

    // Reset Form
    setArrivedItems([]);
    setArrivedSupplierId('');
    setSupplierSearchQuery('');
  };`;

code = code.replace(addLogicOld, addLogicNew);

const formOld = `      {/* Input Form */}
      <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm p-4 lg:p-6 h-fit transition-all duration-300">
        <h3 className="font-bold text-[#2D3025] mb-4">Input Barang Datang</h3>
        <form onSubmit={handleAddArrived} className="space-y-4">
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

          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Produk</label>
            <div className="relative flex items-center w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all">
              <Search className="w-4 h-4 text-[#7A7F6E] mr-2 shrink-0" />
              <input
                type="text"
                required={!productId}
                value={searchQueryForm}
                onChange={(e) => {
                  setSearchQueryForm(e.target.value);
                  setProductId('');
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-[#3A3D32]"
                placeholder="Cari produk..."
              />
              {searchQueryForm && (
                <X 
                  className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-rose-500 transition-colors" 
                  onClick={() => {
                    setSearchQueryForm('');
                    setProductId('');
                  }} 
                />
              )}
              <ChevronDown className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer hover:text-[#3A3D32] transition-colors" onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E4D8] rounded-xl shadow-xl max-h-60 overflow-y-auto py-1">
                {filteredProductsForForm.length > 0 ? (
                  filteredProductsForForm.map(p => {
                    const s = suppliers.find(sup => sup.id === p.supplierId);
                    return (
                      <div 
                        key={p.id}
                        className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer border-b border-[#F9FAF6] last:border-0"
                        onClick={() => handleProductSelect(p.id, p.name)}
                      >
                        <div className="font-bold text-sm text-[#2D3025]">{p.name}</div>
                        <div className="text-xs text-[#7A7F6E] mt-0.5">{s?.name || 'Unknown Supplier'}</div>
                      </div>
                    );
                  })
                ) : (
                  <div className="px-4 py-3 text-sm text-[#7A7F6E] text-center">
                    Tidak ada produk ditemukan.
                  </div>
                )}
              </div>
            )}
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

          <div>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Catatan (Opsional)</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
              placeholder="Tambahkan keterangan..."
            />
          </div>

          <button 
            type="submit"
            className="group w-full flex items-center justify-center gap-2 bg-[#8B9D77] hover:bg-[#728261] text-white px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm shadow-lg shadow-[#8B9D77]/20 active:scale-95"
            disabled={!productId}
          >
            <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform duration-300" />
            <span>Simpan</span>
          </button>
          
          {products.length === 0 && (
            <p className="text-xs text-rose-500 mt-2">Mohon tambah produk di Master Data terlebih dahulu.</p>
          )}
        </form>
      </div>`;

const formNew = `      {/* Input Form */}
      <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm p-4 lg:p-6 h-fit transition-all duration-300">
        <h3 className="font-bold text-[#2D3025] mb-4">Input Barang Datang</h3>
        <div className="space-y-4">
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

            <form onSubmit={handleAddItem} className="space-y-3 bg-[#F9FAF6] p-3 rounded-2xl border border-[#E2E4D8] border-dashed">
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
                placeholder="Catatan..."
              />
              
              <button 
                type="submit"
                disabled={!currentProductId}
                className="w-full py-2 bg-[#E2E4D8] hover:bg-[#d5d7cb] text-[#2D3025] text-xs font-bold rounded-xl transition-colors disabled:opacity-50"
              >
                + Tambah Produk
              </button>
            </form>
          </div>

          <button 
            onClick={handleSaveAllArrived}
            disabled={arrivedItems.length === 0}
            className="group w-full flex items-center justify-center gap-2 bg-[#8B9D77] hover:bg-[#728261] text-white px-4 py-3 rounded-2xl font-bold transition-all duration-300 text-sm shadow-lg shadow-[#8B9D77]/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
            <span>Simpan Semua ({arrivedItems.length})</span>
          </button>
          
          {products.length === 0 && (
            <p className="text-xs text-rose-500 mt-2">Mohon tambah produk di Master Data terlebih dahulu.</p>
          )}
        </div>
      </div>`;

code = code.replace(formOld, formNew);

fs.writeFileSync('src/components/ArrivedRecap.tsx', code);
