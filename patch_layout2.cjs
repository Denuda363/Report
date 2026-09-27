const fs = require('fs');
const file = 'src/components/Layout.tsx';
let code = fs.readFileSync(file, 'utf-8');

const search = `<button 
              onClick={() => {
                if (window.confirm("Are you sure you want to reset ALL data? This will permanently delete your products, suppliers, and reports.")) {
                  resetAllData();
                }
              }}
              className="group flex items-center gap-2 px-3 py-1.5 text-xs md:text-sm text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all duration-300 active:scale-95"
              title="Reset All Data"
            >
              <span className="hidden sm:inline font-medium">Reset Data</span>
              <Trash2 className="w-4 h-4 group-hover:rotate-12 group-hover:scale-110 transition-transform duration-300" />
            </button>`;

code = code.replace(search, '');

fs.writeFileSync(file, code);
