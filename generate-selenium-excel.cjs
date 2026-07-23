const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const reportDir = process.argv[2] || 'selenium/reports';
if (!fs.existsSync(reportDir)) {
  console.log(`Report directory not found: ${reportDir}`);
  process.exit(0);
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.json') && !fullPath.includes('package.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        if (data.results && data.results.length > 0) {
          const workbook = xlsx.utils.book_new();
          const wsData = [['Test Suite', 'Test Title', 'Status', 'Duration (ms)', 'Error']];
          
          data.results.forEach(suite => {
            if (suite.suites) {
              suite.suites.forEach(s => {
                if (s.tests) {
                  s.tests.forEach(t => {
                    wsData.push([
                      s.title || 'General',
                      t.title,
                      t.state || 'failed',
                      t.duration || 0,
                      t.err && t.err.message ? t.err.message : ''
                    ]);
                  });
                }
              });
            }
          });
          
          if (wsData.length > 1) {
            const worksheet = xlsx.utils.aoa_to_sheet(wsData);
            xlsx.utils.book_append_sheet(workbook, worksheet, 'Test Results');
            const excelPath = fullPath.replace('.json', '.xlsx');
            xlsx.writeFile(workbook, excelPath);
            console.log(`✅ Excel report generated: ${excelPath}`);
          }
        }
      } catch (err) {
        console.error(`Failed to process ${fullPath}:`, err);
      }
    }
  }
}

processDirectory(reportDir);
