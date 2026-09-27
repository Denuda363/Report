const fs = require('fs');
let code = fs.readFileSync('src/store/AppContext.tsx', 'utf-8');

code = code.replace(
  /const updateSupplier = async \(id: string, data: Partial<Supplier>\) => \{\n\s*if \(\!userId\) return;/g,
  "const updateSupplier = async (id: string, data: Partial<Supplier>) => {\n    if (!userId) return;\n    if (!id) return;"
);
code = code.replace(
  /const updateProduct = async \(product: Product\) => \{\n\s*if \(\!userId\) return;\n\s*const \{ id, \.\.\.data \} = product;/g,
  "const updateProduct = async (product: Product) => {\n    if (!userId) return;\n    const { id, ...data } = product;\n    if (!id) return;"
);
code = code.replace(
  /const updateReport = async \(report: ReportEntry\) => \{\n\s*if \(\!userId\) return;\n\s*const \{ id, \.\.\.cleanData \} = report;/g,
  "const updateReport = async (report: ReportEntry) => {\n    if (!userId) return;\n    const { id, ...cleanData } = report;\n    if (!id) return;"
);
fs.writeFileSync('src/store/AppContext.tsx', code);
