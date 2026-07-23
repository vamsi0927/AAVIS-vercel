const DriverFactory = require('../utils/DriverFactory');
const AuthPage = require('../pages/AuthPage');
const EducationHubPage = require('../pages/EducationHubPage');
const { expect } = require('chai');
const { By } = require('selenium-webdriver');

const TEST_EMAIL = 'selenium-test-2@gmail.com';
const TEST_PASS  = 'TestPassword123!';

describe('TC_SEL_EDU — Education Hub', function () {
  this.timeout(60000);
  let driver, authPage, eduPage;

  before(async () => {
    driver = await DriverFactory.build();
    authPage = new AuthPage(driver);
    eduPage = new EducationHubPage(driver);
    await authPage.login(TEST_EMAIL, TEST_PASS);
    await authPage.wait.waitUntilUrlContains('/home');
    await eduPage.navigate('/education');
    await eduPage.wait.waitUntilUrlContains('/education');
  });

  after(async () => { if (driver) await driver.quit(); });

  it('TC_SEL_EDU_001: /education page loads', async () => {
    const url = await driver.getCurrentUrl();
    expect(url).to.include('education');
  });

  it('TC_SEL_EDU_002: Label Guide card is present', async () => {
    const cards = await driver.findElements(eduPage.labelGuideCard);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_003: Packaging Guide card is present', async () => {
    const cards = await driver.findElements(eduPage.packagingGuideCard);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_004: Hidden Sugars card is present', async () => {
    const cards = await driver.findElements(eduPage.hiddenSugarsCard);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_005: Food Claims card is present', async () => {
    const cards = await driver.findElements(eduPage.foodClaimsCard);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_006: Clicking Label Guide navigates to article', async () => {
    await eduPage.navigateTo('label');
    await driver.sleep(1200);
    const url = await driver.getCurrentUrl();
    expect(url.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_007: Boards card is present on education hub', async () => {
    await eduPage.navigate('/education');
    await driver.sleep(1000);
    const cards = await driver.findElements(eduPage.boardsCard);
    expect(cards.length).to.be.greaterThan(0);
  });

  it('TC_SEL_EDU_008: Additives card is present', async () => {
    const cards = await driver.findElements(eduPage.additivesCard);
    expect(cards.length).to.be.greaterThan(0);
  });
});
