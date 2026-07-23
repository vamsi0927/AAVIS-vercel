const fs = require('fs');
const file = '.github/workflows/selenium.yml';
let content = fs.readFileSync(file, 'utf8');

// Remove the individual job excel generation
content = content.replace(/      - name: Generate Excel Report\n        run: node generate-selenium-excel.cjs selenium\/reports\/\n        if: always()\n/g, '');

fs.writeFileSync(file, content);
console.log('selenium.yml cleaned up');
