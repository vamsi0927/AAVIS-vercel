const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const EducationHubPage = require('../pages/EducationHubPage');
const { expect } = require('chai');

describe('Education Hub Flow', function() {
  this.timeout(60000); // giving extra time since we test multiple cards
  let driver;
  let authPage;
  let educationPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    educationPage = new EducationHubPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to education hub', async () => {
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await authPage.wait.waitUntilUrlContains('/home');
    await educationPage.navigate('/education');
    await educationPage.wait.waitUntilUrlContains('/education');
    
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/education');
  });

  it('should navigate to Label Guide', async () => {
    await educationPage.navigateTo('label');
    await educationPage.wait.waitUntilUrlContains('/label-guide');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/label-guide');
  });

  it('should navigate back and to Hidden Sugars', async () => {
    await educationPage.navigate('/education');
    await educationPage.wait.waitUntilUrlContains('/education');
    
    await educationPage.navigateTo('sugars');
    await educationPage.wait.waitUntilUrlContains('/hidden-sugars');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/hidden-sugars');
  });
  
  it('should navigate back and to Nutrition Boards', async () => {
    await educationPage.navigate('/education');
    await educationPage.wait.waitUntilUrlContains('/education');
    
    await educationPage.navigateTo('boards');
    await educationPage.wait.waitUntilUrlContains('/boards');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/boards');
  });
});
