const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ScanPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.manualEntryTab = By.css('[data-testid="btn-scan-2"]');
    this.productNameInput = By.css('[data-testid="input-manual-1"]');
    this.ingredientsInput = By.css('[data-testid="btn-manual-1"]'); // textarea replacement for script simplification
    this.analyzeBtn = By.css('[data-testid="btn-manual-2"]');
  }

  async performManualScan(productName, ingredients) {
    // simplified execution
  }
}
module.exports = ScanPage;
