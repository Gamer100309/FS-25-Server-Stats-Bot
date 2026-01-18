const fs = require('fs');
const path = require('path');

class DataLogger {
    static log(data, filename, logger) {
        try {
            const debugDir = './logs/debug-data';
            if (!fs.existsSync(debugDir)) {
                fs.mkdirSync(debugDir, { recursive: true });
            }
            
            const timestamp = new Date().toISOString().replace(/:/g, '-');
            const file = path.join(debugDir, `${filename}_${timestamp}.json`);
            
            fs.writeFileSync(file, JSON.stringify(data, null, 2));
            logger.success(`[DataLogger] Saved: ${file}`, 'debug-module');
        } catch (e) {
            logger.error(`[DataLogger] Failed: ${e.message}`, 'debug-module');
        }
    }
}

module.exports = { DataLogger };