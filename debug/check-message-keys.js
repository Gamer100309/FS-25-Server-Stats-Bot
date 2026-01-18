// ═══════════════════════════════════════════════════════════
//  MESSAGE KEY DEBUG TOOL v1.3
//  Findet fehlende Keys in de.json und en.json
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const path = require('path');

// KONFIGURATION
const CUSTOM_OUTPUT_PATH = "C:\\Users\\jason\\Desktop\\Bot\\LS_25 Server Stats Bot\\Server Test Bot neu aufsetzen\\Klone des Mc Bots als LS Bot umgemünzt\\FS-Server-Status-Bot\\debug\\outputs";

function findProjectRoot(currentDir) {
    if (fs.existsSync(path.join(currentDir, 'package.json'))) {
        return currentDir;
    }
    const parent = path.resolve(currentDir, '..');
    if (parent === currentDir) return process.cwd(); 
    return findProjectRoot(parent);
}

const ROOT_DIR = findProjectRoot(__dirname);
const TEXTS_DIR = path.join(ROOT_DIR, 'texts');
const COGS_DIR = path.join(ROOT_DIR, 'cogs');

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('    🔍 MESSAGE KEY CHECKER v1.3');
console.log(`    📍 Projekt-Root: ${ROOT_DIR}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

// ═══════════════════════════════════════════════════════════
// SPRACHDATEIEN LADEN
// ═══════════════════════════════════════════════════════════

function loadJson(fileName) {
    const filePath = path.join(TEXTS_DIR, fileName);
    try {
        if (!fs.existsSync(filePath)) throw new Error('Datei existiert nicht');
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        console.log(`✅ Geladen: ${path.relative(ROOT_DIR, filePath)}`);
        return data;
    } catch (e) {
        console.log(`❌ Fehler beim Laden von ${fileName}: ${e.message}`);
        return null;
    }
}

const deJson = loadJson('de.json');
const enJson = loadJson('en.json');

if (!deJson || !enJson) {
    console.log('\nAbbruch: Sprachdateien fehlen oder sind fehlerhaft.');
    process.exit(1);
}

// ═══════════════════════════════════════════════════════════
// CODE SCANNER
// ═══════════════════════════════════════════════════════════

const usedKeys = new Set();
let totalMatches = 0; // Zähler für absolut alle Funde
let cogFiles = [];

try {
    cogFiles = fs.readdirSync(COGS_DIR).filter(f => f.endsWith('.js'));
} catch (e) {
    console.log(`❌ Verzeichnis nicht gefunden: ${COGS_DIR}`);
    process.exit(1);
}

console.log('\n📂 Scanne Code-Dateien...\n');

cogFiles.forEach(file => {
    const filePath = path.join(COGS_DIR, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const patterns = [
        /messageHandler\.get\(['"]([^'"]+)['"]/g,
        /this\.msg\.get\(['"]([^'"]+)['"]/g,
        /this\.getText\(['"]([^'"]+)['"]/g,
        /this\.messageHandler\.get\(['"]([^'"]+)['"]/g
    ];
    
    let matchesInFile = 0;
    patterns.forEach(pattern => {
        const found = content.matchAll(pattern);
        for (const match of found) {
            usedKeys.add(match[1]);
            matchesInFile++;
            totalMatches++; // Ingesamt-Zähler erhöhen
        }
    });
    
    console.log(`  ${file.padEnd(30)} - ${matchesInFile} Keys gefunden`);
});

// ═══════════════════════════════════════════════════════════
// LOGIK & TEMPLATE GENERIERUNG
// ═══════════════════════════════════════════════════════════

function getNestedValue(obj, pathStr) {
    const keys = pathStr.split('.');
    let current = obj;
    for (const key of keys) {
        if (current && typeof current === 'object' && key in current) {
            current = current[key];
        } else {
            return null;
        }
    }
    return typeof current === 'string' ? current : null;
}

const missingInDe = [];
const missingInEn = [];

usedKeys.forEach(key => {
    if (!getNestedValue(deJson, key)) missingInDe.push(key);
    if (!getNestedValue(enJson, key)) missingInEn.push(key);
});

function saveTemplate(lang, list) {
    if (list.length === 0) return;
    
    const template = {};
    list.forEach(key => {
        const parts = key.split('.');
        let curr = template;
        parts.forEach((p, i) => {
            if (i === parts.length - 1) curr[p] = `TODO: ${key}`;
            else {
                curr[p] = curr[p] || {};
                curr = curr[p];
            }
        });
    });

    let finalFolder = ROOT_DIR;
    if (fs.existsSync(CUSTOM_OUTPUT_PATH)) {
        finalFolder = CUSTOM_OUTPUT_PATH;
    }

    const fileName = `missing-keys-${lang}.json`;
    const outPath = path.join(finalFolder, fileName);
    
    try {
        fs.writeFileSync(outPath, JSON.stringify(template, null, 2));
        console.log(`✅ Template erstellt: ${fileName}`);
    } catch (err) {
        console.log(`❌ Schreibfehler: ${err.message}`);
    }
}

// ═══════════════════════════════════════════════════════════
// ERGEBNIS-AUSGABE
// ═══════════════════════════════════════════════════════════

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('    📋 ERGEBNIS');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

if (missingInDe.length === 0 && missingInEn.length === 0) {
    console.log('🎉 PERFEKT! Alle Keys sind vorhanden.');
} else {
    if (missingInDe.length > 0) console.log(`❌ de.json: ${missingInDe.length} Keys fehlen.`);
    if (missingInEn.length > 0) console.log(`❌ en.json: ${missingInEn.length} Keys fehlen.`);
    console.log('');
    saveTemplate('de', missingInDe);
    saveTemplate('en', missingInEn);
}

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`📂 Dateien: ${cogFiles.length}`);
console.log(`🔑 unterschiedliche Keys: ${usedKeys.size} | keys insgesamt mit doppelt: ${totalMatches}`);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

process.exit(missingInDe.length + missingInEn.length > 0 ? 1 : 0);