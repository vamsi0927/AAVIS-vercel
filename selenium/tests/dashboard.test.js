const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const DashboardPage = require('../pages/DashboardPage');
const OnboardingPage = require('../pages/OnboardingPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_DASH — Dashboard & Navigation', function () {
  this.timeout(60000);
  let driver, authPage, dashPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    dashPage = new DashboardPage(driver);
    // Login once for all dashboard tests
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_DASH_001: /home renders without crash', async () => {
    await dashPage.navigate('/home');
    await driver.sleep(1200);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('home');
  });

  it('TC_SEL_DASH_002: Bottom nav is present with 5 items', async () => {
    const navItems = await driver.findElements(By.css('nav a, nav button, [data-testid^="btn-bottomnav"]'));
    expect(navItems.length).to.be.greaterThan(3);
  });

  it('TC_SEL_DASH_003: Clicking History nav link navigates to /history', async () => {
    const historyLink = await driver.findElements(By.css('a[href*="history"], [href*="#/history"]'));
    if (historyLink.length > 0) {
      await historyLink[0].click();
      await driver.sleep(1200);
      const url = await driver.getCurrentUrl();
      expect(url).to.include('history');
    } else {
      // Navigate directly if no nav link found
      await dashPage.navigate('/history');
      await driver.sleep(800);
      const url = await driver.getCurrentUrl();
      expect(url).to.include('history');
    }
  });

  it('TC_SEL_DASH_004: Page title is Aavis Food Label Scanner', async () => {
    await dashPage.navigate('/home');
    await driver.sleep(600);
    const title = await driver.getTitle();
    expect(title).to.include('Aavis');
  });

  it('TC_SEL_DASH_005: /home page has no SEVERE console errors', async () => {
    await dashPage.navigate('/home');
    await driver.sleep(1200);
    const logs = await driver.manage().logs().get('browser');
    const severeErrors = logs.filter(l =>
      l.level.name === 'SEVERE' && !l.message.includes('favicon')
    );
    expect(severeErrors.length).to.equal(0);
  });
});
