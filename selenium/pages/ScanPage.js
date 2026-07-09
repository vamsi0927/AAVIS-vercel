const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ScanPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.manualEntryTab = By.css('[data-testid="btn-scan-2"]');
    this.productNameInput = By.css('[data-testid="input-manual-1"]');
    this.ingredientsInput = By.css('[data-testid="textarea-manual-1"]'); 
    this.analyzeBtn = By.css('[data-testid="btn-manual-2"]');
  }

  async performManualScan(productName, ingredients) {
    await this.type(this.productNameInput, productName);
    await this.type(this.ingredientsInput, ingredients);
    await this.click(this.analyzeBtn);
  }
}
module.exports = ScanPage;
