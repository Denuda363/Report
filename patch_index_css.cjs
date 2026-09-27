const fs = require('fs');
const file = 'src/index.css';
let code = fs.readFileSync(file, 'utf-8');

const themeConfig = `
@theme {
  --color-theme-50: var(--color-theme-50);
  --color-theme-100: var(--color-theme-100);
  --color-theme-200: var(--color-theme-200);
  --color-theme-300: var(--color-theme-300);
  --color-theme-500: var(--color-theme-500);
  --color-theme-600: var(--color-theme-600);
  --color-theme-700: var(--color-theme-700);
  
  --color-theme-600-text: var(--color-theme-600-text);
  --color-theme-800: var(--color-theme-800);
  --color-theme-900: var(--color-theme-900);
}
`;

code = code.replace('@import "tailwindcss";', '@import "tailwindcss";\n' + themeConfig);
fs.writeFileSync(file, code);
