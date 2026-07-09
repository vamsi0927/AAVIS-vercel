const DriverFactory = require('../utils/DriverFactory');
const DashboardPage = require('../pages/DashboardPage');
const { expect } = require('chai');

describe('Dashboard Flow (Suite 3)', function() {
  this.timeout(45000);
  let driver;
  let dashboardPage;

  before(async () => {
    driver = await DriverFactory.build();
    dashboardPage = new DashboardPage(driver);
    const AuthPage = require('../pages/AuthPage');
    const authPage = new AuthPage(driver);
    await authPage.login('test@aavis.app', 'TestPassword123!');
    await dashboardPage.wait.waitUntilUrlContains('/home');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should load all dashboard widgets', async () => {
    await dashboardPage.navigate('/home');
    const isVisible = await dashboardPage.getDashboardVisibility();
    expect(isVisible).to.be.true;
  });

  it('should navigate to Scan page via Bottom Nav', async () => {
    await dashboardPage.navigateToScan();
    await dashboardPage.wait.waitUntilUrlContains('/scan');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/scan');
  });
});
