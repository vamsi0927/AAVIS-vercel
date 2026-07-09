const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const SettingsPage = require('../pages/SettingsPage');
const { expect } = require('chai');

describe('Settings Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;
  let settingsPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    settingsPage = new SettingsPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to settings', async () => {
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await authPage.wait.waitUntilUrlContains('/home');
    await settingsPage.navigate('/settings');
    await settingsPage.wait.waitUntilUrlContains('/settings');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/settings');
  });

  it('should navigate to Privacy page', async () => {
    await settingsPage.click(settingsPage.privacyBtn);
    await settingsPage.wait.waitUntilUrlContains('/privacy');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/privacy');
  });

  it('should logout successfully', async () => {
    // Navigate back to settings
    await settingsPage.navigate('/settings');
    await settingsPage.wait.waitUntilUrlContains('/settings');
    
    await settingsPage.logout();
    await authPage.wait.waitUntilUrlContains('/login');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/login');
  });
});
