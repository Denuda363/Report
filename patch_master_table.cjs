const fs = require('fs');
const file = 'src/components/MasterData.tsx';
let code = fs.readFileSync(file, 'utf-8');

const tableHeaderSearch = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Supplier</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Bottom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;
                    
const tableHeaderReplace = `                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Supplier</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Bottom Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Stok</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-left text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 hidden md:table-cell">Lokasi</th>
                    <th className="sticky top-0 z-10 py-4 px-6 text-xs font-bold text-theme-500 uppercase tracking-wider bg-theme-100 rounded-tr-xl w-20">Actions</th>`;
code = code.replace(tableHeaderSearch, tableHeaderReplace);

const tableRowDisplaySearch = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-600-text font-mono block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden">
                              {p.bottomStock !== undefined && p.bottomStock !== null ? p.bottomStock : '-'}
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
                            
const tableRowDisplayReplace = `                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-600-text font-mono block md:table-cell before:content-['Butom_Stok:'] before:mr-2 before:font-bold md:before:hidden">
                              {p.bottomStock !== undefined && p.bottomStock !== null ? p.bottomStock : '-'}
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Stok:'] before:mr-2 before:font-bold md:before:hidden">
                              {p.stock !== undefined && p.stock !== null ? p.stock : '-'}
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 text-sm text-theme-900 block md:table-cell before:content-['Lokasi:'] before:mr-2 before:font-bold md:before:hidden">
                              {p.location || '-'}
                            </td>
                            <td className="py-2 lg:py-4 px-2 lg:px-6 block md:table-cell mt-2 md:mt-0 border-t md:border-0 border-theme-100 pt-2 md:pt-4">`;
code = code.replace(tableRowDisplaySearch, tableRowDisplayReplace);

fs.writeFileSync(file, code);
