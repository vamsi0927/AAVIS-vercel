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

  async waitUntilUrlContains(substring) {
    return await this.driver.wait(until.urlContains(substring), this.timeout);
  }
}
module.exports = WaitUtils;
