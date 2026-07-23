const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_AUTH — Authentication Flow', function () {
  this.timeout(60000);
  let driver, authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_AUTH_001: /login renders email + password inputs', async () => {
    await authPage.navigate('/login');
    await driver.sleep(1000);
    const emails = await driver.findElements(By.css('input[type="email"]'));
    const pwds   = await driver.findElements(By.css('input[type="password"]'));
    expect(emails.length).to.be.greaterThan(0);
    expect(pwds.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_002: Invalid credentials shows error toast', async () => {
    await authPage.login('bad@bad.com', 'wrongpass999');
    const toast = await driver.wait(
      until.elementLocated(By.css('[data-sonner-toast], [role="alert"], .toast')), 10000
    );
    const text = await toast.getText();
    expect(text.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_003: Submit button is present on /login', async () => {
    await authPage.navigate('/login');
    await driver.sleep(800);
    const btns = await driver.findElements(By.css('button[type="submit"]'));
    expect(btns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_AUTH_004: Successful login with valid creds redirects to /home', async () => {
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await driver.wait(until.urlContains('home'), 15000);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/home');
  });
});
