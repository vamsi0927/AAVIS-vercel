const ExcelJS = require('exceljs');
const fs = require('fs');
const path = require('path');

async function auditAndRebuildExcel() {
  const rootPath = path.resolve(__dirname, '..');
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'AAVIS QA Automation';
  workbook.created = new Date();

  // Helper for styling
  const styleHeader = (worksheet) => {
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF203764' } };
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };
    worksheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];
    worksheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: worksheet.columnCount } };
  };

  const styleStatusCell = (cell, status) => {
    const s = (status || '').toUpperCase();
    if (s.includes('PASS')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFC6EFCE' } };
      cell.font = { color: { argb: 'FF006100' } };
    } else if (s.includes('FAIL')) {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFC7CE' } };
      cell.font = { color: { argb: 'FF9C0006' } };
    } else {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFEB9C' } };
      cell.font = { color: { argb: 'FF9C5700' } };
    }
  };

  const addDataSheet = (name, columns, data) => {
    const ws = workbook.addWorksheet(name);
    ws.columns = columns;
    styleHeader(ws);
    data.forEach((row, i) => {
      const addedRow = ws.addRow(row);
      addedRow.eachCell((cell) => {
        cell.alignment = { vertical: 'top', wrapText: true };
        cell.border = { top: {style:'thin', color: {argb:'FFD9D9D9'}}, left: {style:'thin'}, bottom: {style:'thin'}, right: {style:'thin'} };
        if (i % 2 !== 0) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
      });
      // Try to find the status column to style
      columns.forEach((col, idx) => {
        if (col.key === 'status') {
          styleStatusCell(addedRow.getCell(idx + 1), row.status);
        }
      });
    });
    return ws;
  };

  const summaryData = {
    Selenium: { executed: 0, passed: 0, failed: 0, blocked: 0, source: 'selenium/reports/final_execution.json' },
    Appium: { executed: 0, passed: 0, failed: 0, blocked: 0, source: 'automation/reports/json/execution-results.json' },
    Security: { executed: 0, passed: 0, failed: 0, blocked: 0, source: 'Test Results/Security/*.json' },
    Load: { executed: 0, passed: 0, failed: 0, blocked: 0, source: 'Test Results/Performance/*.json' }
  };

  // 1. Appium
  const appiumData = [];
  try {
    const appFile = path.join(rootPath, 'automation/reports/json/execution-results.json');
    if (fs.existsSync(appFile)) {
      const parsed = JSON.parse(fs.readFileSync(appFile, 'utf8'));
      parsed.forEach((tc) => {
        const s = tc.status.toUpperCase();
        if (s === 'PASSED' || s === 'PASS') { summaryData.Appium.passed++; summaryData.Appium.executed++; }
        else if (s === 'FAILED' || s === 'FAIL') { summaryData.Appium.failed++; summaryData.Appium.executed++; }
        else { summaryData.Appium.blocked++; }

        appiumData.push({
          id: tc.id,
          type: 'Appium (Mobile E2E)',
          mod: tc.module || 'N/A',
          scenario: tc.name || '',
          executed: (s === 'PASSED' || s === 'PASS' || s === 'FAILED' || s === 'FAIL') ? 'YES' : 'NO',
          expected: tc.expectedResult || '',
          actual: tc.status === 'Passed' ? 'Assertion Passed' : (tc.error || 'Check logs'),
          status: s,
          duration: tc.duration ? `${tc.duration}s` : 'N/A',
          evidence: 'automation/reports/json/execution-results.json',
          reason: tc.error || 'N/A',
          remarks: 'Genuine mobile test execution parsed'
        });
      });
    }
  } catch (e) {
    console.error('Error parsing Appium logs:', e);
  }

  // 2. Selenium
  const seleniumData = [];
  try {
    const selFile = path.join(rootPath, 'selenium/reports/final_execution.json');
    if (fs.existsSync(selFile)) {
      const parsed = JSON.parse(fs.readFileSync(selFile, 'utf8'));
      let tcCounter = 1;
      parsed.results.forEach((res) => {
        res.suites.forEach((suite) => {
          
          let suiteFailed = false;
          let suiteFailMsg = '';
          if (suite.beforeHooks) {
            suite.beforeHooks.forEach(hook => {
               if (hook.fail) {
                 suiteFailed = true;
                 suiteFailMsg = hook.err && hook.err.message ? hook.err.message : 'Before hook failed';
               }
            });
          }

          suite.tests.forEach((test) => {
            let status = 'NOT VERIFIED';
            if (test.pass) status = 'PASS';
            else if (test.fail) status = 'FAIL';
            else if (suiteFailed) status = 'FAIL'; // Treat suite failures as test failures since it timed out during execution prep
            else if (test.skipped || test.pending) status = 'BLOCKED'; 

            if (status === 'PASS') { summaryData.Selenium.passed++; summaryData.Selenium.executed++; }
            else if (status === 'FAIL') { summaryData.Selenium.failed++; summaryData.Selenium.executed++; }
            else { summaryData.Selenium.blocked++; }

            seleniumData.push({
              id: `TC_SEL_${String(tcCounter++).padStart(3, '0')}`,
              type: 'Selenium (Web E2E)',
              mod: suite.title || 'N/A',
              scenario: test.title || '',
              executed: status !== 'NOT VERIFIED' ? 'YES' : 'NO',
              expected: 'Test passes successfully',
              actual: test.err && test.err.message ? test.err.message : (suiteFailMsg ? suiteFailMsg : 'Assertion Passed'),
              status: status,
              duration: test.duration !== undefined ? `${test.duration}ms` : 'N/A',
              evidence: 'selenium/reports/final_execution.json',
              reason: test.err && test.err.message ? test.err.message : (suiteFailMsg ? suiteFailMsg : 'N/A'),
              remarks: 'Genuine selenium test parsed'
            });
          });
        });
      });
    }
  } catch (e) {
    console.error('Error parsing Selenium logs:', e);
  }

  // 3. Security
  const securityData = [];
  try {
    const secDir = path.join(rootPath, 'Test Results/Security');
    if (fs.existsSync(secDir)) {
      const files = fs.readdirSync(secDir).filter(f => f.endsWith('.json'));
      if (files.length > 0) {
        const latestFile = files.sort().reverse()[0];
        const parsed = JSON.parse(fs.readFileSync(path.join(secDir, latestFile), 'utf8'));
        
        let autoFuzzCount = 0;
        let autoFuzzPassed = 0;
        
        parsed.results.forEach((secTest) => {
          if (secTest.id.startsWith('SEC-AUTO')) {
            autoFuzzCount++;
            if (secTest.status.toUpperCase() === 'PASS') autoFuzzPassed++;
          } else {
            let s = secTest.status.toUpperCase();
            if (s === 'PASS') { summaryData.Security.passed++; summaryData.Security.executed++; }
            else if (s === 'FAIL') { summaryData.Security.failed++; summaryData.Security.executed++; }
            else { summaryData.Security.blocked++; }

            securityData.push({
              id: secTest.id,
              type: 'Vulnerability (DAST)',
              mod: 'Security',
              scenario: secTest.name,
              executed: 'YES',
              expected: 'Secure configuration',
              actual: secTest.reason || '',
              status: s,
              duration: 'N/A',
              evidence: latestFile,
              reason: s === 'FAIL' ? secTest.reason : 'N/A',
              remarks: 'Genuine security assertion parsed'
            });
          }
        });
        
        if (autoFuzzCount > 0) {
          summaryData.Security.executed++;
          if (autoFuzzPassed === autoFuzzCount) { summaryData.Security.passed++; } else { summaryData.Security.failed++; }
          
          securityData.push({
            id: 'SEC-AUTO-FUZZ',
            type: 'Vulnerability (DAST)',
            mod: 'Security Fuzzing',
            scenario: `Automated Fuzzing Scenarios (${autoFuzzCount} iterations)`,
            executed: 'YES',
            expected: 'All fuzzing payloads handled safely',
            actual: `${autoFuzzPassed}/${autoFuzzCount} iterations passed`,
            status: autoFuzzPassed === autoFuzzCount ? 'PASS' : 'FAIL',
            duration: 'N/A',
            evidence: latestFile,
            reason: autoFuzzPassed === autoFuzzCount ? 'N/A' : 'Some fuzz checks failed',
            remarks: 'Consolidated repetitive checks'
          });
        }
      }
    }
  } catch (e) {
    console.error('Error parsing Security logs:', e);
  }

  // 4. Load
  const loadData = [];
  try {
    const perfDir = path.join(rootPath, 'Test Results/Performance');
    if (fs.existsSync(perfDir)) {
      const files = fs.readdirSync(perfDir).filter(f => f.endsWith('.json'));
      if (files.length > 0) {
        // Take the latest single execution run as the true load scenario representation
        const latestFile = files.sort().reverse()[0];
        const parsed = JSON.parse(fs.readFileSync(path.join(perfDir, latestFile), 'utf8'));
        const total = parsed.totalRequests || 0;
        
        let avgLat = parsed.avgLatencyMs;
        let avgLatStr = `${Number(avgLat).toFixed(2)}ms`;
        if (avgLat < 0 || isNaN(avgLat)) avgLatStr = 'INVALID/UNAVAILABLE (Negative/Invalid metric)';
        
        summaryData.Load.executed++;
        if (parsed.failed === 0) { summaryData.Load.passed++; } else { summaryData.Load.failed++; }

        loadData.push({
          scenario: `Core API Load Profile (Latest Run)`,
          vus: 'N/A (Load test config)',
          duration: `${parsed.durationMs}ms`,
          totalReq: total,
          success: parsed.success || 0,
          failed: parsed.failed || 0,
          avgLatency: avgLatStr,
          p95: parsed.p95 || 'N/A',
          throughput: parsed.durationMs ? `${(total / (parsed.durationMs / 1000)).toFixed(2)} req/s` : 'N/A',
          threshold: 'N/A',
          status: parsed.failed === 0 ? 'PASS' : 'FAIL',
          evidence: latestFile
        });
      }
    }
  } catch (e) {
    console.error('Error parsing Load logs:', e);
  }

  // Generate Sheets
  // A. Master Summary
  const summaryWs = workbook.addWorksheet('Master Summary');
  summaryWs.columns = [
    { header: 'Testing Type', key: 'type', width: 25 },
    { header: 'Genuine Executed', key: 'executed', width: 20 },
    { header: 'Passed', key: 'passed', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Blocked / Not Verified', key: 'blocked', width: 25 },
    { header: 'Pass Rate', key: 'rate', width: 15 },
    { header: 'Evidence Source', key: 'source', width: 50 }
  ];
  styleHeader(summaryWs);

  Object.keys(summaryData).forEach(key => {
    const d = summaryData[key];
    const rate = d.executed > 0 ? ((d.passed / d.executed) * 100).toFixed(2) + '%' : '0%';
    summaryWs.addRow({
      type: key, executed: d.executed, passed: d.passed, failed: d.failed, blocked: d.blocked, rate: rate, source: d.source
    });
  });

  // B. Audit Notes
  const auditWs = workbook.addWorksheet('Audit Notes');
  auditWs.columns = [{ header: 'Notes', key: 'note', width: 150 }];
  styleHeader(auditWs);
  auditWs.addRow({ note: 'AAVIS Testing Master Report v2 Audit Log' });
  auditWs.addRow({ note: '----------------------------------------' });
  auditWs.addRow({ note: 'The previous 800-row master report (v1) was replaced because generated scenarios and request iterations were incorrectly represented as independently executed test cases.' });
  auditWs.addRow({ note: 'This created an artificially inflated pass rate and total test count (exactly 200 tests per category) by fabricating data through script loops.' });
  auditWs.addRow({ note: 'This V2 report is built STRICTLY from actual, genuine raw execution artifacts (JSON logs) from Selenium, Appium, Load, and Security runners.' });
  auditWs.addRow({ note: 'No fabricated passes were included. Failed and timed-out tests are explicitly listed as FAIL. Invalid load metrics are explicitly marked as INVALID/UNAVAILABLE without generating fake numbers.' });

  // Columns for standard tests
  const standardColumns = [
    { header: 'Test ID', key: 'id', width: 20 },
    { header: 'Testing Type', key: 'type', width: 25 },
    { header: 'Module', key: 'mod', width: 20 },
    { header: 'Scenario', key: 'scenario', width: 40 },
    { header: 'Executed', key: 'executed', width: 15 },
    { header: 'Expected Result', key: 'expected', width: 30 },
    { header: 'Actual Result', key: 'actual', width: 30 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Duration/Metric', key: 'duration', width: 20 },
    { header: 'Raw Evidence File', key: 'evidence', width: 35 },
    { header: 'Failure Reason', key: 'reason', width: 30 },
    { header: 'Remarks', key: 'remarks', width: 30 }
  ];

  addDataSheet('Selenium Tests', standardColumns, seleniumData);
  addDataSheet('Appium Tests', standardColumns, appiumData);
  addDataSheet('Security Tests', standardColumns, securityData);

  // Load Test Columns
  const loadColumns = [
    { header: 'Scenario', key: 'scenario', width: 25 },
    { header: 'VUs/Concurrency', key: 'vus', width: 25 },
    { header: 'Duration', key: 'duration', width: 20 },
    { header: 'Total Requests', key: 'totalReq', width: 15 },
    { header: 'Successful', key: 'success', width: 15 },
    { header: 'Failed', key: 'failed', width: 15 },
    { header: 'Avg Latency', key: 'avgLatency', width: 40 },
    { header: 'P95', key: 'p95', width: 15 },
    { header: 'Throughput', key: 'throughput', width: 20 },
    { header: 'Threshold', key: 'threshold', width: 15 },
    { header: 'Status', key: 'status', width: 15 },
    { header: 'Raw Evidence File', key: 'evidence', width: 35 }
  ];
  addDataSheet('Load Tests', loadColumns, loadData);

  const outputPath = path.join(rootPath, 'Test Results/AAVIS_Testing_Master_Report_v2.xlsx');
  await workbook.xlsx.writeFile(outputPath);
  console.log(`Successfully audited and wrote Excel file to: ${outputPath}`);
}

auditAndRebuildExcel().catch(console.error);
