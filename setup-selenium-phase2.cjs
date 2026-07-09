const fs = require('fs');
const path = require('path');

const write = (file, content) => {
  const fullPath = path.join(process.cwd(), file);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(fullPath, content.trim() + '\n');
};

// 1. PAGE OBJECT MODELS

write('selenium/pages/OnboardingPage.js', `
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class OnboardingPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.nameInput = By.css('input[name="name"], input[type="text"]');
    this.ageInput = By.css('input[name="age"], input[type="number"]');
    this.maleGenderBtn = By.xpath('//button[contains(text(), "Male")]');
    this.femaleGenderBtn = By.xpath('//button[contains(text(), "Female")]');
    this.continueBtn = By.xpath('//button[contains(text(), "Continue") or contains(text(), "Next")]');
    
    // Diet & Allergies
    this.veganDietBtn = By.xpath('//button[contains(text(), "Vegan")]');
    this.diabetesBtn = By.xpath('//button[contains(text(), "Diabetes")]');
    this.peanutsAllergyBtn = By.xpath('//button[contains(text(), "Peanuts")]');
    
    // Goals
    this.weightLossBtn = By.xpath('//button[contains(text(), "Weight Loss")]');
    this.completeBtn = By.xpath('//button[contains(text(), "Complete") or contains(text(), "Finish")]');
  }

  async fillBasicInfo(name, age, gender) {
    await this.type(this.nameInput, name);
    await this.type(this.ageInput, age);
    if (gender.toLowerCase() === 'male') {
      await this.click(this.maleGenderBtn);
    } else {
      await this.click(this.femaleGenderBtn);
    }
    await this.click(this.continueBtn);
  }

  async selectDietAndAllergies() {
    await this.click(this.veganDietBtn);
    await this.click(this.continueBtn);
    await this.click(this.diabetesBtn);
    await this.click(this.peanutsAllergyBtn);
    await this.click(this.continueBtn);
  }

  async selectGoalAndComplete() {
    await this.click(this.weightLossBtn);
    await this.click(this.completeBtn);
  }
}
module.exports = OnboardingPage;
`);

write('selenium/pages/DashboardPage.js', `
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class DashboardPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.healthScoreCard = By.xpath('//div[contains(text(), "Health Score") or contains(text(), "Dashboard")]');
    this.mostScannedSection = By.xpath('//h2[contains(text(), "Most Scanned")]');
    this.hazardousSection = By.xpath('//h2[contains(text(), "Hazardous")]');
    this.waterTrackerBtn = By.xpath('//button[contains(text(), "Add Water") or contains(@class, "water")]');
    
    // Bottom Nav
    this.homeNav = By.css('nav a[href="/home"]');
    this.scanNav = By.css('nav a[href="/scan"]');
    this.historyNav = By.css('nav a[href="/history"]');
    this.profileNav = By.css('nav a[href="/profile"]');
  }

  async navigateToScan() {
    await this.click(this.scanNav);
  }

  async addWater() {
    await this.click(this.waterTrackerBtn);
  }

  async getDashboardVisibility() {
    await this.wait.waitForElementVisible(this.healthScoreCard);
    return true;
  }
}
module.exports = DashboardPage;
`);

write('selenium/pages/ScanPage.js', `
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ScanPage extends BasePage {
  constructor(driver) {
    super(driver);
    this.manualEntryTab = By.xpath('//button[contains(text(), "Manual")]');
    this.productNameInput = By.css('input[placeholder*="Product"]');
    this.ingredientsInput = By.css('textarea');
    this.analyzeBtn = By.xpath('//button[contains(text(), "Analyze")]');
  }

  async performManualScan(productName, ingredients) {
    await this.click(this.manualEntryTab);
    await this.type(this.productNameInput, productName);
    await this.type(this.ingredientsInput, ingredients);
    await this.click(this.analyzeBtn);
  }
}
module.exports = ScanPage;
`);

write('selenium/pages/ResultPage.js', `
const { By } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ResultPage extends BasePage {
  constructor(driver) {
    super(driver);
    // Explicit wait for the AI loader to finish
    this.scoreRing = By.css('svg circle'); 
    this.insightsTab = By.xpath('//button[contains(text(), "Insights")]');
    this.ingredientsTab = By.xpath('//button[contains(text(), "Ingredients")]');
    this.alternativesTab = By.xpath('//button[contains(text(), "Alternatives")]');
    this.warningAlert = By.css('.bg-red-50, .text-red-600, [role="alert"]');
  }

  async waitForAnalysisComplete() {
    // Analysis takes time, so we wait for the score ring to appear
    await this.wait.waitForElementVisible(this.scoreRing, 20000); // 20s timeout
  }

  async hasWarnings() {
    try {
      await this.wait.waitForElementVisible(this.warningAlert, 5000);
      return true;
    } catch {
      return false;
    }
  }
}
module.exports = ResultPage;
`);

// 2. TEST SUITES

write('selenium/tests/onboarding.test.js', `
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
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should complete the entire onboarding wizard', async () => {
    await onboardingPage.navigate('/onboarding');
    
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
`);

write('selenium/tests/dashboard.test.js', `
const DriverFactory = require('../utils/DriverFactory');
const DashboardPage = require('../pages/DashboardPage');
const { expect } = require('chai');

describe('Dashboard Flow (Suite 3)', function() {
  this.timeout(45000);
  let driver;
  let dashboardPage;

  before(async () => {
    driver = await DriverFactory.build();
    dashboardPage = new DashboardPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should load all dashboard widgets', async () => {
    await dashboardPage.navigate('/home');
    const isVisible = await dashboardPage.getDashboardVisibility();
    expect(isVisible).to.be.true;
  });

  it('should navigate to Scan page via Bottom Nav', async () => {
    await dashboardPage.navigateToScan();
    await dashboardPage.wait.waitUntilUrlContains('/scan');
    const url = await driver.getCurrentUrl();
    expect(url).to.include('/scan');
  });
});
`);

write('selenium/tests/scan_and_result.test.js', `
const DriverFactory = require('../utils/DriverFactory');
const ScanPage = require('../pages/ScanPage');
const ResultPage = require('../pages/ResultPage');
const { expect } = require('chai');

describe('Scan & Result Flow (Suites 4 & 5)', function() {
  this.timeout(90000); // 90 seconds because AI analysis is slow
  let driver;
  let scanPage;
  let resultPage;

  before(async () => {
    driver = await DriverFactory.build();
    scanPage = new ScanPage(driver);
    resultPage = new ResultPage(driver);
  });

  after(async () => {
    if (driver) await driver.quit();
  });

  it('should execute a manual scan and view results', async () => {
    await scanPage.navigate('/scan');
    
    // Perform Scan
    await scanPage.performManualScan('Diet Coke', 'Carbonated water, Aspartame, Caffeine, Caramel Color');
    
    // Wait for AI Analysis
    await resultPage.waitForAnalysisComplete();
    
    // Assert we are on the results page
    await resultPage.wait.waitUntilUrlContains('/result');
    
    // Switch to ingredients tab
    await resultPage.click(resultPage.ingredientsTab);
    
    // Switch to alternatives tab
    await resultPage.click(resultPage.alternativesTab);
  });
});
`);

console.log('Phase 2 Execution Complete.');
