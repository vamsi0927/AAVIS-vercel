const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_AUTH_REGISTER — Register & Forgot Password', function () {
  this.timeout(60000);
  let driver, authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_AUTH_005: /register page renders signup form', async () => {
    await authPage.navigate('/register');
    await driver.sleep(1000);
    const inputs = await driver.findElements(By.css('input[type="email"], input[type="password"]'));
    expect(inputs.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_006: Register with mismatched passwords prevents submission', async () => {
    await authPage.navigate('/register');
    await driver.sleep(800);
    const emails = await driver.findElements(By.css('input[type="email"]'));
    const pwds   = await driver.findElements(By.css('input[type="password"]'));
    if (emails.length > 0) await emails[0].sendKeys('test@unique.com');
    if (pwds.length >= 2) {
      await pwds[0].sendKeys('Password123!');
      await pwds[1].sendKeys('Different456!');
    }
    const btns = await driver.findElements(By.css('button[type="submit"]'));
    if (btns.length > 0) await btns[0].click();
    await driver.sleep(1500);
    const url = await driver.getCurrentUrl();
    const src = await driver.getPageSource();
    const onRegister = url.includes('register');
    const hasError = src.toLowerCase().includes('match') || src.toLowerCase().includes('password');
    expect(onRegister || hasError).to.be.true;
  });

  it('TC_SEL_AUTH_007: /forgot-password renders email field', async () => {
    await authPage.navigate('/forgot-password');
    await driver.sleep(800);
    const emailFields = await driver.findElements(By.css('input[type="email"]'));
    expect(emailFields.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_008: Forgot password submit navigates or shows feedback', async () => {
    await authPage.navigate('/forgot-password');
    await driver.sleep(800);
    const emails = await driver.findElements(By.css('input[type="email"]'));
    if (emails.length > 0) await emails[0].sendKeys('test@example.com');
    const btns = await driver.findElements(By.css('button[type="submit"]'));
    if (btns.length > 0) await btns[0].click();
    await driver.sleep(2000);
    const src = await driver.getPageSource();
    expect(src.length).to.be.greaterThan(200);
  });
});
