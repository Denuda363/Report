const fs = require('fs');
const file = 'src/components/SettingsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const importSearch = `import { AutoDeleteMode, NavbarPosition } from '../types';`;
const importReplace = `import { AutoDeleteMode, NavbarPosition } from '../types';
import { Database, WifiOff } from 'lucide-react';`;
code = code.replace(importSearch, importReplace);

const toggleSearch = `          {/* Theme Settings */}`;
const toggleReplace = `          {/* Database Storage Settings */}
          <div className="bg-white rounded-[2rem] border border-theme-200 shadow-sm overflow-hidden p-6 md:p-8">
            <div className="flex items-start gap-5 mb-8">
              <div className="p-4 bg-theme-50 rounded-2xl border border-theme-100 shadow-sm">
                <Database className="w-7 h-7 text-theme-500" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-theme-900">Database Offline</h3>
                <p className="text-sm text-theme-600-text mt-1.5 font-medium leading-relaxed">
                  Gunakan penyimpanan lokal pada browser ini. Berguna jika terjadi error batas kuota (Quota Exceeded) dari server. Data tidak akan tersinkron antar perangkat.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => {
                  if (!settings.useLocalDb) {
                    if (window.confirm('Aktifkan database offline? Data saat ini tidak akan tersinkron lagi ke cloud untuk perangkat ini. Muat ulang akan dilakukan.')) {
                      updateSettings({ ...settings, useLocalDb: true });
                    }
                  } else {
                    if (window.confirm('Kembali ke database cloud? Muat ulang akan dilakukan.')) {
                      updateSettings({ ...settings, useLocalDb: false });
                    }
                  }
                }}
                className={\`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-500 focus:ring-offset-2 \${settings.useLocalDb ? 'bg-theme-500' : 'bg-neutral-300'}\`}
              >
                <span className={\`inline-block h-5 w-5 transform rounded-full bg-white transition-transform \${settings.useLocalDb ? 'translate-x-8' : 'translate-x-1'}\`} />
              </button>
              <span className="text-sm font-bold text-theme-800">
                {settings.useLocalDb ? 'Mode Offline Aktif' : 'Mode Cloud (Online)'}
              </span>
            </div>
          </div>
          
          {/* Theme Settings */}`;
code = code.replace(toggleSearch, toggleReplace);

fs.writeFileSync(file, code);
