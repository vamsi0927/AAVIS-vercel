const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../Test Results/Excel');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}
const outputPath = path.join(outputDir, 'AAVIS_Testing_Master_Report.xlsx');

// Helper to create empty styled sheets
const createSheet = (headers) => {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  return ws;
};

// 1. Master Summary
const summaryHeaders = ['Category', 'Designed', 'Automated', 'Executed', 'Passed', 'Failed', 'Blocked', 'Not Run', 'Pass Rate'];
const summaryData = [
  ['Selenium Web E2E', 325, 10, 10, 0, 0, 0, 315, '0%'],
  ['Appium Android E2E', 325, 6, 0, 0, 0, 0, 325, '0%'],
  ['Security', 320, 20, 0, 0, 0, 0, 320, '0%'],
  ['API + Load/Performance', 330, 10, 0, 0, 0, 0, 330, '0%'],
  ['Integration + Data Sync', 315, 0, 0, 0, 0, 0, 315, '0%'],
  ['CI/CD & Compatibility', 305, 5, 0, 0, 0, 0, 305, '0%'],
  ['TOTAL', 1920, 51, 10, 0, 0, 0, 1910, '0%']
];

const wb = XLSX.utils.book_new();

const wsSummary = XLSX.utils.aoa_to_sheet([summaryHeaders, ...summaryData]);
XLSX.utils.book_append_sheet(wb, wsSummary, 'Master Summary');

// Generic headers for test case sheets
const tcHeaders = ['Test ID', 'Requirement ID', 'Module', 'Scenario', 'Preconditions', 'Steps', 'Test Data', 'Expected Result', 'Actual Result', 'Status', 'Automation Status', 'Script Ref', 'Bug Ref', 'Evidence'];

// 2. Traceability Matrix
const reqHeaders = ['Requirement ID', 'Description', 'Component', 'Test Case IDs', 'Status'];
XLSX.utils.book_append_sheet(wb, createSheet(reqHeaders), 'Traceability Matrix');

// 3. Test Category Sheets
const categories = ['Selenium', 'Appium', 'Security', 'API', 'Load_Perf', 'Integration', 'CI_CD'];
categories.forEach(cat => {
  XLSX.utils.book_append_sheet(wb, createSheet(tcHeaders), cat);
});

// 4. Bug Report
const bugHeaders = ['Bug ID', 'Title', 'Description', 'Severity', 'Status', 'Found In Test', 'Fix Applied', 'Retest Status'];
XLSX.utils.book_append_sheet(wb, createSheet(bugHeaders), 'Bug Report');

// 5. Execution History
const historyHeaders = ['Run ID', 'Date', 'Environment', 'Trigger', 'Total Tests', 'Passed', 'Failed', 'Pass Rate'];
XLSX.utils.book_append_sheet(wb, createSheet(historyHeaders), 'Execution History');

XLSX.writeFile(wb, outputPath);
console.log(`Generated AAVIS_Testing_Master_Report.xlsx at ${outputPath}`);
