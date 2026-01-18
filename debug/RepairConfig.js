// ═══════════════════════════════════════════════════════════
//  CONFIG REPAIR TOOL - EMERGENCY FIX
//  Repariert ungültige Farben in der Guild-Config
//  Run: node repair_config.js
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

console.log('═══════════════════════════════════════════════════════════');
console.log(' CONFIG REPAIR TOOL');
console.log(' Findet und repariert ungültige Hex-Farben');
console.log('═══════════════════════════════════════════════════════════\n');

// Farb-Validierung
function isValidHex(color) {
    if (!color) return false;
    const hexRegex = /^#[0-9A-Fa-f]{6}$/;
    return hexRegex.test(color);
}

// Standard-Farben
const DEFAULT_ONLINE = '#00FF00';
const DEFAULT_OFFLINE = '#FF0000';

// Configs-Ordner
const configsDir = './configs';

if (!fs.existsSync(configsDir)) {
    console.log('❌ ERROR: ./configs Ordner nicht gefunden!');
    console.log('   Bitte führe das Script im Bot-Hauptverzeichnis aus.');
    process.exit(1);
}

// Alle Config-Dateien finden
const configFiles = fs.readdirSync(configsDir)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(configsDir, f));

console.log(`📂 ${configFiles.length} Config-Dateien gefunden\n`);

let totalRepairs = 0;
let filesRepaired = 0;

// Jede Config prüfen
configFiles.forEach(filePath => {
    const fileName = path.basename(filePath);
    console.log(`\n🔍 Prüfe: ${fileName}`);
    console.log('─────────────────────────────────────────────────────');
    
    try {
        // Lade Config
        const rawData = fs.readFileSync(filePath, 'utf8');
        const config = JSON.parse(rawData);
        
        let repairs = [];
        let modified = false;
        
        // ═══════════════════════════════════════════════════════════
        // PRÜFE GLOBALE FARBEN
        // ═══════════════════════════════════════════════════════════
        if (config.embedColors) {
            // Online Color
            if (config.embedColors.online) {
                if (!isValidHex(config.embedColors.online)) {
                    repairs.push(`❌ Global Online: "${config.embedColors.online}" → "${DEFAULT_ONLINE}"`);
                    config.embedColors.online = DEFAULT_ONLINE;
                    modified = true;
                } else {
                    console.log(`✅ Global Online: ${config.embedColors.online}`);
                }
            } else {
                repairs.push(`⚠️  Global Online fehlt → "${DEFAULT_ONLINE}"`);
                config.embedColors.online = DEFAULT_ONLINE;
                modified = true;
            }
            
            // Offline Color
            if (config.embedColors.offline) {
                if (!isValidHex(config.embedColors.offline)) {
                    repairs.push(`❌ Global Offline: "${config.embedColors.offline}" → "${DEFAULT_OFFLINE}"`);
                    config.embedColors.offline = DEFAULT_OFFLINE;
                    modified = true;
                } else {
                    console.log(`✅ Global Offline: ${config.embedColors.offline}`);
                }
            } else {
                repairs.push(`⚠️  Global Offline fehlt → "${DEFAULT_OFFLINE}"`);
                config.embedColors.offline = DEFAULT_OFFLINE;
                modified = true;
            }
        } else {
            repairs.push(`⚠️  Globale Farben fehlen → Erstelle mit Defaults`);
            config.embedColors = {
                online: DEFAULT_ONLINE,
                offline: DEFAULT_OFFLINE
            };
            modified = true;
        }
        
        // ═══════════════════════════════════════════════════════════
        // PRÜFE SERVER-SPEZIFISCHE FARBEN
        // ═══════════════════════════════════════════════════════════
        if (config.servers && Array.isArray(config.servers)) {
            config.servers.forEach((srv, idx) => {
                console.log(`\n  Server ${idx}: ${srv.serverName}`);
                
                if (srv.embedSettings) {
                    // Online Color
                    if (srv.embedSettings.colorOnline) {
                        if (!isValidHex(srv.embedSettings.colorOnline)) {
                            repairs.push(`  ❌ ${srv.serverName} Online: "${srv.embedSettings.colorOnline}" → entfernt (nutzt Global)`);
                            delete srv.embedSettings.colorOnline;
                            modified = true;
                        } else {
                            console.log(`    ✅ Online: ${srv.embedSettings.colorOnline}`);
                        }
                    }
                    
                    // Offline Color
                    if (srv.embedSettings.colorOffline) {
                        if (!isValidHex(srv.embedSettings.colorOffline)) {
                            repairs.push(`  ❌ ${srv.serverName} Offline: "${srv.embedSettings.colorOffline}" → entfernt (nutzt Global)`);
                            delete srv.embedSettings.colorOffline;
                            modified = true;
                        } else {
                            console.log(`    ✅ Offline: ${srv.embedSettings.colorOffline}`);
                        }
                    }
                }
            });
        }
        
        // ═══════════════════════════════════════════════════════════
        // SPEICHERN WENN ÄNDERUNGEN
        // ═══════════════════════════════════════════════════════════
        if (modified) {
            // Backup erstellen
            const backupPath = filePath + '.backup.' + Date.now();
            fs.writeFileSync(backupPath, rawData);
            
            // Reparierte Config speichern
            fs.writeFileSync(filePath, JSON.stringify(config, null, 2));
            
            console.log(`\n📝 REPARATUREN:`);
            repairs.forEach(r => console.log(`   ${r}`));
            console.log(`\n💾 Backup: ${path.basename(backupPath)}`);
            console.log(`✅ Config repariert und gespeichert`);
            
            totalRepairs += repairs.length;
            filesRepaired++;
        } else {
            console.log(`\n✅ Keine Reparaturen nötig`);
        }
        
    } catch (error) {
        console.log(`\n❌ ERROR beim Lesen von ${fileName}:`);
        console.log(`   ${error.message}`);
    }
});

// ═══════════════════════════════════════════════════════════
// ZUSAMMENFASSUNG
// ═══════════════════════════════════════════════════════════
console.log('\n═══════════════════════════════════════════════════════════');
console.log(' ZUSAMMENFASSUNG');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\nDateien geprüft:    ${configFiles.length}`);
console.log(`Dateien repariert:  ${filesRepaired}`);
console.log(`Total Reparaturen:  ${totalRepairs}`);

if (filesRepaired > 0) {
    console.log('\n🔄 NÄCHSTE SCHRITTE:');
    console.log('   1. Bot neu starten');
    console.log('   2. /setup → Embed Design testen');
    console.log('   3. Wenn OK: Backup-Dateien können gelöscht werden');
    console.log('\n⚠️  Falls Probleme: Restore aus Backup');
} else {
    console.log('\n✅ Alle Configs sind valide!');
    console.log('   Der "Invalid number value" Error hat andere Ursachen.');
    console.log('   → Installiere ColorValidator Patch für zusätzliche Sicherheit');
}

console.log('\n═══════════════════════════════════════════════════════════\n');