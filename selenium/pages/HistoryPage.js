const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class HistoryPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.clearHistoryBtn = By.css('[data-testid="btn-history-1"]');
    this.viewSavedBtn = By.css('[data-testid="btn-history-2"]');
    this.searchInput = By.css('[data-testid="input-history-1"]');
    this.filterBtn = By.css('[data-testid="btn-history-3"]');
    this.scanNowEmptyBtn = By.css('[data-testid="btn-history-4"]');
    this.historyItemBtn = By.css('[data-testid="btn-history-5"]');
    this.cancelDeleteBtn = By.css('[data-testid="btn-history-6"]');
    this.confirmDeleteBtn = By.css('[data-testid="btn-history-7"]');
    this.closeImageBtn = By.css('[data-testid="btn-history-8"]');
  }

  async searchHistory(query) {
    await this.type(this.searchInput, query);
  }

  async clearSearch() {
    const el = await this.wait.waitForElementVisible(this.searchInput);
    // React handles backspace/delete better than clear() for simple text inputs if value isn't bound well,
    // but BasePage.js type() has clear() which usually works for text. 
    // We'll just pass empty string to trigger type which calls clear()
    await this.type(this.searchInput, ' '); 
    await el.clear();
  }
}
module.exports = HistoryPage;
