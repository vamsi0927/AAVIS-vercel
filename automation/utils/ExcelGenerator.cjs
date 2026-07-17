const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Logger = require('./Logger.cjs');

class ExcelGenerator {
  static generate(results) {
    try {
      const outputDir = './automation/reports/excel';
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      const reportPath = path.join(outputDir, 'Automation_Test_Report.xlsx');
      const workbook = XLSX.utils.book_new();

      // 1. Executed Test Cases
      const executedData = results.map(r => ({
        'Test ID': r.id,
        'Module': r.module,
        'Test Name': r.name,
        'Priority': r.priority,
        'Status': r.status,
        'Execution Time (ms)': r.duration || 0
      }));
      const executedSheet = XLSX.utils.json_to_sheet(executedData);
      XLSX.utils.book_append_sheet(workbook, executedSheet, 'Executed Test Cases');

      // 2. Passed Tests
      const passedData = results.filter(r => r.status === 'Passed').map(r => ({
        'Test ID': r.id,
        'Module': r.module,
        'Test Name': r.name,
        'Priority': r.priority,
        'Execution Time (ms)': r.duration || 0
      }));
      const passedSheet = XLSX.utils.json_to_sheet(passedData);
      XLSX.utils.book_append_sheet(workbook, passedSheet, 'Passed Tests');

      // 3. Failed Tests
      const failedData = results.filter(r => r.status === 'Failed').map(r => ({
        'Test ID': r.id,
        'Module': r.module,
        'Test Name': r.name,
        'Priority': r.priority,
        'Error Message': r.error || 'N/A',
        'Execution Time (ms)': r.duration || 0
      }));
      const failedSheet = XLSX.utils.json_to_sheet(failedData);
      XLSX.utils.book_append_sheet(workbook, failedSheet, 'Failed Tests');

      // 4. Skipped Tests
      const skippedData = results.filter(r => r.status === 'Skipped').map(r => ({
        'Test ID': r.id,
        'Module': r.module,
        'Test Name': r.name,
        'Priority': r.priority
      }));
      const skippedSheet = XLSX.utils.json_to_sheet(skippedData);
      XLSX.utils.book_append_sheet(workbook, skippedSheet, 'Skipped Tests');

      // 5. Execution Metrics
      const total = results.length;
      const passed = results.filter(r => r.status === 'Passed').length;
      const failed = results.filter(r => r.status === 'Failed').length;
      const skipped = results.filter(r => r.status === 'Skipped').length;
      const passRate = total > 0 ? ((passed / total) * 100).toFixed(2) : 0;
      
      const metricsData = [
        { Metric: 'Total Test Cases', Value: total },
        { Metric: 'Passed Tests', Value: passed },
        { Metric: 'Failed Tests', Value: failed },
        { Metric: 'Skipped Tests', Value: skipped },
        { Metric: 'Pass Rate (%)', Value: `${passRate}%` }
      ];
      const metricsSheet = XLSX.utils.json_to_sheet(metricsData);
      XLSX.utils.book_append_sheet(workbook, metricsSheet, 'Execution Metrics');

      // 6. Defect Summary
      const defectData = results.filter(r => r.status === 'Failed').map((r, idx) => ({
        'Defect ID': `DF_${r.id}`,
        'Test ID': r.id,
        'Module': r.module,
        'Defect Description': r.error || 'Assertion Error',
        'Severity': r.priority === 'High' ? 'Critical' : (r.priority === 'Medium' ? 'Major' : 'Minor'),
        'Status': 'New'
      }));
      const defectSheet = XLSX.utils.json_to_sheet(defectData);
      XLSX.utils.book_append_sheet(workbook, defectSheet, 'Defect Summary');

      // 7. Pass Rate Summary
      const modules = [...new Set(results.map(r => r.module))];
      const passRateData = modules.map(m => {
        const mTests = results.filter(r => r.module === m);
        const mPassed = mTests.filter(r => r.status === 'Passed').length;
        const mTotal = mTests.length;
        return {
          'Module Name': m,
          'Total Tests': mTotal,
          'Passed': mPassed,
          'Pass Rate (%)': mTotal > 0 ? ((mPassed / mTotal) * 100).toFixed(2) : 0
        };
      });
      const passRateSheet = XLSX.utils.json_to_sheet(passRateData);
      XLSX.utils.book_append_sheet(workbook, passRateSheet, 'Pass Rate Summary');

      XLSX.writeFile(workbook, reportPath);
      Logger.info(`Main Excel report created successfully at: ${reportPath}`);

      // Generate supplementary individual reports
      this.generateSubsetReport(passedData, 'Passed_Test_Cases.xlsx', outputDir);
      this.generateSubsetReport(failedData, 'Failed_Test_Cases.xlsx', outputDir);
      this.generateSubsetReport(metricsData, 'Execution_Summary.xlsx', outputDir);

    } catch (err) {
      Logger.error('Failed to generate Excel reports', err);
    }
  }

  static generateSubsetReport(data, fileName, dir) {
    const workbook = XLSX.utils.book_new();
    const sheet = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(workbook, sheet, 'Summary');
    XLSX.writeFile(workbook, path.join(dir, fileName));
    Logger.info(`Generated subset Excel report: ${fileName}`);
  }
}

module.exports = ExcelGenerator;
