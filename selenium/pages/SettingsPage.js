const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class SettingsPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.backBtn = By.css('[data-testid="btn-settings-1"]');
    this.toggleThemeBtn = By.css('[data-testid="btn-settings-2"]');
    this.cameraPermissionBtn = By.css('[data-testid="btn-settings-3"]');
    this.clearHistoryBtn = By.css('[data-testid="btn-settings-4"]');
    this.privacyBtn = By.css('[data-testid="btn-settings-5"]');
    this.termsBtn = By.css('[data-testid="btn-settings-6"]');
    this.helpBtn = By.css('[data-testid="btn-settings-7"]');
    this.contactBtn = By.css('[data-testid="btn-settings-8"]');
    this.aboutBtn = By.css('[data-testid="btn-settings-9"]');
    this.logoutBtn = By.css('[data-testid="btn-settings-10"]');
  }

  async logout() {
    const el = await this.wait.waitForElementVisible(this.logoutBtn);
    await this.driver.executeScript("arguments[0].scrollIntoView({behavior: 'instant', block: 'center'});", el);
    await this.driver.sleep(500);
    // Force click using JS to bypass any overlay visibility issues
    await this.driver.executeScript("arguments[0].click();", el);
  }
}
module.exports = SettingsPage;
