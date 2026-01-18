// ═══════════════════════════════════════════════════════════
//  LOGGER MODULE - ERWEITERT MIT DEBUG-SCOPES
//  v3.0 - Multi-Level Logging mit gefilterten Debug-Scopes
//  Levels: ERROR → WARNING → SUCCESS → INFO → VERBOSE → DEBUG
//  Scopes: career, vehicles, network, embed, general, etc.
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class Logger {
    constructor(logsFolder = './logs', verboseMode = false, debugMode = false, debugFilters = null) {
        this.logsFolder = logsFolder;
        this.verboseMode = verboseMode;
        this.debugMode = debugMode;
        
        // Debug-Filter: { career: true, vehicles: false, network: true, ... }
        // Wenn null/undefined → alle Scopes aktiv
        // Wenn leer {} → keine Scopes aktiv
        this.debugFilters = debugFilters || {};
        
        if (!fs.existsSync(logsFolder)) {
            fs.mkdirSync(logsFolder, { recursive: true });
        }
        
        const today = new Date().toISOString().split('T')[0];
        this.logFile = path.join(logsFolder, `bot-${today}.log`);
        
        // Log startup info
        this.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        this.info(`Logger initialized - Verbose: ${verboseMode}, Debug: ${debugMode}`);
        if (Object.keys(this.debugFilters).length > 0) {
            this.info(`Debug Filters: ${JSON.stringify(this.debugFilters)}`);
        } else {
            this.info('Debug Filters: ALL SCOPES ACTIVE (no filters configured)');
        }
        this.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    /**
     * Check if a debug scope is enabled
     * @param {string} scope - Scope name (career, vehicles, network, etc.)
     * @returns {boolean} - True if scope is enabled
     */
    isScopeEnabled(scope) {
        // Wenn keine Filter definiert → alle Scopes aktiv
        if (!this.debugFilters || Object.keys(this.debugFilters).length === 0) {
            return true;
        }
        
        // Prüfe ob Scope explizit aktiviert ist
        return this.debugFilters[scope] === true;
    }

    /**
     * Main log method
     * @param {string} message - Message to log
     * @param {string} type - Log type (ERROR, WARNING, SUCCESS, INFO, VERBOSE, DEBUG)
     * @param {string} scope - Scope for DEBUG messages (career, vehicles, network, etc.)
     * @param {boolean} force - Force logging even if mode is disabled
     */
    log(message, type = 'INFO', scope = 'general', force = false) {
        // Check if logging is allowed for this type
        if (!force) {
            // DEBUG only if debug mode is on AND scope is enabled
            if (type === 'DEBUG') {
                if (!this.debugMode) return;
                if (!this.isScopeEnabled(scope)) return;
            }
            
            // VERBOSE only if verbose mode is on
            if (type === 'VERBOSE' && !this.verboseMode) return;
        }
        
        const timestamp = new Date().toLocaleString('de-DE');
        
        // Add scope to DEBUG messages
        let logMessage;
        if (type === 'DEBUG' && scope && scope !== 'general') {
            logMessage = `[${timestamp}] [${type}:${scope.toUpperCase()}] ${message}`;
        } else {
            logMessage = `[${timestamp}] [${type}] ${message}`;
        }
        
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
    error(m, scope = 'general') { 
        this.log(m, 'ERROR', scope, true); 
    }

    /**
     * WARNING - Always logged
     * Use for: Non-critical issues, deprecations
     */
    warning(m, scope = 'general') { 
        this.log(m, 'WARNING', scope, true); 
    }

    /**
     * SUCCESS - Always logged
     * Use for: Successful operations, completed tasks
     */
    success(m, scope = 'general') { 
        this.log(m, 'SUCCESS', scope, true); 
    }

    /**
     * INFO - Always logged
     * Use for: General information, startup messages
     */
    info(m, scope = 'general') { 
        this.log(m, 'INFO', scope, true); 
    }

    /**
     * VERBOSE - Only if verboseMode = true
     * Use for: Detailed operation info, monitoring details
     */
    verbose(m, scope = 'general') { 
        this.log(m, 'VERBOSE', scope); 
    }

    /**
     * DEBUG - Only if debugMode = true AND scope is enabled
     * Use for: XML parsing details, embed construction, detailed traces
     * @param {string} m - Message
     * @param {string} scope - Scope (career, vehicles, network, embed, general, ...)
     */
    debug(m, scope = 'general') { 
        this.log(m, 'DEBUG', scope); 
    }

    /**
     * DEBUG SEPARATOR - Visual separator for debug logs
     * @param {string} scope - Scope (career, vehicles, network, embed, general, ...)
     */
    debugSeparator(scope = 'general') {
        if (!this.debugMode || !this.isScopeEnabled(scope)) return;
        
        this.debug('─────────────────────────────────────────────────────', scope);
    }

    // ═══════════════════════════════════════════════════════════
    // CONVENIENCE METHODS
    // ═══════════════════════════════════════════════════════════

    /**
     * Log a big header separator (always visible)
     */
    separator() {
        this.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    }

    /**
     * Update debug filters at runtime
     * @param {object} filters - New debug filters
     */
    setDebugFilters(filters) {
        this.debugFilters = filters;
        this.info(`Debug Filters Updated: ${JSON.stringify(filters)}`);
    }

    /**
     * Enable/disable a specific debug scope
     * @param {string} scope - Scope name
     * @param {boolean} enabled - Enable or disable
     */
    setDebugScope(scope, enabled) {
        if (!this.debugFilters) {
            this.debugFilters = {};
        }
        this.debugFilters[scope] = enabled;
        this.info(`Debug Scope '${scope}': ${enabled ? 'ENABLED' : 'DISABLED'}`);
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
        
        if (this.debugMode && Object.keys(this.debugFilters).length > 0) {
            this.info(`  DEBUG SCOPES:`);
            for (const [scope, enabled] of Object.entries(this.debugFilters)) {
                this.info(`    ${scope}: ${enabled ? '✅ Enabled' : '❌ Disabled'}`);
            }
        }
    }
}

module.exports = { Logger };