const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const regex = /addReport\(\{\n        date,\n        productId: finalProductId,\n        quantity: qty,\n        notes: combinedNotes \|\| undefined,\n        isWarningStock\n      \}\);/;

code = code.replace(regex, `const p = products.find(prod => prod.id === finalProductId);\n      addReport({\n        date,\n        productId: finalProductId,\n        quantity: qty,\n        notes: combinedNotes || undefined,\n        isWarningStock,\n        isKosongPabrik: p?.isKosongPabrik || false\n      });`);

// also for duplicate report update
const regex2 = /await updateReport\(\{\n          \.\.\.duplicateReport,\n          quantity: qty,\n          notes: combinedNotes \|\| duplicateReport\.notes,\n          isWarningStock\n        \}\);/;
code = code.replace(regex2, `await updateReport({\n          ...duplicateReport,\n          quantity: qty,\n          notes: combinedNotes || duplicateReport.notes,\n          isWarningStock,\n          isKosongPabrik: products.find(prod => prod.id === finalProductId)?.isKosongPabrik || duplicateReport.isKosongPabrik\n        });`);

fs.writeFileSync('src/components/DailyReport.tsx', code);
