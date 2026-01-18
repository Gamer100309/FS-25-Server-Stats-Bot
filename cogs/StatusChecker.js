// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
//  STATUS CHECKER MODULE - FARMING SIMULATOR 25
//  Enhanced with Vehicles and Economy XML Parsing
//  FINAL FIX: count + currentDate + Debug-Logs
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

const https = require('https');
const http = require('http');

class StatusChecker {
    /**
     * Main status check - fetches all server data
     */
    static async getStatus(cfg, logger = null) {
        try {
            // Fetch all XMLs in parallel
            const [statsXml, careerXml, modListHtml, vehiclesXml, economyXml] = await Promise.all([
                this.fetchXml(cfg.stats_url),
                (cfg.career_url || cfg.career_savegame_url) ? this.fetchXml(cfg.career_url || cfg.career_savegame_url) : Promise.resolve(null),
                cfg.mod_list_url ? this.fetchHtml(cfg.mod_list_url) : Promise.resolve(null),
                cfg.vehicles_url ? this.fetchXml(cfg.vehicles_url) : Promise.resolve(null),
                cfg.economy_url ? this.fetchXml(cfg.economy_url) : Promise.resolve(null)
            ]);

            // Debug LOGGING
            if (logger) {
				logger.debugSeparator('network');
				logger.debug(`Stats URL: ${cfg.stats_url}`, 'network');
				logger.debug(`Stats XML: ${statsXml ? `${statsXml.length} chars` : 'NULL'}`, 'network');
				logger.debug(`Career URL: ${cfg.career_url || cfg.career_savegame_url || 'NOT SET'}`, 'network');
				logger.debug(`Career XML: ${careerXml ? `${careerXml.length} chars` : 'NULL'}`, 'network');
				logger.debug(`Vehicles URL: ${cfg.vehicles_url || 'NOT SET'}`, 'network');
				logger.debug(`Vehicles XML: ${vehiclesXml ? `${vehiclesXml.length} chars` : 'NULL'}`, 'network');
				logger.debug(`Economy URL: ${cfg.economy_url || 'NOT SET'}`, 'network');
				logger.debug(`Economy XML: ${economyXml ? `${economyXml.length} chars` : 'NULL'}`, 'network');
			}


            if (!statsXml) {
                return { online: false, error: 'Failed to fetch stats XML' };
            }

            // Parse stats XML
            const statsData = this.parseStatsXml(statsXml, logger);
            if (!statsData) {
                return { online: false, error: 'Failed to parse stats XML' };
            }

            // Parse career data (optional)
            const careerData = careerXml ? this.parseCareerXml(careerXml, logger) : null;

            // Parse mod count (optional)
            let modCount = null;
            if (modListHtml) {
                modCount = this.parseModCount(modListHtml);
            } else if (statsXml) {
                // Fallback: count from stats XML
                modCount = this.countModsFromStats(statsXml);
            }

            // Parse vehicles data (passed logger to maintain detailed logs)
            const vehiclesData = vehiclesXml ? this.parseVehiclesXml(vehiclesXml, logger) : null;

            // Parse economy data (passed logger to maintain detailed logs)
            const economyData = economyXml ? this.parseEconomyXml(economyXml, logger) : null;

            // Build final result
            const result = {
                online: true,
                map: statsData.map,
                version: statsData.version,
                players: statsData.players,
                modCount: modCount,
                career: careerData,
                vehicles: vehiclesData,
                economy: economyData
            };
            
            if (logger) {
				logger.debugSeparator('general');
				logger.debug('Online: true', 'general');
				logger.debug(`Career data: ${careerData ? 'EXISTS' : 'NULL'}`, 'general');
				if (careerData) {
					logger.debug(`  - money: ${careerData.money !== null ? careerData.money : 'NULL'}`, 'general');
					logger.debug(`  - difficulty: ${careerData.difficulty || 'NULL'}`, 'general');
					logger.debug(`  - timeScale: ${careerData.timeScale !== null ? careerData.timeScale : 'NULL'}`, 'general');
					logger.debug(`  - currentDate: ${careerData.currentDate || 'NULL'}`, 'general');
					logger.debug(`  - creationDate: ${careerData.creationDate || 'NULL'}`, 'general');
				}
				logger.debug(`Vehicles data: ${vehiclesData ? 'EXISTS' : 'NULL'}`, 'general');
				if (vehiclesData) {
					logger.debug(`  - count: ${vehiclesData.count}`, 'general');
					logger.debug(`  - totalPrice: â‚¬${vehiclesData.totalPrice}`, 'general');
					logger.debug(`  - totalOperatingTime: ${vehiclesData.totalOperatingTimeFormatted}`, 'general');
				}
			}

			return result;

        } catch (e) {
            return { online: false, error: e.message };
        }
    }

