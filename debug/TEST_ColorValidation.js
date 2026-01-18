// ═══════════════════════════════════════════════════════════
//  COLOR VALIDATOR TEST SCRIPT
//  Umfassende Tests für Farb-Validierung
//  Ausführen: node TEST_ColorValidation.js
// ═══════════════════════════════════════════════════════════

const path = require('path');
const { ColorValidator } = require(path.join(__dirname, '../cogs/ColorValidator'));

// Test-Zähler
let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

// Helper: Test ausführen
function test(name, callback) {
    testsRun++;
    process.stdout.write(`\n[${testsRun}] ${name}... `);
    
    try {
        callback();
        testsPassed++;
        console.log('✅ PASSED');
    } catch (error) {
        testsFailed++;
        console.log(`❌ FAILED`);
        console.log(`   Error: ${error.message}`);
    }
}

// Helper: Assertion
function assert(condition, message) {
    if (!condition) {
        throw new Error(message);
    }
}

console.log('═══════════════════════════════════════════════════════════');
console.log('  COLOR VALIDATOR TEST SUITE');
console.log('═══════════════════════════════════════════════════════════');

// ═══════════════════════════════════════════════════════════
// TEST GROUP 1: GÜLTIGE FARBEN
// ═══════════════════════════════════════════════════════════

console.log('\n📗 TEST GROUP 1: GÜLTIGE FARBEN\n');

test('Grüne Farbe (#00FF00)', () => {
    const result = ColorValidator.validate('#00FF00');
    assert(result.valid === true, 'Should be valid');
    assert(result.color === '#00FF00', 'Color should be uppercase');
    assert(result.error === null, 'Error should be null');
});

test('Rote Farbe (#FF0000)', () => {
    const result = ColorValidator.validate('#FF0000');
    assert(result.valid === true, 'Should be valid');
    assert(result.color === '#FF0000', 'Color should match');
});

test('Blaue Farbe (#0000FF)', () => {
    const result = ColorValidator.validate('#0000FF');
    assert(result.valid === true, 'Should be valid');
});

test('Lowercase Hex wird zu Uppercase (#ff6b00)', () => {
    const result = ColorValidator.validate('#ff6b00');
    assert(result.valid === true, 'Should be valid');
    assert(result.color === '#FF6B00', 'Should convert to uppercase');
});

test('Mixed Case (#FfA500)', () => {
    const result = ColorValidator.validate('#FfA500');
    assert(result.valid === true, 'Should be valid');
    assert(result.color === '#FFA500', 'Should convert to uppercase');
});

test('Schwarz (#000000)', () => {
    const result = ColorValidator.validate('#000000');
    assert(result.valid === true, 'Should be valid');
});

