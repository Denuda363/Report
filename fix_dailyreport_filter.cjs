const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const filterStateOld = `  // Filter State
  const [filterDate, setFilterDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [productFilterQuery, setProductFilterQuery] = useState('');
  const [bottomStockFilter, setBottomStockFilter] = useState<'all' | 'has' | 'none'>('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);`;

const filterStateNew = `  // Filter State
  const [filterDate, setFilterDate] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('');
  const [supplierFilterQuery, setSupplierFilterQuery] = useState('');
  const [productFilterQuery, setProductFilterQuery] = useState('');
  const [bottomStockFilter, setBottomStockFilter] = useState<'all' | 'has' | 'none'>('all');
  const [arrivedFilter, setArrivedFilter] = useState<'all' | 'arrived' | 'not_arrived'>('all');
  const [showDuplicatesOnly, setShowDuplicatesOnly] = useState(false);
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);`;

code = code.replace(filterStateOld, filterStateNew);

const paginationEffectOld = `  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterSupplier, productFilterQuery, bottomStockFilter, showDuplicatesOnly]);`;

const paginationEffectNew = `  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterDate, filterSupplier, productFilterQuery, bottomStockFilter, arrivedFilter, showDuplicatesOnly]);`;

code = code.replace(paginationEffectOld, paginationEffectNew);

const filterReportsOld = `  // Filter reports
  const filteredReports = useMemo(() => {
    let result = reports.filter(r => {
      if (r.isArrivedOnly) return false;

      let matchDate = true;
      let matchSupplier = true;
      let matchProduct = true;

      if (filterDate) {
        matchDate = r.date === filterDate;
      }
      
      const product = products.find(p => p.id === r.productId);

      if (filterSupplier) {
        matchSupplier = product?.supplierId === filterSupplier || (product?.alternativeSupplierIds || []).includes(filterSupplier);
      }
      
      if (productFilterQuery) {
        matchProduct = !!product && product.name.toLowerCase().includes(productFilterQuery.toLowerCase());
      }

      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = r.isBottomStock === true;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = !r.isBottomStock;
      }

      return matchDate && matchSupplier && matchProduct && matchBottomStock;
    });`;

const filterReportsNew = `  // Filter reports
  const filteredReports = useMemo(() => {
    let result = reports.filter(r => {
      if (r.isArrivedOnly) return false;

      let matchDate = true;
      let matchSupplier = true;
      let matchProduct = true;
      let matchArrived = true;

      if (filterDate) {
        matchDate = r.date === filterDate;
      }
      
      const product = products.find(p => p.id === r.productId);

      if (filterSupplier) {
        matchSupplier = product?.supplierId === filterSupplier || (product?.alternativeSupplierIds || []).includes(filterSupplier);
      }
      
      if (productFilterQuery) {
        matchProduct = !!product && product.name.toLowerCase().includes(productFilterQuery.toLowerCase());
      }

      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = r.isBottomStock === true;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = !r.isBottomStock;
      }
      
      if (arrivedFilter === 'arrived') {
        matchArrived = !!r.isArrived;
      } else if (arrivedFilter === 'not_arrived') {
        matchArrived = !r.isArrived;
      }

      return matchDate && matchSupplier && matchProduct && matchBottomStock && matchArrived;
    });`;

code = code.replace(filterReportsOld, filterReportsNew);

const clearButtonOld = `            {(filterDate || filterSupplier || supplierFilterQuery || productFilterQuery || bottomStockFilter !== 'all') && (
              <button 
                onClick={() => { setFilterDate(''); setFilterSupplier(''); setSupplierFilterQuery(''); setProductFilterQuery(''); setBottomStockFilter('all'); }}
                className="text-sm flex items-center gap-1 text-neutral-500 hover:text-rose-600 font-medium transition-colors px-2"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}`;

const clearButtonNew = `            {(filterDate || filterSupplier || supplierFilterQuery || productFilterQuery || bottomStockFilter !== 'all' || arrivedFilter !== 'all') && (
              <button 
                onClick={() => { setFilterDate(''); setFilterSupplier(''); setSupplierFilterQuery(''); setProductFilterQuery(''); setBottomStockFilter('all'); setArrivedFilter('all'); }}
                className="text-sm flex items-center gap-1 text-neutral-500 hover:text-rose-600 font-medium transition-colors px-2"
              >
                <X className="w-4 h-4" /> Clear
              </button>
            )}`;

code = code.replace(clearButtonOld, clearButtonNew);

const selectArrivedFilterUI = `            <div className="relative w-full sm:w-48">
              <select 
                value={arrivedFilter}
                onChange={(e) => setArrivedFilter(e.target.value as 'all' | 'arrived' | 'not_arrived')}
                className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-1.5 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-sm outline-none text-neutral-700 w-full"
              >
                <option value="all">Semua Status Datang</option>
                <option value="arrived">Sudah Datang</option>
                <option value="not_arrived">Belum Datang</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            {(filterDate`;

const bottomStockOld = `              <select 
                value={bottomStockFilter}
                onChange={(e) => setBottomStockFilter(e.target.value as 'all' | 'has' | 'none')}
                className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-1.5 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-sm outline-none text-neutral-700 w-full"
              >
                <option value="all">Semua Butom Stok</option>
                <option value="has">Punya Butom Stok</option>
                <option value="none">Belum Punya Butom Stok</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            {(filterDate`;

code = code.replace(bottomStockOld, bottomStockOld.replace('{(filterDate', selectArrivedFilterUI));

fs.writeFileSync('src/components/DailyReport.tsx', code);
