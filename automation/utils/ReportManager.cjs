const fs = require('fs');
const path = require('path');
const ExcelGenerator = require('./ExcelGenerator.cjs');
const HtmlGenerator = require('./HtmlGenerator.cjs');
const Logger = require('./Logger.cjs');

class ReportManager {
  static save(results) {
    try {
      const jsonDir = './automation/reports/json';
      if (!fs.existsSync(jsonDir)) {
        fs.mkdirSync(jsonDir, { recursive: true });
      }

      // 1. JSON Report
      const jsonPath = path.join(jsonDir, 'execution-results.json');
      fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
      Logger.info(`JSON report generated at: ${jsonPath}`);

      // 2. Generate Excel & HTML Dashboards
      ExcelGenerator.generate(results);
      HtmlGenerator.generate(results);

      // 3. Markdown Summary
      const summaryDir = './automation/reports/summary';
      if (!fs.existsSync(summaryDir)) {
        fs.mkdirSync(summaryDir, { recursive: true });
      }

      const total = results.length;
      const passed = results.filter(r => r.status === 'Passed').length;
      const failed = results.filter(r => r.status === 'Failed').length;
      const skipped = results.filter(r => r.status === 'Skipped').length;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
      const failRate = (100 - parseFloat(passRate)).toFixed(2);

      const summaryMd = `
# Android Appium E2E Execution Summary

Build Number: ${process.env.GITHUB_RUN_NUMBER || 'Local'}
Execution Date: ${new Date().toLocaleDateString()}
Git Commit: ${process.env.GITHUB_SHA || 'N/A'}
Branch: ${process.env.GITHUB_REF || 'main'}

APK Version: 1.0.0
Device: Android Emulator (API 34)

## Execution Metrics

| Metric | Count |
| :--- | :---: |
| **Total Test Cases** | ${total} |
| **Passed** | ${passed} |
| **Failed** | ${failed} |
| **Skipped** | ${skipped} |
| **Pass Percentage** | ${passRate}% |
| **Fail Percentage** | ${failRate}% |

## Sample Passed Scenarios
${results.filter(r => r.status === 'Passed').slice(0, 5).map(r => `✓ ${r.id} - ${r.name}`).join('\n')}

${failed > 0 ? `## Sample Failed Scenarios\n${results.filter(r => r.status === 'Failed').slice(0, 5).map(r => `✗ ${r.id} - ${r.name}\n  Reason: ${r.error}`).join('\n')}` : ''}
`;
      
      const mdPath = path.join(summaryDir, 'summary.md');
      fs.writeFileSync(mdPath, summaryMd.trim());
      Logger.info(`Markdown execution summary created at: ${mdPath}`);

      // 4. Archive Historical Reports (if running in GitHub Actions / CLI)
      const buildNum = process.env.GITHUB_RUN_NUMBER || 'local-build';
      const historyDir = path.join('./automation/reports/history', `build-${buildNum}`);
      if (!fs.existsSync(historyDir)) {
        fs.mkdirSync(historyDir, { recursive: true });
      }

      fs.copyFileSync(path.join('./automation/reports/html/execution-report.html'), path.join(historyDir, 'execution-report.html'));
      fs.copyFileSync(jsonPath, path.join(historyDir, 'execution-results.json'));
      Logger.info(`Archived historical reports to: ${historyDir}`);

      // 5. Replicate reports in 'Test Results/' folder root
      const resultsDir = './Test Results';
      const subdirs = ['Excel', 'HTML', 'JSON', 'Screenshots', 'Logs', 'Summary'];
      subdirs.forEach(d => {
        const dirPath = path.join(resultsDir, d);
        if (!fs.existsSync(dirPath)) {
          fs.mkdirSync(dirPath, { recursive: true });
        }
      });

      // Copy Excel files
      const excelFiles = ['Automation_Test_Report.xlsx', 'Passed_Test_Cases.xlsx', 'Failed_Test_Cases.xlsx', 'Execution_Summary.xlsx'];
      excelFiles.forEach(f => {
        const src = path.join('./automation/reports/excel', f);
        const dest = path.join(resultsDir, 'Excel', f);
        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      });

      // Copy HTML files
      const htmlFiles = ['execution-report.html', 'dashboard.html', 'trends.html'];
      htmlFiles.forEach(f => {
        const src = path.join('./automation/reports/html', f);
        const dest = path.join(resultsDir, 'HTML', f);
        if (fs.existsSync(src)) fs.copyFileSync(src, dest);
      });

      // Copy JSON
      if (fs.existsSync(jsonPath)) {
        fs.copyFileSync(jsonPath, path.join(resultsDir, 'JSON', 'execution-results.json'));
      }

      // Copy Summary
      if (fs.existsSync(mdPath)) {
        fs.copyFileSync(mdPath, path.join(resultsDir, 'Summary', 'summary.md'));
      }

      // Copy Logs
      const logSrc = './automation/logs/automation-execution.log';
      if (fs.existsSync(logSrc)) {
        fs.copyFileSync(logSrc, path.join(resultsDir, 'Logs', 'automation-execution.log'));
      }

      Logger.info(`Replicated reports to: ${resultsDir}`);

    } catch (err) {
      Logger.error('Failed to run ReportManager save', err);
    }
  }
}

module.exports = ReportManager;
