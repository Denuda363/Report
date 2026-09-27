const fs = require('fs');

function replaceInFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Replace arbitrary tailwind classes using css variables with clean class names
  code = code.replace(/bg-\[var\(--color-theme-(\w+)\)\]/g, 'bg-theme-$1');
  code = code.replace(/text-\[var\(--color-theme-(\w+(?:-text)?)\)\]/g, 'text-theme-$1');
  code = code.replace(/border-\[var\(--color-theme-(\w+)\)\]/g, 'border-theme-$1');
  
  // Replace standalone color variables if they ended up somewhere else (e.g. SVG stops)
  
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
