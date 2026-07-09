const fs = require('fs');
const path = require('path');

const walkSync = (dir, filelist = []) => {
  fs.readdirSync(dir).forEach(file => {
    const dirFile = path.join(dir, file);
    if (fs.statSync(dirFile).isDirectory()) {
      filelist = walkSync(dirFile, filelist);
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.jsx')) {
        filelist.push(dirFile);
      }
    }
  });
  return filelist;
};

const files = walkSync(path.join(process.cwd(), 'src/pages'));
const modifiedFiles = [];
const inventory = [];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let original = content;
  
  const componentName = path.basename(file, path.extname(file)).toLowerCase();
  
  // Inject into buttons without data-testid
  let btnCount = 0;
  content = content.replace(/<button([^>]*?)>/g, (match, p1) => {
    if (p1.includes('data-testid')) return match;
    btnCount++;
    const id = `btn-${componentName}-${btnCount}`;
    inventory.push(`- ${id}: ${file}`);
    return `<button data-testid='${id}'${p1}>`;
  });
  
  // Inject into inputs
  let inputCount = 0;
  content = content.replace(/<input([^>]*?)>/g, (match, p1) => {
    if (p1.includes('data-testid')) return match;
    inputCount++;
    const id = `input-${componentName}-${inputCount}`;
    inventory.push(`- ${id}: ${file}`);
    return `<input data-testid='${id}'${p1}>`;
  });

  if (content !== original) {
    fs.writeFileSync(file, content);
    modifiedFiles.push(file);
  }
});

const reportDir = path.join(process.cwd(), 'selenium/reports');
fs.mkdirSync(reportDir, { recursive: true });

fs.writeFileSync(path.join(reportDir, 'modified_files.md'), '# Modified Files\n\n' + modifiedFiles.map(f => `- ${f}`).join('\n'));
fs.writeFileSync(path.join(reportDir, 'selector_inventory.md'), '# Selector Inventory\n\n' + inventory.join('\n'));

console.log('Injection complete. Modified ' + modifiedFiles.length + ' files.');
