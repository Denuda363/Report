const fs = require('fs');
const file = 'src/components/ArrivedRecap.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Update ArrivedItem interface
code = code.replace(
  /interface ArrivedItem \{\n\s*id: string; \/\/ temp id\n\s*productId: string;\n\s*productName: string;\n\s*notes: string;\n\s*\}/,
  `interface ArrivedItem {
    id: string; // temp id
    productId: string;
    productName: string;
    notes: string;
    isReorder?: boolean;
    reorderQty?: number;
    reorderReason?: string;
  }`
);

// Add currentIsReorder, currentReorderQty, currentReorderReason state variables
code = code.replace(
  /const \[currentNotes, setCurrentNotes\] = useState\(''\);/,
  `const [currentNotes, setCurrentNotes] = useState('');
  const [currentIsReorder, setCurrentIsReorder] = useState(false);
  const [currentReorderQty, setCurrentReorderQty] = useState<number | ''>('');
  const [currentReorderReason, setCurrentReorderReason] = useState('');`
);

// Update handleProductSelect to include these
code = code.replace(
  /const handleProductSelect = \(id: string, name: string\) => \{\n\s*setArrivedItems\(\[\.\.\.arrivedItems, \{\n\s*id: Math\.random\(\)\.toString\(36\)\.substr\(2, 9\),\n\s*productId: id,\n\s*productName: name,\n\s*notes: currentNotes\n\s*\}\]\);\n\s*setCurrentProductId\(''\);\n\s*setCurrentSearchQuery\(''\);\n\s*setCurrentNotes\(''\);\n\s*setIsProductDropdownOpen\(false\);\n\s*\};/,
  `const handleProductSelect = (id: string, name: string) => {
    setArrivedItems([...arrivedItems, {
      id: Math.random().toString(36).substr(2, 9),
      productId: id,
      productName: name,
      notes: currentNotes,
      isReorder: currentIsReorder,
      reorderQty: currentReorderQty ? Number(currentReorderQty) : 0,
      reorderReason: currentReorderReason
    }]);
    
    setCurrentProductId('');
    setCurrentSearchQuery('');
    setCurrentNotes('');
    setCurrentIsReorder(false);
    setCurrentReorderQty('');
    setCurrentReorderReason('');
    setIsProductDropdownOpen(false);
  };`
);

fs.writeFileSync(file, code);
