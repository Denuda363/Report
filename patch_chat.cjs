const fs = require('fs');
const file = 'src/components/ChatBox.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/a\.lastSeen \+ b\.lastSeen/g, `Number(a.lastSeen) + Number(b.lastSeen)`);
code = code.replace(/u\.lastSeen \+ 60000 > Date\.now\(\)/g, `Number(u.lastSeen) + 60000 > Date.now()`);

fs.writeFileSync(file, code);
