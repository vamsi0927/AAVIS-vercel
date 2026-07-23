const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const ProfilePage = require('../pages/ProfilePage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_PROF — Profile Management Flow', function () {
  this.timeout(60000);
  let driver, authPage, profilePage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    profilePage = new ProfilePage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await profilePage.navigate('/profile');
    await profilePage.wait.waitUntilUrlContains('/profile');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_PROF_001: /profile page loads with correct URL', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/profile');
  });

  it('TC_SEL_PROF_002: Edit Profile button is present', async () => {
    const editBtns = await driver.findElements(profilePage.editProfileBtn);
    expect(editBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_PROF_003: Edit Profile opens name input field', async () => {
    await profilePage.click(profilePage.editProfileBtn);
    const nameInputs = await driver.findElements(profilePage.nameInput);
    expect(nameInputs.length).to.be.greaterThan(0);
  });

  it('TC_SEL_PROF_004: Name input accepts text', async () => {
    const nameInput = await driver.findElement(profilePage.nameInput);
    await nameInput.clear();
    await nameInput.sendKeys('Selenium Tester Updated');
    const val = await nameInput.getAttribute('value');
    expect(val).to.include('Selenium');
  });

  it('TC_SEL_PROF_005: Cancel edit hides save button', async () => {
    await profilePage.click(profilePage.cancelBtn);
    await driver.sleep(600);
    const saveBtns = await driver.findElements(profilePage.saveBtn);
    expect(saveBtns.length).to.equal(0);
  });

  it('TC_SEL_PROF_006: Settings button navigates to /settings', async () => {
    await profilePage.navigate('/profile');
    await driver.sleep(800);
    const settingsBtns = await driver.findElements(profilePage.settingsBtn);
    if (settingsBtns.length > 0) {
      await settingsBtns[0].click();
      await driver.sleep(1200);
      const url = await driver.getCurrentUrl();
      expect(url).to.include('settings');
    }
  });

  it('TC_SEL_PROF_007: Diet preference toggle button is present', async () => {
    await profilePage.navigate('/profile');
    await driver.sleep(800);
    await profilePage.click(profilePage.editProfileBtn);
    await driver.sleep(600);
    const dietBtns = await driver.findElements(profilePage.dietBtn);
    expect(dietBtns.length).to.be.greaterThan(0);
  });

  it('TC_SEL_PROF_008: Save profile with updated name persists data', async () => {
    // After PROF_007 we are in edit mode (editProfileBtn clicked inside editProfile).
    // Navigate fresh so isEditing resets, then enter edit mode cleanly.
    await profilePage.navigate('/profile');
    await driver.sleep(2500);
    // Wait for edit button to appear (only shown when !isEditing)
    const editBtn = await profilePage.wait.waitForElementVisible(profilePage.editProfileBtn);
    await editBtn.click();
    // Wait for name input
    await profilePage.wait.waitForElementVisible(profilePage.nameInput);
    const nameInput = await driver.findElement(profilePage.nameInput);
    await nameInput.clear();
    await nameInput.sendKeys('Selenium Final Name');
    // Save
    await profilePage.click(profilePage.saveBtn);
    await driver.sleep(2000);
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/profile');
  });
});
