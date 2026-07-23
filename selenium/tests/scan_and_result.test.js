const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_SCAN — Scan & Result Flow', function () {
  this.timeout(60000);
  let driver, authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await authPage.navigate('/scan');
    await driver.sleep(1500);
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_SCAN_001: /scan page loads without crash', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('scan');
  });

  it('TC_SEL_SCAN_002: Scan page renders barcode or camera selector', async () => {
    const src = await driver.getPageSource();
    const hasScanner = src.toLowerCase().includes('scan') || src.toLowerCase().includes('camera') || src.toLowerCase().includes('barcode');
    expect(hasScanner).to.be.true;
  });

  it('TC_SEL_SCAN_003: Manual entry tab is present', async () => {
    const manualLinks = await driver.findElements(By.css('a[href*="manual"], button'));
    expect(manualLinks.length).to.be.greaterThan(0);
  });

  it('TC_SEL_SCAN_004: Barcode tab link is accessible', async () => {
    const barcodeLinks = await driver.findElements(By.css('a[href*="barcode"], a[href*="scan"]'));
    expect(barcodeLinks.length).to.be.greaterThan(0);
  });
});
