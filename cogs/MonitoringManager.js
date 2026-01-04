// ═══════════════════════════════════════════════════════════
//  MONITORING MANAGER MODULE
//  Enhanced with Text-System Support (Phase 1)
//  v5.1.2: Fixed spam issues - State-Loss & Network Errors
// ═══════════════════════════════════════════════════════════

const { StateManager } = require('./StateManager');
const { StatusChecker } = require('./StatusChecker');
const { StatusEmbedBuilder } = require('./EmbedBuilder');

class MonitoringManager {
    constructor(client, configManager, logger, messageHandler) {
        this.client = client;
        this.configManager = configManager;
        this.logger = logger;
        this.messageHandler = messageHandler;
        this.guildIntervals = new Map();
    }

    async updateStatus(guildId, srv) {
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(srv.channelID);
            if (!channel) return;

            const gcfg = this.configManager.loadGuild(guildId);
            const stateMgr = new StateManager(guildId);

            const data = await StatusChecker.getStatus(srv);
            
            // PHASE 1: messageHandler übergeben für mehrsprachige Embeds
            const embed = StatusEmbedBuilder.createEmbed(data, srv, gcfg, this.messageHandler);
            const buttons = StatusEmbedBuilder.createButtons(srv, gcfg, this.messageHandler);

            const msgOpts = { embeds: [embed], components: buttons ? [buttons] : [] };

            const state = stateMgr.get(srv.channelID);
            
            if (state?.messageID) {
                try {
                    const msg = await channel.messages.fetch(state.messageID, {
                        cache: true,
                        force: true
                    });
                    
                    if (msg) {
                        // Einfach nur editieren - KEIN automatisches Löschen!
                        await msg.edit(msgOpts);
                        return;
                    }
                } catch (e) {
                    // ═══════════════════════════════════════════════════════════
                    // FIX: Besseres Error Handling - verhindert Spam!
                    // ═══════════════════════════════════════════════════════════
                    
                    // 1. Message wurde wirklich gelöscht (Discord Error Code 10008)
                    if (e.code === 10008) {
                        this.logger.info(`Message ${state.messageID} wurde gelöscht, erstelle neu`);
                        // Weiter zu "Neue Message erstellen"
                    } 
                    // 2. Network/Timeout Error - SKIP dieses Update!
                    else if (e.message.includes('Timeout') || 
                             e.message.includes('ENOTFOUND') || 
                             e.message.includes('ECONNREFUSED') ||
                             e.message.includes('ETIMEDOUT')) {
                        this.logger.warning(`Network error, skipping update for ${srv.serverName}: ${e.message}`);
                        return; // ← WICHTIG: Keine neue Message bei Netzwerk-Problemen!
                    }
                    // 3. Anderer unbekannter Fehler
                    else {
                        this.logger.error(`Fetch error for ${srv.serverName}: ${e.code || 'NO_CODE'} - ${e.message}`);
                        return; // Skip bei unbekannten Fehlern
                    }
                }
            }

            // Neue Message erstellen (nur wenn keine State existiert ODER Message wirklich gelöscht wurde)
            const msg = await channel.send(msgOpts);
            stateMgr.set(srv.channelID, msg.id, data.online ? 'online' : 'offline');
            this.logger.success(`Neue Status-Message erstellt für ${srv.serverName}`);
            
        } catch (e) {
            this.logger.error(`Update Error [${srv.serverName}]: ${e.message}`);
        }
    }

    startMonitoring(guildId) {
        const gcfg = this.configManager.loadGuild(guildId);
        
        if (this.guildIntervals.has(guildId)) {
            this.guildIntervals.get(guildId).forEach(iv => clearInterval(iv));
            this.guildIntervals.delete(guildId);
        }

        const intervals = [];
        
        for (const srv of gcfg.servers) {
			// Skip if monitoring disabled
			if (srv.monitoringEnabled === false) {
				this.logger.verbose(`Monitoring für ${srv.serverName} ist deaktiviert`);
				continue;
			}
			
            const interval = srv.updateInterval || this.configManager.globalConfig.defaults.updateInterval;
            
            // ═══════════════════════════════════════════════════════════
            // FIX: State-Loss Prevention
            // Prüfe erst ob Message bereits existiert, bevor updateStatus aufgerufen wird
            // ═══════════════════════════════════════════════════════════
            const stateMgr = new StateManager(guildId);
            const state = stateMgr.get(srv.channelID);
            
            if (!state || !state.messageID) {
                // Nur wenn noch keine Message existiert
                this.updateStatus(guildId, srv);
            } else {
                // Message existiert bereits - nur Interval starten
                this.logger.verbose(`Message für ${srv.serverName} existiert bereits (ID: ${state.messageID})`);
            }
            
            const iv = setInterval(() => this.updateStatus(guildId, srv), interval);
            intervals.push(iv);
            
            this.logger.success(`Monitoring: ${srv.serverName} (${interval}ms)`);
        }

        this.guildIntervals.set(guildId, intervals);
    }

    stopMonitoring(guildId) {
        if (this.guildIntervals.has(guildId)) {
            this.guildIntervals.get(guildId).forEach(iv => clearInterval(iv));
            this.guildIntervals.delete(guildId);
        }
    }
}

module.exports = { MonitoringManager };
