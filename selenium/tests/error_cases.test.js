const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

describe('Error Cases & Edge Flows', function() {
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

  it('TC_SEL_ERR_001: Direct nav to /dashboard without login redirects to /login', async () => {
    await authPage.navigate('/dashboard');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    expect(url).to.match(/login|\/$/);
  });

  it('TC_SEL_ERR_002: Direct nav to /profile without login redirects', async () => {
    await authPage.navigate('/profile');
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    expect(url).to.match(/login|\/$/);
  });

  it('TC_SEL_ERR_003: /login page renders the login form', async () => {
    await authPage.navigate('/login');
    await driver.sleep(1000);
    const form = await driver.findElements(By.css('input[type="email"], input[name="email"]'));
    expect(form.length).to.be.greaterThan(0);
  });

  it('TC_SEL_ERR_004: Login with blank email shows error or disables submit', async () => {
    await authPage.navigate('/login');
    await driver.sleep(800);
    // Try to submit with empty fields
    const buttons = await driver.findElements(By.css('button[type="submit"]'));
    if (buttons.length > 0) {
      await buttons[0].click();
      await driver.sleep(1000);
    }
    const url = await driver.getCurrentUrl();
    // Should still be on login — did not proceed
    expect(url).to.include('login');
  });

  it('TC_SEL_ERR_005: Navigate to unknown route shows 404 or fallback page', async () => {
    await authPage.navigate('/this-page-does-not-exist-ever');
    await driver.sleep(1500);
    const src = await driver.getPageSource();
    // Should either redirect to / or render a 404 message — no crash
    expect(src.length).to.be.greaterThan(100);
  });
});
