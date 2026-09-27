const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

const theadSearch = `<th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Butom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;

const theadReplace = `<th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Butom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Kategori</th>
                    <th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Lokasi</th>
                    <th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;

code = code.replace(theadSearch, theadReplace);

// Also change the padding of existing headers to px-3 to save space
code = code.replace(/<th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">Name<\/th>/g, 
                    `<th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tl-xl">Name</th>`);
code = code.replace(/<th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Unit<\/th>/g, 
                    `<th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Unit</th>`);
code = code.replace(/<th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Supplier<\/th>/g, 
                    `<th className="sticky top-0 z-10 py-4 px-3 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100">Supplier</th>`);

// Change `px-6` to `px-3` in the table cells for products to save space
// We can use a regex replacement but it might hit supplier table too. It's fine, px-3 is better for dense tables.
code = code.replace(/lg:px-6/g, 'lg:px-3');

// Also, let's make the form container a bit smaller or table container horizontally scrollable.
// Currently it's w-full lg:w-1/3 and flex-1. Let's make form lg:w-1/4.
code = code.replace(/className="w-full lg:w-1\/3 shrink-0"/g, 'className="w-full lg:w-1/4 shrink-0"');

// Ensure the table container handles horizontal overflow gracefully. 
// "flex-1 overflow-auto bg-white rounded-2xl border border-theme-200 shadow-sm min-h-0"
// "overflow-auto max-h-[calc(100vh-320px)] min-h-[300px]"
// It already has overflow-auto, which handles overflow-x too. 

fs.writeFileSync(file, code);
