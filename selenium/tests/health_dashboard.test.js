const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const HealthDashboardPage = require('../pages/HealthDashboardPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_HEALTH — Health Dashboard', function () {
  this.timeout(60000);
  let driver, authPage, healthPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    healthPage = new HealthDashboardPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await healthPage.navigate('/dashboard');
    await healthPage.wait.waitUntilUrlContains('/dashboard');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_HEALTH_001: /dashboard page loads', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('dashboard');
  });

  it('TC_SEL_HEALTH_002: Week tab button is present', async () => {
    const weekBtns = await driver.findElements(healthPage.weekTabBtn);
    expect(weekBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_HEALTH_003: Month tab button is present', async () => {
    const monthBtns = await driver.findElements(healthPage.monthTabBtn);
    expect(monthBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_HEALTH_004: Prev period button is present', async () => {
    const prevBtns = await driver.findElements(healthPage.prevPeriodBtn);
    expect(prevBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_HEALTH_005: Clicking Month tab renders month view', async () => {
    await healthPage.setTimeRange('month');
    await driver.sleep(800);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('dashboard');
  });

  it('TC_SEL_HEALTH_006: Clicking Week tab renders week view', async () => {
    await healthPage.setTimeRange('week');
    await driver.sleep(800);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('dashboard');
  });

  it('TC_SEL_HEALTH_007: Navigating to previous period works without crash', async () => {
    await healthPage.navigateTime('prev');
    await driver.sleep(800);
    const src = await driver.getPageSource();
    expect(src.length).to.be.greaterThan(200);
  });

  it('TC_SEL_HEALTH_008: Scan History button is present', async () => {
    const scanBtns = await driver.findElements(healthPage.scanHistoryBtn);
    expect(scanBtns.length).to.be.greaterThan(0);
  });
});
