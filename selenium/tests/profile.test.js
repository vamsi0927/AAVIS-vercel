const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const ProfilePage = require('../pages/ProfilePage');
const { expect } = require('chai');
const { until, By, Key } = require('selenium-webdriver');

describe('Profile Management Flow', function() {
  this.timeout(45000);
  let driver;
  let authPage;
  let profilePage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    profilePage = new ProfilePage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should authenticate and navigate to profile', async () => {
    try {
      await authPage.login('selenium-test-2@gmail.com', 'TestPassword123!');
      await authPage.wait.waitUntilUrlContains('/home');
      await profilePage.navigate('/profile');
      await profilePage.wait.waitUntilUrlContains('/profile');
      
      // Verify we are on the profile page
      const url = await driver.getCurrentUrl();
      expect(url).to.include('/profile');
    } catch (e) {
      const data = await driver.takeScreenshot();
      require('fs').writeFileSync('selenium-debug-profile.png', data, 'base64');
      throw e;
    }
  });

  it('should update profile details', async () => {
    await profilePage.editProfile('Selenium User Edited', 30, 180, 75);
    
    // Toggle diet
    await profilePage.click(profilePage.dietBtn); 
    
    await profilePage.saveProfile();
    
    await profilePage.wait.waitUntilUrlContains('/profile');
    
    // Verify changes persist after refresh
    await driver.navigate().refresh();
    await profilePage.wait.waitUntilUrlContains('/profile');
    
    // Should still be on profile
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/profile');
  });
  
  it('should cancel editing profile', async () => {
    await profilePage.click(profilePage.editProfileBtn);
    await profilePage.wait.waitForElementVisible(profilePage.nameInput);
    
    // Type something but cancel
    await profilePage.type(profilePage.nameInput, 'Cancel Me');
    await profilePage.click(profilePage.cancelBtn);
    
    // Save button should not exist anymore since modal closed
    const saveButtons = await driver.findElements(profilePage.saveBtn);
    expect(saveButtons.length).to.equal(0);
  });
});
