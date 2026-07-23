const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const SettingsPage = require('../pages/SettingsPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_SET — Settings Flow', function () {
  this.timeout(60000);
  let driver, authPage, settingsPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    settingsPage = new SettingsPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await settingsPage.navigate('/settings');
    await settingsPage.wait.waitUntilUrlContains('/settings');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_SET_001: /settings page loads with correct URL', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/settings');
  });

  it('TC_SEL_SET_002: Logout button is present', async () => {
    const logoutBtns = await driver.findElements(settingsPage.logoutBtn);
    expect(logoutBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SET_003: Privacy button is present', async () => {
    const privacyBtns = await driver.findElements(settingsPage.privacyBtn);
    expect(privacyBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SET_004: Clicking Privacy navigates to /privacy', async () => {
    await settingsPage.click(settingsPage.privacyBtn);
    await settingsPage.wait.waitUntilUrlContains('/privacy');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/privacy');
  });

  it('TC_SEL_SET_005: Back button returns from privacy to settings', async () => {
    await settingsPage.navigate('/settings');
    await settingsPage.wait.waitUntilUrlContains('/settings');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/settings');
  });

  it('TC_SEL_SET_006: Terms button is present', async () => {
    const termsBtns = await driver.findElements(settingsPage.termsBtn);
    expect(termsBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SET_007: About button is present', async () => {
    const aboutBtns = await driver.findElements(settingsPage.aboutBtn);
    expect(aboutBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SET_008: Logout redirects to /login', async () => {
    await settingsPage.navigate('/settings');
    await settingsPage.wait.waitUntilUrlContains('/settings');
    await settingsPage.logout();
    await authPage.wait.waitUntilUrlContains('/login');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/login');
  });
});
