const fs = require('fs');
const file = 'src/components/SettingsView.tsx';
let code = fs.readFileSync(file, 'utf-8');

const themeSearch = `            <div 
              onClick={() => handleThemeChange('cyan')}
              className={\`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 \${
                (settings.theme || 'default') === 'cyan' 
                  ? 'border-theme-500 bg-theme-50 shadow-sm' 
                  : 'border-theme-200 hover:border-theme-500 bg-white'
              }\`}
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500 shadow-inner flex items-center justify-center">
                {(settings.theme || 'default') === 'cyan' && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <span className="font-bold text-theme-900 text-sm text-center">Cyan</span>
            </div>
            
          </div>`;

const themeReplace = `            <div 
              onClick={() => handleThemeChange('cyan')}
              className={\`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 \${
                (settings.theme || 'default') === 'cyan' 
                  ? 'border-theme-500 bg-theme-50 shadow-sm' 
                  : 'border-theme-200 hover:border-theme-500 bg-white'
              }\`}
            >
              <div className="w-10 h-10 rounded-full bg-cyan-500 shadow-inner flex items-center justify-center">
                {(settings.theme || 'default') === 'cyan' && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <span className="font-bold text-theme-900 text-sm text-center">Cyan</span>
            </div>

            <div 
              onClick={() => handleThemeChange('colorful')}
              className={\`p-4 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center gap-3 \${
                (settings.theme || 'default') === 'colorful' 
                  ? 'border-theme-500 bg-theme-50 shadow-sm' 
                  : 'border-theme-200 hover:border-theme-500 bg-white'
              }\`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-pink-500 via-fuchsia-500 to-indigo-500 shadow-inner flex items-center justify-center">
                {(settings.theme || 'default') === 'colorful' && <CheckCircle2 className="w-5 h-5 text-white" />}
              </div>
              <span className="font-bold text-theme-900 text-sm text-center">Colorful</span>
            </div>
            
          </div>`;

code = code.replace(themeSearch, themeReplace);

fs.writeFileSync(file, code);
