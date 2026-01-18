const fs = require('fs');
const path = require('path');

function findRoot(currentDir) {
    const checkPath = path.join(currentDir, 'package.json');
    if (fs.existsSync(checkPath)) return currentDir;
    const parentDir = path.resolve(currentDir, '..');
    return findRoot(parentDir);
}

async function runVisualCheck() {
    console.log('🖼️  STARTE VISUELLEN COMMAND-CHECK');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    try {
        const rootDir = findRoot(__dirname);
        process.chdir(rootDir);

        const commandHandlerPath = path.join(rootDir, 'cogs', 'CommandHandler.js');
        const statusCheckerPath = path.join(rootDir, 'cogs', 'StatusChecker.js');

        // 1. CODE-SCAN (Anti-Minecraft & Verwaiste Variablen)
        console.log('\n🔍 Suche nach Minecraft-Relikten & Leichen...');
        const cogFiles = fs.readdirSync(path.join(rootDir, 'cogs')).filter(f => f.endsWith('.js'));
        
        // Liste typischer MC-Bot Begriffe, die im LS-Bot nichts zu suchen haben
        const mcRelics = [
            'iconMgr', 'worldData', 'playerUUID', 'inventory', 
            'crafting', 'block', 'mine', 'teleport', 'spawn',
            'mobs', 'skin', 'mojang', 'whitelist'
        ];

        cogFiles.forEach(file => {
            const content = fs.readFileSync(path.join(rootDir, 'cogs', file), 'utf8');
            let foundInFile = [];

            mcRelics.forEach(relic => {
                // Prüft, ob das Wort existiert UND ob es nicht lokal definiert wurde
                const regex = new RegExp(`\\b${relic}\\b`, 'g');
                if (content.match(regex)) {
                    const isDefined = content.includes(`const ${relic}`) || 
                                      content.includes(`let ${relic}`) || 
                                      content.includes(`var ${relic}`) ||
                                      content.includes(`function ${relic}`) ||
                                      content.match(new RegExp(`handle\\w+\\s*\\([^)]*${relic}[^)]*\\)`));

                    if (!isDefined) {
                        foundInFile.push(relic);
                    }
                }
            });

            if (foundInFile.length > 0) {
                console.error(`   ❌ GEFAHR in ${file.padEnd(20)}: Undefinierte Relikte gefunden: [${foundInFile.join(', ')}]`);
            } else {
                console.log(`   ✅ ${file.padEnd(25)}: Frei von MC-Leichen.`);
            }
        });

        // 2. MODULE LADEN
        const { CommandHandler } = require(commandHandlerPath);
        const StatusChecker = require(statusCheckerPath);

        // 3. MOCKING MIT VISUALISIERUNG
        const mockLogger = { info: () => {}, success: () => {}, error: (m) => console.log(`      🔴 LOG ERROR: ${m}`), debug: () => {} };
        const mockConfig = { loadGuild: () => ({ 
            servers: [{ serverName: 'Test-Server', stats_url: 'http://localhost' }],
            prefix: '!',
            language: 'de'
        }), globalConfig: {} };

        const mockInteraction = {
            commandName: 'test',
            options: { getString: () => 'Test-Server', getInteger: () => 1 },
            guildId: '123',
            user: { tag: 'Tester#0001' },
            deferReply: async () => console.log('   ⏳ [Discord] Bot denkt nach (defer)...'),
            // HIER MACHEN WIR DAS EMBED SICHTBAR:
            editReply: async (payload) => {
                console.log('\n      --- 📥 DISCORD ANTWORT (EMBED) ---');
                if (payload.embeds && payload.embeds[0]) {
                    const emb = payload.embeds[0].data || payload.embeds[0];
                    console.log(`      📌 Titel:  ${emb.title || 'Kein Titel'}`);
                    console.log(`      📝 Desc:   ${(emb.description || 'Keine Beschreibung').substring(0, 100)}...`);
                    if (emb.fields) {
                        emb.fields.forEach(f => console.log(`      🔹 ${f.name}: ${f.value}`));
                    }
                } else if (typeof payload === 'string') {
                    console.log(`      💬 Text: ${payload}`);
                }
                console.log('      ----------------------------------\n');
            },
            reply: async (payload) => {
                console.log(`      💬 Direkte Antwort: ${typeof payload === 'string' ? payload : '[Embed/Objekt]'}`);
            }
        };

        const handler = new CommandHandler({ user: { id: '123' }, vehicleData: new Map() }, mockConfig, mockLogger);
        
        // Finde alle handle... Funktionen
        const methods = Object.getOwnPropertyNames(CommandHandler.prototype)
            .filter(m => m.startsWith('handle') && typeof CommandHandler.prototype[m] === 'function');

        // Mock StatusChecker für Daten
        const originalGetStatus = StatusChecker.getStatus;
        StatusChecker.getStatus = async () => ({
            online: true,
            serverInfo: { name: 'LS25 Test-Farm', map: 'Alpines Flachland', slots: '2/16' },
            vehicles: [
                { name: 'Fendt 939', category: 'Traktoren', fuel: '80%' },
                { name: 'Claas Lexion', category: 'Mähdrescher', fuel: '20%' }
            ],
            playerList: ['Bauer_Hans', 'Agrar_Ulli']
        });

        console.log(`\n🚀 Teste ${methods.length} Funktionen nacheinander:\n`);

        for (const method of methods) {
            console.log(`▶️ EXEKUTION: ${method}`);
            try {
                // Wir übergeben die interaction und den Servernamen 'Test-Server'
                await handler[method](mockInteraction, 'Test-Server');
                console.log(`✅ ${method} erfolgreich abgeschlossen.`);
            } catch (err) {
                console.error(`❌ ABSTURZ in ${method}:`);
                console.error(`   ${err.stack.split('\n')[1].trim()}`); // Zeigt die genaue Zeile
                console.error(`   Fehler: ${err.message}`);
            }
            console.log('━'.repeat(40));
        }

        StatusChecker.getStatus = originalGetStatus;

    } catch (err) {
        console.error(`❌ System-Fehler beim Testen: ${err.message}`);
    }

    console.log('\n🏁 Visueller Check beendet.');
    process.exit(0);
}

runVisualCheck();