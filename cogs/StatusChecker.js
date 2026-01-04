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
    static async getStatus(cfg, iconMgr = null) {
        try {
            // Fetch all XMLs in parallel
            const [statsXml, careerXml, modListHtml, vehiclesXml, economyXml] = await Promise.all([
                this.fetchXml(cfg.stats_url),
                cfg.career_url ? this.fetchXml(cfg.career_url) : Promise.resolve(null),
                cfg.mod_list_url ? this.fetchHtml(cfg.mod_list_url) : Promise.resolve(null),
                cfg.vehicles_url ? this.fetchXml(cfg.vehicles_url) : Promise.resolve(null),
                cfg.economy_url ? this.fetchXml(cfg.economy_url) : Promise.resolve(null)
            ]);

            // VERBOSE LOGGING
            console.log('=== FETCH RESULTS ===');
            console.log('Stats URL:', cfg.stats_url);
            console.log('Stats XML:', statsXml ? `${statsXml.length} chars` : 'NULL');
            console.log('Career URL:', cfg.career_url || 'NOT SET');
            console.log('Career XML:', careerXml ? `${careerXml.length} chars` : 'NULL');
            console.log('Vehicles URL:', cfg.vehicles_url || 'NOT SET');
            console.log('Vehicles XML:', vehiclesXml ? `${vehiclesXml.length} chars` : 'NULL');
            console.log('Economy URL:', cfg.economy_url || 'NOT SET');
            console.log('Economy XML:', economyXml ? `${economyXml.length} chars` : 'NULL');
            console.log('====================');

            if (!statsXml) {
                return { online: false, error: 'Failed to fetch stats XML' };
            }

            // Parse stats XML
            const statsData = this.parseStatsXml(statsXml);
            if (!statsData) {
                return { online: false, error: 'Failed to parse stats XML' };
            }

            // Parse career data (optional)
            const careerData = careerXml ? this.parseCareerXml(careerXml) : null;

            // Parse mod count (optional)
            let modCount = null;
            if (modListHtml) {
                modCount = this.parseModCount(modListHtml);
            } else if (statsXml) {
                // Fallback: count from stats XML
                modCount = this.countModsFromStats(statsXml);
            }

            // Parse vehicles data (optional)
            const vehiclesData = vehiclesXml ? this.parseVehiclesXml(vehiclesXml) : null;

            // Parse economy data (optional)
            const economyData = economyXml ? this.parseEconomyXml(economyXml) : null;

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
            
            console.log('=== FINAL RESULT ===');
            console.log('Economy in result:', result.economy ? 'YES' : 'NO');
            if (result.economy) {
                console.log('Great Demands count:', result.economy.greatDemands.length);
                console.log('Great Demands:', JSON.stringify(result.economy.greatDemands, null, 2));
            }
            console.log('====================');

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
     * Parse Career Savegame XML
     */
    static parseCareerXml(xml) {
        try {
            const result = {};

            // Extract money
            const moneyMatch = xml.match(/<money>([\d.]+)<\/money>/);
            result.money = moneyMatch ? parseFloat(moneyMatch[1]) : null;

            // Extract difficulty
            const difficultyMatch = xml.match(/<economicDifficulty>([^<]+)<\/economicDifficulty>/);
            result.difficulty = difficultyMatch ? difficultyMatch[1].trim() : null;

            // Extract time scale
            const timeScaleMatch = xml.match(/<timeScale>([\d.]+)<\/timeScale>/);
            result.timeScale = timeScaleMatch ? parseFloat(timeScaleMatch[1]) : null;

            return result;

        } catch (e) {
            return null;
        }
    }

    /**
     * Parse Vehicles XML - Enhanced for detailed vehicle info
     */
    static parseVehiclesXml(xml) {
        try {
            const result = {
                total: 0,
                totalValue: 0,
                totalOperatingHours: 0,
                farms: {},
                vehicles: [], // NEW: List of all vehicles with details
                categories: {} // NEW: Count by category
            };

            console.log('=== PARSING VEHICLES XML ===');

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
                
                // Extract configFileName from content (e.g. "FS25_fendt/fendt1050.xml")
                const configMatch = content.match(/configFileName="([^"]+)"/);
                let vehicleName = 'Unknown';
                let category = 'other';
                
                if (configMatch) {
                    const configPath = configMatch[1];
                    // Extract filename: "FS25_fendt/fendt1050.xml" -> "fendt1050"
                    const filenameParts = configPath.split('/');
                    const filename = filenameParts[filenameParts.length - 1].replace('.xml', '');
                    vehicleName = this.formatVehicleName(filename);
                    
                    // Determine category from path
                    category = this.determineVehicleCategory(configPath);
                }
                
                // Extract age from propertyState (optional - for future)
                const ageMatch = content.match(/<propertyState\s+age="([^"]+)"/);
                const age = ageMatch ? parseFloat(ageMatch[1]) : 0;

                // Build vehicle object
                const vehicle = {
                    name: vehicleName,
                    category: category,
                    price: price,
                    operatingTime: operatingTime,
                    age: age,
                    farmId: farmId
                };

                // Add to results
                result.vehicles.push(vehicle);
                result.total++;
                result.totalValue += price;
                result.totalOperatingHours += operatingTime;

                // Initialize farm if not exists
                if (!result.farms[farmId]) {
                    result.farms[farmId] = {
                        count: 0,
                        totalValue: 0,
                        totalOperatingHours: 0,
                        vehicles: []
                    };
                }

                // Add to farm
                result.farms[farmId].count++;
                result.farms[farmId].totalValue += price;
                result.farms[farmId].totalOperatingHours += operatingTime;
                result.farms[farmId].vehicles.push(vehicle);

                // Count by category
                if (!result.categories[category]) {
                    result.categories[category] = 0;
                }
                result.categories[category]++;
            }

            console.log(`Total vehicles parsed: ${vehicleCount}`);
            console.log(`Categories:`, result.categories);
            console.log('=== VEHICLES XML PARSED ===');

            return result;

        } catch (e) {
            console.error('Vehicles XML Parse Error:', e);
            return { total: 0, totalValue: 0, farms: {}, vehicles: [], categories: {} };
        }
    }

    /**
     * Format vehicle name from filename
     * e.g. "fendt1050" -> "Fendt 1050"
     */
    static formatVehicleName(filename) {
        // Remove common prefixes
        let name = filename.replace(/^(lizard_|placeable_|pd_)/i, '');
        
        // Split on underscores and capitals
        name = name.replace(/_/g, ' ');
        name = name.replace(/([a-z])([A-Z])/g, '$1 $2');
        
        // Capitalize first letter of each word
        name = name.split(' ').map(word => {
            if (word.length === 0) return word;
            return word.charAt(0).toUpperCase() + word.slice(1);
        }).join(' ');
        
        return name;
    }

    /**
     * Determine vehicle category from config path
     */
    static determineVehicleCategory(configPath) {
        const path = configPath.toLowerCase();
        
        if (path.includes('tractor')) return 'tractors';
        if (path.includes('harvester') || path.includes('combine')) return 'harvesters';
        if (path.includes('truck') || path.includes('semitrailer')) return 'trucks';
        if (path.includes('trailer')) return 'trailers';
        if (path.includes('cultivator') || path.includes('plow') || path.includes('seeder')) return 'cultivation';
        if (path.includes('sprayer') || path.includes('spreader')) return 'spraying';
        if (path.includes('baler') || path.includes('wrapper') || path.includes('mower')) return 'forage';
        if (path.includes('loader') || path.includes('telehandler')) return 'loading';
        
        return 'other';
    }

    /**
     * Parse Economy XML
     */
    static parseEconomyXml(xml) {
        try {
            console.log('=== PARSING ECONOMY XML ===');
            console.log('XML Length:', xml.length);
            
            const result = {
                greatDemands: [],
                prices: {}
            };

            // Extract great demands - FIXED for any attribute order
            // Strategy: Find the tag, then extract attributes individually
            const demandTagMatches = xml.matchAll(/<greatDemand\s+([^>]+)\/?>/gi);
            
            console.log('Looking for greatDemand tags...');
            let demandCount = 0;
            
            for (const tagMatch of demandTagMatches) {
                demandCount++;
                const attributes = tagMatch[1]; // All attributes as one string
                
                console.log(`\n  Demand #${demandCount}:`);
                console.log(`    Attributes: ${attributes.substring(0, 100)}...`);
                
                // Extract individual attributes
                const fillTypeMatch = attributes.match(/fillTypeName="([^"]+)"/);
                const durationMatch = attributes.match(/demandDuration="([^"]+)"/);
                const isRunningMatch = attributes.match(/isRunning="([^"]+)"/);
                const multiplierMatch = attributes.match(/demandMultiplier="([^"]+)"/);
                
                if (fillTypeMatch && durationMatch && isRunningMatch && multiplierMatch) {
                    const fillType = fillTypeMatch[1];
                    const duration = parseFloat(durationMatch[1]);
                    const isRunning = isRunningMatch[1];
                    const multiplier = parseFloat(multiplierMatch[1]);
                    
                    console.log(`    FillType: ${fillType}`);
                    console.log(`    Duration: ${duration}h`);
                    console.log(`    IsRunning: ${isRunning}`);
                    console.log(`    Multiplier: ${multiplier}`);
                    
                    // Only include demands that are currently running
                    if (isRunning === 'true') {
                        const demand = {
                            crop: fillType,
                            duration: duration,
                            durationHours: Math.round(duration), // Already in hours
                            multiplier: multiplier,
                            bonusPercent: Math.round((multiplier - 1) * 100)
                        };
                        result.greatDemands.push(demand);
                        console.log(`    ✅ ADDED TO RESULT (Bonus: +${demand.bonusPercent}%)`);
                    } else {
                        console.log(`    ⏸️ SKIPPED (not running)`);
                    }
                } else {
                    console.log(`    ⚠️ MISSING ATTRIBUTES - Skipped`);
                }
            }
            
            console.log(`Total demands found: ${demandCount}`);
            console.log(`Active demands: ${result.greatDemands.length}`);
            console.log('Active demands data:', JSON.stringify(result.greatDemands, null, 2));

            // Extract price infos - FIXED for real XML format
            const fillTypeMatches = xml.matchAll(/<fillType\s+fillType="([^"]+)"[^>]*>([\s\S]*?)<\/fillType>/gi);
            
            console.log('Looking for fillType prices...');
            let priceCount = 0;
            
            for (const match of fillTypeMatches) {
                const fillType = match[1];
                
                if (fillType === 'UNKNOWN') continue;
                
                const content = match[2];
                
                // Extract period values (last one is current)
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
            
            console.log(`Prices extracted: ${priceCount} crops`);
            console.log('=== ECONOMY XML PARSED ===');
            
            return result;
        } catch (e) {
            console.error('❌ Economy XML Parse Error:', e);
            console.error('Stack:', e.stack);
            return { greatDemands: [], prices: {} };
        }
    }

    /**
     * Parse mod count from HTML
     */
    static parseModCount(html) {
        try {
            const matches = html.match(/<div class="container-row grid-row">/gi);
            return matches ? matches.length : 0;
        } catch (e) {
            return null;
        }
    }

    /**
     * Count mods from stats XML (fallback)
     */
    static countModsFromStats(xml) {
        try {
            const matches = xml.match(/<Mod\s+/gi);
            return matches ? matches.length : 0;
        } catch (e) {
            return null;
        }
    }

    /**
     * Extract attribute value from XML string
     */
    static extractAttribute(str, attrName) {
        const regex = new RegExp(`${attrName}="([^"]*)"`, 'i');
        const match = str.match(regex);
        return match ? match[1] : null;
    }

    /**
     * Decode HTML entities
     */
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