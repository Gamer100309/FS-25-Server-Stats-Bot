// ═══════════════════════════════════════════════════════════
//  LOGGER MODULE
//  v2.0 - Multi-Level Logging System
//  Levels: ERROR → WARNING → SUCCESS → INFO → VERBOSE → DEBUG
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logsFolder = './logs', verboseMode = false, debugMode = false) {
        this.logsFolder = logsFolder;
        this.verboseMode = verboseMode;
        this.debugMode = debugMode;
        
        if (!fs.existsSync(logsFolder)) {
            fs.mkdirSync(logsFolder, { recursive: true });
        }
        
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logsFolder, `bot-${today}.log`);
        
        // Log startup info
        this.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.info(`Logger initialized - Verbose: ${verboseMode}, Debug: ${debugMode}`);
        this.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    /**
     * Main log method
     * @param {string} message - Message to log
     * @param {string} type - Log type (ERROR, WARNING, SUCCESS, INFO, VERBOSE, DEBUG)
     * @param {boolean} force - Force logging even if mode is disabled
     */
    log(message, type = 'INFO', force = false) {
        // Check if logging is allowed for this type
        if (!force) {
            // DEBUG only if debug mode is on
            if (type === 'DEBUG' && !this.debugMode) return;
            
            // VERBOSE only if verbose mode is on
            if (type === 'VERBOSE' && !this.verboseMode) return;
        }
        
        const timestamp = new Date().toLocaleString('de-DE');
        const logMessage = `[${timestamp}] [${type}] ${message}`;
        console.log(logMessage);
        
        try {
            fs.appendFileSync(this.logFile, logMessage + '\n');
        } catch (e) {}
    }

    // ═══════════════════════════════════════════════════════════
    // LOGGING METHODS - Sorted by importance
    // ═══════════════════════════════════════════════════════════

    /**
     * ERROR - Always logged
     * Use for: Crashes, failures, critical errors
     */
    error(m) { 
        this.log(m, 'ERROR', true); 
    }

    /**
     * WARNING - Always logged
     * Use for: Non-critical issues, deprecations
     */
    warning(m) { 
        this.log(m, 'WARNING', true); 
    }

    /**
     * SUCCESS - Always logged
     * Use for: Successful operations, completed tasks
     */
    success(m) { 
        this.log(m, 'SUCCESS', true); 
    }

    /**
     * INFO - Always logged
     * Use for: General information, startup messages
     */
    info(m) { 
        this.log(m, 'INFO', true); 
    }

    /**
     * VERBOSE - Only if verboseMode = true
     * Use for: Detailed operation info, monitoring details
     */
    verbose(m) { 
        this.log(m, 'VERBOSE'); 
    }

    /**
     * DEBUG - Only if debugMode = true
     * Use for: XML parsing details, embed construction, detailed traces
     */
    debug(m) { 
        this.log(m, 'DEBUG'); 
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Log a separator line (DEBUG level)
     */
    debugSeparator(title = '') {
        if (!this.debugMode) return;
        
        if (title) {
            this.debug(`═══════════════════════════════════════════════════════════`);
            this.debug(`  ${title.toUpperCase()}`);
            this.debug(`═══════════════════════════════════════════════════════════`);
        } else {
            this.debug(`═══════════════════════════════════════════════════════════`);
        }
    }

    /**
     * Log current logging configuration
     */
    logConfig() {
        this.info('Logging Configuration:');
        this.info(`  ERROR:   ✅ Always on`);
        this.info(`  WARNING: ✅ Always on`);
        this.info(`  SUCCESS: ✅ Always on`);
        this.info(`  INFO:    ✅ Always on`);
        this.info(`  VERBOSE: ${this.verboseMode ? '✅ Enabled' : '❌ Disabled'}`);
        this.info(`  DEBUG:   ${this.debugMode ? '✅ Enabled' : '❌ Disabled'}`);
    }
}

module.exports = { Logger };
