const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components'),
  path.dirname(path.join(__dirname, 'src', 'App.js'))
];

const patterns = [
  // Fix the solid white bg opacity bug
  { regex: /bg-white dark:bg-slate-800\/(\d+)/g, replace: 'bg-white/$1 dark:bg-slate-800/$1' },
  
  // Fix text opacity breakages if any
  { regex: /text-slate-([0-9]{3}) dark:text-slate-([0-9]{3})\/(\d+)/g, replace: 'text-slate-$1/$3 dark:text-slate-$2/$3' },
  
  // Fix missing hero dark gradients in App.js
  { regex: /from-slate-50 via-white to-teal-50/g, replace: 'from-slate-50 dark:from-slate-900 via-white dark:via-slate-800 to-teal-50 dark:to-teal-900/80' }
];

function processPath(targetPath) {
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    const files = fs.readdirSync(targetPath);
    files.forEach(file => {
      processPath(path.join(targetPath, file));
    });
  } else if (targetPath.endsWith('.js')) {
    let content = fs.readFileSync(targetPath, 'utf8');
    let modified = false;
    
    patterns.forEach(p => {
      if (content.match(p.regex)) {
        content = content.replace(p.regex, p.replace);
        modified = true;
      }
    });
    
    if (modified) {
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`Updated: ${targetPath}`);
    }
  }
}

directories.forEach(processPath);
console.log('Complete!');