    /**
     * Fetch XML from URL
     */
    static fetchXml(url) {
        return new Promise((resolve, reject) => {
            const protocol = url.startsWith('https') ? https : http;
            const timeout = 10000;

            const req = protocol.get(url, { timeout }, (res) => {
                if (res.statusCode !== 200) {
                    resolve(null);
                    return;
                }

                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
            });

            req.on('error', () => resolve(null));
            req.on('timeout', () => {
                req.destroy();
                resolve(null);
            });
        });
    }

    /**
     * Fetch HTML from URL
     */
    static fetchHtml(url) {
        return this.fetchXml(url); // Same logic
    }

    /**
     * Parse Stats XML
     */
    static parseStatsXml(xml, logger = null) {
        try {
            // Extract Server tag attributes
            const serverMatch = xml.match(/<Server\s+([^>]+)>/);
            if (!serverMatch) return null;

            const attrs = serverMatch[1];
            
            // Parse attributes
            const mapName = this.extractAttribute(attrs, 'mapName');
            const version = this.extractAttribute(attrs, 'version');
            const serverName = this.extractAttribute(attrs, 'name');

            // Decode HTML entities
            const decodedName = this.decodeHtmlEntities(serverName);
            const decodedMap = this.decodeHtmlEntities(mapName);

            // NOTE: Password detection REMOVED
            // The XML does NOT contain password information (security/privacy)
            // Password must be manually configured in bot config
            // hasPassword is no longer returned in the result

            // Extract Slots tag
            const slotsMatch = xml.match(/<Slots\s+([^>]+)>/);
            let capacity = 0;
            let numUsed = 0;

            if (slotsMatch) {
                const slotsAttrs = slotsMatch[1];
                capacity = parseInt(this.extractAttribute(slotsAttrs, 'capacity')) || 0;
                numUsed = parseInt(this.extractAttribute(slotsAttrs, 'numUsed')) || 0;
            }

            // Extract player list
            const playerMatches = xml.matchAll(/<Player\s+isUsed="true">([^<]+)<\/Player>/gi);
            const playerList = [];
            for (const match of playerMatches) {
                const playerName = this.decodeHtmlEntities(match[1].trim());
                if (playerName) {
                    playerList.push(playerName);
                }
            }

            return {
                map: decodedMap || 'Unknown',
                version: version || 'Unknown',
                players: {
                    online: numUsed,
                    max: capacity,
                    list: playerList
                }
            };

        } catch (e) {
            return null;
        }
    }

    /**
	 * Parse Career Savegame XML - ULTRA-COMPLETE VERSION
	 * Extracts ALL available data from career savegame
	 */
	static parseCareerXml(xml, logger = null) {
		const log = (msg, scope = 'career') => {
			if (logger && logger.debug) {
				logger.debug(msg, scope);
			}
			// No console.log fallback - only show when debug is enabled
		};

		log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
		log('ðŸ“Š PARSING CAREER SAVEGAME XML');
		log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
		
		const result = {};

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// HELPER: Safe Extract (mit Fehler-Isolierung)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		const safeExtract = (tagName, parseFunc = (v) => v.trim(), defaultValue = null) => {
			try {
				const pattern = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
				const match = xml.match(pattern);
				if (match && match[1] !== undefined && match[1] !== null) {
					const rawValue = match[1].trim();
					if (rawValue === '') {
						log(`  âš ï¸  ${tagName}: EMPTY (using default: ${defaultValue})`);
						return defaultValue;
					}
					const value = parseFunc(rawValue);
					log(`  âœ… ${tagName}: ${value}`);
					return value;
				} else {
					log(`  âš ï¸  ${tagName}: NOT FOUND (using default: ${defaultValue})`);
					return defaultValue;
				}
			} catch (err) {
				log(`  âŒ ${tagName}: ERROR - ${err.message}`);
				return defaultValue;
			}
		};

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 1: BASIC CAREER DATA
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 1: Basic Career Data');
		
