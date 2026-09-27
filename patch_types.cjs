const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/exportData: \(\) => void;\s+importData: \(jsonData: string\) => Promise<void>;/, ""); // remove from types just in case? 
// wait, types.ts needs to have it. AppContext is NOT types.ts
