const fs = require('fs');
const file = 'src/lib/dbAdapter.ts';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/operations: { type: 'delete' \| 'update',/g, "operations: { type: 'delete' | 'update' | 'set',");

code = code.replace(/        if \(existing\) {\n          await localDb\[op\.collection as keyof typeof localDb\]\.setItem\(op\.id, \{ \.\.\.existing, \.\.\.op\.data \}\);\n        }/g,
`        if (existing) {
          await localDb[op.collection as keyof typeof localDb].setItem(op.id, { ...existing, ...op.data });
        }
      } else if (op.type === 'set') {
        await localDb[op.collection as keyof typeof localDb].setItem(op.id, { id: op.id, ...op.data });`);

code = code.replace(/      else if \(op\.type === 'update'\) batch\.update\(ref, op\.data\);/g,
`      else if (op.type === 'update') batch.update(ref, op.data);
      else if (op.type === 'set') batch.set(ref, op.data);`);

fs.writeFileSync(file, code);
