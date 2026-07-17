const BasePage = require('./BasePage.cjs');

class RegisterPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = '[data-testid="input-register-1"]';
    this.emailInput = '[data-testid="input-register-2"]';
    this.passwordInput = '[data-testid="input-register-3"]';
    this.confirmPasswordInput = '[data-testid="input-register-4"]';
    this.submitBtn = '[data-testid="btn-register-3"]';
  }

  async register(name, email, password) {
    await this.type(this.nameInput, name);
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.type(this.confirmPasswordInput, password);
    await this.click(this.submitBtn);
  }
}

module.exports = RegisterPage;
