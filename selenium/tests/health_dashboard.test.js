const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const HealthDashboardPage = require('../pages/HealthDashboardPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

describe('Health Dashboard Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;
  let dashboardPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    dashboardPage = new HealthDashboardPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to health dashboard', async () => {
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await authPage.wait.waitUntilUrlContains('/home');
    await dashboardPage.navigate('/dashboard');
    await dashboardPage.wait.waitUntilUrlContains('/dashboard');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/dashboard');
  });

  it('should toggle time ranges', async () => {
    await dashboardPage.setTimeRange('month');
    await driver.sleep(500); // Wait for React to switch tabs
    await dashboardPage.setTimeRange('week');
    await driver.sleep(500);
  });

  it('should navigate time periods', async () => {
    // Go to previous period
    const prevBtn = await driver.findElement(dashboardPage.prevPeriodBtn);
    if (await prevBtn.isEnabled()) {
        await dashboardPage.navigateTime('prev');
        await driver.sleep(500);
    }
    
    // Test if 'present' button becomes enabled and click it
    const presentBtn = await driver.findElement(dashboardPage.presentPeriodBtn);
    if (await presentBtn.isEnabled()) {
        await dashboardPage.navigateTime('present');
        await driver.sleep(500);
    }
  });

  it('should open AI Chat', async () => {
    await dashboardPage.click(dashboardPage.chatBtn);
    await dashboardPage.wait.waitUntilUrlContains('/dashboard/chat');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/dashboard/chat');
  });
});
