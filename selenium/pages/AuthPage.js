const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class AuthPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.emailInput = By.css('input[type="email"]');
    this.passwordInput = By.css('input[type="password"]');
    this.submitButton = By.css('button[type="submit"]');
  }

  async login(email, password) {
    await this.navigate('/login');
    await this.type(this.emailInput, email);
    await this.type(this.passwordInput, password);
    await this.click(this.submitButton);
  }
}
module.exports = AuthPage;
