const fs = require('fs');
let code = fs.readFileSync('src/components/ArrivedRecap.tsx', 'utf8');

const oldLogic = `      if (arrivedSupplierId && item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          if (!product.supplierId) {
            await updateProduct({
              ...product,
              supplierId: arrivedSupplierId
            });
          } else if (product.supplierId !== arrivedSupplierId) {
            if (!product.alternativeSupplierIds?.includes(arrivedSupplierId)) {
               await updateProduct({
                 ...product,
                 alternativeSupplierIds: [...(product.alternativeSupplierIds || []), arrivedSupplierId]
               });
            }
          }
        }
      }`;

const newLogic = `      if (item.productId) {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          let needsUpdate = false;
          let updatedProduct = { ...product };

          if (arrivedSupplierId) {
            if (!product.supplierId) {
              updatedProduct.supplierId = arrivedSupplierId;
              needsUpdate = true;
            } else if (product.supplierId !== arrivedSupplierId) {
              if (!product.alternativeSupplierIds?.includes(arrivedSupplierId)) {
                updatedProduct.alternativeSupplierIds = [...(product.alternativeSupplierIds || []), arrivedSupplierId];
                needsUpdate = true;
              }
            }
          }

          if (product.isKosongPabrik) {
            updatedProduct.isKosongPabrik = false;
            updatedProduct.kosongPabrikDate = undefined;
            needsUpdate = true;
          }

          if (needsUpdate) {
            await updateProduct(updatedProduct);
          }
        }
      }`;

code = code.replace(oldLogic, newLogic);
fs.writeFileSync('src/components/ArrivedRecap.tsx', code);
