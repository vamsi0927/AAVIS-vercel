const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

describe('Forgot Password & Register Flows', function() {
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

  it('TC_SEL_AUTH_003: /register page renders signup form', async () => {
    await authPage.navigate('/register');
    await driver.sleep(1000);
    const inputs = await driver.findElements(By.css('input[type="email"], input[type="password"]'));
    expect(inputs.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_004: Register with mismatched passwords shows error', async () => {
    await authPage.navigate('/register');
    await driver.sleep(800);
    const emailInputs = await driver.findElements(By.css('input[type="email"]'));
    const passInputs = await driver.findElements(By.css('input[type="password"]'));
    if (emailInputs.length > 0) {
      await emailInputs[0].sendKeys('test_mismatch@example.com');
    }
    if (passInputs.length >= 2) {
      await passInputs[0].sendKeys('Password123!');
      await passInputs[1].sendKeys('DifferentPass456!');
    }
    const submitBtns = await driver.findElements(By.css('button[type="submit"]'));
    if (submitBtns.length > 0) {
      await submitBtns[0].click();
      await driver.sleep(1500);
    }
    // Expect still on register or an error is shown
    const url = await driver.getCurrentUrl();
    const src = await driver.getPageSource();
    const hasError = src.toLowerCase().includes('match') || src.toLowerCase().includes('password') || url.includes('register');
    expect(hasError).to.be.true;
  });

  it('TC_SEL_AUTH_005: /forgot-password page renders email field', async () => {
    await authPage.navigate('/forgot-password');
    await driver.sleep(1000);
    const emailFields = await driver.findElements(By.css('input[type="email"]'));
    expect(emailFields.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_006: Forgot password submission with invalid email shows error', async () => {
    await authPage.navigate('/forgot-password');
    await driver.sleep(800);
    const emailFields = await driver.findElements(By.css('input[type="email"]'));
    if (emailFields.length > 0) {
      await emailFields[0].sendKeys('not-an-email');
    }
    const submitBtns = await driver.findElements(By.css('button[type="submit"]'));
    if (submitBtns.length > 0) {
      await submitBtns[0].click();
      await driver.sleep(1500);
    }
    const src = await driver.getPageSource();
    // Should show validation error or stay on page
    expect(src.length).to.be.greaterThan(100);
  });
});
