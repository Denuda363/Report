const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const filteredReportsOld = `  // Filter reports
  const filteredReports = useMemo(() => {
    let result = reports.filter(r => {
      if (r.isArrivedOnly) return false;`;

const filteredReportsNew = `  // Filter reports including arrived only (for export)
  const reportsForExport = useMemo(() => {
    let result = reports.filter(r => {
      let matchDate = true;
      let matchSupplier = true;
      let matchProduct = true;
      let matchArrived = true;

      if (filterDate) {
        matchDate = r.date === filterDate;
      }
      
      const product = products.find(p => p.id === r.productId);

      if (filterSupplier) {
        matchSupplier = product?.supplierId === filterSupplier || (product?.alternativeSupplierIds || []).includes(filterSupplier);
      }
      
      if (productFilterQuery) {
        matchProduct = !!product && product.name.toLowerCase().includes(productFilterQuery.toLowerCase());
      }

      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = r.isBottomStock === true;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = !r.isBottomStock;
      }
      
      if (arrivedFilter === 'arrived') {
        matchArrived = !!r.isArrived;
      } else if (arrivedFilter === 'not_arrived') {
        matchArrived = !r.isArrived;
      }

      return matchDate && matchSupplier && matchProduct && matchBottomStock && matchArrived;
    });

    if (showDuplicatesOnly) {
      const counts: Record<string, number> = {};
      result.forEach(r => {
        const key = \`\${r.date}_\${r.productId}\`;
        counts[key] = (counts[key] || 0) + 1;
      });
      result = result.filter(r => {
        const key = \`\${r.date}_\${r.productId}\`;
        return counts[key] > 1;
      });
    }

    return result.sort((a, b) => {
      if (a.date !== b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.createdAt - a.createdAt;
    });
  }, [reports, filterDate, filterSupplier, productFilterQuery, products, bottomStockFilter, arrivedFilter, showDuplicatesOnly]);

  // Filter reports for display
  const filteredReports = useMemo(() => {
    return reportsForExport.filter(r => !r.isArrivedOnly);`;

code = code.replace(filteredReportsOld, filteredReportsNew);

// Replace the old filteredReports logic up to 'return result.sort('
const oldFilteredEnd = `  // Filter reports for display
  const filteredReports = useMemo(() => {
    return reportsForExport.filter(r => !r.isArrivedOnly);
      let matchDate = true;
      let matchSupplier = true;
      let matchProduct = true;
      let matchArrived = true;

      if (filterDate) {
        matchDate = r.date === filterDate;
      }
      
      const product = products.find(p => p.id === r.productId);

      if (filterSupplier) {
        matchSupplier = product?.supplierId === filterSupplier || (product?.alternativeSupplierIds || []).includes(filterSupplier);
      }
      
      if (productFilterQuery) {
        matchProduct = !!product && product.name.toLowerCase().includes(productFilterQuery.toLowerCase());
      }

      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = r.isBottomStock === true;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = !r.isBottomStock;
      }
      
      if (arrivedFilter === 'arrived') {
        matchArrived = !!r.isArrived;
      } else if (arrivedFilter === 'not_arrived') {
        matchArrived = !r.isArrived;
      }

      return matchDate && matchSupplier && matchProduct && matchBottomStock && matchArrived;
    });

    if (showDuplicatesOnly) {
      const counts: Record<string, number> = {};
      result.forEach(r => {
        const key = \`\${r.date}_\${r.productId}\`;
        counts[key] = (counts[key] || 0) + 1;
      });
      result = result.filter(r => {
        const key = \`\${r.date}_\${r.productId}\`;
        return counts[key] > 1;
      });
    }

    return result.sort((a, b) => {
      if (a.date !== b.date) return new Date(b.date).getTime() - new Date(a.date).getTime();
      return b.createdAt - a.createdAt;
    });`;

const replacedPart = `  // Filter reports for display
  const filteredReports = useMemo(() => {
    return reportsForExport.filter(r => !r.isArrivedOnly);`;

code = code.replace(oldFilteredEnd, replacedPart);

const exportPdfOld = `  const handleExportPdf = () => {
    exportReportsToPdf(filteredReports, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
const exportPdfNew = `  const handleExportPdf = () => {
    exportReportsToPdf(reportsForExport, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
code = code.replace(exportPdfOld, exportPdfNew);

const exportTxtOld = `  const handleExportTxt = () => {
    exportReportsToTxt(filteredReports, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
const exportTxtNew = `  const handleExportTxt = () => {
    exportReportsToTxt(reportsForExport, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
code = code.replace(exportTxtOld, exportTxtNew);

const exportExcelOld = `  const handleExportExcel = () => {
    exportReportsToExcel(filteredReports, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
const exportExcelNew = `  const handleExportExcel = () => {
    exportReportsToExcel(reportsForExport, products, suppliers, \`Report_\${format(new Date(), 'yyyyMMdd')}\`);
  };`;
code = code.replace(exportExcelOld, exportExcelNew);


fs.writeFileSync('src/components/DailyReport.tsx', code);
