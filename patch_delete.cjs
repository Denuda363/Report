const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Update interface
code = code.replace(
  /deleteReport: \(id: string\) => Promise<void>;\n\s*deleteMultipleReports: \(ids: string\[\]\) => Promise<void>;\n\s*deleteReportsByDateRange: \(startDate: string, endDate: string\) => Promise<void>;/,
  `deleteReport: (id: string, forceDeleteArrived?: boolean) => Promise<void>;
  deleteMultipleReports: (ids: string[], forceDeleteArrived?: boolean) => Promise<void>;
  deleteReportsByDateRange: (startDate: string, endDate: string) => Promise<void>;`
);

// Update auto-delete logic
code = code.replace(
  /reportsToDelete\.forEach\(r => \{\n\s*batch\.delete\(doc\(db, 'reports', r\.id\)\);\n\s*\}\);/,
  `reportsToDelete.forEach(r => {
        if (r.isArrived) {
          batch.update(doc(db, 'reports', r.id), {
            quantity: 0,
            isKosongPabrik: false,
            isArrivedOnly: true
          });
        } else {
          batch.delete(doc(db, 'reports', r.id));
        }
      });`
);

// Update deleteReport
code = code.replace(
  /const deleteReport = async \(id: string\) => \{\n\s*if \(\!id\) return;\n\s*if \(\!userId\) return;\n\s*await deleteDoc\(doc\(db, 'reports', id\)\);\n\s*\};/,
  `const deleteReport = async (id: string, forceDeleteArrived = false) => {
    if (!id) return;
    if (!userId) return;
    
    if (!forceDeleteArrived) {
      const report = state.reports.find(r => r.id === id);
      if (report && report.isArrived) {
        await updateDoc(doc(db, 'reports', id), {
          quantity: 0,
          isKosongPabrik: false,
          isArrivedOnly: true
        });
        return;
      }
    }
    
    await deleteDoc(doc(db, 'reports', id));
  };`
);

// Update deleteMultipleReports
code = code.replace(
  /const deleteMultipleReports = async \(ids: string\[\]\) => \{\n\s*if \(\!userId \|\| ids\.length === 0\) return;\n\s*try \{\n\s*const batch = writeBatch\(db\);\n\s*ids\.forEach\(id => \{\n\s*batch\.delete\(doc\(db, 'reports', id\)\);\n\s*\}\);\n\s*await batch\.commit\(\);\n\s*\} catch \(error\) \{\n\s*console\.error\('Error deleting multiple reports:', error\);\n\s*throw error;\n\s*\}\n\s*\};/,
  `const deleteMultipleReports = async (ids: string[], forceDeleteArrived = false) => {
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
  };`
);

// Update deleteReportsByDateRange
code = code.replace(
  /const deleteReportsByDateRange = async \(startDate: string, endDate: string\) => \{\n\s*if \(\!userId\) return;\n\s*try \{\n\s*const reportsToDelete = state\.reports\.filter\(r => r\.date >= startDate && r\.date <= endDate\);\n\s*const batch = writeBatch\(db\);\n\s*reportsToDelete\.forEach\(r => \{\n\s*batch\.delete\(doc\(db, 'reports', r\.id\)\);\n\s*\}\);\n\s*await batch\.commit\(\);\n\s*\} catch \(error\) \{\n\s*console\.error\("Error deleting reports by date range:", error\);\n\s*\}\n\s*\};/,
  `const deleteReportsByDateRange = async (startDate: string, endDate: string) => {
    if (!userId) return;
    try {
      const reportsToDelete = state.reports.filter(r => r.date >= startDate && r.date <= endDate);
      const batch = writeBatch(db);
      reportsToDelete.forEach(r => {
        if (r.isArrived) {
          batch.update(doc(db, 'reports', r.id), {
            quantity: 0,
            isKosongPabrik: false,
            isArrivedOnly: true
          });
        } else {
          batch.delete(doc(db, 'reports', r.id));
        }
      });
      await batch.commit();
    } catch (error) {
      console.error("Error deleting reports by date range:", error);
    }
  };`
);

fs.writeFileSync(file, code);
