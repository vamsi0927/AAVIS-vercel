import fs from 'fs';
import path from 'path';

const dir = path.join(process.cwd(), 'src');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(dirPath);
  });
}

walk(dir, (filePath) => {
  if (!filePath.endsWith('.tsx')) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace `truncate` with `break-words whitespace-normal` specifically around product names, brands, dates, etc.
  // The user hates the "..." ellipsis.
  content = content.replace(/className="([^"]*)truncate([^"]*)"/g, (match, p1, p2) => {
    // If it's a structural element that needs truncation (e.g. email, very long text in a button where we don't want it to wrap and break layout), we might keep it.
    // But user said "fix it in entire app". Let's aggressively replace it in product cards.
    return `className="${p1}break-words whitespace-normal${p2}"`;
  });

  // Replace `line-clamp-2` with `break-words whitespace-normal`
  content = content.replace(/className="([^"]*)line-clamp-2([^"]*)"/g, (match, p1, p2) => {
    return `className="${p1}break-words whitespace-normal${p2}"`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
});
