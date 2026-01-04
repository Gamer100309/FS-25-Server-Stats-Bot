// ═══════════════════════════════════════════════════════════
//  ALERT MANAGER MODULE - PHASE 3
//  Great Demand Monitoring & Notification System
//  Full Implementation: Status + Channel + DM Subscribers
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder } = require('discord.js');
const { StatusChecker } = require('./StatusChecker');

class AlertManager {
    constructor(client, configManager, logger, messageHandler) {
        this.client = client;
        this.configManager = configManager;
        this.logger = logger;
        this.messageHandler = messageHandler;
        
        // Track last known demands per guild
        this.lastDemands = new Map(); // guildId -> { serverName: [demands] }
        
        // Track last alert time per guild (for cooldown)
        this.lastAlertTime = new Map(); // guildId -> timestamp
    }

    /**
     * Start monitoring for all guilds
     */
    startMonitoring() {
        // Check alerts every 60 seconds
        setInterval(() => {
            this.checkAllGuilds();
        }, 60000);
        
        this.logger.info('📢 Alert Manager started - checking every 60 seconds');
    }

    /**
     * Check alerts for all guilds
     */
    async checkAllGuilds() {
        for (const [guildId, guild] of this.client.guilds.cache) {
            try {
                await this.checkGuildAlerts(guildId);
            } catch (e) {
                this.logger.error(`Alert check error for guild ${guildId}: ${e.message}`);
            }
        }
    }

    /**
     * Check alerts for a specific guild
     */
    async checkGuildAlerts(guildId) {
        const gcfg = this.configManager.loadGuild(guildId);
        
        // Check if alert system is enabled
        if (!gcfg.alertSystem?.enabled) return;

        for (const srv of gcfg.servers) {
            if (!srv.economy_url) continue;

            try {
                const data = await StatusChecker.getStatus(srv, null);
                
                if (!data.economy?.greatDemands) continue;

                // Find new demands (not seen before)
                const newDemands = this.findNewDemands(guildId, srv.serverName, data.economy.greatDemands);
                
                if (newDemands.length > 0) {
                    this.logger.info(`🔥 New great demands detected on ${srv.serverName}: ${newDemands.map(d => d.crop).join(', ')}`);
                    await this.sendAlerts(guildId, srv, newDemands, gcfg);
                }

                // Update last known demands
                this.updateLastDemands(guildId, srv.serverName, data.economy.greatDemands);

            } catch (e) {
                this.logger.error(`Alert check error for ${srv.serverName}: ${e.message}`);
            }
        }
    }

    /**
     * Find new demands that weren't there before
     */
    findNewDemands(guildId, serverName, currentDemands) {
        const guildKey = `${guildId}_${serverName}`;
        const lastDemands = this.lastDemands.get(guildKey) || [];
        
        const newDemands = currentDemands.filter(current => {
            // Check if this demand is new (not in last demands)
            return !lastDemands.some(last => last.crop === current.crop);
        });

        return newDemands;
    }

    /**
     * Update last known demands
     */
    updateLastDemands(guildId, serverName, demands) {
        const guildKey = `${guildId}_${serverName}`;
        this.lastDemands.set(guildKey, demands);
    }

    /**
     * Send all alerts (Channel + DM)
     */
    async sendAlerts(guildId, srv, demands, gcfg) {
        // 1. Send to alert channel (with cooldown)
        if (gcfg.alertSystem.channelId) {
            await this.sendChannelAlert(guildId, srv, demands, gcfg);
        }

        // 2. Send DMs to subscribers (no cooldown)
        if (gcfg.alertSystem.dmSubscribers?.length > 0) {
            await this.sendDMAlerts(guildId, srv, demands, gcfg);
        }
    }

    /**
     * Send alert to channel (with cooldown)
     */
    async sendChannelAlert(guildId, srv, demands, gcfg) {
        try {
            // Check cooldown
            const now = Date.now();
            const lastAlert = this.lastAlertTime.get(guildId) || 0;
            const cooldownMs = (gcfg.alertSystem.cooldownMinutes || 60) * 60 * 1000;

            if (now - lastAlert < cooldownMs) {
                this.logger.verbose(`Alert cooldown active for guild ${guildId}`);
                return;
            }

            const channel = await this.client.channels.fetch(gcfg.alertSystem.channelId);
            if (!channel) {
                this.logger.error(`Alert channel ${gcfg.alertSystem.channelId} not found`);
                return;
            }

            const embed = this.createAlertEmbed(srv, demands, gcfg);
            await channel.send({ embeds: [embed] });

            // Update last alert time
            this.lastAlertTime.set(guildId, now);
            this.logger.success(`📢 Channel alert sent to ${channel.name}`);

        } catch (e) {
            this.logger.error(`Failed to send channel alert: ${e.message}`);
        }
    }

