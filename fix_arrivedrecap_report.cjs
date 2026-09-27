const fs = require('fs');
let code = fs.readFileSync('src/components/ArrivedRecap.tsx', 'utf8');

const regex1 = /await updateReport\(\{\n            \.\.\.existingReport,\n            isArrived: true,\n            arrivedAt: Date\.now\(\),\n            arrivedSupplierId: arrivedSupplierId \|\| existingReport\.arrivedSupplierId,\n            notes: existingReport\.notes \? \`\$\{existingReport\.notes\} \| \$\{arrivalNote\}\` : arrivalNote\n          \}\);/;

code = code.replace(regex1, `await updateReport({\n            ...existingReport,\n            isArrived: true,\n            arrivedAt: Date.now(),\n            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,\n            notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote,\n            isKosongPabrik: false // Uncheck kosong pabrik\n          });`);

const regex2 = /await updateReport\(\{\n            \.\.\.existingReport,\n            arrivedAt: Date\.now\(\),\n            arrivedSupplierId: arrivedSupplierId \|\| existingReport\.arrivedSupplierId,\n            notes: item\.notes \|\| existingReport\.notes\n          \}\);/;

code = code.replace(regex2, `await updateReport({\n            ...existingReport,\n            arrivedAt: Date.now(),\n            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,\n            notes: item.notes || existingReport.notes,\n            isKosongPabrik: false // Uncheck kosong pabrik\n          });`);


fs.writeFileSync('src/components/ArrivedRecap.tsx', code);
