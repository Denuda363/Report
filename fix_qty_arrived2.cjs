const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const listSearch = `<div className="font-bold text-theme-900 truncate">{item.productName}</div>`;
const listReplace = `<div className="font-bold text-theme-900 truncate">{item.productName} {item.arrivedQty ? \`(\${item.arrivedQty} Qty)\` : ''}</div>`;
code = code.replace(listSearch, listReplace);

fs.writeFileSync(file, code);
