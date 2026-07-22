const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class EducationHubPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.labelGuideCard = By.css('[data-testid="card-educationhub-label-guide"]');
    this.packagingGuideCard = By.css('[data-testid="card-educationhub-packaging-guide"]');
    this.hiddenSugarsCard = By.css('[data-testid="card-educationhub-hidden-sugars"]');
    this.foodClaimsCard = By.css('[data-testid="card-educationhub-food-claims"]');
    this.additivesCard = By.css('[data-testid="card-educationhub-additives"]');
    this.portionGuideCard = By.css('[data-testid="card-educationhub-portion-guide"]');
    this.boardsCard = By.css('[data-testid="card-educationhub-boards"]');
  }

  async navigateTo(cardName) {
    const cards = {
        'label': this.labelGuideCard,
        'packaging': this.packagingGuideCard,
        'sugars': this.hiddenSugarsCard,
        'claims': this.foodClaimsCard,
        'additives': this.additivesCard,
        'portion': this.portionGuideCard,
        'boards': this.boardsCard
    };
    await this.click(cards[cardName]);
  }
}
module.exports = EducationHubPage;
