// ═══════════════════════════════════════════════════════════
//  STATUS CHECKER MODULE - FARMING SIMULATOR 25
//  Enhanced with Vehicles and Economy XML Parsing
//  Phase 3: Full Feature Set
// ═══════════════════════════════════════════════════════════

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
                cfg.career_url ? this.fetchXml(cfg.career_url) : Promise.resolve(null),
                cfg.mod_list_url ? this.fetchHtml(cfg.mod_list_url) : Promise.resolve(null),
                cfg.vehicles_url ? this.fetchXml(cfg.vehicles_url) : Promise.resolve(null),
                cfg.economy_url ? this.fetchXml(cfg.economy_url) : Promise.resolve(null)
            ]);

            // Debug LOGGING
            if (logger) {
				logger.debugSeparator('STATUS CHECK - XML FETCH');
				logger.debug('Stats URL:', cfg.stats_url);
				logger.debug(`Stats XML: ${statsXml ? `${statsXml.length} chars` : 'NULL'}`);
				logger.debug(`Career URL: ${cfg.career_url || 'NOT SET'}`);
				logger.debug(`Career XML: ${careerXml ? `${careerXml.length} chars` : 'NULL'}`);
				logger.debug(`Vehicles URL: ${cfg.vehicles_url || 'NOT SET'}`);
				logger.debug(`Vehicles XML: ${vehiclesXml ? `${vehiclesXml.length} chars` : 'NULL'}`);
				logger.debug(`Economy URL: ${cfg.economy_url || 'NOT SET'}`);
				logger.debug(`Economy XML: ${economyXml ? `${economyXml.length} chars` : 'NULL'}`);
			}


            if (!statsXml) {
                return { online: false, error: 'Failed to fetch stats XML' };
            }

            // Parse stats XML
            const statsData = this.parseStatsXml(statsXml);
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
                hasPassword: statsData.hasPassword,
                players: statsData.players,
                modCount: modCount,
                career: careerData,
                vehicles: vehiclesData,
                economy: economyData
            };
            
            if (logger) {
				logger.debugSeparator('STATUS CHECK - FINAL RESULT');
				logger.debug('Online: true');
				logger.debug(`Career data: ${careerData ? 'EXISTS' : 'NULL'}`);
				if (careerData) {
					logger.debug(`  - money: ${careerData.money !== null ? careerData.money : 'NULL'}`);
					logger.debug(`  - difficulty: ${careerData.difficulty || 'NULL'}`);
					logger.debug(`  - timeScale: ${careerData.timeScale !== null ? careerData.timeScale : 'NULL'}`);
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
    static parseStatsXml(xml) {
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

            // Check for password
            const hasPassword = xml.includes('password="true"') || xml.includes('<password>true</password>');

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
                hasPassword: hasPassword,
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
	static parseCareerXml(xml) {
		try {
			console.log('═══════════════════════════════════════════════════════════');
			console.log('📊 PARSING CAREER SAVEGAME XML');
			console.log('═══════════════════════════════════════════════════════════');
			
			const result = {};

			// ═══════════════════════════════════════════════════════════
			// PHASE 1: BASIC CAREER DATA (bereits implementiert)
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 1: Basic Career Data');
			
			// Extract money
			const moneyMatch = xml.match(/<money>([\d.]+)<\/money>/);
			result.money = moneyMatch ? parseFloat(moneyMatch[1]) : null;
			console.log(`  💰 Money: ${result.money}`);

			// Extract difficulty
			const difficultyMatch = xml.match(/<economicDifficulty>([^<]+)<\/economicDifficulty>/);
			result.difficulty = difficultyMatch ? difficultyMatch[1].trim() : null;
			console.log(`  ⚡ Difficulty: ${result.difficulty}`);

			// Extract time scale
			const timeScaleMatch = xml.match(/<timeScale>([\d.]+)<\/timeScale>/);
			result.timeScale = timeScaleMatch ? parseFloat(timeScaleMatch[1]) : null;
			console.log(`  ⏱️ Time Scale: ${result.timeScale}x`);

			// ═══════════════════════════════════════════════════════════
			// PHASE 2: TIME & DATE (bereits implementiert)
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 2: Time & Date');
			
			// Play Time (in Millisekunden -> Stunden umrechnen)
			const playTimeMatch = xml.match(/<playTime>([\d.]+)<\/playTime>/);
			if (playTimeMatch) {
				const playTimeMs = parseFloat(playTimeMatch[1]);
				result.playTime = playTimeMs / 1000 / 60 / 60; // Convert to hours
				result.playTimeFormatted = this.formatPlayTime(result.playTime);
				console.log(`  🕐 Play Time: ${result.playTimeFormatted} (${result.playTime}h)`);
			} else {
				result.playTime = null;
				result.playTimeFormatted = null;
				console.log(`  🕐 Play Time: NOT FOUND`);
			}

			// Current Day
			const dayPeriodMatch = xml.match(/<dayTime>\s*<currentDay>([\d]+)<\/currentDay>/);
			result.currentDay = dayPeriodMatch ? parseInt(dayPeriodMatch[1]) : null;
			console.log(`  📅 Current Day: ${result.currentDay}`);

			// Period Duration (Tage pro Periode/Monat)
			const periodMatch = xml.match(/<period>([\d]+)<\/period>/);
			result.daysPerPeriod = periodMatch ? parseInt(periodMatch[1]) : null;
			console.log(`  📆 Days Per Period: ${result.daysPerPeriod}`);

			// Current Season
			const seasonMatch = xml.match(/<visualSeason>([\d]+)<\/visualSeason>/);
			if (seasonMatch) {
				const seasonNum = parseInt(seasonMatch[1]);
				result.currentSeason = this.getSeasonName(seasonNum);
				result.currentSeasonNumber = seasonNum;
				console.log(`  🍂 Season: ${result.currentSeason} (#${seasonNum})`);
			} else {
				result.currentSeason = null;
				result.currentSeasonNumber = null;
				console.log(`  🍂 Season: NOT FOUND`);
			}

			// Save Date
			const saveDateMatch = xml.match(/<saveDate>([^<]+)<\/saveDate>/);
			if (saveDateMatch) {
				result.saveDate = saveDateMatch[1].trim();
				result.saveDateFormatted = this.formatSaveDate(result.saveDate);
				console.log(`  💾 Save Date: ${result.saveDateFormatted}`);
			} else {
				result.saveDate = null;
				result.saveDateFormatted = null;
				console.log(`  💾 Save Date: NOT FOUND`);
			}

			// ═══════════════════════════════════════════════════════════
			// PHASE 3: GAMEPLAY SETTINGS (bereits implementiert + NEU)
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 3: Gameplay Settings');
			
			// Growth Rate
			const growthMatch = xml.match(/<growthRate>([\d.]+)<\/growthRate>/);
			result.growthRate = growthMatch ? parseFloat(growthMatch[1]) : null;
			console.log(`  🌱 Growth Rate: ${result.growthRate}x`);

			// Field Jobs Enabled
			const fieldJobsMatch = xml.match(/<missionFieldJobsEnabled>([^<]+)<\/missionFieldJobsEnabled>/);
			result.fieldJobsEnabled = fieldJobsMatch ? (fieldJobsMatch[1].trim() === 'true') : null;
			console.log(`  📋 Field Jobs: ${result.fieldJobsEnabled}`);

			// Auto Save Enabled
			const autoSaveMatch = xml.match(/<autoSaveEnabled>([^<]+)<\/autoSaveEnabled>/);
			result.autoSaveEnabled = autoSaveMatch ? (autoSaveMatch[1].trim() === 'true') : null;
			console.log(`  💾 Auto Save: ${result.autoSaveEnabled}`);

			// Reset Vehicles
			const resetVehiclesMatch = xml.match(/<resetVehicles>([^<]+)<\/resetVehicles>/);
			result.resetVehicles = resetVehiclesMatch ? (resetVehiclesMatch[1].trim() === 'true') : null;
			console.log(`  🔄 Reset Vehicles: ${result.resetVehicles}`);

			// ═══════════════════════════════════════════════════════════
			// PHASE 4: NEW GAMEPLAY SETTINGS
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 4: NEW Gameplay Settings');
			
			// Traffic Enabled
			const trafficMatch = xml.match(/<trafficEnabled>([^<]+)<\/trafficEnabled>/);
			result.trafficEnabled = trafficMatch ? (trafficMatch[1].trim() === 'true') : null;
			console.log(`  🚦 Traffic: ${result.trafficEnabled}`);

			// Weeds Enabled
			const weedsMatch = xml.match(/<weedsEnabled>([^<]+)<\/weedsEnabled>/);
			result.weedsEnabled = weedsMatch ? (weedsMatch[1].trim() === 'true') : null;
			console.log(`  🌱 Weeds: ${result.weedsEnabled}`);

			// Fruit Destruction
			const fruitDestructionMatch = xml.match(/<fruitDestruction>([^<]+)<\/fruitDestruction>/);
			result.fruitDestruction = fruitDestructionMatch ? (fruitDestructionMatch[1].trim() === 'true') : null;
			console.log(`  🌾 Fruit Destruction: ${result.fruitDestruction}`);

			// Snow Enabled
			const snowMatch = xml.match(/<snowEnabled>([^<]+)<\/snowEnabled>/);
			result.snowEnabled = snowMatch ? (snowMatch[1].trim() === 'true') : null;
			console.log(`  ❄️ Snow: ${result.snowEnabled}`);

			// Stones Enabled
			const stonesMatch = xml.match(/<stonesEnabled>([^<]+)<\/stonesEnabled>/);
			result.stonesEnabled = stonesMatch ? (stonesMatch[1].trim() === 'true') : null;
			console.log(`  🪨 Stones: ${result.stonesEnabled}`);

			// Fuel Usage
			const fuelUsageMatch = xml.match(/<fuelUsage>([\d.]+)<\/fuelUsage>/);
			result.fuelUsage = fuelUsageMatch ? parseFloat(fuelUsageMatch[1]) : null;
			console.log(`  ⛽ Fuel Usage: ${result.fuelUsage}`);

			// ═══════════════════════════════════════════════════════════
			// PHASE 5: FINANCIAL DATA
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 5: Financial Data');
			
			// Loan (aktueller Kredit)
			const loanMatch = xml.match(/<loan>([\d.]+)<\/loan>/);
			result.loan = loanMatch ? parseFloat(loanMatch[1]) : null;
			console.log(`  🏦 Loan: €${result.loan}`);

			// Initial Money (Startkapital bei Spielstandserstellung)
			const initialMoneyMatch = xml.match(/<initialMoney>([\d.]+)<\/initialMoney>/);
			result.initialMoney = initialMoneyMatch ? parseFloat(initialMoneyMatch[1]) : null;
			console.log(`  💼 Initial Money: €${result.initialMoney}`);

			// ═══════════════════════════════════════════════════════════
			// PHASE 6: HELPER SETTINGS
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 6: Helper Settings');
			
			// Helper Buys Fuel
			const helperFuelMatch = xml.match(/<helperBuyFuel>([^<]+)<\/helperBuyFuel>/);
			result.helperBuysFuel = helperFuelMatch ? (helperFuelMatch[1].trim() === 'true') : null;
			console.log(`  🛢️ Helper Buys Fuel: ${result.helperBuysFuel}`);

			// Helper Buys Seeds
			const helperSeedsMatch = xml.match(/<helperBuySeeds>([^<]+)<\/helperBuySeeds>/);
			result.helperBuysSeeds = helperSeedsMatch ? (helperSeedsMatch[1].trim() === 'true') : null;
			console.log(`  🌾 Helper Buys Seeds: ${result.helperBuysSeeds}`);

			// Helper Buys Fertilizer
			const helperFertilizerMatch = xml.match(/<helperBuyFertilizer>([^<]+)<\/helperBuyFertilizer>/);
			result.helperBuysFertilizer = helperFertilizerMatch ? (helperFertilizerMatch[1].trim() === 'true') : null;
			console.log(`  💊 Helper Buys Fertilizer: ${result.helperBuysFertilizer}`);

			// ═══════════════════════════════════════════════════════════
			// PHASE 7: SAVEGAME INFO
			// ═══════════════════════════════════════════════════════════
			
			console.log('🔍 Phase 7: Savegame Info');
			
			// Savegame Name
			const savegameNameMatch = xml.match(/<savegameName>([^<]+)<\/savegameName>/);
			result.savegameName = savegameNameMatch ? this.decodeHtmlEntities(savegameNameMatch[1].trim()) : null;
			console.log(`  📝 Savegame Name: ${result.savegameName}`);

			// Creation Date
			const creationDateMatch = xml.match(/<creationDate>([^<]+)<\/creationDate>/);
			if (creationDateMatch) {
				result.creationDate = creationDateMatch[1].trim();
				result.creationDateFormatted = this.formatSaveDate(result.creationDate);
				console.log(`  🛠️ Creation Date: ${result.creationDateFormatted}`);
			} else {
				result.creationDate = null;
				result.creationDateFormatted = null;
				console.log(`  🛠️ Creation Date: NOT FOUND`);
			}

			console.log('═══════════════════════════════════════════════════════════');
			console.log('✅ CAREER XML PARSING COMPLETE');
			console.log(`📊 Total fields extracted: ${Object.keys(result).length}`);
			console.log('═══════════════════════════════════════════════════════════');

			return result;

		} catch (e) {
			console.error('❌ Career XML Parse Error:', e);
			console.error('Stack:', e.stack);
			return null;
		}
	}

	// ═══════════════════════════════════════════════════════════
	// HELPER FUNCTIONS (bereits vorhanden, hier zur Vollständigkeit)
	// ═══════════════════════════════════════════════════════════

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
     */
    static parseVehiclesXml(xml, logger = null) {
        try {
            const result = {
                total: 0,
                totalValue: 0,
                totalOperatingHours: 0,
                farms: {},
                vehicles: [],
                categories: {}
            };

            if (logger) logger.debug('=== PARSING VEHICLES XML ===');

            // Extract all vehicle tags with full content
            const vehicleMatches = xml.matchAll(/<vehicle\s+([^>]+)>([\s\S]*?)<\/vehicle>/gi);
            let vehicleCount = 0;

            for (const match of vehicleMatches) {
                vehicleCount++;
                const attrs = match[1];
                const content = match[2];
                
                // Extract basic attributes
                const farmId = this.extractAttribute(attrs, 'farmId') || '0';
                const price = parseFloat(this.extractAttribute(attrs, 'price')) || 0;
                const operatingTime = parseFloat(this.extractAttribute(attrs, 'operatingTime')) || 0;
                
                let vehicleName = 'Unknown';
                let category = 'other';
                let configPath = null;
                
                // METHOD 1: Try configFileName attribute in vehicle tag
                configPath = this.extractAttribute(attrs, 'configFileName');
                
                // METHOD 2: Try configFileName in content
                if (!configPath) {
                    const configMatch = content.match(/configFileName="([^"]+)"/);
                    if (configMatch) {
                        configPath = configMatch[1];
                    }
                }
                
                // METHOD 3: Try filename attribute
                if (!configPath) {
                    configPath = this.extractAttribute(attrs, 'filename');
                }
                
                // METHOD 4: Try any XML path pattern
                if (!configPath) {
                    const pathMatch = content.match(/\b([A-Za-z0-9_]+\/[A-Za-z0-9_]+\.xml)\b/);
                    if (pathMatch) {
                        configPath = pathMatch[1];
                    }
                }
                
                // Parse the config path if we found one
                if (configPath) {
                    const parts = configPath.split('/');
                    const xmlFile = parts[parts.length - 1];
                    const filename = xmlFile.replace('.xml', '');
                    
                    vehicleName = this.formatVehicleName(filename);
                    category = this.determineVehicleCategory(configPath);
                    
                    if (logger) logger.debug(`  Vehicle #${vehicleCount}: ${filename} -> ${vehicleName} (${category})`);
                } else {
                    if (logger) logger.debug(`  Vehicle #${vehicleCount}: NO CONFIG PATH FOUND`);
                    if (logger) logger.debug(`    Attrs: ${attrs.substring(0, 100)}...`);
                    if (logger) logger.debug(`    Content: ${content.substring(0, 100)}...`);
                }
                
                const ageMatch = content.match(/<propertyState\s+age="([^"]+)"/);
                const age = ageMatch ? parseFloat(ageMatch[1]) : 0;

                const vehicle = {
                    name: vehicleName,
                    category: category,
                    price: price,
                    operatingTime: operatingTime,
                    age: age,
                    farmId: farmId
                };

                result.vehicles.push(vehicle);
                result.total++;
                result.totalValue += price;
                result.totalOperatingHours += operatingTime;

                if (!result.farms[farmId]) {
                    result.farms[farmId] = {
                        count: 0,
                        totalValue: 0,
                        totalOperatingHours: 0,
                        vehicles: []
                    };
                }

                result.farms[farmId].count++;
                result.farms[farmId].totalValue += price;
                result.farms[farmId].totalOperatingHours += operatingTime;
                result.farms[farmId].vehicles.push(vehicle);

                if (!result.categories[category]) {
                    result.categories[category] = 0;
                }
                result.categories[category]++;
            }

            if (logger) logger.debug(`Total vehicles parsed: ${vehicleCount}`);
            if (logger) logger.debug(`Categories:`, result.categories);
            if (logger) logger.debug('=== VEHICLES XML PARSED ===');

            return result;

        } catch (e) {
            console.error('Vehicles XML Parse Error:', e);
            return { total: 0, totalValue: 0, farms: {}, vehicles: [], categories: {} };
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
            if (logger) logger.debug('=== PARSING ECONOMY XML ===');
            if (logger) logger.debug('XML Length:', xml.length);
            
            const result = {
                greatDemands: [],
                prices: {}
            };

            const demandTagMatches = xml.matchAll(/<greatDemand\s+([^>]+)\/?>/gi);
            if (logger) logger.debug('Looking for greatDemand tags...');
            let demandCount = 0;
            
            for (const tagMatch of demandTagMatches) {
                demandCount++;
                const attributes = tagMatch[1];
                
                if (logger) logger.debug(`\n  Demand #${demandCount}:`);
                if (logger) logger.debug(`    Attributes: ${attributes.substring(0, 100)}...`);
                
                const fillTypeMatch = attributes.match(/fillTypeName="([^"]+)"/);
                const durationMatch = attributes.match(/demandDuration="([^"]+)"/);
                const isRunningMatch = attributes.match(/isRunning="([^"]+)"/);
                const multiplierMatch = attributes.match(/demandMultiplier="([^"]+)"/);
                
                if (fillTypeMatch && durationMatch && isRunningMatch && multiplierMatch) {
                    const fillType = fillTypeMatch[1];
                    const duration = parseFloat(durationMatch[1]);
                    const isRunning = isRunningMatch[1];
                    const multiplier = parseFloat(multiplierMatch[1]);
                    
                    if (logger) logger.debug(`    FillType: ${fillType}`);
                    if (logger) logger.debug(`    Duration: ${duration}h`);
                    if (logger) logger.debug(`    IsRunning: ${isRunning}`);
                    if (logger) logger.debug(`    Multiplier: ${multiplier}`);
                    
                    if (isRunning === 'true') {
                        const demand = {
                            crop: fillType,
                            duration: duration,
                            durationHours: Math.round(duration),
                            multiplier: multiplier,
                            bonusPercent: Math.round((multiplier - 1) * 100)
                        };
                        result.greatDemands.push(demand);
                        if (logger) logger.debug(`    ✅ ADDED TO RESULT (Bonus: +${demand.bonusPercent}%)`);
                    } else {
                        if (logger) logger.debug(`    ⏸️ SKIPPED (not running)`);
                    }
                } else {
                    if (logger) logger.debug(`    ⚠️ MISSING ATTRIBUTES - Skipped`);
                }
            }
            
            if (logger) logger.debug(`Total demands found: ${demandCount}`);
            if (logger) logger.debug(`Active demands: ${result.greatDemands.length}`);

            const fillTypeMatches = xml.matchAll(/<fillType\s+fillType="([^"]+)"[^>]*>([\s\S]*?)<\/fillType>/gi);
            if (logger) logger.debug('Looking for fillType prices...');
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
            
            if (logger) logger.debug(`Prices extracted: ${priceCount} crops`);
            if (logger) logger.debug('=== ECONOMY XML PARSED ===');
            return result;
        } catch (e) {
            console.error('❌ Economy XML Parse Error:', e);
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
