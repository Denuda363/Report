const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const startIdx = code.indexOf('  const filteredReports = useMemo(() => {');
if (startIdx !== -1) {
  const endIdxStr = '  }, [reports, filterDate, filterSupplier, productFilterQuery, bottomStockFilter, products, showDuplicatesOnly]);';
  const endIdx = code.indexOf(endIdxStr, startIdx);
  if (endIdx !== -1) {
    const toReplace = code.substring(startIdx, endIdx + endIdxStr.length);
    code = code.replace(toReplace, `  const filteredReports = useMemo(() => {\n    return reportsForExport.filter(r => !r.isArrivedOnly);\n  }, [reportsForExport]);`);
    fs.writeFileSync('src/components/DailyReport.tsx', code);
    console.log("Replaced successfully!");
  } else {
    console.log("End marker not found");
  }
} else {
  console.log("Start marker not found");
}
