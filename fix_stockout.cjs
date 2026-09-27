const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(
  "\\${isProductDropdownOpen ? 'rotate-180' : ''}",
  "${isProductDropdownOpen ? 'rotate-180' : ''}"
);

code = code.replace(
  "\\`(\\${item.notes})\\`",
  "\`(\${item.notes})\`"
);

fs.writeFileSync(file, code);
