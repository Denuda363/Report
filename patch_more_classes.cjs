const fs = require('fs');

function replaceInFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  code = code.replace(/focus:ring-\[var\(--color-theme-500\)\]/g, 'focus:ring-theme-500');
  code = code.replace(/focus-within:ring-\[var\(--color-theme-500\)\]/g, 'focus-within:ring-theme-500');
  code = code.replace(/ring-\[var\(--color-theme-500\)\]/g, 'ring-theme-500');
  code = code.replace(/divide-\[var\(--color-theme-200\)\]/g, 'divide-theme-200');
  code = code.replace(/shadow-\[var\(--color-theme-500\)\]\/20/g, 'shadow-theme-500/20');
  
  fs.writeFileSync(file, code);
}

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const path = dir + '/' + file;
    if (fs.statSync(path).isDirectory()) {
      processDir(path);
    } else if (path.endsWith('.tsx') || path.endsWith('.ts')) {
      replaceInFile(path);
    }
  }
}

processDir('src');
