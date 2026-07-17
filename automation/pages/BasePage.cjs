class BasePage {
  constructor(driver) {
    this.driver = driver;
  }

  async findElement(selector) {
    return await this.driver.$(selector);
  }

  async click(selector) {
    const el = await this.findElement(selector);
    await el.waitForClickable({ timeout: 10000 });
    await el.click();
  }

  async type(selector, text) {
    const el = await this.findElement(selector);
    await el.waitForExist({ timeout: 10000 });
    await el.setValue(text);
  }

  async getText(selector) {
    const el = await this.findElement(selector);
    await el.waitForExist({ timeout: 10000 });
    return await el.getText();
  }

  async isVisible(selector) {
    try {
      const el = await this.findElement(selector);
      return await el.isDisplayed();
    } catch (e) {
      return false;
    }
  }
}

module.exports = BasePage;
