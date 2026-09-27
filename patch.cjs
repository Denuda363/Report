const fs = require('fs');
let code = fs.readFileSync('src/store/AppContext.tsx', 'utf-8');

code = code.replace(
  /const updateSupplier = async \(id: string, data: Partial<Supplier>\) => \{/,
  "const updateSupplier = async (id: string, data: Partial<Supplier>) => {\n    if (!id) return;"
);
code = code.replace(
  /const deleteSupplier = async \(id: string\) => \{/,
  "const deleteSupplier = async (id: string) => {\n    if (!id) return;"
);
code = code.replace(
  /const updateProduct = async \(product: Product\) => \{\n\s*const \{ id, \.\.\.cleanData \} = product;/,
  "const updateProduct = async (product: Product) => {\n    const { id, ...cleanData } = product;\n    if (!id) return;"
);
code = code.replace(
  /const deleteProduct = async \(id: string\) => \{/,
  "const deleteProduct = async (id: string) => {\n    if (!id) return;"
);
code = code.replace(
  /const updateReport = async \(report: ReportEntry\) => \{\n\s*const \{ id, \.\.\.cleanData \} = report;/,
  "const updateReport = async (report: ReportEntry) => {\n    const { id, ...cleanData } = report;\n    if (!id) return;"
);
code = code.replace(
  /const deleteReport = async \(id: string\) => \{/,
  "const deleteReport = async (id: string) => {\n    if (!id) return;"
);
fs.writeFileSync('src/store/AppContext.tsx', code);
