const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const HistoryPage = require('../pages/HistoryPage');
const { expect } = require('chai');
const { until, By, Key } = require('selenium-webdriver');

describe('History Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;
  let historyPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    historyPage = new HistoryPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to history', async () => {
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await authPage.wait.waitUntilUrlContains('/home');
    await historyPage.navigate('/history');
    await historyPage.wait.waitUntilUrlContains('/history');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/history');
  });

  it('should render history page controls', async () => {
    // Check if search input exists
    const searchExists = await driver.findElements(historyPage.searchInput);
    expect(searchExists.length).to.be.greaterThan(0);
    
    // Check if view saved button exists
    const viewSavedExists = await driver.findElements(historyPage.viewSavedBtn);
    expect(viewSavedExists.length).to.be.greaterThan(0);
  });

  it('should filter history items using search', async () => {
    await historyPage.searchHistory('NonExistentItem123');
    await driver.sleep(1000); // Wait for React re-render
    
    // After searching for non-existent, there should be no history item buttons displayed
    const items = await driver.findElements(historyPage.historyItemBtn);
    expect(items.length).to.equal(0);
  });
  
  it('should clear history search', async () => {
    const input = await driver.findElement(historyPage.searchInput);
    await input.sendKeys(Key.CONTROL, 'a', Key.DELETE);
    await driver.sleep(500); // Wait for React re-render
    
    const val = await input.getAttribute('value');
    expect(val).to.equal('');
  });
});
