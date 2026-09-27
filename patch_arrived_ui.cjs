const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Ensure that "Input Barang Datang" is visible even when collapsed
const titleSearch = `{(!isFormCollapsed || isFormFullscreen) && <h3 className="font-bold text-theme-900 whitespace-nowrap">Input Barang Datang</h3>}`;
const titleReplace = `<h3 className="font-bold text-theme-900 whitespace-nowrap lg:block">Input Barang Datang</h3>`;
code = code.replace(titleSearch, titleReplace);

// Also add a chevron down to indicate it's expandable when collapsed
const iconSearch = `<PackageOpen className="w-5 h-5" />
            </div>`;
const iconReplace = `<PackageOpen className="w-5 h-5" />
            </div>
            {isFormCollapsed && !isFormFullscreen && <ChevronDown className="w-4 h-4 text-theme-500 lg:hidden" />}`;
code = code.replace(iconSearch, iconReplace);

fs.writeFileSync(file, code);
