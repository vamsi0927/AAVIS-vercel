const fs = require('fs');
const path = require('path');

const rootPath = __dirname;
const htmlDir = path.join(rootPath, 'Test Results', 'HTML');
if (!fs.existsSync(htmlDir)) fs.mkdirSync(htmlDir, { recursive: true });

function generateHTML(title, results) {
  let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background-color: #0f172a; color: #f8fafc; padding: 2rem; }
    h1 { color: #38bdf8; border-bottom: 2px solid #334155; padding-bottom: 0.5rem; }
    table { width: 100%; border-collapse: collapse; margin-top: 1rem; background-color: #1e293b; border-radius: 8px; overflow: hidden; }
    th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid #334155; }
    th { background-color: #0f172a; color: #94a3b8; font-weight: 600; text-transform: uppercase; font-size: 0.85rem; }
    tr:last-child td { border-bottom: none; }
    .status-PASS { color: #10b981; font-weight: bold; }
    .status-FAIL { color: #ef4444; font-weight: bold; }
    .status-BLOCKED { color: #f59e0b; font-weight: bold; }
    .status-NOT-RUN { color: #64748b; font-weight: bold; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <table>
    <thead>
      <tr>
        <th>Test ID</th>
        <th>Category / Module</th>
        <th>Scenario</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
`;

  results.forEach(r => {
    let statusClass = `status-${r.status ? r.status.toUpperCase().replace(' ', '-') : 'PASS'}`;
    html += `      <tr>
        <td>${r.id || 'N/A'}</td>
        <td>${r.mod || 'N/A'}</td>
        <td>${r.scenario || 'N/A'}</td>
        <td class="${statusClass}">${r.status || 'PASS'}</td>
      </tr>\n`;
  });

  html += `    </tbody>
  </table>
</body>
</html>`;
  return html;
}

// 1. Web
let webResults = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'selenium/reports/sync/mochawesome.json'), 'utf8');
  JSON.parse(raw).results.forEach(res => {
    res.suites.forEach(suite => {
      suite.tests.forEach(test => {
        const parts = test.title.split(': ');
        webResults.push({ id: parts[0] || 'TC_WEB', mod: 'Selenium E2E', scenario: parts[1] || test.title, status: test.state === 'passed' ? 'PASS' : (test.state === 'failed' ? 'FAIL' : 'BLOCKED') });
      });
    });
  });
} catch(e) { webResults = [{id: 'WEB-001', mod: 'Web', scenario: 'Data not available', status: 'BLOCKED'}]; }
fs.writeFileSync(path.join(htmlDir, 'web_report.html'), generateHTML('Web (Selenium) E2E Results', webResults));

// 2. Mobile
let mobileResults = [];
try {
  const raw = fs.readFileSync(path.join(__dirname, 'automation/reports/json/execution-results.json'), 'utf8');
  JSON.parse(raw).forEach(t => {
    mobileResults.push({ id: t.id, mod: t.module || t.mod || 'Mobile', scenario: t.name || t.scenario, status: t.status || 'PASS' });
  });
} catch(e) { mobileResults = [{id: 'APP-001', mod: 'Mobile', scenario: 'Data not available', status: 'BLOCKED'}]; }
fs.writeFileSync(path.join(htmlDir, 'mobile_report.html'), generateHTML('Mobile (Appium) Results', mobileResults));

// 3. Security
let secResults = [];
try {
  const secFiles = fs.readdirSync(path.join(__dirname, 'Test Results/Security')).filter(f => f.endsWith('.json'));
  if (secFiles.length > 0) {
    const raw = fs.readFileSync(path.join(__dirname, 'Test Results/Security', secFiles[secFiles.length - 1]), 'utf8');
    JSON.parse(raw).results.forEach(t => {
      secResults.push({ id: t.id, mod: 'Security Check', scenario: t.name || t.scenario, status: t.status || 'PASS' });
    });
  }
} catch(e) { secResults = [{id: 'SEC-001', mod: 'Security', scenario: 'Data not available', status: 'BLOCKED'}]; }
fs.writeFileSync(path.join(htmlDir, 'security_report.html'), generateHTML('Security (DAST) Results', secResults));

// 4. Load
let loadResults = [];
try {
  const loadFiles = fs.readdirSync(path.join(__dirname, 'Test Results/Performance')).filter(f => f.endsWith('.json') && f.includes('comprehensive'));
  if (loadFiles.length > 0) {
    const raw = fs.readFileSync(path.join(__dirname, 'Test Results/Performance', loadFiles[loadFiles.length - 1]), 'utf8');
    JSON.parse(raw).forEach(t => {
      loadResults.push({ id: t.id, mod: 'Load Test Config', scenario: t.scenario, status: t.status || 'NOT RUN' });
    });
  }
} catch(e) { loadResults = [{id: 'LD-001', mod: 'Load', scenario: 'Data not available', status: 'BLOCKED'}]; }
fs.writeFileSync(path.join(htmlDir, 'load_report.html'), generateHTML('Performance & Load Results', loadResults));

console.log('HTML reports generated in Test Results/HTML/');
