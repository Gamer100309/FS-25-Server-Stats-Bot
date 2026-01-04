// ═══════════════════════════════════════════════════════════
//  LOGGER MODULE
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logsFolder = './logs', verboseMode = false) {
        this.logsFolder = logsFolder;
        this.verboseMode = verboseMode;
        
        if (!fs.existsSync(logsFolder)) {
            fs.mkdirSync(logsFolder, { recursive: true });
        }
        
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logsFolder, `bot-${today}.log`);
    }

    log(message, type = 'INFO', force = false) {
        if (!this.verboseMode && !force && type === 'VERBOSE') return;
        
        const timestamp = new Date().toLocaleString('de-DE');
        const logMessage = `[${timestamp}] [${type}] ${message}`;
        console.log(logMessage);
        
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (e) {}
    }

    verbose(m) { this.log(m, 'VERBOSE'); }
    info(m) { this.log(m, 'INFO', true); }
    success(m) { this.log(m, 'SUCCESS', true); }
    error(m) { this.log(m, 'ERROR', true); }
    warning(m) { this.log(m, 'WARNING', true); }
}

module.exports = { Logger };