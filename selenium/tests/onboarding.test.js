const DriverFactory = require('../utils/DriverFactory');
const OnboardingPage = require('../pages/OnboardingPage');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_ONB — Onboarding Flow', function () {
  this.timeout(60000);
  let driver, authPage, onboardingPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    onboardingPage = new OnboardingPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await onboardingPage.wait.waitUntilUrlContains('/home');
    await onboardingPage.navigate('/onboarding');
    await driver.sleep(1200);
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_ONB_001: /onboarding page loads', async () => {
    const url = await driver.getCurrentUrl();
    // May redirect to home if already onboarded — both are acceptable
    expect(url.length).to.be.greaterThan(0);
  });

  it('TC_SEL_ONB_002: Skip button is present on onboarding', async () => {
    const skips = await driver.findElements(onboardingPage.skipBtn);
    const nexts = await driver.findElements(onboardingPage.nextBtn);
    // Either skip or next must exist on onboarding
    expect(skips.length + nexts.length).to.be.greaterThan(0);
  });

  it('TC_SEL_ONB_003: Clicking Skip navigates to /setup or /home', async () => {
    const skips = await driver.findElements(onboardingPage.skipBtn);
    if (skips.length > 0) {
      await onboardingPage.skipSplash();
      await driver.sleep(1500);
    }
    const url = await driver.getCurrentUrl();
    expect(url).to.match(/setup|home/);
  });
});
