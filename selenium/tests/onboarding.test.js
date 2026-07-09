const DriverFactory = require('../utils/DriverFactory');
const OnboardingPage = require('../pages/OnboardingPage');
const { expect } = require('chai');

describe('Onboarding Flow (Suite 2)', function() {
  this.timeout(60000);
  let driver;
  let onboardingPage;

  before(async () => {
    driver = await DriverFactory.build();
    onboardingPage = new OnboardingPage(driver);
    const AuthPage = require('../pages/AuthPage');
    const authPage = new AuthPage(driver);
    await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
    await onboardingPage.wait.waitUntilUrlContains('/home');
    await onboardingPage.navigate('/onboarding');
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should complete the entire onboarding wizard', async () => {
    await onboardingPage.navigate('/onboarding');
    await onboardingPage.skipSplash();
    
    // Step 1
    await onboardingPage.fillBasicInfo('Test User', '25', 'Male');
    
    // Step 2 & 3
    await onboardingPage.selectDietAndAllergies();
    
    // Step 4
    await onboardingPage.selectGoalAndComplete();
    
    // Assert redirect to home
    await onboardingPage.wait.waitUntilUrlContains('/home');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/home');
  });
});
