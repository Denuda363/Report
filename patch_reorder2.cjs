const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Update the updateReport block in handleSaveAllArrived
code = code.replace(
  /await updateReport\(\{\n\s*\.\.\.existingReport,\n\s*isArrived: true,\n\s*arrivedAt: Date\.now\(\),\n\s*arrivedSupplierId: arrivedSupplierId \|\| existingReport\.arrivedSupplierId,\n\s*notes: existingReport\.notes \? \`\$\{existingReport\.notes\} \| \$\{arrivalNote\}\` : arrivalNote,\n\s*isKosongPabrik: false \/\/ Uncheck kosong pabrik\n\s*\}\);/,
  `await updateReport({
            ...existingReport,
            isArrived: true,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: existingReport.notes ? \`\${existingReport.notes} | \${arrivalNote}\` : arrivalNote,
            isKosongPabrik: false, // Uncheck kosong pabrik
            ...(item.isReorder ? {
              isReorder: true,
              reorderQty: item.reorderQty,
              reorderReason: item.reorderReason
            } : {})
          });`
);

code = code.replace(
  /await updateReport\(\{\n\s*\.\.\.existingReport,\n\s*arrivedAt: Date\.now\(\),\n\s*arrivedSupplierId: arrivedSupplierId \|\| existingReport\.arrivedSupplierId,\n\s*notes: item\.notes \? \(existingReport\.notes \? \`\$\{existingReport\.notes\} \| \$\{item\.notes\}\` : item\.notes\) : existingReport\.notes\n\s*\}\);/,
  `await updateReport({
            ...existingReport,
            arrivedAt: Date.now(),
            arrivedSupplierId: arrivedSupplierId || existingReport.arrivedSupplierId,
            notes: item.notes ? (existingReport.notes ? \`\${existingReport.notes} | \${item.notes}\` : item.notes) : existingReport.notes,
            ...(item.isReorder ? {
              isReorder: true,
              reorderQty: item.reorderQty,
              reorderReason: item.reorderReason
            } : {})
          });`
);

// Update addReport block
code = code.replace(
  /await addReport\(\{\n\s*date,\n\s*productId: item\.productId,\n\s*quantity: 0,\n\s*notes: item\.notes,\n\s*isArrived: true,\n\s*isArrivedOnly: true,\n\s*arrivedAt: Date\.now\(\),\n\s*arrivedSupplierId,\n\s*isBottomStock: false\n\s*\}\);/,
  `await addReport({
          date,
          productId: item.productId,
          quantity: 0,
          notes: item.notes,
          isArrived: true,
          isArrivedOnly: true,
          arrivedAt: Date.now(),
          arrivedSupplierId,
          isBottomStock: false,
          isReorder: item.isReorder || false,
          reorderQty: item.reorderQty || 0,
          reorderReason: item.reorderReason || ''
        });`
);

fs.writeFileSync(file, code);
