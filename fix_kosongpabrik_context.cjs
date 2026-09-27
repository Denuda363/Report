const fs = require('fs');
let code = fs.readFileSync('src/components/KosongPabrikRecap.tsx', 'utf8');

code = code.replace(
  'const { products, suppliers, updateProduct } = useAppContext();',
  'const { products, suppliers, updateProduct, reports, updateReport } = useAppContext();'
);
// Also remove the redeclaration of { reports, updateReport } inside handleSelectProduct if I did that.
code = code.replace(
  'const { reports, updateReport } = useAppContext();\n\n  const handleSelectProduct',
  'const handleSelectProduct'
);

fs.writeFileSync('src/components/KosongPabrikRecap.tsx', code);
