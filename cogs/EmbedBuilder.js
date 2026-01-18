// ═══════════════════════════════════════════════════════════
//  EMBED BUILDER MODULE - WITH DEBUG LOGGING AND FIELD ROTATION
//  Enhanced version with Field Rotation System and Password Field Fix
//  VERSION 2: Fixed Password Field Logic
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { ColorValidator } = require('./ColorValidator');

class StatusEmbedBuilder {
    /**
     * Creates a status embed for Farming Simulator server
     * @param {Object} data - Server status data from StatusChecker
     * @param {Object} srv - Server config
     * @param {Object} gcfg - Guild config
     * @param {Object} messageHandler - MessageHandler instance (optional)
     * @param {Object} logger - Logger instance (optional)
     */
    static createEmbed(data, srv, gcfg, messageHandler = null, logger = null) {
        const s = srv.embedSettings || {};
        
        // ═══════════════════════════════════════════════════════════
        // DEBUG: LOG ALL AVAILABLE DATA
        // ═══════════════════════════════════════════════════════════
        if (logger) {
            logger.debugSeparator('EMBED CREATION');
            logger.debug(`Server: ${srv.serverName}`);
            logger.debug(`Online: ${data.online}`);
            
            logger.debug('Available Data:');
            logger.debug(`  - map: ${data.map ? `"${data.map}"` : 'NULL'}`);
            logger.debug(`  - version: ${data.version ? `"${data.version}"` : 'NULL'}`);
            logger.debug(`  - hasPassword: ${data.hasPassword}`);
            logger.debug(`  - players: ${data.players ? `${data.players.online}/${data.players.max}` : 'NULL'}`);
            logger.debug(`  - modCount: ${data.modCount !== null ? data.modCount : 'NULL'}`);
            logger.debug(`  - vehicles: ${data.vehicles ? `${data.vehicles.count} total` : 'NULL'}`);
            logger.debug(`  - career: ${data.career ? 'EXISTS' : 'NULL'}`);
            
            if (data.career) {
                logger.debug('Career Data:');
                logger.debug(`    - money: ${data.career.money !== null && data.career.money !== undefined ? data.career.money : 'NULL'}`);
                logger.debug(`    - difficulty: ${data.career.difficulty ? `"${data.career.difficulty}"` : 'NULL'}`);
                logger.debug(`    - timeScale: ${data.career.timeScale !== null && data.career.timeScale !== undefined ? data.career.timeScale : 'NULL'}`);
            }
            
            logger.debug(`  - economy: ${data.economy ? 'EXISTS' : 'NULL'}`);
            if (data.economy) {
                logger.debug(`    - greatDemands: ${data.economy.greatDemands ? data.economy.greatDemands.length : 0} active`);
            }
            
            logger.debug('Embed Settings:');
            logger.debug(`  - showMap: ${s.showMap} (will show: ${s.showMap !== false})`);
            logger.debug(`  - showVersion: ${s.showVersion} (will show: ${s.showVersion !== false})`);
            logger.debug(`  - showPasswordField: ${s.showPasswordField} (will show: ${s.showPasswordField !== false})`);
            logger.debug(`  - showPlayers: ${s.showPlayers} (will show: ${s.showPlayers !== false})`);
            logger.debug(`  - showPlayerList: ${s.showPlayerList} (will show: ${s.showPlayerList !== false})`);
            logger.debug(`  - showMods: ${s.showMods} (will show: ${s.showMods !== false})`);
            logger.debug(`  - showVehicles: ${s.showVehicles} (will show: ${s.showVehicles !== false})`);
            logger.debug(`  - showMoney: ${s.showMoney} (will show: ${s.showMoney !== false})`);
            logger.debug(`  - showDifficulty: ${s.showDifficulty} (will show: ${s.showDifficulty !== false})`);
            logger.debug(`  - showTimeScale: ${s.showTimeScale} (will show: ${s.showTimeScale !== false})`);
            logger.debug(`  - showGreatDemands: ${s.showGreatDemands} (will show: ${s.showGreatDemands !== false})`);
            logger.debug(`  - enableFieldRotation: ${s.enableFieldRotation}`);
        }
        
        // Emojis from config (with fallback)
        const e = s.emojis || gcfg.defaultEmojis;
        
        const safeColor = ColorValidator.getStatusColor(
			s, gcfg.embedColors || {}, data.online
		);
		const embed = new EmbedBuilder()
			.setColor(safeColor)
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
            
            // ═══════════════════════════════════════════════════════════
            // FIELD COLLECTION SYSTEM
            // ═══════════════════════════════════════════════════════════
            
            // Sammle alle Fields die potentiell hinzugefügt werden könnten
            const allPotentialFields = [];
            
            // ═══════════════════════════════════════════════════════════
            // MAP FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.map && s.showMap !== false) {
                const mapLabel = messageHandler
                    ? messageHandler.get('status.online.fields.map', { emoji: e.map }, srv, gcfg)
                    : `${e.map} Map`;
                
                allPotentialFields.push({
                    name: mapLabel,
                    value: data.map,
                    inline: false,
                    fieldId: 'map'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // VERSION FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.version && s.showVersion !== false) {
                const versionLabel = messageHandler
                    ? messageHandler.get('status.online.fields.version', { emoji: e.version }, srv, gcfg)
                    : `${e.version} Version`;
                
                allPotentialFields.push({
                    name: versionLabel,
                    value: data.version,
                    inline: true,
                    fieldId: 'version'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // PASSWORD FIELD (CONFIG-BASED with hasNoPassword option)
            // ═══════════════════════════════════════════════════════════
            
            // Hole Passwort aus Config (beide Varianten unterstützen)
            const configPassword = srv.server_password || srv.serverPassword;
            const hasNoPassword = s.hasNoPassword === true;
            
            // WICHTIG: Das XML enthält KEINE Passwort-Information (Sicherheit!)
            // Das Passwort muss manuell in der Bot-Config eingetragen werden.
            //
            // Neue Option: hasNoPassword
            // User kann explizit angeben dass der Server KEIN Passwort hat
            // → Zeigt "🔓 No password required" an
            //
            // Konflikt-Handling: Wenn BEIDES gesetzt (hasNoPassword + serverPassword):
            // → serverPassword hat Priorität (wird angezeigt)
            // → Warnung in Debug-Logs
            
            if (s.showPasswordField !== false && (configPassword || hasNoPassword)) {
                // Debug: Zeige Password Field Status
                if (logger) {
                    logger.debug('┌─────────────────────────────────────────┐', 'embed');
                    logger.debug('│  PASSWORD FIELD (CONFIG-BASED)          │', 'embed');
                    logger.debug('├─────────────────────────────────────────┤', 'embed');
                    logger.debug(`│ s.showPasswordField:   ${s.showPasswordField !== false ? '✅ TRUE' : '❌ FALSE'}`, 'embed');
                    logger.debug(`│ s.revealPasswordText:  ${s.revealPasswordText === true ? '✅ TRUE' : '❌ FALSE'}`, 'embed');
                    logger.debug(`│ s.hasNoPassword:       ${hasNoPassword ? '✅ TRUE' : '❌ FALSE'}`, 'embed');
                    logger.debug('├─────────────────────────────────────────┤', 'embed');
                    logger.debug('│  CONFIG PASSWORD DETECTION              │', 'embed');
                    logger.debug('├─────────────────────────────────────────┤', 'embed');
                    logger.debug(`│ srv.server_password:   ${srv.server_password ? `"${srv.server_password}"` : '❌ NULL/UNDEFINED'}`, 'embed');
                    logger.debug(`│ srv.serverPassword:    ${srv.serverPassword ? `"${srv.serverPassword}"` : '❌ NULL/UNDEFINED'}`, 'embed');
                    logger.debug(`│ configPassword:        ${configPassword ? '✅ SET' : '❌ NOT SET'}`, 'embed');
                    logger.debug('└─────────────────────────────────────────┘', 'embed');
                    
                    // Konflikt-Warnung
                    if (hasNoPassword && configPassword) {
                        logger.warning('┌─────────────────────────────────────────┐', 'embed');
                        logger.warning('│  ⚠️  CONFIGURATION CONFLICT             │', 'embed');
                        logger.warning('├─────────────────────────────────────────┤', 'embed');
                        logger.warning('│ hasNoPassword=true but password is set! │', 'embed');
                        logger.warning('│ Password takes priority and will be     │', 'embed');
                        logger.warning('│ displayed. Remove password OR set       │', 'embed');
                        logger.warning('│ hasNoPassword=false to fix this.        │', 'embed');
                        logger.warning('└─────────────────────────────────────────┘', 'embed');
                    }
                }
                
                const passwordLabel = messageHandler
                    ? messageHandler.get('status.online.fields.password', { emoji: e.password }, srv, gcfg)
                    : `${e.password} Password`;
                
                let passwordValue;
                let debugReason = '';
                
                // Logik mit Priorität:
                // 1. Config-Passwort gesetzt → Zeige Passwort (hat Priorität!)
                // 2. hasNoPassword=true → Zeige "No password required"
                // 3. Nichts gesetzt → Field wird ausgeblendet (dieser Fall wird oben abgefangen)
                
                if (configPassword) {
                    // Passwort hat Priorität (auch wenn hasNoPassword gesetzt ist)
                    if (s.revealPasswordText) {
                        // Zeige Passwort als Discord Spoiler
                        passwordValue = `||${configPassword}|| *(Click to show)*`;
                        debugReason = hasNoPassword 
                            ? 'CONFLICT: Both set → password priority → showing as spoiler'
                            : 'revealPasswordText=TRUE → showing as spoiler';
                    } else {
                        // Zeige nur "Protected" Status
                        passwordValue = '🔒 Protected';
                        debugReason = hasNoPassword
                            ? 'CONFLICT: Both set → password priority → showing "Protected"'
                            : 'revealPasswordText=FALSE → showing "Protected"';
                    }
                } else if (hasNoPassword) {
                    // Explizit: Server hat KEIN Passwort
                    passwordValue = '🔓 No password required';
                    debugReason = 'hasNoPassword=TRUE → showing "No password required"';
                }
                
                if (logger) {
                    logger.debug(`┌─────────────────────────────────────────┐`, 'embed');
                    logger.debug(`│  PASSWORD FIELD RESULT                  │`, 'embed');
                    logger.debug(`├─────────────────────────────────────────┤`, 'embed');
                    logger.debug(`│ Reason:  ${debugReason}`, 'embed');
                    logger.debug(`│ Value:   "${passwordValue}"`, 'embed');
                    logger.debug(`└─────────────────────────────────────────┘`, 'embed');
                }
                
                allPotentialFields.push({
                    name: passwordLabel,
                    value: passwordValue,
                    inline: true,
                    fieldId: 'password'
                });
            } else {
                // Field wird ausgeblendet
                if (logger) {
                    const reason = s.showPasswordField === false 
                        ? 'showPasswordField = false' 
                        : 'no password AND hasNoPassword not set';
                    logger.debug(`❌ Password Field HIDDEN (${reason})`, 'embed');
                }
            }


            // ═══════════════════════════════════════════════════════════
            // PLAYERS FIELD
            // ═══════════════════════════════════════════════════════════
            if (s.showPlayers !== false) {
                const playersLabel = messageHandler
                    ? messageHandler.get('status.online.fields.players', { emoji: e.players }, srv, gcfg)
                    : `${e.players} Players`;
                
                allPotentialFields.push({
                    name: playersLabel,
                    value: `${data.players.online}/${data.players.max}`,
                    inline: true,
                    fieldId: 'players'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // MODS FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.modCount != null && s.showMods !== false) {
                const modsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.mods', { emoji: e.mods }, srv, gcfg)
                    : `${e.mods} Mods`;
                
                allPotentialFields.push({
                    name: modsLabel,
                    value: String(data.modCount),
                    inline: true,
                    fieldId: 'mods'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // VEHICLES FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.vehicles && s.showVehicles !== false) {
                const vehiclesLabel = messageHandler
                    ? messageHandler.get('status.online.fields.vehicles', { emoji: e.vehicles }, srv, gcfg)
                    : `${e.vehicles || '🚜'} Vehicles`;
                
                allPotentialFields.push({
                    name: vehiclesLabel,
                    value: `${data.vehicles.count} total`,
                    inline: true,
                    fieldId: 'vehicles'
                });
            }
			
			// ═══════════════════════════════════════════════════════════
            // MOD LIST LINK
            // ═══════════════════════════════════════════════════════════
            if (srv.mod_list_url && s.showModList !== false) {
                const modListLabel = messageHandler
                    ? messageHandler.get('status.online.fields.modList', { emoji: e.mods }, srv, gcfg)
                    : `${e.mods || '🔧'} Mod List`;
                
                allPotentialFields.push({
                    name: modListLabel,
                    value: `[View Mods](${srv.mod_list_url})`,
                    inline: true,
                    fieldId: 'modList'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // MONEY FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.career && data.career.money != null && s.showMoney !== false) {
                const moneyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.money', { emoji: e.money }, srv, gcfg)
                    : `${e.money} Money`;
                
                const formattedMoney = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(data.career.money);
                
                allPotentialFields.push({
                    name: moneyLabel,
                    value: formattedMoney,
                    inline: true,
                    fieldId: 'money'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // DIFFICULTY FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.career && data.career.difficulty && s.showDifficulty !== false) {
                const difficultyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.difficulty', { emoji: e.difficulty }, srv, gcfg)
                    : `${e.difficulty} Difficulty`;
                
                const difficultyValue = data.career.difficulty.charAt(0).toUpperCase() + 
                                       data.career.difficulty.slice(1).toLowerCase();
                
                allPotentialFields.push({
                    name: difficultyLabel,
                    value: difficultyValue,
                    inline: true,
                    fieldId: 'difficulty'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // TIME SCALE FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.career && data.career.timeScale && s.showTimeScale !== false) {
                const timeScaleLabel = messageHandler
                    ? messageHandler.get('status.online.fields.timeScale', { emoji: e.timeScale }, srv, gcfg)
                    : `${e.timeScale} Time Scale`;
                
                const timeScaleValue = `${data.career.timeScale}x`;
                
                allPotentialFields.push({
                    name: timeScaleLabel,
                    value: timeScaleValue,
                    inline: true,
                    fieldId: 'timeScale'
                });
            }
			
			// ═══════════════════════════════════════════════════════════
            // NEUE CAREER FELDER - ZEIT & DATUM
            // ═══════════════════════════════════════════════════════════

            // PLAY TIME
            if (data.career && data.career.playTimeFormatted && s.showPlayTime !== false) {
                const playTimeLabel = messageHandler
                    ? messageHandler.get('status.online.fields.playTime', { emoji: e.playTime || '🕐' }, srv, gcfg)
                    : `🕐 Play Time`;
                
                allPotentialFields.push({
                    name: playTimeLabel,
                    value: data.career.playTimeFormatted,
                    inline: true,
                    fieldId: 'playTime'
                });
            }

            // CURRENT DAY & SEASON (kombiniert)
            if (data.career && data.career.currentDay && data.career.currentSeason && s.showCurrentDate !== false) {
                const currentDateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.currentDate', { emoji: e.currentDate || '📅' }, srv, gcfg)
                    : `📅 Current Date`;
                
                const seasonName = data.career.currentSeason.charAt(0) + data.career.currentSeason.slice(1).toLowerCase();
                const maxDays = data.career.daysPerPeriod || 28;
                const dateValue = `Day ${data.career.currentDay}/${maxDays}, ${seasonName}`;
                
                allPotentialFields.push({
                    name: currentDateLabel,
                    value: dateValue,
                    inline: true,
                    fieldId: 'currentDate'
                });
            }

            // SAVE DATE
            if (data.career && data.career.saveDateFormatted && s.showSaveDate !== false) {
                const saveDateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.saveDate', { emoji: e.saveDate || '💾' }, srv, gcfg)
                    : `💾 Last Saved`;
                
                allPotentialFields.push({
                    name: saveDateLabel,
                    value: data.career.saveDateFormatted,
                    inline: true,
                    fieldId: 'saveDate'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // CREATION DATE FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.career && data.career.creationDate && s.showCreationDate !== false) {
                const creationDateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.creationDate', { emoji: e.creationDate }, srv, gcfg)
                    : `${e.creationDate || '🛠️'} Creation Date`;
                
                // Format creation date (ISO to readable)
                const creationDateFormatted = new Date(data.career.creationDate).toLocaleDateString('de-DE');
                
                allPotentialFields.push({
                    name: creationDateLabel,
                    value: creationDateFormatted,
                    inline: true,
                    fieldId: 'creationDate'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // GAMEPLAY SETTINGS
            // ═══════════════════════════════════════════════════════════

            // GROWTH RATE
            if (data.career && data.career.growthRate != null && s.showGrowthRate !== false) {
                const growthRateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.growthRate', { emoji: e.growthRate || '🌱' }, srv, gcfg)
                    : `🌱 Growth Rate`;
                
                const growthValue = `${data.career.growthRate}x`;
                
                allPotentialFields.push({
                    name: growthRateLabel,
                    value: growthValue,
                    inline: true,
                    fieldId: 'growthRate'
                });
            }

            // FIELD JOBS
            if (data.career && data.career.fieldJobsEnabled != null && s.showFieldJobs !== false) {
                const fieldJobsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.fieldJobs', { emoji: e.fieldJobs || '📋' }, srv, gcfg)
                    : `📋 Field Jobs`;
                
                const fieldJobsValue = data.career.fieldJobsEnabled
                    ? (messageHandler ? messageHandler.get('status.online.fieldJobsOn', {}, srv, gcfg) : '✅ Enabled')
                    : (messageHandler ? messageHandler.get('status.online.fieldJobsOff', {}, srv, gcfg) : '❌ Disabled');
                
                allPotentialFields.push({
                    name: fieldJobsLabel,
                    value: fieldJobsValue,
                    inline: true,
                    fieldId: 'fieldJobs'
                });
            }

            // AUTO SAVE
            if (data.career && data.career.autoSaveEnabled != null && s.showAutoSave !== false) {
                const autoSaveLabel = messageHandler
                    ? messageHandler.get('status.online.fields.autoSave', { emoji: e.autoSave || '💾' }, srv, gcfg)
                    : `💾 Auto Save`;
                
                const autoSaveValue = data.career.autoSaveEnabled
                    ? (messageHandler ? messageHandler.get('status.online.autoSaveOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.autoSaveOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: autoSaveLabel,
                    value: autoSaveValue,
                    inline: true,
                    fieldId: 'autoSave'
                });
            }

            // RESET VEHICLES
            if (data.career && data.career.resetVehicles != null && s.showResetVehicles !== false) {
                const resetVehiclesLabel = messageHandler
                    ? messageHandler.get('status.online.fields.resetVehicles', { emoji: e.resetVehicles || '🔄' }, srv, gcfg)
                    : `🔄 Reset Vehicles`;
                
                const resetVehiclesValue = data.career.resetVehicles
                    ? (messageHandler ? messageHandler.get('status.online.resetVehiclesOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.resetVehiclesOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: resetVehiclesLabel,
                    value: resetVehiclesValue,
                    inline: true,
                    fieldId: 'resetVehicles'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // NEUE GAMEPLAY SETTINGS
            // ═══════════════════════════════════════════════════════════

            // TRAFFIC
            if (data.career && data.career.trafficEnabled != null && s.showTraffic !== false) {
                const trafficLabel = messageHandler
                    ? messageHandler.get('status.online.fields.traffic', { emoji: e.traffic || '🚦' }, srv, gcfg)
                    : `🚦 Traffic`;
                
                const trafficValue = data.career.trafficEnabled
                    ? (messageHandler ? messageHandler.get('status.online.trafficOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.trafficOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: trafficLabel,
                    value: trafficValue,
                    inline: true,
                    fieldId: 'traffic'
                });
            }

            // WEEDS
            if (data.career && data.career.weedsEnabled != null && s.showWeeds !== false) {
                const weedsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.weeds', { emoji: e.weeds || '🌱' }, srv, gcfg)
                    : `🌱 Weeds`;
                
                const weedsValue = data.career.weedsEnabled
                    ? (messageHandler ? messageHandler.get('status.online.weedsOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.weedsOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: weedsLabel,
                    value: weedsValue,
                    inline: true,
                    fieldId: 'weeds'
                });
            }

            // FRUIT DESTRUCTION
            if (data.career && data.career.fruitDestruction != null && s.showFruitDestruction !== false) {
                const fruitLabel = messageHandler
                    ? messageHandler.get('status.online.fields.fruitDestruction', { emoji: e.fruitDestruction || '🌾' }, srv, gcfg)
                    : `🌾 Fruit Destruction`;
                
                const fruitValue = data.career.fruitDestruction
                    ? (messageHandler ? messageHandler.get('status.online.fruitDestructionOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.fruitDestructionOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: fruitLabel,
                    value: fruitValue,
                    inline: true,
                    fieldId: 'fruitDestruction'
                });
            }

            // SNOW
            if (data.career && data.career.snowEnabled != null && s.showSnow !== false) {
                const snowLabel = messageHandler
                    ? messageHandler.get('status.online.fields.snow', { emoji: e.snow || '❄️' }, srv, gcfg)
                    : `❄️ Snow`;
                
                const snowValue = data.career.snowEnabled
                    ? (messageHandler ? messageHandler.get('status.online.snowOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.snowOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: snowLabel,
                    value: snowValue,
                    inline: true,
                    fieldId: 'snow'
                });
            }

            // STONES
            if (data.career && data.career.stonesEnabled != null && s.showStones !== false) {
                const stonesLabel = messageHandler
                    ? messageHandler.get('status.online.fields.stones', { emoji: e.stones || '🪨' }, srv, gcfg)
                    : `🪨 Stones`;
                
                const stonesValue = data.career.stonesEnabled
                    ? (messageHandler ? messageHandler.get('status.online.stonesOn', {}, srv, gcfg) : '✅ On')
                    : (messageHandler ? messageHandler.get('status.online.stonesOff', {}, srv, gcfg) : '❌ Off');
                
                allPotentialFields.push({
                    name: stonesLabel,
                    value: stonesValue,
                    inline: true,
                    fieldId: 'stones'
                });
            }

            // FUEL USAGE
            if (data.career && data.career.fuelUsage != null && s.showFuelUsage !== false) {
                const fuelLabel = messageHandler
                    ? messageHandler.get('status.online.fields.fuelUsage', { emoji: e.fuelUsage || '⛽' }, srv, gcfg)
                    : `⛽ Fuel Usage`;
                
                // Fuel Usage ist ein Multiplikator (z.B. 1.0 = 100%, 0.5 = 50%)
                const fuelPercent = Math.round(data.career.fuelUsage * 100);
                const fuelValue = `${fuelPercent}%`;
                
                allPotentialFields.push({
                    name: fuelLabel,
                    value: fuelValue,
                    inline: true,
                    fieldId: 'fuelUsage'
                });
            }

			// ═══════════════════════════════════════════════════════════
            // FINANCIAL DATA
            // ═══════════════════════════════════════════════════════════

            // INITIAL LOAN FIELD
            if (data.career && data.career.initialLoan !== null && s.showInitialLoan !== false) {
                const initialLoanLabel = messageHandler
                    ? messageHandler.get('status.online.fields.initialLoan', { emoji: e.loan }, srv, gcfg)
                    : `${e.loan || '🏦'} Initial Loan`;
                
                const formattedLoan = new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(data.career.initialLoan);
                
                allPotentialFields.push({
                    name: initialLoanLabel,
                    value: formattedLoan,
                    inline: true,
                    fieldId: 'initialLoan'
                });
            }

            // INITIAL MONEY
            if (data.career && data.career.initialMoney != null && s.showInitialMoney !== false) {
                const initialMoneyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.initialMoney', { emoji: e.initialMoney || '💼' }, srv, gcfg)
                    : `💼 Start Money`;
                
                const formattedInitialMoney = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(data.career.initialMoney);
                
                allPotentialFields.push({
                    name: initialMoneyLabel,
                    value: formattedInitialMoney,
                    inline: true,
                    fieldId: 'initialMoney'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // HELPER SETTINGS
            // ═══════════════════════════════════════════════════════════
            if (data.career && s.showHelperSettings !== false) {
                const helperFuelLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperFuel', { emoji: e.helperFuel }, srv, gcfg)
                    : `${e.helperFuel || '⛽'} Helper Buy Fuel`;
                
                const helperSeedsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperSeeds', { emoji: e.helperSeeds }, srv, gcfg)
                    : `${e.helperSeeds || '🌾'} Helper Buy Seeds`;
                
                const helperFertilizerLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperFertilizer', { emoji: e.helperFertilizer }, srv, gcfg)
                    : `${e.helperFertilizer || '💊'} Helper Buy Fertilizer`;
                
                // Fuel
				if (data.career.helperBuyFuel !== null && data.career.helperBuyFuel !== undefined && s.showHelperFuel !== false) {
					const fuelValue = data.career.helperBuyFuel ? '✅ Enabled' : '❌ Disabled';
					if (helperFuelLabel && typeof helperFuelLabel === 'string' && helperFuelLabel.length > 0) {
						allPotentialFields.push({
							name: helperFuelLabel,
							value: fuelValue,
							inline: true,
							fieldId: 'helperFuel'
						});
					}
				}

				// Seeds
				if (data.career.helperBuySeeds !== null && data.career.helperBuySeeds !== undefined && s.showHelperSeeds !== false) {
					const seedsValue = data.career.helperBuySeeds ? '✅ Enabled' : '❌ Disabled';
					if (helperSeedsLabel && typeof helperSeedsLabel === 'string' && helperSeedsLabel.length > 0) {
						allPotentialFields.push({
							name: helperSeedsLabel,
							value: seedsValue,
							inline: true,
							fieldId: 'helperSeeds'
						});
					}
				}

				// Fertilizer
				if (data.career.helperBuyFertilizer !== null && data.career.helperBuyFertilizer !== undefined && s.showHelperFertilizer !== false) {
					const fertilizerValue = data.career.helperBuyFertilizer ? '✅ Enabled' : '❌ Disabled';
					if (helperFertilizerLabel && typeof helperFertilizerLabel === 'string' && helperFertilizerLabel.length > 0) {
						allPotentialFields.push({
							name: helperFertilizerLabel,
							value: fertilizerValue,
							inline: true,
							fieldId: 'helperFertilizer'
						});
					}
				}
            }

            // ═══════════════════════════════════════════════════════════
            // SAVEGAME INFO
            // ═══════════════════════════════════════════════════════════

            // SAVEGAME NAME
            if (data.career && data.career.savegameName && s.showSavegameName !== false) {
                const savegameNameLabel = messageHandler
                    ? messageHandler.get('status.online.fields.savegameName', { emoji: e.savegameName || '📂' }, srv, gcfg)
                    : `📂 Savegame`;
                
                allPotentialFields.push({
                    name: savegameNameLabel,
                    value: data.career.savegameName,
                    inline: true,
                    fieldId: 'savegameName'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // PLAYER LIST FIELD
            // ═══════════════════════════════════════════════════════════
            if (s.showPlayerList !== false) {
                const playerListLabel = messageHandler
                    ? messageHandler.get('status.online.fields.playerList', { emoji: e.playerList }, srv, gcfg)
                    : `${e.playerList} Online Players`;
                
                if (data.players.list.length > 0) {
                    const list = data.players.list.join(', ').substring(0, 1024);
                    allPotentialFields.push({
                        name: playerListLabel,
                        value: list,
                        inline: false,
                        fieldId: 'playerList'
                    });
                } else if (data.players.max > 0) {
                    const noPlayersText = messageHandler
                        ? messageHandler.get('status.online.noPlayers', {}, srv, gcfg)
                        : '➖ Nobody online';
                    
                    allPotentialFields.push({
                        name: playerListLabel,
                        value: noPlayersText,
                        inline: false,
                        fieldId: 'playerList'
                    });
                }
            }

            // ═══════════════════════════════════════════════════════════
            // GREAT DEMANDS FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.economy && data.economy.greatDemands && data.economy.greatDemands.length > 0 && s.showGreatDemands !== false) {
                const demands = data.economy.greatDemands.map(d => {
                    const cropName = d.crop.charAt(0) + d.crop.slice(1).toLowerCase();
                    const hours = Math.round(d.durationHours);
                    const bonus = d.bonusPercent || Math.round((d.multiplier - 1) * 100);
                    return `🔥 ${cropName} **+${bonus}%** (${hours}h left)`;
                }).join('\n');
                
                const demandsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.greatDemands', { emoji: '🔥' }, srv, gcfg)
                    : '🔥 Active Demands';
                
                allPotentialFields.push({
                    name: demandsLabel,
                    value: demands,
                    inline: false,
                    fieldId: 'greatDemands'
                });
            }

            // ═══════════════════════════════════════════════════════════
            // FIELD ROTATION LOGIC
            // ═══════════════════════════════════════════════════════════
            
            const MAX_FIELDS = 25;
            const totalFields = allPotentialFields.length;
            
            if (logger) {
                logger.debug(`Total potential fields: ${totalFields}`);
                logger.debug(`Field Rotation enabled: ${s.enableFieldRotation}`);
            }
            
            // Prüfe ob Field Rotation aktiv ist
            if (s.enableFieldRotation) {
                // ✅ ROTATION AKTIV - Zeige rotierenden Ausschnitt
                if (totalFields > MAX_FIELDS) {
                    // Initialisiere Rotation Index wenn nicht vorhanden
                    if (s.currentFieldRotationIndex === undefined) {
                        s.currentFieldRotationIndex = 0;
                    }
                    
                    // Berechne Start und Ende des aktuellen Fensters
                    const windowStart = s.currentFieldRotationIndex;
                    const windowEnd = Math.min(windowStart + MAX_FIELDS, totalFields);
                    
                    // Hole die Fields für dieses Fenster
                    const fieldsToShow = allPotentialFields.slice(windowStart, windowEnd);
                    
                    if (logger) {
                        logger.debug(`Showing fields ${windowStart}-${windowEnd - 1} of ${totalFields}`);
                    }
                    
                    // Füge Fields hinzu
                    fieldsToShow.forEach(field => {
                        embed.addFields({
                            name: field.name,
                            value: field.value,
                            inline: field.inline
                        });
                    });
                    
                    // Berechne nächsten Index (zyklisch)
                    s.currentFieldRotationIndex = windowEnd >= totalFields ? 0 : windowEnd;
                    
                } else {
                    // Weniger als MAX_FIELDS - Zeige alle
                    allPotentialFields.forEach(field => {
                        embed.addFields({
                            name: field.name,
                            value: field.value,
                            inline: field.inline
                        });
                    });
                }
            } else {
                // ❌ ROTATION DEAKTIVIERT
                if (totalFields > MAX_FIELDS) {
                    // ⚠️ ZU VIELE FIELDS - Zeige Warnhinweis
                    if (logger) {
                        logger.debug(`WARNING: ${totalFields} fields exceed limit of ${MAX_FIELDS} with rotation disabled`);
                    }
                    
                    embed.addFields({
                        name: '⚠️ Too Many Fields',
                        value: `This server has **${totalFields} fields** configured, but Discord only allows **${MAX_FIELDS} fields** per embed.\n\n` +
                               `**To fix this:**\n` +
                               `• Enable **Field Rotation** in Setup → Embed Design\n` +
                               `• Or disable some fields in Setup → Embed Design → Hide/View Fields\n\n` +
                               `Current fields will not be displayed until this is resolved.`,
                        inline: false
                    });
                } else {
                    // ✅ Innerhalb des Limits - Zeige alle Fields
                    allPotentialFields.forEach(field => {
                        embed.addFields({
                            name: field.name,
                            value: field.value,
                            inline: field.inline
                        });
                    });
                }
            }

            // MAP SCREENSHOT (as large image below embed) - TOGGLEABLE
			if (srv.map_screenshot_url && s.showMapScreenshot !== false) {
				embed.setImage(srv.map_screenshot_url);
			}

        } else {
            // SERVER IS OFFLINE
            if (logger) logger.debug('Server is OFFLINE - skipping all fields');
            
            const title = messageHandler
                ? messageHandler.get('status.offline.title', { 
                    emoji: e.offline, 
                    serverName: srv.serverName 
                  }, srv, gcfg)
                : `${e.offline} ${srv.serverName} Offline`;
            embed.setTitle(title);
            
            const description = messageHandler
                ? messageHandler.get('status.offline.description', {}, srv, gcfg)
                : 'Server is offline or unreachable';
            embed.setDescription(description);
        }
        
        if (logger) {
            logger.debug('────────────────────────────────────');
            logger.debug('Embed creation complete');
        }

		// Run debug modules
		if (global.debugModules && global.debugModules.length > 0) {
			global.debugModules.forEach(dm => {
				try {
					if (dm.module.EmbedValidator) {
						dm.module.EmbedValidator.validate(embed, logger);
					}
					if (dm.module.FieldInspector) {
						dm.module.FieldInspector.inspect(data, srv, s, logger);
					}
					if (dm.module.DataLogger) {
						dm.module.DataLogger.log({ data, srv, embed: embed.data }, srv.serverName, logger);
					}
				} catch (e) {
					logger.error(`[DEBUG:MODULE] ${dm.name} failed: ${e.message}`, 'debug-module');
				}
			});
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