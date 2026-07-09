const DriverFactory = require('../utils/DriverFactory');
const ScanPage = require('../pages/ScanPage');
const ResultPage = require('../pages/ResultPage');
const { expect } = require('chai');

describe('Scan & Result Flow (Suites 4 & 5)', function() {
  this.timeout(90000); // 90 seconds because AI analysis is slow
  let driver;
  let scanPage;
  let resultPage;

  before(async () => {
    driver = await DriverFactory.build();
    scanPage = new ScanPage(driver);
    resultPage = new ResultPage(driver);
    const AuthPage = require('../pages/AuthPage');
    const authPage = new AuthPage(driver);
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await scanPage.wait.waitUntilUrlContains('/home');
    await scanPage.navigate('/scan/manual');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should execute a manual scan and view results', async () => {
    await scanPage.navigate('/scan/manual');
    
    // Perform Scan
    await scanPage.performManualScan('Diet Coke', 'Carbonated water, Aspartame, Caffeine, Caramel Color');
    
    // Wait for AI Analysis
    await resultPage.waitForAnalysisComplete();
    
    // Assert we are on the results page
    await resultPage.wait.waitUntilUrlContains('/result');
    
    // Switch to ingredients tab (Removed in new UI)
    // await resultPage.click(resultPage.ingredientsTab);
    
    // Switch to alternatives tab (Removed in new UI)
    // await resultPage.click(resultPage.alternativesTab);
  });
});
