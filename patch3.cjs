const fs = require('fs');
let code = fs.readFileSync('src/components/ChatBox.tsx', 'utf-8');

code = code.replace(
  /await deleteDoc\(doc\(db, 'messages', msgId\)\);/,
  "if (msgId) await deleteDoc(doc(db, 'messages', msgId));"
);
fs.writeFileSync('src/components/ChatBox.tsx', code);
