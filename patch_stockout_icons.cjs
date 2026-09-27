const fs = require('fs');
const file = 'src/components/StockOut.tsx';
let code = fs.readFileSync(file, 'utf-8');

const search = `className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity"`;
const replace = `className="absolute top-3 right-3 flex gap-1 transition-opacity"`;

code = code.replace(search, replace);

fs.writeFileSync(file, code);
