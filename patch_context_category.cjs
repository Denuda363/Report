const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const interfaceSearch = `newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string }[]`;
const interfaceReplace = `newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string; category?: string }[]`;
code = code.split(interfaceSearch).join(interfaceReplace);

const docSearch = `                stock: np.stock,
                location: np.location,
                userId`;
const docReplace = `                stock: np.stock,
                location: np.location,
                category: np.category,
                userId`;
code = code.replace(docSearch, docReplace);

const updateSearch = `if (np.bottomStock !== undefined || np.stock !== undefined || np.location !== undefined) {
              const pId = productMap.get(key);
              const updates: any = {};
              if (np.bottomStock !== undefined) updates.bottomStock = np.bottomStock;
              if (np.stock !== undefined) updates.stock = np.stock;
              if (np.location !== undefined) updates.location = np.location;`;
const updateReplace = `if (np.bottomStock !== undefined || np.stock !== undefined || np.location !== undefined || np.category !== undefined) {
              const pId = productMap.get(key);
              const updates: any = {};
              if (np.bottomStock !== undefined) updates.bottomStock = np.bottomStock;
              if (np.stock !== undefined) updates.stock = np.stock;
              if (np.location !== undefined) updates.location = np.location;
              if (np.category !== undefined) updates.category = np.category;`;
code = code.replace(updateSearch, updateReplace);

fs.writeFileSync(file, code);
