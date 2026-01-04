// ═══════════════════════════════════════════════════════════
//  MESSAGE HANDLER MODULE
//  Multi-Language Text Management System
//  DEFAULT LANGUAGE: English
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class MessageHandler {
    constructor() {
        this.textsFolder = './texts';
        this.languages = new Map();
        this.defaultLanguage = 'en'; // CHANGED FROM 'de' TO 'en'
        
        // Texts Ordner erstellen falls nicht vorhanden
        if (!fs.existsSync(this.textsFolder)) {
            fs.mkdirSync(this.textsFolder, { recursive: true });
        }
        
        // Vordefinierte Sprachen laden
        this.loadLanguage('de');
        this.loadLanguage('en');
        
        // Custom Sprachen laden
        this.loadCustomLanguages();
    }

    /**
     * Lade eine Sprachdatei
     */
    loadLanguage(languageCode) {
        try {
            const filePath = path.join(this.textsFolder, `${languageCode}.json`);
            
            if (fs.existsSync(filePath)) {
                const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                this.languages.set(languageCode, data);
                return true;
            }
            
            return false;
        } catch (e) {
            console.error(`Error loading language ${languageCode}: ${e.message}`);
            return false;
        }
    }

    /**
     * Lade alle Custom-Sprachdateien (custom_*.json)
     */
    loadCustomLanguages() {
        try {
            const files = fs.readdirSync(this.textsFolder);
            
            files.forEach(file => {
                if (file.startsWith('custom_') && file.endsWith('.json')) {
                    const languageCode = file.replace('.json', '');
                    this.loadLanguage(languageCode);
                }
            });
        } catch (e) {
            // Ordner existiert noch nicht oder ist leer
        }
    }

    /**
     * Hole einen Text mit Fallback-System
     * 
     * @param {string} key - Text-Key (z.B. "setup.mainMenu.title")
     * @param {object} variables - Variablen zum Ersetzen (z.B. {serverName: "Survival"})
     * @param {object} serverConfig - Server-spezifische Config (optional)
     * @param {object} guildConfig - Guild Config mit globalTextSettings (optional)
     * @returns {string} Der Text mit ersetzten Variablen
     */
    get(key, variables = {}, serverConfig = null, guildConfig = null) {
        // Sprache ermitteln (Fallback-Kette)
        let language = this.defaultLanguage;
        
        // 1. Server-spezifische Sprache (höchste Priorität)
        if (serverConfig?.textSettings?.language) {
            language = serverConfig.textSettings.language;
            
            // FIX: Wenn "global", hole die globale Sprache
            if (language === 'global' && guildConfig?.globalTextSettings?.defaultLanguage) {
                language = guildConfig.globalTextSettings.defaultLanguage;
            }
        }
        
        // 2. Globale Guild-Sprache
        else if (guildConfig?.globalTextSettings?.defaultLanguage) {
            language = guildConfig.globalTextSettings.defaultLanguage;
        }
        
        // Text holen
        let text = this.getText(key, language);
        
        // Fallback zu Default Language wenn nicht gefunden
        if (!text && language !== this.defaultLanguage) {
            text = this.getText(key, this.defaultLanguage);
        }
        
        // Fallback zu Key selbst wenn gar nichts gefunden
        if (!text) {
            return `[MISSING: ${key}]`;
        }
        
        // Variablen ersetzen
        return this.replaceVariables(text, variables);
    }

    /**
     * Hole einen Text aus einer bestimmten Sprache
     * 
     * @param {string} key - Text-Key mit Punktnotation
     * @param {string} languageCode - Sprachcode
     * @returns {string|null} Der Text oder null
     */
    getText(key, languageCode) {
        const languageData = this.languages.get(languageCode);
        if (!languageData) return null;
        
        // Navigiere durch verschachtelte Keys (z.B. "setup.mainMenu.title")
        const keys = key.split('.');
        let value = languageData;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return typeof value === 'string' ? value : null;
    }

    /**
     * Ersetze Variablen in einem Text
     * 
     * @param {string} text - Text mit Platzhaltern
     * @param {object} variables - Variablen zum Ersetzen
     * @returns {string} Text mit ersetzten Variablen
     */
    replaceVariables(text, variables = {}) {
        let result = text;
        
        for (const [key, value] of Object.entries(variables)) {
            const placeholder = `{${key}}`;
            result = result.replace(new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), value);
        }
        
        return result;
    }

    /**
     * Hole alle verfügbaren Sprachen
     * 
     * @returns {Array} Array mit {code, name, isCustom}
     */
    getAvailableLanguages() {
        const languages = [];
        
        for (const [code, data] of this.languages.entries()) {
            languages.push({
                code: code,
                name: data._meta?.languageName || code,
                isCustom: code.startsWith('custom_'),
                emoji: this.getLanguageEmoji(code)
            });
        }
        
        return languages.sort((a, b) => {
            // Standard-Sprachen zuerst, dann Custom
            if (a.isCustom && !b.isCustom) return 1;
            if (!a.isCustom && b.isCustom) return -1;
            return a.name.localeCompare(b.name);
        });
    }

    /**
     * Hole Emoji für eine Sprache
     */
    getLanguageEmoji(code) {
        const emojis = {
            'de': '🇩🇪',
            'en': '🇬🇧',
        };
        
        if (code.startsWith('custom_')) return '✏️';
        return emojis[code] || '🌐';
    }

    /**
     * Erstelle eine Custom-Sprachdatei basierend auf einer existierenden
     * 
     * @param {string} customName - Name der Custom-Sprache (z.B. "survival")
     * @param {string} baseLanguage - Basis-Sprache (z.B. "de")
     * @returns {boolean} Erfolg
     */
    createCustomLanguage(customName, baseLanguage = 'en') {
        try {
            const sanitizedName = customName.replace(/[^a-z0-9_-]/gi, '_').toLowerCase();
            const customCode = `custom_${sanitizedName}`;
            const filePath = path.join(this.textsFolder, `${customCode}.json`);
            
            // Prüfe ob bereits existiert
            if (fs.existsSync(filePath)) {
                return false;
            }
            
            // Hole Basis-Sprache
            const baseData = this.languages.get(baseLanguage);
            if (!baseData) return false;
            
            // Erstelle Custom-Datei mit Metadaten
            const customData = {
                ...baseData,
                _meta: {
                    language: customCode,
                    languageName: customName,
                    version: "4.0",
                    author: "Custom",
                    description: `Custom language based on ${baseLanguage}`,
                    baseLanguage: baseLanguage,
                    created: new Date().toISOString()
                }
            };
            
            fs.writeFileSync(filePath, JSON.stringify(customData, null, 2));
            this.loadLanguage(customCode);
            
            return true;
        } catch (e) {
            console.error(`Error creating custom language: ${e.message}`);
            return false;
        }
    }

    /**
     * Lösche eine Custom-Sprache
     * 
     * @param {string} customCode - Custom-Sprachcode (z.B. "custom_survival")
     * @returns {boolean} Erfolg
     */
    deleteCustomLanguage(customCode) {
        try {
            if (!customCode.startsWith('custom_')) return false;
            
            const filePath = path.join(this.textsFolder, `${customCode}.json`);
            
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
                this.languages.delete(customCode);
                return true;
            }
            
            return false;
        } catch (e) {
            console.error(`Error deleting custom language: ${e.message}`);
            return false;
        }
    }

    /**
     * Aktualisiere einen einzelnen Text in einer Custom-Sprache
     * 
     * @param {string} customCode - Custom-Sprachcode
     * @param {string} key - Text-Key
     * @param {string} value - Neuer Wert
     * @returns {boolean} Erfolg
     */
    updateCustomText(customCode, key, value) {
        try {
            if (!customCode.startsWith('custom_')) return false;
            
            const languageData = this.languages.get(customCode);
            if (!languageData) return false;
            
            // Navigiere zu dem Key und setze den Wert
            const keys = key.split('.');
            let current = languageData;
            
            for (let i = 0; i < keys.length - 1; i++) {
                if (!(keys[i] in current)) {
                    current[keys[i]] = {};
                }
                current = current[keys[i]];
            }
            
            current[keys[keys.length - 1]] = value;
            
            // Speichere die aktualisierte Datei
            const filePath = path.join(this.textsFolder, `${customCode}.json`);
            fs.writeFileSync(filePath, JSON.stringify(languageData, null, 2));
            
            // Lade neu
            this.loadLanguage(customCode);
            
            return true;
        } catch (e) {
            console.error(`Error updating custom text: ${e.message}`);
            return false;
        }
    }

    /**
     * Reload alle Sprachen (z.B. nach manueller Bearbeitung)
     */
    reloadAll() {
        this.languages.clear();
        this.loadLanguage('de');
        this.loadLanguage('en');
        this.loadCustomLanguages();
    }

    /**
     * Hole Language-Name für Display
     */
    getLanguageName(code, guildConfig = null) {
        // Spezielle Behandlung für "global"
        if (code === 'global' && guildConfig?.globalTextSettings?.defaultLanguage) {
            const globalLang = guildConfig.globalTextSettings.defaultLanguage;
            const langData = this.languages.get(globalLang);
            return `${this.getLanguageEmoji(globalLang)} Global (${langData?._meta?.languageName || globalLang})`;
        }
        
        const langData = this.languages.get(code);
        return `${this.getLanguageEmoji(code)} ${langData?._meta?.languageName || code}`;
    }
}

module.exports = { MessageHandler };