class FieldInspector {
    static inspect(data, srv, embedSettings, logger) {
        logger.debug('[FieldInspector] Inspecting data...', 'debug-module');
        
        // Career Data
        if (data.career) {
            logger.debug('  📊 CAREER DATA:', 'debug-module');
            logger.debug(`    - money: ${typeof data.career.money} = ${data.career.money}`, 'debug-module');
            logger.debug(`    - difficulty: ${typeof data.career.difficulty} = "${data.career.difficulty}"`, 'debug-module');
            logger.debug(`    - timeScale: ${typeof data.career.timeScale} = ${data.career.timeScale}`, 'debug-module');
            logger.debug(`    - currentDate: ${typeof data.career.currentDate} = "${data.career.currentDate}"`, 'debug-module');
            logger.debug(`    - helperBuyFuel: ${typeof data.career.helperBuyFuel} = ${data.career.helperBuyFuel}`, 'debug-module');
            logger.debug(`    - helperBuySeeds: ${typeof data.career.helperBuySeeds} = ${data.career.helperBuySeeds}`, 'debug-module');
            logger.debug(`    - helperBuyFertilizer: ${typeof data.career.helperBuyFertilizer} = ${data.career.helperBuyFertilizer}`, 'debug-module');
        }
        
        // Vehicles Data
        if (data.vehicles) {
            logger.debug('  🚜 VEHICLES DATA:', 'debug-module');
            logger.debug(`    - count: ${typeof data.vehicles.count} = ${data.vehicles.count}`, 'debug-module');
            logger.debug(`    - totalVehicles: ${typeof data.vehicles.totalVehicles} = ${data.vehicles.totalVehicles}`, 'debug-module');
            logger.debug(`    - totalPrice: ${typeof data.vehicles.totalPrice} = ${data.vehicles.totalPrice}`, 'debug-module');
        }
        
        // Embed Settings
        logger.debug('  ⚙️ EMBED SETTINGS:', 'debug-module');
        Object.entries(embedSettings).forEach(([key, value]) => {
            logger.debug(`    - ${key}: ${typeof value} = ${value}`, 'debug-module');
        });
        
        // Emojis
        const emojis = srv.emojis || {};
        logger.debug('  😀 EMOJIS:', 'debug-module');
        Object.entries(emojis).slice(0, 5).forEach(([key, value]) => {
            const codePoints = [...value].map(c => c.codePointAt(0).toString(16)).join(' ');
            logger.debug(`    - ${key}: "${value}" (U+${codePoints})`, 'debug-module');
        });
    }
}

module.exports = { FieldInspector };