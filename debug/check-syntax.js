const fs = require('fs');
const path = require('path');

function findRoot(currentDir) {
    const checkPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(checkPath)) return currentDir;
    const parentDir = path.resolve(currentDir, '..');
    if (parentDir === currentDir) throw new Error('Root nicht gefunden.');
    return findRoot(parentDir);
}

async function runFullDiagnostics() {
    console.log('🚀 STARTE VOLLSTÄNDIGE SYSTEM-DIAGNOSE...');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        const rootDir = findRoot(__dirname);
        process.chdir(rootDir);

        // 1. JSON & CONFIG CHECK
        console.log('\n📁 Prüfe Konfigurationsdateien (JSON Syntax):');
        const jsonFiles = [
            'global-config.example.json',
            'global-config.json' // Falls vorhanden
        ];
        
        // Suche dynamisch in configs/ und states/
        ['configs', 'states', 'texts'].forEach(dir => {
            const fullPath = path.join(rootDir, dir);
            if (fs.existsSync(fullPath)) {
                fs.readdirSync(fullPath).forEach(file => {
                    if (file.endsWith('.json')) jsonFiles.push(path.join(dir, file));
                });
            }
        });

        jsonFiles.forEach(file => {
            const filePath = path.join(rootDir, file);
            if (fs.existsSync(filePath)) {
                try {
                    JSON.parse(fs.readFileSync(filePath, 'utf8'));
                    console.log(`   ✅ ${file.padEnd(40)}: KORREKT`);
                } catch (e) {
                    console.error(`   ❌ ${file.padEnd(40)}: SYNTAX-FEHLER!`);
                    console.error(`      -> ${e.message}`);
                }
            }
        });

        // 2. TEXT KEYS VALIDIERUNG (Integration deines Debug-Tools)
        const keyChecker = path.join(rootDir, 'debug', 'check-message-keys.js');
        if (fs.existsSync(keyChecker)) {
            console.log('\n🔑 Starte Key-Validierung (check-message-keys.js):');
            try {
                require(keyChecker);
                console.log('   ✅ Key-Check ausgeführt.');
            } catch (e) {
                console.error('   ❌ Fehler beim Ausführen des Key-Checks.');
            }
        }

        // 3. MODUL-CHECK (Die 13+ Cogs)
        console.log('\n🧪 Teste Modul-Ladevorgang (Cogs):');
        const cogsDir = path.join(rootDir, 'cogs');
        if (fs.existsSync(cogsDir)) {
            const cogs = fs.readdirSync(cogsDir).filter(f => f.endsWith('.js'));
            cogs.forEach(file => {
                try {
                    require(path.join(cogsDir, file));
                    console.log(`   ✅ ${file.padEnd(40)}: OK`);
                } catch (err) {
                    console.error(`   ❌ ${file.padEnd(40)}: FEHLER!`);
                    console.error(`      -> ${err.message}`);
                }
            });
        }

        // 4. BOT-START TESTLAUF
        console.log('\n⚡ Starte Bot-Prozess-Test (10 Sek.)...');
        const { spawn } = require('child_process');
        const bot = spawn('node', ['index.js'], { stdio: ['inherit', 'pipe', 'pipe'] });

        bot.stdout.on('data', (data) => {
            const output = data.toString();
            if (output.toLowerCase().includes('error')) console.log(`⚠️  LOG-WARNUNG: ${output.trim()}`);
            if (output.includes('ready') || output.includes('logged in')) {
                console.log('🚀 STATUS: Bot erfolgreich online gegangen.');
            }
        });

        setTimeout(() => {
            console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
            console.log('Diagnose beendet. Bot-Testinstanz wird geschlossen.');
            bot.kill();
            process.exit(0);
        }, 10000);

    } catch (err) {
        console.error(`❌ KRITISCHER DIAGNOSE-ABBRUCH: ${err.message}`);
    }
}

runFullDiagnostics();