const { By, Key } = require('selenium-webdriver');
const BasePage = require('./BasePage');

class ProfilePage extends BasePage {
  constructor(driver) {
    super(driver);
    this.cancelBtn = By.css('[data-testid="btn-profile-1"]');
    this.saveBtn = By.css('[data-testid="btn-profile-2"]');
    this.settingsBtn = By.css('[data-testid="btn-profile-3"]');
    this.editProfileBtn = By.css('[data-testid="btn-profile-4"]');
    
    this.nameInput = By.css('[data-testid="input-profile-2"]');
    this.ageInput = By.css('[data-testid="input-profile-3"]');
    this.heightInput = By.css('[data-testid="input-profile-4"]');
    this.weightInput = By.css('[data-testid="input-profile-5"]');
    
    this.dietBtn = By.css('[data-testid="btn-profile-5"]');
    this.allergenBtn = By.css('[data-testid="btn-profile-6"]');
    this.conditionBtn = By.css('[data-testid="btn-profile-7"]');
    
    this.fileInput = By.css('[data-testid="input-profile-1"]');
    this.uploadPhotoBtn = By.css('[data-testid="btn-profile-8"]');
    this.removePhotoBtn = By.css('[data-testid="btn-profile-9"]');
    this.cancelActionBtn = By.css('[data-testid="btn-profile-10"]');
    
    this.saveAvatarBtn = By.css('[data-testid="btn-profile-11"]');
    this.reselectPhotoBtn = By.css('[data-testid="btn-profile-12"]');
    this.removePhotoPreviewBtn = By.css('[data-testid="btn-profile-13"]');
    this.cancelPreviewBtn = By.css('[data-testid="btn-profile-14"]');
    
    this.cancelRemovePhotoBtn = By.css('[data-testid="btn-profile-15"]');
    this.confirmRemovePhotoBtn = By.css('[data-testid="btn-profile-16"]');
  }

  async editProfile(name, age, height, weight) {
    await this.click(this.editProfileBtn);
    await this.wait.waitForElementVisible(this.nameInput);
    
    if (name) {
        await this.type(this.nameInput, name);
    }
    if (age) {
        await this.type(this.ageInput, age.toString());
    }
    if (height) {
        await this.type(this.heightInput, height.toString());
    }
    if (weight) {
        await this.type(this.weightInput, weight.toString());
    }
  }

  async saveProfile() {
    await this.click(this.saveBtn);
  }
}
module.exports = ProfilePage;
