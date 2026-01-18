// ═══════════════════════════════════════════════════════════
//  CONFIG MANAGER MODULE
//  Enhanced with Multi-Language Text System
//  Updated with modern FS config structure
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

class ConfigManager {
    constructor() {
        this.configsFolder = './configs';
        this.statesFolder = './states';
        this.textsFolder = './texts';
        
        [this.configsFolder, this.statesFolder, this.textsFolder].forEach(f => {
            if (!fs.existsSync(f)) fs.mkdirSync(f, { recursive: true });
        });
        
        this.globalConfig = this.loadGlobal();
        
        // Kopiere Sprachdateien wenn noch nicht vorhanden
        this.ensureLanguageFiles();
    }

    /**
     * Stelle sicher dass die Standard-Sprachdateien existieren
     */
    ensureLanguageFiles() {
        const deFile = path.join(this.textsFolder, 'de.json');
        const enFile = path.join(this.textsFolder, 'en.json');
        
        // Wenn Dateien nicht existieren, aus dem Projekt kopieren
        // (In Production würden diese mit dem Bot ausgeliefert)
        if (!fs.existsSync(deFile) || !fs.existsSync(enFile)) {
        }
    }

    loadGlobal() {
		try {
			if (fs.existsSync('./global-config.json')) {
				const content = fs.readFileSync('./global-config.json', 'utf8');
				return JSON.parse(content);
			}
		} catch (e) {
			// ✅ FEHLER LOGGEN STATT IGNORIEREN!
			console.error('❌ ERROR: global-config.json is invalid!');
			console.error(`Error: ${e.message}`);
			console.error('Please fix the JSON syntax or delete the file to regenerate.');
			process.exit(1);  // ← STOPPEN statt überschreiben!
		}
        
        const def = {
            token: "YOUR_BOT_TOKEN_HERE",
            verboseLogging: false,
            globalSettings: {
                verboseMode: false,
                debugMode: false
            },
            debugFilters: {
                career: true,
                vehicles: true,
                economy: true,
                network: true,
                embed: true,
                monitoring: true,
                interaction: true,
                setup: true,
                general: true
            },
            debugModules: {
                enabled: false,
                modules: [],
                stopOnError: false
            },
            defaults: {
                updateInterval: 10000,
                embedColors: {
                    online: "#00FF00",
                    offline: "#FF0000"
                },
                defaultEmojis: {
                    online: "🟢",
                    offline: "🔴",
                    map: "🗺️",
                    version: "⚙️",
                    password: "🔒",
                    players: "👥",
                    mods: "🔧",
                    vehicles: "🚜",
                    money: "💰",
                    difficulty: "⚡",
                    timeScale: "⏱️",
                    playerList: "👤",
                    playTime: "🕐",
                    currentDate: "📅",
                    saveDate: "💾",
                    growthRate: "🌱",
                    fieldJobs: "📋",
                    autoSave: "💾",
                    resetVehicles: "🔄",
                    savegameName: "📝",
                    creationDate: "🛠️",
                    traffic: "🚦",
                    weeds: "🌱",
                    fruitDestruction: "🌾",
                    snow: "❄️",
                    stones: "🪨",
                    fuelUsage: "⛽",
                    loan: "🏦",
                    initialMoney: "💼",
                    helperFuel: "🛢️",
                    helperSeeds: "🌾",
                    helperFertilizer: "💊",
                    mapScreenshot: "🖼️",
                    greatDemands: "🔥"
                },
                defaultButtonMessages: {
                    playersMessage: "👥 **Online Spieler ({count}/{max}):**\n```\n{players}\n```"
                },
                setupPermissions: {
                    allowAdministrator: true,
                    allowedRoles: []
                },
                textSettings: {
                    defaultLanguage: "en",
                    allowCustomTexts: true
                }
            }
        };
        
        fs.writeFileSync('./global-config.json', JSON.stringify(def, null, 2));
        return def;
    }

    getGuildPath(guildId) {
        return path.join(this.configsFolder, `guild_${guildId}.json`);
    }

