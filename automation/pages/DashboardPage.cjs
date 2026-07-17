const BasePage = require('./BasePage.cjs');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.historyTab = '[data-testid="nav-history"]';
    this.scanTab = '[data-testid="nav-scan"]';
    this.profileTab = '[data-testid="nav-profile"]';
    this.dashboardTab = '[data-testid="nav-dashboard"]';
  }

  async goToHistory() {
    await this.click(this.historyTab);
  }

  async goToScan() {
    await this.click(this.scanTab);
  }

  async goToProfile() {
    await this.click(this.profileTab);
  }

  async goToDashboard() {
    await this.click(this.dashboardTab);
  }
}

module.exports = DashboardPage;
