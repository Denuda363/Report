const fs = require('fs');
const file = 'src/store/AppContext.tsx';
let code = fs.readFileSync(file, 'utf-8');

const interfaceSearch = `  importMasterData: (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number }[]
  ) => Promise<string[]>;`;
const interfaceReplace = `  importMasterData: (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string }[]
  ) => Promise<string[]>;`;
code = code.replace(interfaceSearch, interfaceReplace);

const fnSearch = `  const importMasterData = async (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number }[]
  ): Promise<string[]> => {`;
const fnReplace = `  const importMasterData = async (
    newSuppliers: { name: string }[],
    newProducts: { name: string; unit: string; supplierName: string; bottomStock?: number; stock?: number; location?: string }[]
  ): Promise<string[]> => {`;
code = code.replace(fnSearch, fnReplace);

const docSearch = `              await addDoc(collection(db, 'products'), { 
                name: np.name, 
                unit: np.unit, 
                supplierId: sid,
                bottomStock: np.bottomStock,
                userId
              });`;
const docReplace = `              await addDoc(collection(db, 'products'), { 
                name: np.name, 
                unit: np.unit, 
                supplierId: sid,
                bottomStock: np.bottomStock,
                stock: np.stock,
                location: np.location,
                userId
              });`;
code = code.replace(docSearch, docReplace);

const updateSearch = `            // Optional: Update existing if needed, but for now we skip or maybe just ignore.
            // If you wanted to update bottomStock for existing product on import:
            /*
            if (np.bottomStock !== undefined) {
              const pId = productMap.get(key);
              await updateDoc(doc(db, 'products', pId!), { bottomStock: np.bottomStock });
            }
            */`;
const updateReplace = `            // Optional: Update existing if needed, but for now we skip or maybe just ignore.
            if (np.bottomStock !== undefined || np.stock !== undefined || np.location !== undefined) {
              const pId = productMap.get(key);
              const updates: any = {};
              if (np.bottomStock !== undefined) updates.bottomStock = np.bottomStock;
              if (np.stock !== undefined) updates.stock = np.stock;
              if (np.location !== undefined) updates.location = np.location;
              
              if (Object.keys(updates).length > 0) {
                await updateDoc(doc(db, 'products', pId!), updates);
              }
            }`;
code = code.replace(updateSearch, updateReplace);

fs.writeFileSync(file, code);
