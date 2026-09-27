const fs = require('fs');
const file = 'src/components/DailyReport.tsx';
let code = fs.readFileSync(file, 'utf-8');

// Replace lg: with md: for table display classes
code = code.replace(/block lg:table/g, 'block md:table');
code = code.replace(/hidden lg:table-header-group/g, 'hidden md:table-header-group');
code = code.replace(/block lg:table-row-group/g, 'block md:table-row-group');
code = code.replace(/block lg:table-row/g, 'block md:table-row');
code = code.replace(/block lg:table-cell/g, 'block md:table-cell');
code = code.replace(/lg:border-0/g, 'md:border-0');
code = code.replace(/lg:border-b/g, 'md:border-b');
code = code.replace(/lg:mb-0/g, 'md:mb-0');
code = code.replace(/lg:rounded-none/g, 'md:rounded-none');

code = code.replace(/lg:text-right/g, 'md:text-right');
code = code.replace(/lg:text-center/g, 'md:text-center');

code = code.replace(/lg:before:hidden/g, 'md:before:hidden');
code = code.replace(/inline-flex lg:flex/g, 'inline-flex md:flex');
code = code.replace(/justify-start lg:justify-center/g, 'justify-start md:justify-center');
code = code.replace(/flex-1 lg:flex-none/g, 'flex-1 md:flex-none');
code = code.replace(/lg:bg-transparent/g, 'md:bg-transparent');
code = code.replace(/lg:border-transparent/g, 'md:border-transparent');
code = code.replace(/lg:hidden/g, 'md:hidden');

fs.writeFileSync(file, code);
