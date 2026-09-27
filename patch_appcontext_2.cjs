const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/const batch = writeBatch\(db\);\s+ids\.forEach\(id => {[\s\S]*?}\);\s+batch\.delete\(doc\(db, 'reports', id\)\);\s+}\);\s+await batch\.commit\(\);/m, 
`      const ops = ids.map(id => {
        if (!forceDeleteArrived) {
          const report = state.reports.find(r => r.id === id);
          if (report && report.isArrived) {
            return { type: 'update', collection: 'reports', id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
          }
        }
        return { type: 'delete', collection: 'reports', id };
      }) as any[];
      await executeBatch(ops);`);

fs.writeFileSync(file, code);
