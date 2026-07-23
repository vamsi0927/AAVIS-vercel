const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const SearchPage = require('../pages/SearchPage');
const { expect } = require('chai');
const { By, Key } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_SRCH — Search Flow', function () {
  this.timeout(60000);
  let driver, authPage, searchPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    searchPage = new SearchPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await searchPage.navigate('/search');
    await searchPage.wait.waitUntilUrlContains('/search');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_SRCH_001: /search page loads correctly', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/search');
  });

  it('TC_SEL_SRCH_002: Search input is rendered', async () => {
    const inputs = await driver.findElements(searchPage.searchInput);
    expect(inputs.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SRCH_003: Typing in search input updates its value', async () => {
    const input = await driver.findElement(searchPage.searchInput);
    await input.clear();
    await input.sendKeys('apple juice');
    await driver.sleep(500);
    const val = await input.getAttribute('value');
    expect(val).to.include('apple');
  });

  it('TC_SEL_SRCH_004: Clearing search input empties field', async () => {
    const input = await driver.findElement(searchPage.searchInput);
    await input.sendKeys(Key.CONTROL, 'a', Key.DELETE);
    await driver.sleep(400);
    const val = await input.getAttribute('value');
    expect(val).to.equal('');
  });

  it('TC_SEL_SRCH_005: Trending term buttons are visible', async () => {
    const trending = await driver.findElements(searchPage.trendingTermBtn);
    expect(trending.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SRCH_006: Clicking a trending term populates search input', async () => {
    const trending = await driver.findElements(searchPage.trendingTermBtn);
    if (trending.length > 0) {
      await trending[0].click();
      await driver.sleep(700);
      const input = await driver.findElement(searchPage.searchInput);
      const val = await input.getAttribute('value');
      expect(val.length).to.be.greaterThan(0);
    }
  });

  it('TC_SEL_SRCH_007: Back button is present on search page', async () => {
    const backBtns = await driver.findElements(searchPage.backBtn);
    expect(backBtns.length).to.be.greaterThan(0);
  });
});