		// Money (in <statistics>!)
		result.money = safeExtract('money', parseFloat, null);
		
		// Difficulty
		result.difficulty = safeExtract('economicDifficulty', v => v, null);
		
		// Time Scale
		result.timeScale = safeExtract('timeScale', parseFloat, null);

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 2: TIME & DATE
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 2: Time & Date');
		
		// Play Time (in Minuten -> Stunden)
		const playTimeMinutes = safeExtract('playTime', parseFloat, null);
		if (playTimeMinutes !== null) {
			result.playTime = playTimeMinutes / 60; // Convert minutes to hours
			result.playTimeFormatted = this.formatPlayTime(result.playTime);
			log(`  ðŸ• Play Time Formatted: ${result.playTimeFormatted}`);
		} else {
			result.playTime = null;
			result.playTimeFormatted = null;
		}

		// Save Date
		const saveDate = safeExtract('saveDate', v => v, null);
		if (saveDate) {
			result.saveDate = saveDate;
			result.saveDateFormatted = this.formatSaveDate(saveDate);
			log(`  ðŸ’¾ Save Date Formatted: ${result.saveDateFormatted}`);
		} else {
			result.saveDate = null;
			result.saveDateFormatted = null;
		}

		// Creation Date
		result.creationDate = safeExtract('creationDate', v => v, null);
		
		// Current Date (NEW! - FIXED!)
		// Parse dayTime to get current in-game date
		const currentDateParsed = this.parseCurrentDate(xml);
		if (currentDateParsed) {
			result.currentDate = currentDateParsed.formatted;
			result.currentDay = currentDateParsed.day;
			result.currentMonth = currentDateParsed.month;
			result.currentYear = currentDateParsed.year;
			result.currentSeason = currentDateParsed.season;
			result.currentSeasonNumber = currentDateParsed.seasonNumber;
			log(`  ðŸ“… Current Date: ${result.currentDate} (${result.currentSeason})`);
		} else {
			result.currentDate = null;
			result.currentDay = null;
			result.currentMonth = null;
			result.currentYear = null;
			result.currentSeason = null;
			result.currentSeasonNumber = null;
		}

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 3: GAMEPLAY SETTINGS (REPARIERT!)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 3: Gameplay Settings');
		
		// Growth Mode â†’ Growth Rate Umrechnung
		// growthMode: 1 = 1x, 2 = 2x, 3 = 4x
		const growthMode = safeExtract('growthMode', parseInt, null);
		if (growthMode !== null) {
			const rateMap = { 1: 1, 2: 2, 3: 4 };
			result.growthRate = rateMap[growthMode] || growthMode;
			log(`  ðŸŒ± Growth Rate (converted from mode ${growthMode}): ${result.growthRate}x`);
		} else {
			result.growthRate = null;
		}

		// Planned Days Per Period (Tage pro Monat)
		result.daysPerPeriod = safeExtract('plannedDaysPerPeriod', parseInt, null);

		// Auto Save (Interval > 0 = enabled)
		const autoSaveInterval = safeExtract('autoSaveInterval', parseFloat, null);
		if (autoSaveInterval !== null) {
			result.autoSaveEnabled = autoSaveInterval > 0;
			result.autoSaveInterval = autoSaveInterval;
			log(`  ðŸ’¾ Auto Save: ${result.autoSaveEnabled} (interval: ${autoSaveInterval}s)`);
		} else {
			result.autoSaveEnabled = null;
			result.autoSaveInterval = null;
		}

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 4: ENVIRONMENTAL SETTINGS (REPARIERT!)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 4: Environmental Settings');
		
		// Traffic
		result.trafficEnabled = safeExtract('trafficEnabled', v => v === 'true', null);
		
