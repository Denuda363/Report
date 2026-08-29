import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useAppContext } from '../store/AppContext';
import { Plus, Trash2, Download, Filter, Calendar as CalendarIcon, Search, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { exportReportsToExcel } from '../lib/excel';

export const DailyReport = () => {
  const { reports, products, suppliers, addReport, deleteReport } = useAppContext();

  // Form State
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState('');
  
  // Searchable Select State
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Filter State
  const [filterDate, setFilterDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');

  const selectedProduct = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  // Handle click outside for custom dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredProductsForSelect = useMemo(() => {
    return products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [products, searchQuery]);

  const handleProductSelect = (id: string, name: string) => {
    setProductId(id);
    setSearchQuery(name);
    setIsDropdownOpen(false);
  };

  const handleAddReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !productId || !selectedProduct) return;

    const qty = quantity === '' ? 0 : Number(quantity);
    if (qty < 0) return;

    addReport({
      date,
      productId,
      quantity: qty,
    });

    // Reset qty, keep date and product for faster multi-entry
    setQuantity('');
    setSearchQuery('');
    setProductId('');
  };

  const handleExport = () => {
    exportReportsToExcel(filteredReports, products, suppliers, `Report_${format(new Date(), 'yyyyMMdd')}`);
  };

  // Filter reports
  const filteredReports = useMemo(() => {
    return reports.filter(r => {
      let matchDate = true;
      let matchSupplier = true;

      if (filterDate) {
        matchDate = r.date === filterDate;
      }
      
      if (filterSupplier) {
        const product = products.find(p => p.id === r.productId);
        matchSupplier = product?.supplierId === filterSupplier;
      }

      return matchDate && matchSupplier;
    }).sort((a, b) => b.date.localeCompare(a.date)); // Sort newest first
  }, [reports, filterDate, filterSupplier, products]);

  const totalFilteredValue = filteredReports.reduce((sum, r) => sum + r.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full">
      {/* Input Form */}
      <div className="w-full lg:w-80 shrink-0 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm p-6 h-fit">
        <h3 className="font-bold text-[#2D3025] mb-4">Record Sales</h3>
        <form onSubmit={handleAddReport} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
            />
          </div>
          
          <div className="relative" ref={dropdownRef}>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Product</label>
            <div 
              className="relative flex items-center w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus-within:ring-2 focus-within:ring-[#8B9D77] focus-within:border-[#8B9D77] transition-all"
            >
              <Search className="w-4 h-4 text-[#7A7F6E] mr-2 shrink-0" />
              <input
                type="text"
                required={!productId}
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setProductId(''); // Reset ID if they type something new
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full outline-none bg-transparent text-sm text-[#3A3D32]"
                placeholder="Search product..."
              />
              <ChevronDown className="w-4 h-4 text-[#7A7F6E] ml-2 shrink-0 cursor-pointer" onClick={() => setIsDropdownOpen(!isDropdownOpen)} />
            </div>

            {isDropdownOpen && (
              <div className="absolute z-50 w-full mt-2 bg-white border border-[#E2E4D8] rounded-2xl shadow-lg max-h-60 overflow-y-auto">
                {filteredProductsForSelect.length === 0 ? (
                  <div className="p-4 text-sm text-[#7A7F6E] text-center">No products found.</div>
                ) : (
                  filteredProductsForSelect.map(p => (
                    <div 
                      key={p.id}
                      onClick={() => handleProductSelect(p.id, p.name)}
                      className="px-4 py-3 hover:bg-[#F1F3E9] cursor-pointer text-sm text-[#2D3025] font-bold border-b border-[#F9FAF6] last:border-0"
                    >
                      {p.name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold text-[#8B9D77] uppercase tracking-wider mb-2">Quantity</label>
            <input
              type="number"
              min="0"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-4 py-3 border border-[#E2E4D8] rounded-2xl bg-[#F9FAF6] focus:ring-2 focus:ring-[#8B9D77] focus:border-[#8B9D77] outline-none transition-all text-sm text-[#3A3D32]"
              placeholder="0"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 bg-[#8B9D77] hover:bg-[#728261] text-white px-4 py-3 rounded-2xl font-bold transition-colors text-sm"
              disabled={products.length === 0}
            >
              <Plus className="w-4 h-4" /> Add Record
            </button>
            {products.length === 0 && (
              <p className="text-xs text-rose-500 mt-2 text-center">Master data products is empty.</p>
            )}
          </div>
        </form>
      </div>

      {/* Reports Data Table */}
      <div className="flex-1 bg-white rounded-3xl border border-[#E2E4D8] shadow-sm flex flex-col overflow-hidden min-h-[500px]">
        {/* Toolbar */}
        <div className="p-6 border-b border-[#E2E4D8] bg-white flex flex-col sm:flex-row gap-4 justify-between items-center">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-[#F9FAF6] border border-[#E2E4D8] rounded-2xl px-4 py-2 focus-within:border-[#8B9D77] focus-within:ring-1 focus-within:ring-[#8B9D77] transition-all">
              <CalendarIcon className="w-4 h-4 text-[#7A7F6E]" />
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="text-sm outline-none bg-transparent text-[#3A3D32]" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-[#F9FAF6] border border-[#E2E4D8] rounded-2xl px-4 py-2 focus-within:border-[#8B9D77] focus-within:ring-1 focus-within:ring-[#8B9D77] transition-all">
              <Filter className="w-4 h-4 text-[#7A7F6E]" />
              <select 
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="text-sm outline-none bg-transparent text-[#3A3D32] min-w-[120px]"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            
            {(filterDate || filterSupplier) && (
              <button 
                onClick={() => { setFilterDate(''); setFilterSupplier(''); }}
                className="text-sm text-[#7A7F6E] hover:text-rose-600 font-bold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          
          <button 
            onClick={handleExport}
            disabled={filteredReports.length === 0}
            className="flex items-center gap-2 bg-white text-[#8B9D77] border border-[#E2E4D8] hover:bg-[#F1F3E9] disabled:opacity-50 px-4 py-2.5 rounded-xl font-bold transition-colors text-sm whitespace-nowrap"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-2">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-white z-10">
              <tr className="border-b border-[#E2E4D8]">
                <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] rounded-tl-xl">Date</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9]">Product</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9]">Supplier</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] text-right">Qty</th>
                <th className="py-3 px-4 text-xs font-bold text-[#8B9D77] uppercase tracking-wider bg-[#F1F3E9] w-12 text-center rounded-tr-xl"></th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#7A7F6E]">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-12 h-12 bg-[#F9FAF6] rounded-full flex items-center justify-center mb-3 border border-[#E2E4D8]">
                        <Filter className="w-6 h-6 text-[#7A7F6E]" />
                      </div>
                      <p className="font-bold text-[#2D3025]">No records found</p>
                      <p className="text-sm mt-1">Try adjusting your filters or adding new data.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredReports.map(r => {
                  const product = products.find(p => p.id === r.productId);
                  const supplier = product ? suppliers.find(s => s.id === product.supplierId) : null;
                  
                  return (
                    <tr key={r.id} className="border-b border-[#F1F3E9] hover:bg-[#F9FAF6]">
                      <td className="py-3 px-4 text-sm text-[#7A7F6E] whitespace-nowrap">{format(new Date(r.date), 'dd MMM yyyy')}</td>
                      <td className="py-3 px-4 text-sm font-bold text-[#2D3025]">{product?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-[10px] text-[#8B9D77] uppercase font-bold">{supplier?.name || 'Unknown'}</td>
                      <td className="py-3 px-4 text-sm text-[#2D3025] text-right font-bold">{r.quantity} {product?.unit || ''}</td>
                      <td className="py-3 px-4 text-center">
                        <button onClick={() => deleteReport(r.id)} className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors" title="Delete record">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Sum */}
        {filteredReports.length > 0 && (
          <div className="bg-[#F9FAF6] border-t border-[#E2E4D8] p-6 flex flex-col sm:flex-row justify-between items-center gap-4 sm:gap-0 rounded-b-3xl">
            <span className="font-bold text-[#7A7F6E] text-sm">Showing {filteredReports.length} records</span>
            <div className="flex items-center gap-3">
              <span className="text-[#7A7F6E] text-sm font-bold uppercase tracking-wider">Total Volume:</span>
              <span className="font-bold text-[#2D3025] text-2xl">{totalFilteredValue.toLocaleString('id-ID')} Units</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
