const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.healthScoreCard = By.css('[data-testid="btn-healthdashboard-1"]');
    this.waterTrackerBtn = By.css('[data-testid="btn-watertracker-1"]');
    this.scanNav = By.css('nav a[href="/scan"]');
  }

  async navigateToScan() {
    await this.click(this.scanNav);
  }

  async addWater() {
    await this.click(this.waterTrackerBtn);
  }

  async getDashboardVisibility() {
    try {
      await this.wait.waitForElementVisible(this.healthScoreCard);
      return true;
    } catch {
      return false; 
    }
  }
}
module.exports = DashboardPage;
