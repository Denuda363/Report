const fs = require('fs');
const glob = require('glob'); // Note: we can use simple fs recursion if glob is not installed, but let's try a simple recursive function

function replaceInFile(file) {
  let code = fs.readFileSync(file, 'utf-8');
  
  // Backgrounds & Borders
  code = code.replace(/#F9FAF6/g, 'var(--color-theme-50)');
  code = code.replace(/#F1F3E9/g, 'var(--color-theme-100)');
  code = code.replace(/#E2E4D8/g, 'var(--color-theme-200)');
  code = code.replace(/#DCE2CD/g, 'var(--color-theme-300)');
  code = code.replace(/#D9DED0/g, 'var(--color-theme-300)');
  code = code.replace(/#E9EDDE/g, 'var(--color-theme-100)');
  
  // Brand
  code = code.replace(/#8B9D77/g, 'var(--color-theme-500)');
  code = code.replace(/#728261/g, 'var(--color-theme-600)');
  code = code.replace(/#556B2F/g, 'var(--color-theme-700)');
  
  // Text
  code = code.replace(/#7A7F6E/g, 'var(--color-theme-600-text)');
  code = code.replace(/#3A3D32/g, 'var(--color-theme-800)');
  code = code.replace(/#2D3025/g, 'var(--color-theme-900)');
  
  // Also we must convert Tailwind arbitrary values `bg-[var(--color-theme-50)]` to something simpler, 
  // or we can just replace the bracketed values with standard tailwind classes if we define them in index.css.
  
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
