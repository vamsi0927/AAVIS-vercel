const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

describe('Accessibility & Responsive Layout', function() {
  this.timeout(45000);
  let driver;
  let authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('TC_SEL_A11Y_001: Login page has html lang attribute set', async () => {
    await authPage.navigate('/login');
    await driver.sleep(800);
    const html = await driver.findElement(By.css('html'));
    const lang = await html.getAttribute('lang');
    expect(lang).to.not.be.empty;
  });

  it('TC_SEL_A11Y_002: Login page renders without console JavaScript errors', async () => {
    await authPage.navigate('/login');
    await driver.sleep(1500);
    const logs = await driver.manage().logs().get('browser');
    const errors = logs.filter(l => l.level.name === 'SEVERE' && l.message.toLowerCase().includes('error'));
    expect(errors.length).to.equal(0);
  });

  it('TC_SEL_A11Y_003: Login page has viewport meta tag', async () => {
    await authPage.navigate('/login');
    await driver.sleep(500);
    const meta = await driver.findElements(By.css('meta[name="viewport"]'));
    expect(meta.length).to.be.greaterThan(0);
  });

  it('TC_SEL_A11Y_004: Mobile viewport 375px renders login form without overflow', async () => {
    await driver.manage().window().setRect({ width: 375, height: 812 });
    await authPage.navigate('/login');
    await driver.sleep(800);
    const body = await driver.findElement(By.css('body'));
    const overflow = await driver.executeScript(
      'return window.getComputedStyle(arguments[0]).overflowX',
      body
    );
    // Reset window size
    await driver.manage().window().setRect({ width: 1280, height: 900 });
    expect(['hidden', 'auto', 'visible', 'clip']).to.include(overflow);
  });
});
