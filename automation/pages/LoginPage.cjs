const BasePage = require('./BasePage.cjs');

class LoginPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = '[data-testid="input-login-1"]';
    this.passwordInput = '[data-testid="input-login-2"]';
    this.submitBtn = '[data-testid="btn-login-3"]';
    this.forgotPasswordLink = '[data-testid="btn-login-2"]';
  }

  async login(email, password) {
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitBtn);
  }

  async clickForgotPassword() {
    await this.click(this.forgotPasswordLink);
  }
}

module.exports = LoginPage;