test('Weiß (#FFFFFF)', () => {
    const result = ColorValidator.validate('#FFFFFF');
    assert(result.valid === true, 'Should be valid');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 2: UNGÜLTIGE FARBEN
// ═══════════════════════════════════════════════════════════

console.log('\n📕 TEST GROUP 2: UNGÜLTIGE FARBEN\n');

test('Ohne # Prefix (00FF00)', () => {
    const result = ColorValidator.validate('00FF00');
    assert(result.valid === false, 'Should be invalid');
    assert(result.color === null, 'Color should be null');
    assert(result.error.includes('Must start with #'), 'Error should mention #');
});

test('Zu kurz (#00FF0)', () => {
    const result = ColorValidator.validate('#00FF0');
    assert(result.valid === false, 'Should be invalid');
    assert(result.error.includes('Must be 7 characters'), 'Error should mention length');
});

test('Zu lang (#00FF000)', () => {
    const result = ColorValidator.validate('#00FF000');
    assert(result.valid === false, 'Should be invalid');
});

test('Ungültige Zeichen (#GG0000)', () => {
    const result = ColorValidator.validate('#GG0000');
    assert(result.valid === false, 'Should be invalid');
    assert(result.error.includes('Only 0-9 and A-F allowed'), 'Error should mention hex chars');
});

test('Ungültige Zeichen (#00ZZ00)', () => {
    const result = ColorValidator.validate('#00ZZ00');
    assert(result.valid === false, 'Should be invalid');
});

test('Sonderzeichen (#00@F00)', () => {
    const result = ColorValidator.validate('#00@F00');
    assert(result.valid === false, 'Should be invalid');
});

test('Leer-String', () => {
    const result = ColorValidator.validate('');
    assert(result.valid === false, 'Should be invalid');
    assert(result.error.includes('cannot be empty'), 'Error should mention empty');
});

test('Nur Spaces ("   ")', () => {
    const result = ColorValidator.validate('   ');
    assert(result.valid === false, 'Should be invalid');
});

test('Null', () => {
    const result = ColorValidator.validate(null);
    assert(result.valid === false, 'Should be invalid');
});

test('Undefined', () => {
    const result = ColorValidator.validate(undefined);
    assert(result.valid === false, 'Should be invalid');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 3: WHITESPACE HANDLING
// ═══════════════════════════════════════════════════════════

console.log('\n📘 TEST GROUP 3: WHITESPACE HANDLING\n');

test('Leading Whitespace ("  #00FF00")', () => {
    const result = ColorValidator.validate('  #00FF00');
    assert(result.valid === true, 'Should trim and validate');
    assert(result.color === '#00FF00', 'Should return trimmed color');
});

test('Trailing Whitespace ("#00FF00  ")', () => {
    const result = ColorValidator.validate('#00FF00  ');
    assert(result.valid === true, 'Should trim and validate');
});

test('Both Whitespace ("  #00FF00  ")', () => {
    const result = ColorValidator.validate('  #00FF00  ');
    assert(result.valid === true, 'Should trim and validate');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 4: getSafeColor() FALLBACK CHAIN
// ═══════════════════════════════════════════════════════════

console.log('\n📙 TEST GROUP 4: FALLBACK CHAIN\n');

test('Primary valid → Returns Primary', () => {
    const result = ColorValidator.getSafeColor('#FF0000', '#00FF00', '#0000FF');
    assert(result === '#FF0000', 'Should return primary color');
});

test('Primary invalid, Secondary valid → Returns Secondary', () => {
    const result = ColorValidator.getSafeColor('INVALID', '#00FF00', '#0000FF');
    assert(result === '#00FF00', 'Should return secondary color');
});

test('Primary + Secondary invalid, Tertiary valid → Returns Tertiary', () => {
    const result = ColorValidator.getSafeColor('INVALID', 'ALSO_INVALID', '#0000FF');
    assert(result === '#0000FF', 'Should return tertiary color');
});

test('All invalid → Returns Default (#00FF00)', () => {
    const result = ColorValidator.getSafeColor('INVALID', 'INVALID2', 'INVALID3');
    assert(result === '#00FF00', 'Should return ultimate fallback');
});

test('Null primary, valid secondary', () => {
    const result = ColorValidator.getSafeColor(null, '#FF0000');
    assert(result === '#FF0000', 'Should fallback to secondary');
});

test('Only tertiary provided (default behavior)', () => {
    const result = ColorValidator.getSafeColor(null);
    assert(result === '#00FF00', 'Should return default green');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 5: getStatusColor() SERVER STATUS
// ═══════════════════════════════════════════════════════════

console.log('\n📔 TEST GROUP 5: STATUS COLOR SELECTION\n');

test('Online with server color', () => {
    const embedSettings = { colorOnline: '#00FF00' };
    const globalColors = { online: '#AAAAAA' };
    const result = ColorValidator.getStatusColor(embedSettings, globalColors, true);
    assert(result === '#00FF00', 'Should use server-specific online color');
});

test('Online without server color → Global color', () => {
    const embedSettings = {};
    const globalColors = { online: '#00FF00' };
    const result = ColorValidator.getStatusColor(embedSettings, globalColors, true);
    assert(result === '#00FF00', 'Should use global online color');
});

test('Online with invalid server color → Global fallback', () => {
    const embedSettings = { colorOnline: 'INVALID' };
    const globalColors = { online: '#00FF00' };
    const result = ColorValidator.getStatusColor(embedSettings, globalColors, true);
    assert(result === '#00FF00', 'Should fallback to global color');
});

test('Offline with server color', () => {
    const embedSettings = { colorOffline: '#FF0000' };
    const globalColors = { offline: '#AAAAAA' };
    const result = ColorValidator.getStatusColor(embedSettings, globalColors, false);
    assert(result === '#FF0000', 'Should use server-specific offline color');
});

test('All invalid → Default offline red', () => {
    const embedSettings = { colorOffline: 'INVALID' };
    const globalColors = { offline: 'INVALID' };
    const result = ColorValidator.getStatusColor(embedSettings, globalColors, false);
    assert(result === '#FF0000', 'Should use default red');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 6: CONFIG VALIDATION
// ═══════════════════════════════════════════════════════════

console.log('\n📓 TEST GROUP 6: CONFIG VALIDATION\n');

test('Valid config', () => {
    const config = {
        embedColors: {
            online: '#00FF00',
            offline: '#FF0000'
        },
        servers: [
            {
                serverName: 'Test',
                embedSettings: {
                    colorOnline: '#00FFFF',
                    colorOffline: '#FF00FF'
                }
            }
        ]
    };
    const result = ColorValidator.validateConfig(config);
    assert(result.valid === true, 'Config should be valid');
    assert(result.errors.length === 0, 'Should have no errors');
});

test('Invalid global online color', () => {
    const config = {
        embedColors: {
            online: 'INVALID',
            offline: '#FF0000'
        },
        servers: []
    };
    const result = ColorValidator.validateConfig(config);
    assert(result.valid === false, 'Config should be invalid');
    assert(result.errors.length > 0, 'Should have errors');
    assert(result.errors[0].includes('Global Online Color'), 'Error should mention global online');
});

test('Invalid server color', () => {
    const config = {
        embedColors: {
            online: '#00FF00',
            offline: '#FF0000'
        },
        servers: [
            {
                serverName: 'BadServer',
                embedSettings: {
                    colorOnline: '12345',
                    colorOffline: '#FF0000'
                }
            }
        ]
    };
    const result = ColorValidator.validateConfig(config);
    assert(result.valid === false, 'Config should be invalid');
    assert(result.errors.length > 0, 'Should have errors');
    assert(result.errors[0].includes('BadServer'), 'Error should mention server name');
});

// ═══════════════════════════════════════════════════════════
// TEST GROUP 7: COLOR CONVERSION
// ═══════════════════════════════════════════════════════════

console.log('\n🔵 TEST GROUP 7: COLOR CONVERSION\n');

test('Hex to Integer (#00FF00)', () => {
    const result = ColorValidator.toInteger('#00FF00');
    assert(result === 0x00FF00, 'Should convert to correct integer');
});

test('Integer to Hex (0xFF0000)', () => {
    const result = ColorValidator.toHex(0xFF0000);
    assert(result === '#FF0000', 'Should convert to hex string');
});

test('Hex string passthrough', () => {
    const result = ColorValidator.toHex('#00FF00');
    assert(result === '#00FF00', 'Should return string as-is');
});

test('Invalid hex to integer → Fallback', () => {
    const result = ColorValidator.toInteger('INVALID');
    assert(result === 0x00FF00, 'Should return default green integer');
});

// ═══════════════════════════════════════════════════════════
// TEST SUMMARY
// ═══════════════════════════════════════════════════════════

console.log('\n═══════════════════════════════════════════════════════════');
console.log('  TEST SUMMARY');
console.log('═══════════════════════════════════════════════════════════');
console.log(`\nTotal Tests:  ${testsRun}`);
console.log(`✅ Passed:    ${testsPassed}`);
console.log(`❌ Failed:    ${testsFailed}`);
console.log(`📊 Success:   ${((testsPassed / testsRun) * 100).toFixed(1)}%`);

if (testsFailed === 0) {
    console.log('\n🎉 ALL TESTS PASSED! ColorValidator is working correctly.');
    console.log('✅ Safe to use in production.');
    process.exit(0);
} else {
    console.log('\n⚠️  SOME TESTS FAILED! Please review the errors above.');
    console.log('❌ Do NOT use in production until all tests pass.');
    process.exit(1);
}