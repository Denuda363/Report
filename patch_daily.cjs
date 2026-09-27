const fs = require('fs');
const file = 'src/components/DailyReport.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Add types and state
code = code.replace(
  /\/\/ Form State/,
  `interface PendingReportItem {
  id: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number | '';
  bottomStock: number | '';
  showBottomStockInput: boolean;
  notes: string;
  isWarningStock: boolean;
}

  // Form State`
);

code = code.replace(
  /const \[errorMsg, setErrorMsg\] = useState<string \| null>\(null\);/,
  `const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<PendingReportItem[]>([]);
  const [saveSummary, setSaveSummary] = useState<{ isOpen: boolean; saved: any[]; failed: { item: any, reason: string }[]; }>({ isOpen: false, saved: [], failed: [] });
  const [isSavingAll, setIsSavingAll] = useState(false);`
);

// 2. Add handleAddToList and handleSaveAll before handleAddReport
const newFunctions = `
  const handleAddToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) return;
    if (!productId && !searchQuery.trim()) {
      setErrorMsg("Produk harus diisi.");
      return;
    }
    
    let finalProductId = productId;
    const prodName = finalProductId ? (products.find(p => p.id === finalProductId)?.name || searchQuery) : searchQuery.trim();
    
    // Check if duplicate in pending list
    const isDuplicateInList = pendingItems.some(i => 
      (finalProductId && i.productId === finalProductId) || (!finalProductId && i.productName.toLowerCase() === prodName.toLowerCase())
    );
    if (isDuplicateInList) {
      setErrorMsg(\`Produk "\${prodName}" sudah ada di dalam list input (ganda).\`);
      return;
    }

    // Check if duplicate in database for this date
    const isDuplicateInDb = reports.some(r => 
      r.date === date && 
      ((finalProductId && r.productId === finalProductId) || (!finalProductId && products.find(p=>p.id === r.productId)?.name.toLowerCase() === prodName.toLowerCase()))
    );
    
    if (isDuplicateInDb) {
      setErrorMsg(\`Produk "\${prodName}" sudah ada pada laporan tanggal \${date}. Tidak boleh ganda.\`);
      return;
    }
    
    const qty = quantity === '' ? 0 : Number(quantity);
    if (qty < 0) {
      setErrorMsg("Quantity tidak valid.");
      return;
    }

    const newItem: PendingReportItem = {
      id: Math.random().toString(36).substr(2, 9),
      productId: finalProductId,
      productName: prodName,
      unit,
      quantity,
      bottomStock,
      showBottomStockInput,
      notes,
      isWarningStock
    };
    
    setPendingItems([...pendingItems, newItem]);
    
    // reset form fields
    setQuantity('');
    setSearchQuery('');
    setProductId('');
    setUnit('pcs');
    setNotes('');
    setBottomStock('');
    setShowBottomStockInput(false);
    setIsWarningStock(false);
    setErrorMsg(null);
  };

  const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;
    setIsSavingAll(true);
    
    const saved = [];
    const failed = [];
    
    for (const item of pendingItems) {
      let finalProductId = item.productId;
      
      try {
        if (!finalProductId && item.productName) {
          let defaultSupplier = suppliers.find(s => s.name.toLowerCase() === 'tanpa supplier' || s.name.toLowerCase() === 'unknown supplier');
          let supplierId = defaultSupplier?.id;
          if (!supplierId) {
            supplierId = await addSupplier({ name: 'Tanpa Supplier' });
          }
          
          finalProductId = await addProduct({
            name: item.productName,
            supplierId,
            unit: item.unit || 'pcs',
            ...(item.showBottomStockInput && item.bottomStock !== '' ? { bottomStock: Number(item.bottomStock) } : {})
          });
        } else if (finalProductId) {
          const selectedProd = products.find(p => p.id === finalProductId);
          if (selectedProd) {
            let hasChanges = false;
            let updatedProd = { ...selectedProd };
            if (selectedProd.unit !== item.unit) {
              updatedProd.unit = item.unit || 'pcs';
              hasChanges = true;
            }
            if (item.showBottomStockInput && item.bottomStock !== '') {
              updatedProd.bottomStock = Number(item.bottomStock);
              hasChanges = true;
            }
            if (hasChanges) {
              await updateProduct(updatedProd);
            }
          }
        }
        
        const duplicateReport = reports.find(
          r => r.date === date && r.productId === finalProductId
        );
        
        if (duplicateReport) {
          failed.push({ item, reason: "Data ganda (sudah ada di database saat disimpan)." });
          continue;
        }
        
        const qty = item.quantity === '' ? 0 : Number(item.quantity);
        if (qty < 0) {
          failed.push({ item, reason: "Quantity minus tidak diizinkan." });
          continue;
        }
        
        const p = products.find(prod => prod.id === finalProductId);
        await addReport({
          date,
          productId: finalProductId,
          quantity: qty,
          notes: item.notes || undefined,
          isWarningStock: item.isWarningStock,
          isKosongPabrik: p?.isKosongPabrik || false
        });
        
        saved.push(item);
      } catch (e: any) {
        failed.push({ item, reason: e.message || "Gagal menyimpan data." });
      }
    }
    
    setSaveSummary({ isOpen: true, saved, failed });
    setPendingItems([]);
    setIsSavingAll(false);
  };

  const handleAddReport = async (e: React.FormEvent) => {`;

code = code.replace(/const handleAddReport = async \(e: React\.FormEvent\) => \{/, newFunctions);

fs.writeFileSync(file, code);
