const { Builder } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

(async () => {
    console.log("Starting chrome...");
    try {
        let options = new chrome.Options();
        options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage');
        // Tell selenium-webdriver not to use the automated version downloader, as it fails in restricted environments
        // Instead we can use a service builder with a known path if we had chromedriver, but we don't have chromedriver.
        // Wait, on windows without chromedriver, we can't run selenium-webdriver easily unless it's downloaded.
        
        let builder = new Builder().forBrowser('chrome').setChromeOptions(options);
        const driver = await builder.build();
        console.log("Successfully launched Chrome!");
        await driver.quit();
    } catch(e) {
        console.error("Error launching chrome:", e);
    }
})();
