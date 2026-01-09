// ═══════════════════════════════════════════════════════════
//  EMBED BUILDER MODULE - WITH DEBUG LOGGING
//  Enhanced version to diagnose missing fields
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

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
            logger.debug(`  - vehicles: ${data.vehicles ? `${data.vehicles.total} total` : 'NULL'}`);
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
            logger.debug(`  - showPassword: ${s.showPassword} (will show: ${s.showPassword !== false})`);
            logger.debug(`  - showPlayers: ${s.showPlayers} (will show: ${s.showPlayers !== false})`);
            logger.debug(`  - showPlayerList: ${s.showPlayerList} (will show: ${s.showPlayerList !== false})`);
            logger.debug(`  - showMods: ${s.showMods} (will show: ${s.showMods !== false})`);
            logger.debug(`  - showVehicles: ${s.showVehicles} (will show: ${s.showVehicles !== false})`);
            logger.debug(`  - showMoney: ${s.showMoney} (will show: ${s.showMoney !== false})`);
            logger.debug(`  - showDifficulty: ${s.showDifficulty} (will show: ${s.showDifficulty !== false})`);
            logger.debug(`  - showTimeScale: ${s.showTimeScale} (will show: ${s.showTimeScale !== false})`);
            logger.debug(`  - showGreatDemands: ${s.showGreatDemands} (will show: ${s.showGreatDemands !== false})`);
        }
        
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
            
            // ═══════════════════════════════════════════════════════════
            // MAP FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.map && s.showMap !== false) {
                if (logger) logger.debug(`✅ Adding MAP field: "${data.map}"`);
                
                const mapLabel = messageHandler
                    ? messageHandler.get('status.online.fields.map', { emoji: e.map }, srv, gcfg)
                    : `${e.map} Map`;
                
                embed.addFields({
                    name: mapLabel,
                    value: data.map,
                    inline: false
                });
            } else {
                if (logger) logger.debug(`❌ Skipping MAP field (data.map=${!!data.map}, showMap=${s.showMap}, check=${s.showMap !== false})`);
            }

            // ═══════════════════════════════════════════════════════════
            // VERSION FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.version && s.showVersion !== false) {
                if (logger) logger.debug(`✅ Adding VERSION field: "${data.version}"`);
                
                const versionLabel = messageHandler
                    ? messageHandler.get('status.online.fields.version', { emoji: e.version }, srv, gcfg)
                    : `${e.version} Version`;
                
                embed.addFields({
                    name: versionLabel,
                    value: data.version,
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping VERSION field (data.version=${!!data.version}, showVersion=${s.showVersion}, check=${s.showVersion !== false})`);
            }

            // ═══════════════════════════════════════════════════════════
            // PASSWORD FIELD
            // ═══════════════════════════════════════════════════════════
            if (s.showPasswordField !== false) {
				const passwordLabel = messageHandler
					? messageHandler.get('status.online.fields.password', { emoji: e.password }, srv, gcfg)
					: `${e.password} Password`;
				
				let passwordValue;
				
				if (!data.hasPassword) {
					// Kein Passwort
					passwordValue = messageHandler 
						? messageHandler.get('status.online.passwordNo', {}, srv, gcfg)
						: '🔓 No';
				} else {
					// Passwort vorhanden
					if (s.revealPasswordText && srv.server_password) {
						// Passwort als Spoiler zeigen
						passwordValue = `||${srv.server_password}||`;
					} else {
						// Nur "Ja" anzeigen
						passwordValue = messageHandler 
							? messageHandler.get('status.online.passwordYes', {}, srv, gcfg)
							: '🔒 Yes';
					}
				}
				
				embed.addFields({
					name: passwordLabel,
					value: passwordValue,
					inline: true
				});
			}

            // ═══════════════════════════════════════════════════════════
            // PLAYERS FIELD
            // ═══════════════════════════════════════════════════════════
            if (s.showPlayers !== false) {
                if (logger) logger.debug(`✅ Adding PLAYERS field: ${data.players.online}/${data.players.max}`);
                
                const playersLabel = messageHandler
                    ? messageHandler.get('status.online.fields.players', { emoji: e.players }, srv, gcfg)
                    : `${e.players} Players`;
                
                embed.addFields({
                    name: playersLabel,
                    value: `${data.players.online}/${data.players.max}`,
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping PLAYERS field (showPlayers=${s.showPlayers})`);
            }

            // ═══════════════════════════════════════════════════════════
            // MODS FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.modCount != null && s.showMods !== false) {
                if (logger) logger.debug(`✅ Adding MODS field: ${data.modCount}`);
                
                const modsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.mods', { emoji: e.mods }, srv, gcfg)
                    : `${e.mods} Mods`;
                
                embed.addFields({
                    name: modsLabel,
                    value: String(data.modCount),
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping MODS field (modCount=${data.modCount}, showMods=${s.showMods})`);
            }

            // ═══════════════════════════════════════════════════════════
            // VEHICLES FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.vehicles && s.showVehicles !== false) {
                if (logger) logger.debug(`✅ Adding VEHICLES field: ${data.vehicles.total}`);
                
                const vehiclesLabel = messageHandler
                    ? messageHandler.get('status.online.fields.vehicles', { emoji: e.vehicles }, srv, gcfg)
                    : `${e.vehicles || '🚜'} Vehicles`;
                
                embed.addFields({
                    name: vehiclesLabel,
                    value: `${data.vehicles.total} total`,
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping VEHICLES field (vehicles=${!!data.vehicles}, showVehicles=${s.showVehicles})`);
            }

            // ═══════════════════════════════════════════════════════════
            // MONEY FIELD (CRITICAL DEBUG)
            // ═══════════════════════════════════════════════════════════
            if (logger) {
                logger.debug('─────────────────────────────────────');
                logger.debug('MONEY FIELD CHECK:');
                logger.debug(`  data.career exists: ${!!data.career}`);
                logger.debug(`  data.career.money: ${data.career?.money}`);
                logger.debug(`  data.career.money != null: ${data.career?.money != null}`);
                logger.debug(`  s.showMoney: ${s.showMoney}`);
                logger.debug(`  s.showMoney !== false: ${s.showMoney !== false}`);
                logger.debug(`  FULL CONDITION: ${data.career && data.career.money != null && s.showMoney !== false}`);
            }
            
            if (data.career && data.career.money != null && s.showMoney !== false) {
                if (logger) logger.debug(`✅ Adding MONEY field: ${data.career.money}`);
                
                const moneyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.money', { emoji: e.money }, srv, gcfg)
                    : `${e.money} Money`;
                
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
            } else {
                if (logger) logger.debug(`❌ Skipping MONEY field`);
            }

            // ═══════════════════════════════════════════════════════════
            // DIFFICULTY FIELD (CRITICAL DEBUG)
            // ═══════════════════════════════════════════════════════════
            if (logger) {
                logger.debug('─────────────────────────────────────');
                logger.debug('DIFFICULTY FIELD CHECK:');
                logger.debug(`  data.career exists: ${!!data.career}`);
                logger.debug(`  data.career.difficulty: ${data.career?.difficulty}`);
                logger.debug(`  s.showDifficulty: ${s.showDifficulty}`);
                logger.debug(`  s.showDifficulty !== false: ${s.showDifficulty !== false}`);
                logger.debug(`  FULL CONDITION: ${data.career && data.career.difficulty && s.showDifficulty !== false}`);
            }
            
            if (data.career && data.career.difficulty && s.showDifficulty !== false) {
                if (logger) logger.debug(`✅ Adding DIFFICULTY field: "${data.career.difficulty}"`);
                
                const difficultyLabel = messageHandler
                    ? messageHandler.get('status.online.fields.difficulty', { emoji: e.difficulty }, srv, gcfg)
                    : `${e.difficulty} Difficulty`;
                
                const difficultyValue = data.career.difficulty.charAt(0).toUpperCase() + 
                                       data.career.difficulty.slice(1).toLowerCase();
                
                embed.addFields({
                    name: difficultyLabel,
                    value: difficultyValue,
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping DIFFICULTY field`);
            }

            // ═══════════════════════════════════════════════════════════
            // TIME SCALE FIELD (CRITICAL DEBUG)
            // ═══════════════════════════════════════════════════════════
            if (logger) {
                logger.debug('─────────────────────────────────────');
                logger.debug('TIME SCALE FIELD CHECK:');
                logger.debug(`  data.career exists: ${!!data.career}`);
                logger.debug(`  data.career.timeScale: ${data.career?.timeScale}`);
                logger.debug(`  s.showTimeScale: ${s.showTimeScale}`);
                logger.debug(`  s.showTimeScale !== false: ${s.showTimeScale !== false}`);
                logger.debug(`  FULL CONDITION: ${data.career && data.career.timeScale && s.showTimeScale !== false}`);
            }
            
            if (data.career && data.career.timeScale && s.showTimeScale !== false) {
                if (logger) logger.debug(`✅ Adding TIME SCALE field: ${data.career.timeScale}x`);
                
                const timeScaleLabel = messageHandler
                    ? messageHandler.get('status.online.fields.timeScale', { emoji: e.timeScale }, srv, gcfg)
                    : `${e.timeScale} Time Scale`;
                
                const timeScaleValue = `${data.career.timeScale}x`;
                
                embed.addFields({
                    name: timeScaleLabel,
                    value: timeScaleValue,
                    inline: true
                });
            } else {
                if (logger) logger.debug(`❌ Skipping TIME SCALE field`);
            }
			
			// ═══════════════════════════════════════════════════════════
            // NEUE CAREER FELDER - ZEIT & DATUM (bereits aus Schritt 4)
            // ═══════════════════════════════════════════════════════════

            // PLAY TIME
            if (data.career && data.career.playTimeFormatted && s.showPlayTime !== false) {
                const playTimeLabel = messageHandler
                    ? messageHandler.get('status.online.fields.playTime', { emoji: e.playTime || '🕐' }, srv, gcfg)
                    : `🕐 Play Time`;
                
                embed.addFields({
                    name: playTimeLabel,
                    value: data.career.playTimeFormatted,
                    inline: true
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
                
                embed.addFields({
                    name: currentDateLabel,
                    value: dateValue,
                    inline: true
                });
            }

            // SAVE DATE
            if (data.career && data.career.saveDateFormatted && s.showSaveDate !== false) {
                const saveDateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.saveDate', { emoji: e.saveDate || '💾' }, srv, gcfg)
                    : `💾 Last Saved`;
                
                embed.addFields({
                    name: saveDateLabel,
                    value: data.career.saveDateFormatted,
                    inline: true
                });
            }

            // CREATION DATE (NEU)
            if (data.career && data.career.creationDateFormatted && s.showCreationDate !== false) {
                const creationDateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.creationDate', { emoji: e.creationDate || '🛠️' }, srv, gcfg)
                    : `🛠️ Created`;
                
                embed.addFields({
                    name: creationDateLabel,
                    value: data.career.creationDateFormatted,
                    inline: true
                });
            }

            // ═══════════════════════════════════════════════════════════
            // GAMEPLAY SETTINGS (alt + neu)
            // ═══════════════════════════════════════════════════════════

            // GROWTH RATE
            if (data.career && data.career.growthRate != null && s.showGrowthRate !== false) {
                const growthRateLabel = messageHandler
                    ? messageHandler.get('status.online.fields.growthRate', { emoji: e.growthRate || '🌱' }, srv, gcfg)
                    : `🌱 Growth Rate`;
                
                const growthValue = `${data.career.growthRate}x`;
                
                embed.addFields({
                    name: growthRateLabel,
                    value: growthValue,
                    inline: true
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
                
                embed.addFields({
                    name: fieldJobsLabel,
                    value: fieldJobsValue,
                    inline: true
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
                
                embed.addFields({
                    name: autoSaveLabel,
                    value: autoSaveValue,
                    inline: true
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
                
                embed.addFields({
                    name: resetVehiclesLabel,
                    value: resetVehiclesValue,
                    inline: true
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
                
                embed.addFields({
                    name: trafficLabel,
                    value: trafficValue,
                    inline: true
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
                
                embed.addFields({
                    name: weedsLabel,
                    value: weedsValue,
                    inline: true
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
                
                embed.addFields({
                    name: fruitLabel,
                    value: fruitValue,
                    inline: true
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
                
                embed.addFields({
                    name: snowLabel,
                    value: snowValue,
                    inline: true
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
                
                embed.addFields({
                    name: stonesLabel,
                    value: stonesValue,
                    inline: true
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
                
                embed.addFields({
                    name: fuelLabel,
                    value: fuelValue,
                    inline: true
                });
            }

            // ═══════════════════════════════════════════════════════════
            // FINANCIAL DATA
            // ═══════════════════════════════════════════════════════════

            // LOAN
            if (data.career && data.career.loan != null && s.showLoan !== false) {
                const loanLabel = messageHandler
                    ? messageHandler.get('status.online.fields.loan', { emoji: e.loan || '🏦' }, srv, gcfg)
                    : `🏦 Loan`;
                
                const formattedLoan = new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: 'EUR',
                    minimumFractionDigits: 0,
                    maximumFractionDigits: 0
                }).format(data.career.loan);
                
                embed.addFields({
                    name: loanLabel,
                    value: formattedLoan,
                    inline: true
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
                
                embed.addFields({
                    name: initialMoneyLabel,
                    value: formattedInitialMoney,
                    inline: true
                });
            }

            // ═══════════════════════════════════════════════════════════
            // HELPER SETTINGS
            // ═══════════════════════════════════════════════════════════

            // HELPER BUYS FUEL
            if (data.career && data.career.helperBuysFuel != null && s.showHelperFuel !== false) {
                const helperFuelLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperFuel', { emoji: e.helperFuel || '🛢️' }, srv, gcfg)
                    : `🛢️ Helper Buys Fuel`;
                
                const helperFuelValue = data.career.helperBuysFuel
                    ? (messageHandler ? messageHandler.get('status.online.helperFuelOn', {}, srv, gcfg) : '✅ Yes')
                    : (messageHandler ? messageHandler.get('status.online.helperFuelOff', {}, srv, gcfg) : '❌ No');
                
                embed.addFields({
                    name: helperFuelLabel,
                    value: helperFuelValue,
                    inline: true
                });
            }

            // HELPER BUYS SEEDS
            if (data.career && data.career.helperBuysSeeds != null && s.showHelperSeeds !== false) {
                const helperSeedsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperSeeds', { emoji: e.helperSeeds || '🌾' }, srv, gcfg)
                    : `🌾 Helper Buys Seeds`;
                
                const helperSeedsValue = data.career.helperBuysSeeds
                    ? (messageHandler ? messageHandler.get('status.online.helperSeedsOn', {}, srv, gcfg) : '✅ Yes')
                    : (messageHandler ? messageHandler.get('status.online.helperSeedsOff', {}, srv, gcfg) : '❌ No');
                
                embed.addFields({
                    name: helperSeedsLabel,
                    value: helperSeedsValue,
                    inline: true
                });
            }

            // HELPER BUYS FERTILIZER
            if (data.career && data.career.helperBuysFertilizer != null && s.showHelperFertilizer !== false) {
                const helperFertilizerLabel = messageHandler
                    ? messageHandler.get('status.online.fields.helperFertilizer', { emoji: e.helperFertilizer || '💊' }, srv, gcfg)
                    : `💊 Helper Buys Fertilizer`;
                
                const helperFertilizerValue = data.career.helperBuysFertilizer
                    ? (messageHandler ? messageHandler.get('status.online.helperFertilizerOn', {}, srv, gcfg) : '✅ Yes')
                    : (messageHandler ? messageHandler.get('status.online.helperFertilizerOff', {}, srv, gcfg) : '❌ No');
                
                embed.addFields({
                    name: helperFertilizerLabel,
                    value: helperFertilizerValue,
                    inline: true
                });
            }

            // ═══════════════════════════════════════════════════════════
            // SAVEGAME INFO
            // ═══════════════════════════════════════════════════════════

            // SAVEGAME NAME
            if (data.career && data.career.savegameName && s.showSavegameName !== false) {
                const savegameNameLabel = messageHandler
                    ? messageHandler.get('status.online.fields.savegameName', { emoji: e.savegameName || '📝' }, srv, gcfg)
                    : `📝 Savegame`;
                
                embed.addFields({
                    name: savegameNameLabel,
                    value: data.career.savegameName,
                    inline: true
                });
            }

            // PLAYER LIST (bereits vorhanden, bleibt unverändert)

            // ═══════════════════════════════════════════════════════════
            // PLAYER LIST FIELD
            // ═══════════════════════════════════════════════════════════
            if (s.showPlayerList !== false) {
                const playerListLabel = messageHandler
                    ? messageHandler.get('status.online.fields.playerList', { emoji: e.playerList }, srv, gcfg)
                    : `${e.playerList} Online Players`;
                
                if (data.players.list.length > 0) {
                    if (logger) logger.debug(`✅ Adding PLAYER LIST field: ${data.players.list.length} players`);
                    
                    const list = data.players.list.join(', ').substring(0, 1024);
                    embed.addFields({
                        name: playerListLabel,
                        value: list,
                        inline: false
                    });
                } else if (data.players.max > 0) {
                    if (logger) logger.debug(`✅ Adding PLAYER LIST field: Empty`);
                    
                    const noPlayersText = messageHandler
                        ? messageHandler.get('status.online.noPlayers', {}, srv, gcfg)
                        : '➖ Nobody online';
                    
                    embed.addFields({
                        name: playerListLabel,
                        value: noPlayersText,
                        inline: false
                    });
                }
            } else {
                if (logger) logger.debug(`❌ Skipping PLAYER LIST field (showPlayerList=${s.showPlayerList})`);
            }

            // ═══════════════════════════════════════════════════════════
            // GREAT DEMANDS FIELD
            // ═══════════════════════════════════════════════════════════
            if (data.economy && data.economy.greatDemands && data.economy.greatDemands.length > 0 && s.showGreatDemands !== false) {
                if (logger) logger.debug(`✅ Adding GREAT DEMANDS field: ${data.economy.greatDemands.length} demands`);
                
                const demands = data.economy.greatDemands.map(d => {
                    const cropName = d.crop.charAt(0) + d.crop.slice(1).toLowerCase();
                    const hours = Math.round(d.durationHours);
                    const bonus = d.bonusPercent || Math.round((d.multiplier - 1) * 100);
                    return `🔥 ${cropName} **+${bonus}%** (${hours}h left)`;
                }).join('\n');
                
                const demandsLabel = messageHandler
                    ? messageHandler.get('status.online.fields.greatDemands', { emoji: '🔥' }, srv, gcfg)
                    : '🔥 Active Demands';
                
                embed.addFields({
                    name: demandsLabel,
                    value: demands,
                    inline: false
                });
            } else {
                if (logger) logger.debug(`❌ Skipping GREAT DEMANDS field (economy=${!!data.economy}, demands=${data.economy?.greatDemands?.length || 0}, showGreatDemands=${s.showGreatDemands})`);
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
            logger.debug('─────────────────────────────────────');
            logger.debug('Embed creation complete');
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
