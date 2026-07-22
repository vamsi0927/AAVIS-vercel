const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OnboardingPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.skipBtn = By.css('[data-testid="btn-onboarding-1"]');
    this.nextBtn = By.css('[data-testid="btn-onboarding-2"]');
  }

  async skipSplash() {
    // Click skip — navigates to /setup
    await this.click(this.skipBtn);
  }

  async fillBasicInfo(name, age, gender) {
    // Onboarding slides only have Skip/Continue buttons, no form inputs
    // Nothing to fill at this stage in Onboarding.tsx
  }

  async selectDietAndAllergies() {
    // No-op for Onboarding slides
  }

  async selectGoalAndComplete() {
    // No-op for Onboarding slides
  }
}
module.exports = OnboardingPage;
