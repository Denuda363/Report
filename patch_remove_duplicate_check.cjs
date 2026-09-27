const fs = require('fs');
const file = 'src/components/DailyReport.tsx';
let code = fs.readFileSync(file, 'utf-8');

// 1. Remove duplicate check from handleAddToList
const addToListSearch = `    // Check if duplicate in pending list
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
    }`;

code = code.replace(addToListSearch, '');

// 2. Add processedProductIds to handleSaveAll
const handleSaveSearch = `const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;
    setIsSavingAll(true);
    
    const saved = [];
    const failed = [];
    
    for (const item of pendingItems) {`;

const handleSaveReplace = `const handleSaveAll = async () => {
    if (pendingItems.length === 0) return;
    setIsSavingAll(true);
    
    const saved = [];
    const failed = [];
    const processedProductIds = new Set();
    
    for (const item of pendingItems) {`;

code = code.replace(handleSaveSearch, handleSaveReplace);

const duplicateCheckSearch = `const duplicateReport = reports.find(
          r => r.date === date && r.productId === finalProductId
        );
        
        if (duplicateReport) {
          failed.push({ item, reason: "Data ganda (sudah ada di database saat disimpan)." });
          continue;
        }`;

const duplicateCheckReplace = `
        if (processedProductIds.has(finalProductId)) {
          failed.push({ item, reason: "Data ganda (duplikat di dalam list input)." });
          continue;
        }

        const duplicateReport = reports.find(
          r => r.date === date && r.productId === finalProductId
        );
        
        if (duplicateReport) {
          failed.push({ item, reason: "Data ganda (sudah ada di laporan sebelumnya)." });
          continue;
        }
        processedProductIds.add(finalProductId);`;

code = code.replace(duplicateCheckSearch, duplicateCheckReplace);

fs.writeFileSync(file, code);
