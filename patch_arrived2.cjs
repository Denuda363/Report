const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

const regex = /<p className="text-xs text-rose-500 mt-2">Mohon tambah produk di Master Data terlebih dahulu\.<\/p>\s*\)\}\s*<\/div>\s*<\/div>/;

code = code.replace(regex, 
`<p className="text-xs text-rose-500 mt-2">Mohon tambah produk di Master Data terlebih dahulu.</p>
          )}
        </div>
        )}
      </div>`);

fs.writeFileSync(file, code);
