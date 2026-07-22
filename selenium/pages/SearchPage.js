const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class SearchPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.backBtn = By.css('[data-testid="btn-search-1"]');
    this.searchInput = By.css('[data-testid="input-search-1"]');
    this.trendingTermBtn = By.css('[data-testid="btn-search-2"]');
    this.recentSearchBtn = By.css('[data-testid="btn-search-3"]');
    this.askAiBtnPrimary = By.css('[data-testid="btn-search-4"]');
    this.askAiBtnAlt = By.css('[data-testid="btn-search-5"]');
    this.clearAiBtn = By.css('[data-testid="btn-search-6"]');
    this.searchResultBtn = By.css('[data-testid="btn-search-7"]');
  }

  async search(query) {
    await this.type(this.searchInput, query);
  }

  async askAi() {
    await this.click(this.askAiBtnPrimary);
  }
}
module.exports = SearchPage;
