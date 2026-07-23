const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
require('chromedriver');
const config = require('../config/config');

class DriverFactory {
  static async build() {
    let builder = new Builder().forBrowser(config.browser);

    if (config.browser === 'chrome') {
      let options = new chrome.Options();
      if (config.isHeadless) options.addArguments('--headless=new');
      options.addArguments('--no-sandbox', '--disable-dev-shm-usage', '--window-size=1920,1080', '--disable-gpu', '--disable-software-rasterizer');
      
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
