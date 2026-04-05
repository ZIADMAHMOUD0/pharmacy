const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

const patterns = [
  // 1. Fully map ALL remaining "gray" colors to appropriate Dark Mode "slate" versions
  { regex: /(bg-gray-900)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-100' },
  { regex: /(bg-gray-800)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-200' },
  { regex: /(bg-gray-700)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-300' },
  { regex: /(bg-gray-600)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-400' },
  { regex: /(bg-gray-500)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-500' },
  { regex: /(bg-gray-400)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-600' },
  { regex: /(bg-gray-300)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-700' },
  { regex: /(bg-gray-200)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-gray-100)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-gray-50)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-900/50' },
  
  { regex: /(text-gray-900)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-100' },
  { regex: /(text-gray-800)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-100' },
  { regex: /(text-gray-700)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-200' },
  { regex: /(text-gray-600)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-300' },
  { regex: /(text-gray-500)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-400' },
  { regex: /(text-gray-400)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-500' },
  { regex: /(text-gray-300)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-600' },
  { regex: /(text-gray-200)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-700' },
  { regex: /(text-gray-100)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-800' },
  { regex: /(text-gray-50)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-900' },
  
  { regex: /(border-gray-900)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-100' },
  { regex: /(border-gray-800)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-200' },
  { regex: /(border-gray-700)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-300' },
  { regex: /(border-gray-600)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-400' },
  { regex: /(border-gray-500)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-500' },
  { regex: /(border-gray-400)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-600' },
  { regex: /(border-gray-300)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700' },
  { regex: /(border-gray-200)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700/50' },
  { regex: /(border-gray-100)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-800' },
  { regex: /(border-gray-50)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-800' },

  { regex: /(hover:bg-gray-200)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-700' },
  { regex: /(hover:bg-gray-100)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-800' },
  { regex: /(hover:bg-gray-50)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-800/80' },

  // 2. Catch ANY unmapped solid backgrounds missed in previous scans
  // We use \b to ensure word boundary.
  { regex: /(bg-white)\b(?!\s*dark:)(?!\/)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-white\/[0-9]{1,2})\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' }, // For opacity, just append dark:bg-slate-800 (Tailwind handles the opacity logic internally or we keep it clean. Wait, if it's bg-white/10, making it dark:bg-slate-800/10)
  
  // Clean up bg-white with specific opacity
  { regex: /(bg-white)\/(10|20|30|50|70|80|90|95)\b(?!\s*dark:)/g, replace: '$1/$2 dark:bg-slate-800/$2' },

  // 3. Catch Any unmapped text colors
  { regex: /(text-slate-800)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-100' },
  { regex: /(text-slate-700)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-200' },
  { regex: /(text-slate-600)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-300' },
  { regex: /(text-slate-500)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-400' },
  { regex: /(text-slate-400)\b(?!\s*dark:)/g, replace: '$1 dark:text-slate-500' },
  
  // 4. Catch Any unmapped backgrounds
  { regex: /(bg-slate-50)\b(?!\s*dark:)(?!\/)/g, replace: '$1 dark:bg-slate-900/50' },
  { regex: /(bg-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-800' },
  { regex: /(bg-slate-200)\b(?!\s*dark:)/g, replace: '$1 dark:bg-slate-700' },
  
  // 5. Catch Any unmapped borders
  { regex: /(border-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700/50' },
  { regex: /(border-slate-200)\b(?!\s*dark:)/g, replace: '$1 dark:border-slate-700' },

  // 6. Catch hover states
  { regex: /(hover:bg-slate-50)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-800/80' },
  { regex: /(hover:bg-slate-100)\b(?!\s*dark:)/g, replace: '$1 dark:hover:bg-slate-700/50' },
  
];

// Set to keep track of processed files to avoid duplicates since __dirname/src includes pages/components
const processedFiles = new Set();

function processPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    const files = fs.readdirSync(targetPath);
    files.forEach(file => {
      processPath(path.join(targetPath, file));
    });
  } else if (targetPath.endsWith('.js')) {
    if (processedFiles.has(targetPath)) return;
    processedFiles.add(targetPath);

    let content = fs.readFileSync(targetPath, 'utf8');
    let modified = false;
    
    // Iteratively apply patterns
    patterns.forEach(p => {
      // Need multiple passes for multiple matches on the same line if \b matches awkwardly? 
      // replace(/.../g) replaces globally.
      if (content.match(p.regex)) {
        content = content.replace(p.regex, p.replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`Updated: ${path.basename(targetPath)}`);
    }
  }
}

directories.forEach(processPath);
console.log(`Processed ${processedFiles.size} files.`);
console.log('Complete!');
