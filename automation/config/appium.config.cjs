module.exports = {
  hostname: process.env.APPIUM_HOST || '127.0.0.1',
  port: parseInt(process.env.APPIUM_PORT || '4723', 10),
  path: '/wd/hub',
  capabilities: {
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': 'Android Emulator',
    'appium:app': './android/app/build/outputs/apk/debug/app-debug.apk',
    'appium:appPackage': 'com.aavis.app',
    'appium:appActivity': 'com.aavis.app.MainActivity',
    'appium:newCommandTimeout': 240,
    'appium:autoGrantPermissions': true,
    'appium:ensureWebviewsHavePages': true
  },
  local: {
    emulatorName: 'pixel_5',
    apkPath: './android/app/build/outputs/apk/debug/app-debug.apk'
  }
};
