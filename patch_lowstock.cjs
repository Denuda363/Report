const fs = require('fs');
const file = 'src/components/LowStockRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/const lowStockData = useMemo\(\(\) => {/g, 
`const lowStockData = useMemo(() => {`);

code = code.replace(/Object\.entries\(lowStockData\)\.forEach\(\(\[supplierId, prods\]\) => {/g, 
`Object.entries(lowStockData as Record<string, any[]>).forEach(([supplierId, prods]) => {`);

code = code.replace(/Object\.entries\(lowStockData\)\.map\(\(\[supplierId, prods\]\) => {/g, 
`Object.entries(lowStockData as Record<string, any[]>).map(([supplierId, prods]) => {`);

fs.writeFileSync(file, code);
