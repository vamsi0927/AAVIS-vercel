const fs = require('fs');
const path = require('path');
const Logger = require('./Logger.cjs');

class HtmlGenerator {
  static generate(results) {
    try {
      const outputDir = './automation/reports/html';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const total = results.length;
      const passed = results.filter(r => r.status === 'Passed').length;
      const failed = results.filter(r => r.status === 'Failed').length;
      const skipped = results.filter(r => r.status === 'Skipped').length;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
      const duration = results.reduce((acc, r) => acc + (r.duration || 0), 0);

      const modules = [...new Set(results.map(r => r.module))];
      const moduleSummary = modules.map(m => {
        const mTests = results.filter(r => r.module === m);
        const mPassed = mTests.filter(r => r.status === 'Passed').length;
        const mFailed = mTests.filter(r => r.status === 'Failed').length;
        const mSkipped = mTests.filter(r => r.status === 'Skipped').length;
        const mTotal = mTests.length;
        return {
          name: m,
          total: mTotal,
          passed: mPassed,
          failed: mFailed,
          skipped: mSkipped,
          rate: mTotal > 0 ? ((mPassed / mTotal) * 100).toFixed(1) : 0
        };
      });

      const reportPath = path.join(outputDir, 'execution-report.html');
      
      const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>AAVIS Android E2E Automation Report</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    :root {
      --bg-navy-900: #080914;
      --bg-navy-800: #111324;
      --bg-navy-700: #1b1e36;
      --brand-primary: #8b5cf6;
      --brand-secondary: #06b6d4;
      --brand-safe: #10b981;
      --brand-caution: #f59e0b;
      --brand-hazardous: #ef4444;
      --text-main: #f4f5fb;
      --text-sub: #a1a3b5;
    }
    body {
      background-color: var(--bg-navy-900);
      color: var(--text-main);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      margin: 0;
      padding: 24px;
    }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
      border-bottom: 1px solid var(--bg-navy-700);
      padding-bottom: 16px;
    }
    h1 {
      font-size: 2rem;
      font-weight: 800;
      background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .metrics-container {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 32px;
    }
    .metric-card {
      background-color: var(--bg-navy-800);
      border: 1px solid var(--bg-navy-700);
      border-radius: 16px;
      padding: 20px;
      text-align: center;
    }
    .metric-title {
      font-size: 0.85rem;
      color: var(--text-sub);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 2.25rem;
      font-weight: 800;
    }
    .passed { color: var(--brand-safe); }
    .failed { color: var(--brand-hazardous); }
    .skipped { color: var(--brand-caution); }
    
    .charts-container {
      display: grid;
      grid-template-columns: 1fr 2fr;
      gap: 20px;
      margin-bottom: 32px;
    }
    .chart-card {
      background-color: var(--bg-navy-800);
      border: 1px solid var(--bg-navy-700);
      border-radius: 16px;
      padding: 20px;
      height: 350px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 16px;
      background-color: var(--bg-navy-800);
      border-radius: 16px;
      overflow: hidden;
      border: 1px solid var(--bg-navy-700);
    }
    th, td {
      padding: 12px 16px;
      text-align: left;
      border-bottom: 1px solid var(--bg-navy-700);
    }
    th {
      background-color: var(--bg-navy-700);
      color: var(--text-main);
      font-weight: 700;
    }
    tr:hover {
      background-color: rgba(255, 255, 255, 0.02);
    }
  </style>
</head>
<body>
  <header>
    <div>
      <h1>AAVIS E2E Automation Dashboard</h1>
      <p style="color: var(--text-sub); margin: 4px 0 0 0;">Run Date: ${new Date().toLocaleString()}</p>
    </div>
    <div style="background-color: var(--bg-navy-800); padding: 12px 20px; border-radius: 12px; border: 1px solid var(--bg-navy-700);">
      <strong>Device:</strong> Android Emulator (API 34) | <strong>App Version:</strong> 1.0.0
    </div>
  </header>

  <div class="metrics-container">
    <div class="metric-card">
      <div class="metric-title">Total Tests</div>
      <div class="metric-value">${total}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Passed</div>
      <div class="metric-value passed">${passed}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Failed</div>
      <div class="metric-value failed">${failed}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Skipped</div>
      <div class="metric-value skipped">${skipped}</div>
    </div>
    <div class="metric-card">
      <div class="metric-title">Pass Rate</div>
      <div class="metric-value passed">${passRate}%</div>
    </div>
  </div>

  <div class="charts-container">
    <div class="chart-card">
      <h3>Distribution</h3>
      <canvas id="pieChart"></canvas>
    </div>
    <div class="chart-card">
      <h3>Module Performance Summary</h3>
      <canvas id="barChart"></canvas>
    </div>
  </div>

  <h2>Test Suite Modules Breakdown</h2>
  <table>
    <thead>
      <tr>
        <th>Module</th>
        <th>Total Tests</th>
        <th>Passed</th>
        <th>Failed</th>
        <th>Skipped</th>
        <th>Pass Rate</th>
      </tr>
    </thead>
    <tbody>
      ${moduleSummary.map(m => `
        <tr>
          <td><strong>${m.name}</strong></td>
          <td>${m.total}</td>
          <td class="passed">${m.passed}</td>
          <td class="failed">${m.failed}</td>
          <td class="skipped">${m.skipped}</td>
          <td><strong>${m.rate}%</strong></td>
        </tr>
      `).join('')}
    </tbody>
  </table>

  <script>
    const ctxPie = document.getElementById('pieChart').getContext('2d');
    new Chart(ctxPie, {
      type: 'doughnut',
      data: {
        labels: ['Passed', 'Failed', 'Skipped'],
        datasets: [{
          data: [${passed}, ${failed}, ${skipped}],
          backgroundColor: ['#10b981', '#ef4444', '#f59e0b'],
          borderColor: '#111324',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom', labels: { color: '#f4f5fb' } }
        }
      }
    });

    const ctxBar = document.getElementById('barChart').getContext('2d');
    new Chart(ctxBar, {
      type: 'bar',
      data: {
        labels: [${modules.map(m => `'${m}'`).join(', ')}],
        datasets: [{
          label: 'Pass Rate (%)',
          data: [${moduleSummary.map(m => m.rate).join(', ')}],
          backgroundColor: '#8b5cf6',
          borderRadius: 8
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { min: 0, max: 100, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#f4f5fb' } },
          x: { grid: { display: false }, ticks: { color: '#f4f5fb' } }
        },
        plugins: {
          legend: { display: false }
        }
      }
    });
  </script>
</body>
</html>
`;
      
      fs.writeFileSync(reportPath, htmlContent);
      Logger.info(`HTML Dashboard report created successfully at: ${reportPath}`);

      fs.copyFileSync(reportPath, path.join(outputDir, 'dashboard.html'));
      fs.copyFileSync(reportPath, path.join(outputDir, 'trends.html'));
      Logger.info('Supplementary HTML reports generated.');

    } catch (err) {
      Logger.error('Failed to generate HTML reports', err);
    }
  }
}

module.exports = HtmlGenerator;
