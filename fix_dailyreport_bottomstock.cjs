const fs = require('fs');
let code = fs.readFileSync('src/components/DailyReport.tsx', 'utf8');

const oldLogic = `      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = r.isBottomStock === true;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = !r.isBottomStock;
      }`;

const newLogic = `      let matchBottomStock = true;
      if (bottomStockFilter === 'has') {
        matchBottomStock = product?.bottomStock !== undefined && product?.bottomStock !== null && product.bottomStock > 0;
      } else if (bottomStockFilter === 'none') {
        matchBottomStock = product?.bottomStock === undefined || product?.bottomStock === null || product.bottomStock === 0;
      }`;

if (code.includes(oldLogic)) {
  code = code.replace(oldLogic, newLogic);
  fs.writeFileSync('src/components/DailyReport.tsx', code);
  console.log('Success');
} else {
  console.log('Target not found');
}
