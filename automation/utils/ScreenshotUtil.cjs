const fs = require('fs');
const path = require('path');
const Logger = require('./Logger.cjs');

class ScreenshotUtil {
  static async capture(driver, testId) {
    try {
      const dir = './automation/screenshots';
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const filePath = path.join(dir, `${testId}_${Date.now()}.png`);
      const screenshot = await driver.takeScreenshot();
      fs.writeFileSync(filePath, screenshot, 'base64');
      Logger.info(`Screenshot successfully captured for ${testId} at ${filePath}`);
      return filePath;
    } catch (err) {
      Logger.error(`Failed to capture screenshot for ${testId}`, err);
      return null;
    }
  }
}

module.exports = ScreenshotUtil;
