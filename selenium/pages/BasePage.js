const WaitUtils = require('../utils/WaitUtils');

class BasePage {
  constructor(driver) {
    this.driver = driver;
    this.wait = new WaitUtils(driver);
  }

  async navigate(path = '') {
    const config = require('../config/config');
    const hashPath = path.startsWith('/') ? '/#' + path : '/#/' + path;
    await this.driver.get(config.baseUrl + hashPath);
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
