// ═══════════════════════════════════════════════════════════
//  EMBED BUILDER MODULE - FARMING SIMULATOR 25
//  Complete FS-specific implementation with all fields
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class StatusEmbedBuilder {
    /**
     * Creates a status embed for Farming Simulator server
     * @param {Object} data - Server status data from StatusChecker
     * @param {Object} srv - Server config
     * @param {Object} gcfg - Guild config
     * @param {Object} messageHandler - MessageHandler instance (optional)
     */
    static createEmbed(data, srv, gcfg, messageHandler = null) {
        const s = srv.embedSettings || {};
        
        // Emojis from config (with fallback)
        const e = s.emojis || gcfg.defaultEmojis;
        
        const embed = new EmbedBuilder()
            .setColor(data.online ? 
                (s.colorOnline || gcfg.embedColors.online) : 
                (s.colorOffline || gcfg.embedColors.offline))
            .setTimestamp();
        
        // Footer
        const footerText = messageHandler 
            ? messageHandler.get('status.footer', { footerText: gcfg.footerText }, srv, gcfg)
            : `Last updated • ${gcfg.footerText}`;
        embed.setFooter({ text: footerText });

        if (data.online) {
            // ═══════════════════════════════════════════════════════════
            // SERVER IS ONLINE
            // ═══════════════════════════════════════════════════════════
            
            // Title
            const title = messageHandler
                ? messageHandler.get('status.online.title', { 
                    emoji: e.online, 
                    serverName: srv.serverName 
                  }, srv, gcfg)
                : `${e.online} ${srv.serverName} Online`;
            embed.setTitle(title);
            
            // MAP (always show)
            if (data.map && s.showMap !== false) {
                const mapLabel = messageHandler
                    ? messageHandler.get('status.online.fields.map', { emoji: e.map }, srv, gcfg)
                    : `${e.map} Map`;
                
                embed.addFields({
                    name: mapLabel,
                    value: data.map,
                    inline: false
                });
            }

            // VERSION
            if (data.version && s.showVersion !== false) {
                const versionLabel = messageHandler
                    ? messageHandler.get('status.online.fields.version', { emoji: e.version }, srv, gcfg)
                    : `${e.version} Version`;
                
                embed.addFields({
                    name: versionLabel,
                    value: data.version,
                    inline: true
                });
            }

            // PASSWORD STATUS
            if (s.showPassword !== false) {
                const passwordLabel = messageHandler
                    ? messageHandler.get('status.online.fields.password', { emoji: e.password }, srv, gcfg)
                    : `${e.password} Password`;
                
                const passwordValue = data.hasPassword 
                    ? (messageHandler 
                        ? messageHandler.get('status.online.passwordYes', {}, srv, gcfg)
                        : '🔒 Yes')
                    : (messageHandler
                        ? messageHandler.get('status.online.passwordNo', {}, srv, gcfg)
                        : '🔓 No');
                
                embed.addFields({
                    name: passwordLabel,
                    value: passwordValue,
                    inline: true
                });
            }

            // PLAYERS
            if (s.showPlayers !== false) {
                const playersLabel = messageHandler
                    ? messageHandler.get('status.online.fields.players', { emoji: e.players }, srv, gcfg)
                    : `${e.players} Players`;
                
                embed.addFields({
                    name: playersLabel,
                    value: `${data.players.online}/${data.players.max}`,
                    inline: true
                });
            }

            // MODS COUNT
            if (data.modCount != null && s.showMods !== false) {
                const modsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.mods', { emoji: e.mods }, srv, gcfg)
                    : `${e.mods} Mods`;
                
                embed.addFields({
                    name: modsLabel,
                    value: String(data.modCount),
                    inline: true
                });
            }

            // VEHICLE COUNT
            if (data.vehicles && s.showVehicles !== false) {
                const vehiclesLabel = messageHandler
                    ? messageHandler.get('status.online.fields.vehicles', { emoji: e.vehicles }, srv, gcfg)
                    : `${e.vehicles || '🚜'} Vehicles`;
                
                embed.addFields({
                    name: vehiclesLabel,
                    value: `${data.vehicles.total} total`,
                    inline: true
                });
            }

            // MONEY (from Career data)
            if (data.career && data.career.money != null && s.showMoney !== false) {
                const moneyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.money', { emoji: e.money }, srv, gcfg)
                    : `${e.money} Money`;
                
                // Format money with thousands separators
                const formattedMoney = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(data.career.money);
                
                embed.addFields({
                    name: moneyLabel,
                    value: formattedMoney,
                    inline: true
                });
            }

            // DIFFICULTY (from Career data)
            if (data.career && data.career.difficulty && s.showDifficulty !== false) {
                const difficultyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.difficulty', { emoji: e.difficulty }, srv, gcfg)
                    : `${e.difficulty} Difficulty`;
                
                // Capitalize first letter
                const difficultyValue = data.career.difficulty.charAt(0).toUpperCase() + 
                                       data.career.difficulty.slice(1).toLowerCase();
                
                embed.addFields({
                    name: difficultyLabel,
                    value: difficultyValue,
                    inline: true
                });
            }

            // TIME SCALE (from Career data)
            if (data.career && data.career.timeScale && s.showTimeScale !== false) {
                const timeScaleLabel = messageHandler
                    ? messageHandler.get('status.online.fields.timeScale', { emoji: e.timeScale }, srv, gcfg)
                    : `${e.timeScale} Time Scale`;
                
                const timeScaleValue = `${data.career.timeScale}x`;
                
                embed.addFields({
                    name: timeScaleLabel,
                    value: timeScaleValue,
                    inline: true
                });
            }

            // PLAYER LIST
            if (s.showPlayerList !== false) {
                const playerListLabel = messageHandler
                    ? messageHandler.get('status.online.fields.playerList', { emoji: e.playerList }, srv, gcfg)
                    : `${e.playerList} Online Players`;
                
                if (data.players.list.length > 0) {
                    const list = data.players.list.join(', ').substring(0, 1024);
                    embed.addFields({
                        name: playerListLabel,
                        value: list,
                        inline: false
                    });
                } else if (data.players.max > 0) {
                    // Nobody online
                    const noPlayersText = messageHandler
                        ? messageHandler.get('status.online.noPlayers', {}, srv, gcfg)
                        : '➖ Nobody online';
                    
                    embed.addFields({
                        name: playerListLabel,
                        value: noPlayersText,
                        inline: false
                    });
                }
            }

            // GREAT DEMANDS (from Economy data)
            console.log('=== EMBED: GREAT DEMANDS ===');
            console.log('data.economy:', data.economy ? 'EXISTS' : 'NULL');
            if (data.economy) {
                console.log('data.economy.greatDemands:', data.economy.greatDemands);
                console.log('greatDemands.length:', data.economy.greatDemands.length);
            }
            console.log('s.showGreatDemands:', s.showGreatDemands);
            
            if (data.economy && data.economy.greatDemands && data.economy.greatDemands.length > 0 && s.showGreatDemands !== false) {
                console.log('✅ ADDING GREAT DEMANDS FIELD TO EMBED');
                
                const demands = data.economy.greatDemands.map(d => {
                    const cropName = d.crop.charAt(0) + d.crop.slice(1).toLowerCase();
                    const hours = Math.round(d.durationHours);
                    const bonus = d.bonusPercent || Math.round((d.multiplier - 1) * 100);
                    const text = `🔥 ${cropName} **+${bonus}%** (${hours}h left)`;
                    console.log('  Demand text:', text);
                    return text;
                }).join('\n');
                
                console.log('Final demands text:', demands);
                
                const demandsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.greatDemands', { emoji: '🔥' }, srv, gcfg)
                    : '🔥 Active Demands';
                
                console.log('Demands label:', demandsLabel);
                
                embed.addFields({
                    name: demandsLabel,
                    value: demands,
                    inline: false
                });
                
                console.log('✅ FIELD ADDED');
            } else {
                console.log('❌ NOT ADDING - Condition failed');
            }
            console.log('============================');

            // MAP SCREENSHOT (as large image below embed)
            if (srv.map_screenshot_url && s.showMapScreenshot !== false) {
                embed.setImage(srv.map_screenshot_url);
            }

        } else {
            // ═══════════════════════════════════════════════════════════
            // SERVER IS OFFLINE
            // ═══════════════════════════════════════════════════════════
            
            // Title
            const title = messageHandler
                ? messageHandler.get('status.offline.title', { 
                    emoji: e.offline, 
                    serverName: srv.serverName 
                  }, srv, gcfg)
                : `${e.offline} ${srv.serverName} Offline`;
            embed.setTitle(title);
            
            // Description
            const description = messageHandler
                ? messageHandler.get('status.offline.description', {}, srv, gcfg)
                : 'Server is offline or unreachable';
            embed.setDescription(description);
        }

        return embed;
    }

    /**
     * Creates button row
     * @param {Object} srv - Server config
     * @param {Object} gcfg - Guild config (optional)
     * @param {Object} messageHandler - MessageHandler instance (optional)
     */
    static createButtons(srv, gcfg = null, messageHandler = null) {
        const bs = srv.buttonSettings || {};
        if (bs.enabled === false) return null;

        const row = new ActionRowBuilder();
        
        // PLAYERS Button (shows detailed player list)
        if (bs.showPlayersButton !== false) {
            const label = messageHandler
                ? messageHandler.get('buttons.players.label', {}, srv, gcfg)
                : (bs.playersButtonLabel || '👥 Show Players');
            
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`players_${srv.channelID}`)
                    .setLabel(label)
                    .setStyle(ButtonStyle.Primary)
            );
        }

        return row.components.length > 0 ? row : null;
    }
}

module.exports = { StatusEmbedBuilder };