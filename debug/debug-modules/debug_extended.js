// ═══════════════════════════════════════════════════════════
//  EXTENDED DEBUG HOOK
//  Überwacht ALLE Discord.js Aufrufe die crashen könnten
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');

console.log('🔧 Installing EXTENDED debug hooks...\n');

// ═══════════════════════════════════════════════════════════
// HOOK 1: EmbedBuilder.addFields
// ═══════════════════════════════════════════════════════════
const originalAddFields = EmbedBuilder.prototype.addFields;
EmbedBuilder.prototype.addFields = function(...fields) {
    console.log(`📋 [DEBUG] addFields() called with ${fields.length} field(s)`);
    
    fields.forEach((field, idx) => {
        console.log(`   Field ${idx}:`);
        console.log(`      name: "${field.name}" (type: ${typeof field.name})`);
        console.log(`      value: "${field.value}" (type: ${typeof field.value}, length: ${field.value?.length})`);
        console.log(`      inline: ${field.inline}`);
        
        // Validierung
        if (!field.name || field.name.length === 0) {
            console.log(`      ⚠️  WARNING: Empty name!`);
        }
        if (!field.value || field.value.length === 0) {
            console.log(`      ⚠️  WARNING: Empty value!`);
        }
        if (field.value && field.value.length > 1024) {
            console.log(`      ❌ ERROR: Value too long (${field.value.length} > 1024)!`);
        }
    });
    
    try {
        return originalAddFields.apply(this, fields);
    } catch (error) {
        console.log(`\n🚨 ═══ addFields() CRASHED ═══`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Fields:`, JSON.stringify(fields, null, 2));
        console.log(`═══════════════════════════════\n`);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════
// HOOK 2: StringSelectMenuBuilder.addOptions
// ═══════════════════════════════════════════════════════════
const originalAddOptions = StringSelectMenuBuilder.prototype.addOptions;
StringSelectMenuBuilder.prototype.addOptions = function(...options) {
    const flatOptions = options.flat();
    console.log(`\n📝 [DEBUG] addOptions() called with ${flatOptions.length} option(s)`);
    
    flatOptions.forEach((opt, idx) => {
        console.log(`   Option ${idx}:`);
        console.log(`      label: "${opt.label}" (type: ${typeof opt.label})`);
        console.log(`      value: "${opt.value}" (type: ${typeof opt.value})`);
        console.log(`      emoji: "${opt.emoji}" (type: ${typeof opt.emoji})`);
        console.log(`      description: "${opt.description}"`);
        
        // Validierung
        if (!opt.label || opt.label.length === 0) {
            console.log(`      ❌ ERROR: Empty label!`);
        }
        if (!opt.value) {
            console.log(`      ❌ ERROR: Missing value!`);
        }
        if (opt.emoji !== undefined && opt.emoji !== null && typeof opt.emoji !== 'string') {
            console.log(`      ❌ ERROR: Invalid emoji type: ${typeof opt.emoji}`);
        }
    });
    
    try {
        return originalAddOptions.call(this, ...options);
    } catch (error) {
        console.log(`\n🚨 ═══ addOptions() CRASHED ═══`);
        console.log(`   Error: ${error.message}`);
        console.log(`   Stack:`, error.stack);
        console.log(`   Options:`, JSON.stringify(flatOptions, null, 2));
        console.log(`═══════════════════════════════\n`);
        throw error;
    }
};

// ═══════════════════════════════════════════════════════════
// HOOK 3: Interaction.update
// ═══════════════════════════════════════════════════════════
// Wir können Interaction.prototype nicht direkt patchen,
// aber wir loggen wenn addOptions aufgerufen wird

console.log('✅ Extended debug hooks installed!');
console.log('   - EmbedBuilder.addFields()');
console.log('   - StringSelectMenuBuilder.addOptions()');
console.log('   - Detailed validation logging\n');

module.exports = {};