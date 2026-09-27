const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Ensure that "Input Barang Datang" is visible even when collapsed
const titleSearch = `<h3 className="font-bold text-theme-900 whitespace-nowrap lg:block">Input Barang Datang</h3>`;
const titleReplace = `<h3 className={\`font-bold text-theme-900 whitespace-nowrap \${isFormCollapsed && !isFormFullscreen ? 'hidden lg:block' : ''}\`}>Input Barang Datang</h3>`;
code = code.replace(titleSearch, titleReplace);

fs.writeFileSync(file, code);
