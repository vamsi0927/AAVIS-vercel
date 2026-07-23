const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const reportDir = process.argv[2] || 'selenium/reports';
if (!fs.existsSync(reportDir)) {
  console.log(`Report directory not found: ${reportDir}`);
  process.exit(0);
}

const workbook = xlsx.utils.book_new();
const wsData = [['Module', 'Test Suite', 'Test Title', 'Status', 'Duration (ms)', 'Error']];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.json') && !fullPath.includes('package.json')) {
      try {
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const moduleName = path.basename(path.dirname(fullPath));
        if (data.results && data.results.length > 0) {
          data.results.forEach(suite => {
            if (suite.suites) {
              suite.suites.forEach(s => {
                if (s.tests) {
                  s.tests.forEach(t => {
                    wsData.push([
                      moduleName,
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
        }
      } catch (err) {
        console.error(`Failed to process ${fullPath}:`, err);
      }
    }
  }
}

processDirectory(reportDir);

if (wsData.length > 1) {
  const worksheet = xlsx.utils.aoa_to_sheet(wsData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'All Selenium Results');
  const excelPath = path.join(reportDir, 'Selenium_Test_Report.xlsx');
  xlsx.writeFile(workbook, excelPath);
  console.log(`✅ Master Selenium Excel report generated: ${excelPath}`);
}

