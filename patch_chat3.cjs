const fs = require('fs');
const file = 'src/components/ChatBox.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/Number\(a\.lastSeen\) \+ Number\(b\.lastSeen\)/g, `(Number(a.lastSeen) || 0) + (Number(b.lastSeen) || 0)`);
code = code.replace(/Number\(u\.lastSeen\) \+ 60000 > Date\.now\(\)/g, `(Number(u.lastSeen) || 0) + 60000 > Date.now()`);

fs.writeFileSync(file, code);
