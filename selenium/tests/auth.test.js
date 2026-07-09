const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const { expect } = require('chai');
const { until, By } = require('selenium-webdriver');

describe('Authentication Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should navigate to login page', async () => {
    await authPage.navigate('/login');
    const title = await driver.getTitle();
    expect(title).to.include('Aavis'); // Add your actual expected title
  });
  
  it('should show error on invalid credentials', async () => {
    await authPage.login('invalid@example.com', 'wrongpassword123');
    const errorMsg = await driver.wait(until.elementLocated(By.css('[data-sonner-toast] [data-title], [data-sonner-toast]')), 10000);
    await driver.wait(async () => {
      const text = await errorMsg.getText();
      return text.length > 0;
    }, 5000);
    const text = await errorMsg.getText();
    expect(text).to.not.be.empty;
  });
});
