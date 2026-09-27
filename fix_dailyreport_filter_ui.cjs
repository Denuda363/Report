const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const targetStr = `              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            {(filterDate`;

const injectStr = `              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
            
            <div className="relative w-full sm:w-48">
              <select 
                value={arrivedFilter}
                onChange={(e) => setArrivedFilter(e.target.value as 'all' | 'arrived' | 'not_arrived')}
                className="appearance-none bg-white border border-neutral-200 rounded-lg pl-3 pr-8 py-1.5 focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-all text-sm outline-none text-neutral-700 w-full"
              >
                <option value="all">Semua Status Datang</option>
                <option value="arrived">Sudah Datang</option>
                <option value="not_arrived">Belum Datang</option>
              </select>
              <ChevronDown className="w-4 h-4 text-neutral-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {(filterDate`;

if (code.includes(targetStr)) {
  code = code.replace(targetStr, injectStr);
  fs.writeFileSync('src/components/DailyReport.tsx', code);
  console.log('Success');
} else {
  console.log('Target not found');
}
