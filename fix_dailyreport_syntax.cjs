const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const regex = /const filteredReports = useMemo\(\(\) => \{\n    return reportsForExport\.filter\(r => !r\.isArrivedOnly\);[\s\S]*?return counts\[key\] > 1;\n      \}\);\n    \}\n\n    return result\.sort\(\(a, b\) => \{\n      if \(a\.date !== b\.date\) return new Date\(b\.date\)\.getTime\(\) - new Date\(a\.date\)\.getTime\(\);\n      return b\.createdAt - a\.createdAt;\n    \}\);\n  \}, \[reports, filterDate, filterSupplier, productFilterQuery, products, bottomStockFilter, showDuplicatesOnly\]\);/g;

// Wait, the end of the block in the actual code:
