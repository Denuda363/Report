const fs = require('fs');
const file = 'src/components/SettingsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `import { Database, WifiOff } from 'lucide-react';`;
const importReplace = `import { Database, WifiOff, Download, Upload } from 'lucide-react';
import React, { useRef } from 'react';`;
code = code.replace(importSearch, importReplace);

// add file input and functions 
const hookSearch = `export const SettingsView = () => {
  const { settings, updateSettings, resetAllData } = useAppContext();`;
const hookReplace = `export const SettingsView = () => {
  const { settings, updateSettings, resetAllData, exportData, importData } = useAppContext();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (window.confirm("Peringatan: Merestore data akan menimpa/mengganti data Anda saat ini yang memiliki ID yang sama, atau menambahkannya jika belum ada. Lanjutkan?")) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        await importData(text);
        if (fileInputRef.current) fileInputRef.current.value = '';
      };
      reader.readAsText(file);
    } else {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };`;
code = code.replace(hookSearch, hookReplace);

// add the backup & restore ui component
const toggleSearch2 = `          {/* Theme Settings */}`;
const toggleReplace2 = `          {/* Backup & Restore Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm">
                <Download className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-900">Backup & Restore Data</h3>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Cadangkan seluruh data aplikasi Anda menjadi file JSON, atau pulihkan dari file cadangan sebelumnya.
                </p>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <button 
                onClick={() => exportData()}
                className="w-full sm:w-auto px-6 py-3 bg-theme-600 hover:bg-theme-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4" />
                Download Backup
              </button>
              
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-theme-50 text-theme-700 border border-theme-200 font-bold rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Upload className="w-4 h-4" />
                Restore Data
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".json" 
                className="hidden" 
              />
            </div>
          </div>

          {/* Theme Settings */}`;
code = code.replace(toggleSearch2, toggleReplace2);

fs.writeFileSync(file, code);
