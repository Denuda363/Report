const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

code = code.replace(/<table className="w-full text-left border-collapse block md:table">/g, 
                    '<table className="w-full md:min-w-[900px] text-left border-collapse block md:table">');

fs.writeFileSync(file, code);
