const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const regex = /const filteredReports = useMemo\(\(\) => \{\n    return reportsForExport\.filter\(r => !r\.isArrivedOnly\);\n\n      let matchDate = true;[\s\S]*?return result\.sort\(\(a, b\) => \{\n      if \(a\.date !== b\.date\) return new Date\(b\.date\)\.getTime\(\) - new Date\(a\.date\)\.getTime\(\);\n      return b\.createdAt - a\.createdAt;\n    \}\);\n  \}, \[reports, filterDate, filterSupplier, productFilterQuery, products, bottomStockFilter, showDuplicatesOnly\]\);/g;

code = code.replace(regex, `const filteredReports = useMemo(() => {\n    return reportsForExport.filter(r => !r.isArrivedOnly);\n  }, [reportsForExport]);`);

fs.writeFileSync('src/components/DailyReport.tsx', code);