		// Weeds
		result.weedsEnabled = safeExtract('weedsEnabled', v => v === 'true', null);
		
		// Fruit Destruction
		result.fruitDestruction = safeExtract('fruitDestruction', v => v === 'true', null);
		
		// Snow (REPARIERT: isSnowEnabled!)
		result.snowEnabled = safeExtract('isSnowEnabled', v => v === 'true', null);
		
		// Stones
		result.stonesEnabled = safeExtract('stonesEnabled', v => v === 'true', null);
		
		// Fuel Usage
		result.fuelUsage = safeExtract('fuelUsage', parseInt, null);

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 5: FINANCIAL DATA (REPARIERT!)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 5: Financial Data');
		
		// Initial Money (REPARIERT: initialMoney!)
		result.initialMoney = safeExtract('initialMoney', parseFloat, null);
		
		// Initial Loan (nur Startkredit)
		result.initialLoan = safeExtract('initialLoan', parseFloat, null);
		
		// Aktueller Kredit existiert NICHT in XML
		result.loan = null;
		log('  âš ï¸  loan: NOT in XML (only initialLoan exists)');

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 6: HELPER SETTINGS
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 6: Helper Settings');
		
		result.helperBuyFuel = safeExtract('helperBuyFuel', v => v === 'true', null);
		result.helperBuySeeds = safeExtract('helperBuySeeds', v => v === 'true', null);
		result.helperBuyFertilizer = safeExtract('helperBuyFertilizer', v => v === 'true', null);

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// PHASE 7: SAVEGAME INFO (REPARIERT!)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Phase 7: Savegame Info');
		
		// Savegame Name (REPARIERT: savegameName!)
		result.savegameName = safeExtract('savegameName', v => v, null);
		
		// Map Title
		result.mapTitle = safeExtract('mapTitle', v => v, null);

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// NICHT-EXISTENTE FELDER (Explizit auf null)
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('ðŸ” Non-Existent Fields (set to null)');
		
		result.fieldJobsEnabled = null;
		log('  âš ï¸  fieldJobsEnabled: NOT in XML');
		
		result.resetVehicles = null;
		log('  âš ï¸  resetVehicles: NOT in XML');

		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		// SUMMARY
		// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
		
		log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
		log(`âœ… Career XML Parsing Complete (${Object.keys(result).length} fields)`);
		log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
		
