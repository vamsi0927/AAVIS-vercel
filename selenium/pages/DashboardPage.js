const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.healthScoreCard = By.css('[data-testid="btn-home-1"]');
    this.waterTrackerBtn = By.css('[data-testid="btn-watertracker-1"]');
    this.scanNav = By.css('[data-testid="btn-bottomnav-scan"]');
  }

  async navigateToScan() {
    // The scan button is absolutely positioned (-top-10) and may not pass
    // Selenium's elementIsVisible check even when rendered. Use JS click.
    const el = await this.wait.waitForElementVisible(this.scanNav);
    await this.driver.executeScript('arguments[0].click();', el);
  }

  async addWater() {
    await this.click(this.waterTrackerBtn);
  }

  async getDashboardVisibility() {
    try {
      const el = await this.wait.waitForElementVisible(this.healthScoreCard);
      return el !== null;
    } catch {
      return false; 
    }
  }
}
module.exports = DashboardPage;
