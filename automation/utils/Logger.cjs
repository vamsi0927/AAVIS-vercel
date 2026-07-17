const fs = require('fs');
const path = require('path');

class Logger {
  static init() {
    this.logDir = './automation/logs';
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    this.logFile = path.join(this.logDir, 'automation-execution.log');
    fs.writeFileSync(this.logFile, `--- AUTOMATION EXECUTION START: ${new Date().toISOString()} ---\n`);
  }

  static info(message) {
    const logMsg = `[INFO] [${new Date().toLocaleTimeString()}] ${message}\n`;
    console.log(logMsg.trim());
    fs.appendFileSync(this.logFile, logMsg);
  }

  static error(message, err) {
    const logMsg = `[ERROR] [${new Date().toLocaleTimeString()}] ${message}${err ? ' - ' + (err.stack || err.message || err) : ''}\n`;
    console.error(logMsg.trim());
    fs.appendFileSync(this.logFile, logMsg);
  }
}

Logger.init();
module.exports = Logger;