    loadGuild(guildId, guildName = 'Unknown') {
        const p = this.getGuildPath(guildId);
        
        if (fs.existsSync(p)) {
            try {
                const config = JSON.parse(fs.readFileSync(p, 'utf8'));
                
                // Migration: Füge textSettings hinzu falls nicht vorhanden
                if (!config.globalTextSettings) {
                    config.globalTextSettings = {
                        defaultLanguage: "en",
                        allowCustomTexts: true
                    };
                    this.saveGuild(guildId, config);
                }
                
                // Migration: Füge textSettings zu Servern hinzu falls nicht vorhanden
                if (config.servers) {
                    let needsSave = false;
                    config.servers.forEach(srv => {
                        if (!srv.textSettings) {
                            srv.textSettings = {
                                language: "global", // "global" = nutze globalTextSettings
                                customTexts: null
                            };
                            needsSave = true;
                        }
                    });
                    if (needsSave) {
                        this.saveGuild(guildId, config);
                    }
                }
                
				// Migration: Füge monitoringEnabled zu Servern hinzu falls nicht vorhanden
                if (config.servers) {
                    let needsSave = false;
                    config.servers.forEach(srv => {
                        if (srv.monitoringEnabled === undefined) {
                            srv.monitoringEnabled = true; // Default: Monitoring ist AN
                            needsSave = true;
                        }
                    });
                    if (needsSave) {
                        this.saveGuild(guildId, config);
                    }
                }
				
				// Migration: Füge Field Rotation zu embedSettings hinzu falls nicht vorhanden
				if (config.servers) {
					let needsSave = false;
					config.servers.forEach(srv => {
						if (!srv.embedSettings) {
							srv.embedSettings = {};
							needsSave = true;
						}
						if (srv.embedSettings.enableFieldRotation === undefined) {
							srv.embedSettings.enableFieldRotation = false; // Default: OFF
							srv.embedSettings.currentFieldRotationIndex = 0;
							needsSave = true;
						}
					});
					if (needsSave) {
						this.saveGuild(guildId, config);
					}
				}
				
				// Migration: Füge hasNoPassword zu embedSettings hinzu falls nicht vorhanden
				if (config.servers) {
					let needsSave = false;
					config.servers.forEach(srv => {
						if (!srv.embedSettings) {
							srv.embedSettings = {};
							needsSave = true;
						}
						if (srv.embedSettings.hasNoPassword === undefined) {
							srv.embedSettings.hasNoPassword = false; // Default: OFF
							needsSave = true;
						}
					});
					if (needsSave) {
						this.saveGuild(guildId, config);
					}
				}
				
                return config;
            } catch (e) {
                console.error(`Guild ${guildId}: Config Error`);
            }
        }
        
        const newCfg = {
            _guild_info: {
                guildId: guildId,
                guildName: guildName,
                setupDate: new Date().toISOString()
            },
            servers: [],
            setupPermissions: { ...this.globalConfig.defaults.setupPermissions },
            embedColors: { ...this.globalConfig.defaults.embedColors },
            defaultEmojis: { ...this.globalConfig.defaults.defaultEmojis },
            defaultButtonMessages: { ...this.globalConfig.defaults.defaultButtonMessages },
            footerText: "mcapi.us",
            // NEU: Globale Text-Einstellungen
            globalTextSettings: {
                defaultLanguage: "en",
                allowCustomTexts: true
            }
        };
        
        this.saveGuild(guildId, newCfg);
        return newCfg;
    }

    saveGuild(guildId, config) {
        try {
            fs.writeFileSync(this.getGuildPath(guildId), JSON.stringify(config, null, 2));
            return true;
        } catch (e) {
            console.error(`Guild ${guildId}: Save Error`);
            return false;
        }
    }

    /**
     * Hole die effektive Sprache für einen Server
     * (löst "global" auf zur tatsächlichen Sprache)
     */
    getEffectiveLanguage(serverConfig, guildConfig) {
        if (serverConfig?.textSettings?.language === 'global') {
            return guildConfig?.globalTextSettings?.defaultLanguage || 'en';
        }
        return serverConfig?.textSettings?.language || guildConfig?.globalTextSettings?.defaultLanguage || 'en';
    }
}

module.exports = { ConfigManager };