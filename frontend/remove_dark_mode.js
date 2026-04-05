const fs = require('fs');
const path = require('path');

const directories = [
  path.join(__dirname, 'src', 'pages'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src')
];

const processedFiles = new Set();
// A robust regex to strip ANY class starting with `dark:`. It removes leading spaces as well so we don't leave double spaces.
const purgeDarkRegex = /\s*dark:[a-zA-Z0-9\-\/\[\]:]+/g;

function processPath(targetPath) {
  if (!fs.existsSync(targetPath)) return;
  const stat = fs.statSync(targetPath);
  
  if (stat.isDirectory()) {
    const files = fs.readdirSync(targetPath);
    files.forEach(file => {
      processPath(path.join(targetPath, file));
    });
  } else if (targetPath.endsWith('.js') && !targetPath.includes('node_modules')) {
    if (processedFiles.has(targetPath)) return;
    processedFiles.add(targetPath);

    let content = fs.readFileSync(targetPath, 'utf8');
    
    // Replace dark mode classes
    if (purgeDarkRegex.test(content)) {
      content = content.replace(purgeDarkRegex, '');
      fs.writeFileSync(targetPath, content, 'utf8');
      console.log(`Purged dark mode from: ${path.basename(targetPath)}`);
    }
  }
}

directories.forEach(processPath);
console.log(`Processed ${processedFiles.size} files for Dark Mode purging.`);
console.log('Complete!');
