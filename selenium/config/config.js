require('dotenv').config();
module.exports = {
  baseUrl: process.env.BASE_URL || 'http://localhost:5173',
  browser: process.env.BROWSER || 'chrome',
  isHeadless: process.env.HEADLESS !== 'false',
  timeout: {
    implicit: 10000,
    pageLoad: 30000,
    script: 30000
  },
  mobileEmulation: process.env.MOBILE === 'true'
};
