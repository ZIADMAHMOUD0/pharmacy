const fs = require('fs');
const path = require('path');

const fileToProcess = path.join(__dirname, 'src', 'App.js');

const patterns = [
  { regex: /(bg-white)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-slate-50)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-900/50' },
  { regex: /(bg-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-slate-200)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-700' },
  
  { regex: /(text-slate-800)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-100' },
  { regex: /(text-slate-700)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-200' },
  { regex: /(text-slate-600)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-300' },
  { regex: /(text-slate-500)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-400' },
  { regex: /(text-slate-400)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-500' },
  
  { regex: /(border-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700/50' },
  { regex: /(border-slate-200)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700' },
  
  { regex: /(hover:bg-slate-50)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-800/80' },
  { regex: /(hover:bg-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-700/50' },
  { regex: /(hover:bg-slate-200)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-700' },
  
  { regex: /(bg-teal-50)\b(?!\s*dark:)/g, replace: '$1 dark:bg-teal-900/50' },
  { regex: /(text-teal-700)\b(?!\s*dark:)/g, replace: '$1 dark:text-teal-300' }
];

let content = fs.readFileSync(fileToProcess, 'utf8');
let modified = false;

patterns.forEach(p => {
  if (content.match(p.regex)) {
    content = content.replace(p.regex, p.replace);
    modified = true;
  }
});

if (modified) {
  fs.writeFileSync(fileToProcess, content, 'utf8');
  console.log(`Updated: ${fileToProcess}`);
}

console.log('Complete!');