		return result;
	}

	// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
	// NEW: Parse Current Date from dayTime
	// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
	
	/**
	 * Parse current in-game date from dayTime structure
	 * @param {string} xml - Career XML
	 * @returns {object} Parsed date info or null
	 */
	static parseCurrentDate(xml) {
		try {
			// Extract dayTime tag
			const dayTimeMatch = xml.match(/<dayTime>([\s\S]*?)<\/dayTime>/i);
			if (!dayTimeMatch) return null;
			
			const dayTimeContent = dayTimeMatch[1];
			
			// Extract current day, period (month), year
			const dayMatch = dayTimeContent.match(/<currentDay>(\d+)<\/currentDay>/i);
			const periodMatch = dayTimeContent.match(/<currentPeriod>(\d+)<\/currentPeriod>/i);
			const yearMatch = dayTimeContent.match(/<currentYear>(\d+)<\/currentYear>/i);
			
			if (!dayMatch || !periodMatch || !yearMatch) return null;
			
			const day = parseInt(dayMatch[1]);
			const period = parseInt(periodMatch[1]); // 0-11 (month)
			const year = parseInt(yearMatch[1]);
			
			// Calculate season (0=Spring, 1=Summer, 2=Autumn, 3=Winter)
			const seasonNumber = Math.floor(period / 3);
			const season = this.getSeasonName(seasonNumber);
			
			// Month names
			const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
			                   'July', 'August', 'September', 'October', 'November', 'December'];
			const monthName = monthNames[period] || 'Unknown';
			
			// Format: "Day 5, June Year 3" or similar
			const formatted = `Day ${day}, ${monthName} Year ${year}`;
			
			return {
				day: day,
				month: period + 1, // 1-12
				monthName: monthName,
				year: year,
				season: season,
				seasonNumber: seasonNumber,
				formatted: formatted
			};
			
		} catch (err) {
			console.log(`  âŒ parseCurrentDate ERROR: ${err.message}`);
			return null;
		}
	}

	// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
	// HELPER FUNCTIONS (bereits vorhanden, hier zur VollstÃ¤ndigkeit)
	// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

	/**
	 * Format play time to human readable format
	 * @param {number} hours - Play time in hours
	 * @returns {string} Formatted time (e.g. "45h 23m")
	 */
	static formatPlayTime(hours) {
		if (!hours) return null;
		
		const h = Math.floor(hours);
		const m = Math.floor((hours - h) * 60);
		
		if (h > 0 && m > 0) {
			return `${h}h ${m}m`;
		} else if (h > 0) {
			return `${h}h`;
		} else {
			return `${m}m`;
		}
	}

	/**
	 * Get season name from number
	 * @param {number} seasonNum - Season number (0-3)
	 * @returns {string} Season name
	 */
	static getSeasonName(seasonNum) {
		const seasons = ['SPRING', 'SUMMER', 'AUTUMN', 'WINTER'];
		return seasons[seasonNum] || 'UNKNOWN';
	}

	/**
	 * Format save date to readable format
	 * @param {string} dateStr - ISO date string
	 * @returns {string} Formatted date
	 */
	static formatSaveDate(dateStr) {
		if (!dateStr) return null;
		
		try {
			const date = new Date(dateStr);
			// Format: "06.01.2025 15:30"
			const day = String(date.getDate()).padStart(2, '0');
			const month = String(date.getMonth() + 1).padStart(2, '0');
			const year = date.getFullYear();
			const hours = String(date.getHours()).padStart(2, '0');
			const minutes = String(date.getMinutes()).padStart(2, '0');
			
			return `${day}.${month}.${year} ${hours}:${minutes}`;
		} catch (e) {
			return dateStr;
		}
	}

    /**
     * Parse Vehicles XML - Enhanced for detailed vehicle info
     * FIXED: Returns count instead of totalVehicles
     */
    static parseVehiclesXml(xml, logger = null) {
        try {
            const log = (msg, scope = 'vehicles') => {
                if (logger && logger.debug) {
                    logger.debug(msg, scope);
                }
                // No console.log fallback - only show when debug is enabled
            };

            log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            log('ðŸšœ PARSING VEHICLES XML');
            log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

            const vehicles = [];
            let totalPrice = 0;
            let totalOperatingTime = 0;
            let trainCount = 0;
            let vehicleCount = 0;

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // REGEX PATTERN FÃœR VEHICLES
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            
            const vehiclePattern = /<vehicle\s+([^>]+)>/g;
            let match;

            while ((match = vehiclePattern.exec(xml)) !== null) {
                const attrs = match[1];
                
                // Extract attributes
                const nameMatch = attrs.match(/filename="([^"]+)"/);
                const priceMatch = attrs.match(/price="([\d.]+)"/);
                const operatingTimeMatch = attrs.match(/operatingTime="([\d.]+)"/);
                const farmIdMatch = attrs.match(/farmId="(\d+)"/);
                
                // Get vehicle name from filename
                let name = 'Unknown';
                if (nameMatch && nameMatch[1]) {
                    const parts = nameMatch[1].split('/');
                    const filename = parts[parts.length - 1];
                    name = filename.replace('.xml', '');
                }

                const price = priceMatch ? parseFloat(priceMatch[1]) : 0;
                const operatingTime = operatingTimeMatch ? parseFloat(operatingTimeMatch[1]) : 0;
                const farmId = farmIdMatch ? parseInt(farmIdMatch[1]) : 0;

                // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                // TRAIN-FILTER (wie in VehicleMenus.js filterFarm0)
                // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
                
                const isTrain = name.toLowerCase().includes('locomotive') || 
                               name.toLowerCase().includes('train') ||
                               attrs.includes('type="trainTrailer"') ||
                               attrs.includes('type="trainTimberTrailer"');

                if (isTrain) {
                    trainCount++;
                    log(`  ðŸš‚ SKIPPED (Train): ${name}`);
                    continue; // Skip trains
                }

                // Filter farmId 0 (wie in VehicleMenus.js)
                if (farmId === 0) {
                    log(`  âš ï¸  SKIPPED (farmId 0): ${name}`);
                    continue;
                }

                // Add vehicle
                vehicles.push({
                    name: name,
                    price: price,
                    operatingTime: operatingTime,
                    farmId: farmId
                });

                // Add to totals
                totalPrice += price;
                totalOperatingTime += operatingTime;
                vehicleCount++;

                log(`  âœ… ${name}: â‚¬${price.toFixed(0)}, ${(operatingTime / 3600).toFixed(1)}h`);
            }

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // FORMAT OPERATING TIME (Stunden)
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            
            const totalHours = totalOperatingTime / 3600; // Convert seconds to hours
            const formattedOperatingTime = this.formatPlayTime(totalHours);

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // SUMMARY
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            
            log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');
            log(`âœ… Vehicles Parsed: ${vehicleCount}`);
            log(`ðŸš‚ Trains Skipped: ${trainCount}`);
            log(`ðŸ’° Total Price: â‚¬${totalPrice.toFixed(0)}`);
            log(`â±ï¸  Total Operating Time: ${formattedOperatingTime} (${totalHours.toFixed(1)}h)`);
            log('â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•');

            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            // FIXED: Return count instead of totalVehicles
            // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
            return {
                vehicles: vehicles,
                count: vehicleCount, // PRIMARY: Used by embed
                totalVehicles: vehicleCount, // Backward compatibility
                totalPrice: totalPrice,
                totalOperatingTime: totalOperatingTime,
                totalOperatingTimeFormatted: formattedOperatingTime,
                trainsSkipped: trainCount
            };

        } catch (err) {
            if (logger) {
                logger.error(`âŒ Vehicles XML Parsing FAILED: ${err.message}`, 'vehicles');
            } else {
                console.error('âŒ Vehicles XML Parsing FAILED:', err);
            }
            return {
                vehicles: [],
                count: 0, // PRIMARY
                totalVehicles: 0, // Backward compatibility
                totalPrice: 0,
                totalOperatingTime: 0,
                totalOperatingTimeFormatted: 'N/A',
                trainsSkipped: 0
            };
        }
    }

    /**
     * Format vehicle name from filename
     */
    static formatVehicleName(filename) {
        if (!filename) return 'Unknown';
        let name = filename.replace(/^(lizard_|placeable_|pd_|FS\d+_)/i, '');
        name = name.replace(/(_\d+)$/i, '');
        name = name.replace(/_/g, ' ');
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        name = name.split(' ').map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
        return name || 'Unknown';
    }

    /**
     * Determine vehicle category from config path
     */
    static determineVehicleCategory(configPath) {
        if (!configPath) return 'other';
        const path = configPath.toLowerCase();
        if (path.includes('tractor')) return 'tractors';
        if (path.includes('harvester') || path.includes('combine')) return 'harvesters';
        if (path.includes('truck') || path.includes('/vehicles/wheeled/man/') || 
            path.includes('/vehicles/wheeled/lizard/')) return 'trucks';
        if (path.includes('trailer') || path.includes('semitrailer')) return 'trailers';
        if (path.includes('cultivator') || path.includes('plow') || 
            path.includes('seeder') || path.includes('planter')) return 'cultivation';
        if (path.includes('sprayer') || path.includes('spreader') || 
            path.includes('fertilizer')) return 'spraying';
        if (path.includes('baler') || path.includes('wrapper') || 
            path.includes('mower') || path.includes('tedder') || 
            path.includes('windrower')) return 'forage';
        if (path.includes('loader') || path.includes('telehandler') || 
            path.includes('frontloader')) return 'loading';
        return 'other';
    }

    /**
     * Parse Economy XML
     */
    static parseEconomyXml(xml, logger = null) {
        try {
            if (logger) logger.debug('=== PARSING ECONOMY XML ===', 'economy');
            if (logger) logger.debug(`XML Length: ${xml.length}`, 'economy');
            
            const result = {
                greatDemands: [],
                prices: {}
            };

            const demandTagMatches = xml.matchAll(/<greatDemand\s+([^>]+)\/?>/gi);
            if (logger) logger.debug('Looking for greatDemand tags...', 'economy');
            let demandCount = 0;
            
            for (const tagMatch of demandTagMatches) {
                demandCount++;
                const attributes = tagMatch[1];
                
                if (logger) logger.debug(`\n  Demand #${demandCount}:`, 'economy');
                if (logger) logger.debug(`    Attributes: ${attributes.substring(0, 100)}...`, 'economy');
                
                const fillTypeMatch = attributes.match(/fillTypeName="([^"]+)"/);
                const durationMatch = attributes.match(/demandDuration="([^"]+)"/);
                const isRunningMatch = attributes.match(/isRunning="([^"]+)"/);
                const multiplierMatch = attributes.match(/demandMultiplier="([^"]+)"/);
                
                if (fillTypeMatch && durationMatch && isRunningMatch && multiplierMatch) {
                    const fillType = fillTypeMatch[1];
                    const duration = parseFloat(durationMatch[1]);
                    const isRunning = isRunningMatch[1];
                    const multiplier = parseFloat(multiplierMatch[1]);
                    
                    if (logger) logger.debug(`    FillType: ${fillType}`, 'economy');
                    if (logger) logger.debug(`    Duration: ${duration}h`, 'economy');
                    if (logger) logger.debug(`    IsRunning: ${isRunning}`, 'economy');
                    if (logger) logger.debug(`    Multiplier: ${multiplier}`, 'economy');
                    
                    if (isRunning === 'true') {
                        const demand = {
                            crop: fillType,
                            duration: duration,
                            durationHours: Math.round(duration),
                            multiplier: multiplier,
                            bonusPercent: Math.round((multiplier - 1) * 100)
                        };
                        result.greatDemands.push(demand);
                        if (logger) logger.debug(`    âœ… ADDED TO RESULT (Bonus: +${demand.bonusPercent}%)`, 'economy');
                    } else {
                        if (logger) logger.debug(`    â¸ï¸ SKIPPED (not running)`, 'economy');
                    }
                } else {
                    if (logger) logger.debug(`    âš ï¸ MISSING ATTRIBUTES - Skipped`, 'economy');
                }
            }
            
            if (logger) logger.debug(`Total demands found: ${demandCount}`, 'economy');
            if (logger) logger.debug(`Active demands: ${result.greatDemands.length}`, 'economy');

            const fillTypeMatches = xml.matchAll(/<fillType\s+fillType="([^"]+)"[^>]*>([\s\S]*?)<\/fillType>/gi);
            if (logger) logger.debug('Looking for fillType prices...', 'economy');
            let priceCount = 0;
            
            for (const match of fillTypeMatches) {
                const fillType = match[1];
                if (fillType === 'UNKNOWN') continue;
                const content = match[2];
                const periodMatches = content.matchAll(/<period\s+period="[^"]+">(\d+)<\/period>/gi);
                const values = [];
                for (const periodMatch of periodMatches) {
                    values.push(parseInt(periodMatch[1]));
                }
                if (values.length > 0) {
                    result.prices[fillType] = {
                        current: values[values.length - 1],
                        history: values
                    };
                    priceCount++;
                }
            }
            
            if (logger) logger.debug(`Prices extracted: ${priceCount} crops`, 'economy');
            if (logger) logger.debug('=== ECONOMY XML PARSED ===', 'economy');
            return result;
        } catch (e) {
            console.error('âŒ Economy XML Parse Error:', e);
            return { greatDemands: [], prices: {} };
        }
    }

    static parseModCount(html) {
        try {
            const matches = html.match(/<div class="container-row grid-row">/gi);
            return matches ? matches.length : 0;
        } catch (e) {
            return null;
        }
    }

    static countModsFromStats(xml) {
        try {
            const matches = xml.match(/<Mod\s+/gi);
            return matches ? matches.length : 0;
        } catch (e) {
            return null;
        }
    }

    static extractAttribute(str, attrName) {
        const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
        const match = str.match(regex);
        return match ? match[1] : null;
    }

    static decodeHtmlEntities(text) {
        if (!text) return text;
        return text
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&amp;/g, '&');
    }
}

module.exports = { StatusChecker };