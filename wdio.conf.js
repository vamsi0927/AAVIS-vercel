exports.config = {
    runner: 'local',
    port: 4723,
    path: '/',
    specs: [
        './automation/tests/**/*.js'
    ],
    maxInstances: 1,
    capabilities: [{
        platformName: 'Android',
        'appium:deviceName': 'Android Emulator',
        'appium:automationName': 'UiAutomator2',
        'appium:appPackage': 'com.aavis.app',
        'appium:appActivity': '.MainActivity'
    }],
    logLevel: 'info',
    bail: 0,
    baseUrl: 'http://localhost',
    waitforTimeout: 10000,
    connectionRetryTimeout: 120000,
    connectionRetryCount: 3,
    framework: 'mocha',
    reporters: ['spec', ['json', {
        outputDir: './automation/reports/json',
        outputFileFormat: function(opts) { 
            return 'execution-results.json'
        }
    }]],
    mochaOpts: {
        ui: 'bdd',
        timeout: 120000
    }
}
