const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const SearchPage = require('../pages/SearchPage');
const { expect } = require('chai');
const { until, By, Key } = require('selenium-webdriver');

describe('Search Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;
  let searchPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    searchPage = new SearchPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to search', async () => {
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await authPage.wait.waitUntilUrlContains('/home');
    await searchPage.navigate('/search');
    await searchPage.wait.waitUntilUrlContains('/search');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/search');
  });

  it('should render trending searches', async () => {
    const trendingBtns = await driver.findElements(searchPage.trendingTermBtn);
    expect(trendingBtns.length).to.be.greaterThan(0);
  });

  it('should show AI search button when typing', async () => {
    await searchPage.search('Maggie Noodles');
    await driver.sleep(500); // Wait for React to render Ask AI button
    
    const aiBtn = await driver.wait(until.elementLocated(searchPage.askAiBtnPrimary), 5000);
    expect(await aiBtn.isDisplayed()).to.be.true;
  });

  it('should clear search input', async () => {
    const input = await driver.findElement(searchPage.searchInput);
    await input.sendKeys(Key.CONTROL, 'a', Key.DELETE);
    await driver.sleep(500);
    
    const val = await input.getAttribute('value');
    expect(val).to.equal('');
  });
});