    /**
     * Send DM alerts to subscribers
     */
    async sendDMAlerts(guildId, srv, demands, gcfg) {
        const subscribers = gcfg.alertSystem.dmSubscribers || [];
        let sent = 0;
        let failed = 0;

        for (const userId of subscribers) {
            try {
                const user = await this.client.users.fetch(userId);
                if (!user) {
                    failed++;
                    continue;
                }

                const embed = this.createAlertEmbed(srv, demands, gcfg);
                await user.send({ embeds: [embed] });
                sent++;

            } catch (e) {
                this.logger.verbose(`Failed to send DM to ${userId}: ${e.message}`);
                failed++;
            }
        }

        if (sent > 0) {
            this.logger.success(`📧 DM alerts sent to ${sent} subscribers`);
        }
        if (failed > 0) {
            this.logger.warning(`⚠️ Failed to send ${failed} DM alerts`);
        }
    }

    /**
     * Create alert embed
     */
    createAlertEmbed(srv, demands, gcfg) {
        const embed = new EmbedBuilder()
            .setColor('#FF6B00')
            .setTitle('🔥 GREAT DEMAND ALERT!')
            .setTimestamp();

        if (demands.length === 1) {
            const d = demands[0];
            const cropName = this.formatCropName(d.crop);
            
            embed.setDescription(
                `**${cropName}** is in HIGH DEMAND!\n\n` +
                `💰 Price: **+40% BONUS**\n` +
                `⏰ Duration: **~${d.durationHours} hours remaining**\n\n` +
                `💡 **Tip:** Sell now for maximum profit!`
            );
        } else {
            const demandList = demands.map(d => {
                const cropName = this.formatCropName(d.crop);
                return `🔥 **${cropName}** (+40%, ~${d.durationHours}h)`;
            }).join('\n');

            embed.setDescription(
                `**Multiple crops in HIGH DEMAND!**\n\n${demandList}\n\n` +
                `💡 **Tip:** Check prices with \`/prices\` for details!`
            );
        }

        embed.setFooter({ text: `Server: ${srv.serverName}` });

        return embed;
    }

    /**
     * Format crop name for display
     */
    formatCropName(crop) {
        // Convert SUGARCANE → Sugarcane, WHEAT → Wheat, etc.
        if (!crop) return 'Unknown';
        
        return crop.charAt(0).toUpperCase() + crop.slice(1).toLowerCase().replace(/_/g, ' ');
    }

    /**
     * Subscribe user to DM alerts
     */
    subscribeUser(guildId, userId) {
        const gcfg = this.configManager.loadGuild(guildId);
        
        if (!gcfg.alertSystem) {
            gcfg.alertSystem = {
                enabled: true,
                channelId: null,
                cooldownMinutes: 60,
                dmSubscribers: [],
                showInStatus: true,
                minDemandPercent: 30
            };
        }

        if (!gcfg.alertSystem.dmSubscribers) {
            gcfg.alertSystem.dmSubscribers = [];
        }

        // Check if already subscribed
        if (gcfg.alertSystem.dmSubscribers.includes(userId)) {
            return { success: false, reason: 'already_subscribed' };
        }

        // Add to subscribers
        gcfg.alertSystem.dmSubscribers.push(userId);
        this.configManager.saveGuild(guildId, gcfg);

        this.logger.info(`📧 User ${userId} subscribed to alerts in guild ${guildId}`);
        return { success: true };
    }

    /**
     * Unsubscribe user from DM alerts
     */
    unsubscribeUser(guildId, userId) {
        const gcfg = this.configManager.loadGuild(guildId);
        
        if (!gcfg.alertSystem?.dmSubscribers) {
            return { success: false, reason: 'not_subscribed' };
        }

        const index = gcfg.alertSystem.dmSubscribers.indexOf(userId);
        if (index === -1) {
            return { success: false, reason: 'not_subscribed' };
        }

        // Remove from subscribers
        gcfg.alertSystem.dmSubscribers.splice(index, 1);
        this.configManager.saveGuild(guildId, gcfg);

        this.logger.info(`📧 User ${userId} unsubscribed from alerts in guild ${guildId}`);
        return { success: true };
    }

    /**
     * Get alert status for user
     */
    getAlertStatus(guildId, userId) {
        const gcfg = this.configManager.loadGuild(guildId);
        
        const isSubscribed = gcfg.alertSystem?.dmSubscribers?.includes(userId) || false;
        const subscriberCount = gcfg.alertSystem?.dmSubscribers?.length || 0;
        const channelId = gcfg.alertSystem?.channelId || null;
        
        return {
            isSubscribed,
            subscriberCount,
            channelId,
            alertsEnabled: gcfg.alertSystem?.enabled || false
        };
    }
}

module.exports = { AlertManager };