const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const HistoryPage = require('../pages/HistoryPage');
const { expect } = require('chai');
const { until, By, Key } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_HIST — History Flow', function () {
  this.timeout(60000);
  let driver, authPage, historyPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    historyPage = new HistoryPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await historyPage.navigate('/history');
    await historyPage.wait.waitUntilUrlContains('/history');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_HIST_001: /history page loads and URL is correct', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/history');
  });

  it('TC_SEL_HIST_002: Search input control is rendered', async () => {
    const searchFields = await driver.findElements(historyPage.searchInput);
    expect(searchFields.length).to.be.greaterThan(0);
  });

  it('TC_SEL_HIST_003: View Saved button is rendered', async () => {
    const viewSaved = await driver.findElements(historyPage.viewSavedBtn);
    expect(viewSaved.length).to.be.greaterThan(0);
  });

  it('TC_SEL_HIST_004: Searching for nonexistent item returns no results', async () => {
    await historyPage.searchHistory('ZZZ_NO_MATCH_XYZ_999');
    await driver.sleep(1000);
    const items = await driver.findElements(historyPage.historyItemBtn);
    expect(items.length).to.equal(0);
  });

  it('TC_SEL_HIST_005: Clearing search input empties the field', async () => {
    const input = await driver.findElement(historyPage.searchInput);
    await input.sendKeys(Key.CONTROL, 'a', Key.DELETE);
    await driver.sleep(500);
    const val = await input.getAttribute('value');
    expect(val).to.equal('');
  });

  it('TC_SEL_HIST_006: Filter button is present on history page', async () => {
    const filterBtns = await driver.findElements(historyPage.filterBtn);
    expect(filterBtns.length).to.be.greaterThan(0);
  });
});
