const fs = require('fs');
const path = require('path');

const write = (file, content) => {
  const fullPath = path.join(process.cwd(), file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

write('selenium/config/config.js', `
require('dotenv').config();
module.exports = {
  baseUrl: process.env.BASE_URL || 'https://aavis.vercel.app',
  browser: process.env.BROWSER || 'chrome',
  isHeadless: process.env.HEADLESS !== 'false',
  timeout: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  },
  mobileEmulation: process.env.MOBILE === 'true'
};
`);

write('selenium/utils/DriverFactory.js', `
const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const config = require('../config/config');

class DriverFactory {
  static async build() {
    let builder = new Builder().forBrowser(config.browser);

    if (config.browser === 'chrome') {
      let options = new chrome.Options();
      if (config.isHeadless) options.addArguments('--headless=new');
      options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080');
      
      if (config.mobileEmulation) {
        options.setMobileEmulation({ deviceName: 'Pixel 5' });
      }
      
      builder.setChromeOptions(options);
    }

    const driver = await builder.build();
    await driver.manage().setTimeouts(config.timeout);
    return driver;
  }
}
module.exports = DriverFactory;
`);

write('selenium/utils/WaitUtils.js', `
const { until } = require('selenium-webdriver');

class WaitUtils {
  constructor(driver) {
    this.driver = driver;
    this.timeout = 15000;
  }

  async waitForElementVisible(locator) {
    return await this.driver.wait(until.elementLocated(locator), this.timeout);
  }

  async waitForElementClickable(locator) {
    const el = await this.waitForElementVisible(locator);
    return await this.driver.wait(until.elementIsVisible(el), this.timeout);
  }
}
module.exports = WaitUtils;
`);

write('selenium/pages/BasePage.js', `
const WaitUtils = require('../utils/WaitUtils');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.wait = new WaitUtils(driver);
  }

  async navigate(path = '') {
    const config = require('../config/config');
    await this.driver.get(config.baseUrl + path);
  }

  async click(locator) {
    const el = await this.wait.waitForElementClickable(locator);
    await el.click();
  }

  async type(locator, text) {
    const el = await this.wait.waitForElementVisible(locator);
    await el.clear();
    await el.sendKeys(text);
  }
}
module.exports = BasePage;
`);

write('selenium/pages/AuthPage.js', `
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class AuthPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
  }

  async login(email, password) {
    await this.navigate('/login');
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }
}
module.exports = AuthPage;
`);

write('selenium/tests/auth.test.js', `
const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

describe('Authentication Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should navigate to login page', async () => {
    await authPage.navigate('/login');
    const title = await driver.getTitle();
    expect(title).to.include('Aavis'); // Add your actual expected title
  });
  
  it('should show error on invalid credentials', async () => {
    await authPage.login('invalid@example.com', 'wrongpassword123');
    // We expect an error toast or message. Adapt the selector to your app.
    const errorMsg = await driver.wait(until.elementLocated(By.css('.toast-error, [role="alert"]')), 10000);
    const text = await errorMsg.getText();
    expect(text).to.not.be.empty;
  });
});
`);

console.log('Setup script complete.');
