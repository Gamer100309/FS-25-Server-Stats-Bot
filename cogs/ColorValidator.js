// ═══════════════════════════════════════════════════════════
//  COLOR VALIDATOR MODULE
//  Zentrale Farb-Validierung für Discord Embeds
//  Verhindert "Invalid number value" Errors
// ═══════════════════════════════════════════════════════════

class ColorValidator {
    /**
     * Validate and sanitize hex color code
     * @param {string} color - Color to validate (e.g. "#00FF00")
     * @returns {object} { valid: boolean, color: string, error: string }
     */
    static validate(color) {
        // Remove whitespace
        const trimmed = (color || '').trim();
        
        // Check if empty
        if (!trimmed) {
            return { 
                valid: false, 
                color: null, 
                error: 'Color code cannot be empty' 
            };
        }
        
        // Check format: Must start with # and have 6 hex characters
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        
        if (!hexRegex.test(trimmed)) {
            // Detailed error message
            let error = 'Invalid hex color code!';
            
            if (!trimmed.startsWith('#')) {
                error += '\n• Must start with #';
            }
            if (trimmed.length !== 7) {
                error += `\n• Must be 7 characters (is ${trimmed.length})`;
            }
            if (!/^[#0-9A-Fa-f]*$/.test(trimmed)) {
                error += '\n• Only 0-9 and A-F allowed';
            }
            
            error += '\n\nExample: #00FF00';
            
            return { 
                valid: false, 
                color: null, 
                error 
            };
        }
        
        // Valid!
        return { 
            valid: true, 
            color: trimmed.toUpperCase(), 
            error: null 
        };
    }

    /**
     * Get safe color with fallback chain
     * @param {string} primary - Primary color to try
     * @param {string} secondary - Secondary fallback color
     * @param {string} tertiary - Tertiary fallback color (default: #00FF00)
     * @returns {string} Valid hex color (GUARANTEED)
     */
    static getSafeColor(primary, secondary = null, tertiary = '#00FF00') {
        // Try primary
        const primaryValidation = this.validate(primary);
        if (primaryValidation.valid) {
            return primaryValidation.color;
        }
        
        // Try secondary
        if (secondary) {
            const secondaryValidation = this.validate(secondary);
            if (secondaryValidation.valid) {
                return secondaryValidation.color;
            }
        }
        
        // Try tertiary (default)
        const tertiaryValidation = this.validate(tertiary);
        if (tertiaryValidation.valid) {
            return tertiaryValidation.color;
        }
        
        // Ultimate fallback (should never happen)
        return '#00FF00';
    }

    /**
     * Get safe online/offline colors from config
     * @param {object} embedSettings - Server embed settings (optional)
     * @param {object} globalColors - Global embed colors
     * @param {boolean} online - Server online status
     * @returns {string} Valid hex color
     */
    static getStatusColor(embedSettings = {}, globalColors = {}, online = true) {
        if (online) {
            return this.getSafeColor(
                embedSettings.colorOnline,
                globalColors.online,
                '#00FF00' // Default green
            );
        } else {
            return this.getSafeColor(
                embedSettings.colorOffline,
                globalColors.offline,
                '#FF0000' // Default red
            );
        }
    }

    /**
     * Convert Discord.js integer color to hex (for backwards compatibility)
     * @param {number|string} color - Discord color (integer or hex)
     * @returns {string} Hex color string
     */
    static toHex(color) {
        if (typeof color === 'string') {
            return color;
        }
        
        if (typeof color === 'number') {
            return '#' + color.toString(16).padStart(6, '0').toUpperCase();
        }
        
        return '#00FF00'; // Fallback
    }

    /**
     * Convert hex to Discord.js integer (optional, for special cases)
     * @param {string} hex - Hex color string
     * @returns {number} Discord color integer
     */
    static toInteger(hex) {
        const validation = this.validate(hex);
        if (!validation.valid) {
            return 0x00FF00; // Default green
        }
        
        return parseInt(validation.color.substring(1), 16);
    }

    /**
     * Pre-validate entire config object (for startup checks)
     * @param {object} config - Guild config object
     * @returns {object} { valid: boolean, errors: array }
     */
    static validateConfig(config) {
        const errors = [];
        
        // Check global colors
        if (config.embedColors) {
            const onlineCheck = this.validate(config.embedColors.online);
            if (!onlineCheck.valid) {
                errors.push(`Global Online Color: ${onlineCheck.error}`);
            }
            
            const offlineCheck = this.validate(config.embedColors.offline);
            if (!offlineCheck.valid) {
                errors.push(`Global Offline Color: ${offlineCheck.error}`);
            }
        }
        
        // Check server-specific colors
        if (config.servers) {
            config.servers.forEach((srv, idx) => {
                if (srv.embedSettings?.colorOnline) {
                    const check = this.validate(srv.embedSettings.colorOnline);
                    if (!check.valid) {
                        errors.push(`Server ${idx} (${srv.serverName}) Online Color: ${check.error}`);
                    }
                }
                
                if (srv.embedSettings?.colorOffline) {
                    const check = this.validate(srv.embedSettings.colorOffline);
                    if (!check.valid) {
                        errors.push(`Server ${idx} (${srv.serverName}) Offline Color: ${check.error}`);
                    }
                }
            });
        }
        
        return {
            valid: errors.length === 0,
            errors
        };
    }
}

module.exports = { ColorValidator };