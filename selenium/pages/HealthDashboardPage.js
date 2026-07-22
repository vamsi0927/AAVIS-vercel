const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class HealthDashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.prevPeriodBtn = By.css('[data-testid="btn-healthdashboard-1"]');
    this.nextPeriodBtn = By.css('[data-testid="btn-healthdashboard-2"]');
    this.presentPeriodBtn = By.css('[data-testid="btn-healthdashboard-3"]');
    this.weekTabBtn = By.css('[data-testid="btn-healthdashboard-4"]');
    this.monthTabBtn = By.css('[data-testid="btn-healthdashboard-5"]');
    this.chatBtn = By.css('[data-testid="btn-healthdashboard-6"]');
    this.scanHistoryBtn = By.css('[data-testid="btn-healthdashboard-7"]');
  }

  async setTimeRange(range) {
    if (range === 'week') {
      await this.click(this.weekTabBtn);
    } else if (range === 'month') {
      await this.click(this.monthTabBtn);
    }
  }

  async navigateTime(direction) {
    if (direction === 'prev') {
      await this.click(this.prevPeriodBtn);
    } else if (direction === 'next') {
      await this.click(this.nextPeriodBtn);
    } else if (direction === 'present') {
      await this.click(this.presentPeriodBtn);
    }
  }
}
module.exports = HealthDashboardPage;
