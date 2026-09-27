const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const search = `  const deleteMultipleReports = async (ids: string[], forceDeleteArrived = false) => {
    if (!userId || ids.length === 0) return;
    try {
      const batch = writeBatch(db);
      ids.forEach(id => {
        if (!forceDeleteArrived) {
          const report = state.reports.find(r => r.id === id);
          if (report && report.isArrived) {
            batch.update(doc(db, 'reports', id), {
              quantity: 0,
              isKosongPabrik: false,
              isArrivedOnly: true
            });
            return;
          }
        }
        batch.delete(doc(db, 'reports', id));
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting multiple reports:', error);
      throw error;
    }
  };`;

const replace = `  const deleteMultipleReports = async (ids: string[], forceDeleteArrived = false) => {
    if (!userId || ids.length === 0) return;
    try {
      const ops = ids.map(id => {
        if (!forceDeleteArrived) {
          const report = state.reports.find(r => r.id === id);
          if (report && report.isArrived) {
            return { type: 'update', collection: 'reports', id, data: { quantity: 0, isKosongPabrik: false, isArrivedOnly: true } };
          }
        }
        return { type: 'delete', collection: 'reports', id };
      }) as any[];
      await executeBatch(ops);
    } catch (error) {
      console.error('Error deleting multiple reports:', error);
      throw error;
    }
  };`;

if(code.includes(search)) {
  code = code.replace(search, replace);
  fs.writeFileSync(file, code);
  console.log("Success");
} else {
  console.log("Not found");
}

