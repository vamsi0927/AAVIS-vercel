const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const assert = require('assert');

describe('AAVIS Selenium E2E Login Test', function () {
  let driver;

  before(async function () {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  });

  after(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  it('should successfully log in and redirect to home dashboard', async function () {
    const baseUrl = process.env.BASE_URL || 'https://vamsi0927.github.io/AAVIS-vercel';
    const targetUrl = `${baseUrl}/#/login`;
    
    console.log(`Navigating to: ${targetUrl}`);
    await driver.get(targetUrl);

    // Wait for the email input field to exist
    const emailField = await driver.wait(
      until.elementLocated(By.css('[data-testid="input-login-1"]')),
      15000
    );

    // Enter test credentials
    await emailField.sendKeys('attalurivamsi0905@gmail.com');

    const passwordField = await driver.findElement(By.css('[data-testid="input-login-2"]'));
    await passwordField.sendKeys('vamsi12345');

    // Click Login Button
    const loginButton = await driver.findElement(By.css('[data-testid="btn-login-1"]'));
    await loginButton.click();

    console.log('Login credentials submitted. Waiting for dashboard navigation...');

    try {
      // Wait for URL redirect to contain #/home
      await driver.wait(async () => {
        const currentUrl = await driver.getCurrentUrl();
        return currentUrl.includes('#/home') || currentUrl.endsWith('/#/');
      }, 15000);

      const finalUrl = await driver.getCurrentUrl();
      console.log(`Successfully navigated to: ${finalUrl}`);
      
      assert.ok(
        finalUrl.includes('#/home') || finalUrl.endsWith('/#/'),
        `Failed redirect. Final URL: ${finalUrl}`
      );
    } catch (err) {
      const currentUrl = await driver.getCurrentUrl();
      const bodyText = await driver.findElement(By.tagName('body')).getText();
      console.log(`[TEST FAILED] URL: ${currentUrl}`);
      console.log(`[TEST FAILED] Page Text: ${bodyText.substring(0, 500)}`);
      
      try {
        const logs = await driver.manage().logs().get('browser');
        console.log('--- BROWSER CONSOLE LOGS ---');
        logs.forEach(log => console.log(`[${log.level.name}] ${log.message}`));
        console.log('----------------------------');
      } catch (e) {
        console.log('Could not fetch browser logs:', e.message);
      }
      
      const fs = require('fs');
      try {
        const screenshot = await driver.takeScreenshot();
        fs.writeFileSync('C:\\Users\\anvkp\\.gemini\\antigravity\\brain\\0b929305-8c25-4dd0-b6b7-c261f8eaeaa4\\scratch\\screenshot.png', screenshot, 'base64');
        console.log('Error screenshot saved.');
      } catch (e) {}
      throw err;
    }
  });
});
