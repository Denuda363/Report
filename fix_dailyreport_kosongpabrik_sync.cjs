const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const regex = /onChange=\{\(e\) => updateReport\(\{ \.\.\.r, isKosongPabrik: e\.target\.checked \}\)\}/;

const syncHandler = `const handleKosongPabrikChange = async (r: typeof reports[0], checked: boolean) => {
    await updateReport({ ...r, isKosongPabrik: checked });
    const product = products.find(p => p.id === r.productId);
    if (product) {
      await updateProduct({
        ...product,
        isKosongPabrik: checked,
        kosongPabrikDate: checked ? Date.now() : undefined
      });
    }
  };`;

// Insert the handler near handleExportPdf
code = code.replace(
  'const handleExportPdf = () => {', 
  `${syncHandler}\n\n  const handleExportPdf = () => {`
);

code = code.replace(regex, `onChange={(e) => handleKosongPabrikChange(r, e.target.checked)}`);

fs.writeFileSync('src/components/DailyReport.tsx', code);
