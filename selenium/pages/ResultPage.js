const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ResultPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.scoreRing = By.css('svg'); 
    this.ingredientsTab = By.css('[data-testid="btn-result-2"]');
    this.alternativesTab = By.css('[data-testid="btn-result-3"]');
    this.warningAlert = By.css('[data-testid="btn-result-1"]');
  }

  async waitForAnalysisComplete() {
    await this.wait.waitForElementVisible(this.scoreRing, 5000); 
  }
}
module.exports = ResultPage;
