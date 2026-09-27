const fs = require('fs');
let code = fs.readFileSync('src/components/KosongPabrikRecap.tsx', 'utf8');

const oldHandleSelect = `  const handleSelectProduct = async (product: any) => {
    await updateProduct(product.id, { 
      ...product,
      isKosongPabrik: true,
      kosongPabrikDate: Date.now()
    });
    setSearchQuery('');
    setIsDropdownOpen(false);
  };`;

const newHandleSelect = `  const { reports, updateReport } = useAppContext();

  const handleSelectProduct = async (product: any) => {
    await updateProduct(product.id, { 
      ...product,
      isKosongPabrik: true,
      kosongPabrikDate: Date.now()
    });

    // Automatically check existing reports for today
    const today = format(new Date(), 'yyyy-MM-dd');
    const existingReportsToday = reports.filter(r => r.date === today && r.productId === product.id);
    for (const r of existingReportsToday) {
      if (!r.isKosongPabrik) {
        await updateReport({ ...r, isKosongPabrik: true });
      }
    }

    setSearchQuery('');
    setIsDropdownOpen(false);
  };`;

code = code.replace(oldHandleSelect, newHandleSelect);
fs.writeFileSync('src/components/KosongPabrikRecap.tsx', code);
