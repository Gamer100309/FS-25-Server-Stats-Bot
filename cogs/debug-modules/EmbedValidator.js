class EmbedValidator {
    static validate(embed, logger) {
        logger.debug('[EmbedValidator] Starting validation...', 'debug-module');
        
        const errors = [];
        const warnings = [];
        
        // Title
        if (embed.data.title) {
            if (embed.data.title.length > 256) {
                errors.push(`Title too long: ${embed.data.title.length}/256 chars`);
            }
            logger.debug(`  ✅ Title: ${embed.data.title.length} chars`, 'debug-module');
        }
        
        // Description
        if (embed.data.description) {
            if (embed.data.description.length > 4096) {
                errors.push(`Description too long: ${embed.data.description.length}/4096 chars`);
            }
            logger.debug(`  ✅ Description: ${embed.data.description.length} chars`, 'debug-module');
        }
        
        // Fields
        if (embed.data.fields) {
            if (embed.data.fields.length > 25) {
                errors.push(`Too many fields: ${embed.data.fields.length}/25`);
            }
            
            logger.debug(`  ✅ Fields: ${embed.data.fields.length}/25`, 'debug-module');
            
            embed.data.fields.forEach((field, i) => {
                // Name validation
                if (!field.name || typeof field.name !== 'string') {
                    errors.push(`Field ${i}: name is ${typeof field.name} (must be string)`);
                } else if (field.name.length > 256) {
                    errors.push(`Field ${i}: name too long (${field.name.length}/256 chars)`);
                } else if (field.name.length === 0) {
                    errors.push(`Field ${i}: name is empty`);
                }
                
                // Value validation
                if (!field.value || typeof field.value !== 'string') {
                    errors.push(`Field ${i}: value is ${typeof field.value} (must be string)`);
                } else if (field.value.length > 1024) {
                    errors.push(`Field ${i}: value too long (${field.value.length}/1024 chars)`);
                } else if (field.value.length === 0) {
                    errors.push(`Field ${i}: value is empty`);
                }
                
                // Inline validation
                if (field.inline !== undefined && typeof field.inline !== 'boolean') {
                    errors.push(`Field ${i}: inline is ${typeof field.inline} (must be boolean)`);
                }
                
                logger.debug(`    Field ${i}: "${field.name.substring(0, 30)}" = ${field.value.length} chars`, 'debug-module');
            });
        }
        
        // Total character count
        let totalChars = 0;
        if (embed.data.title) totalChars += embed.data.title.length;
        if (embed.data.description) totalChars += embed.data.description.length;
        if (embed.data.footer?.text) totalChars += embed.data.footer.text.length;
        if (embed.data.fields) {
            embed.data.fields.forEach(f => {
                totalChars += f.name.length + f.value.length;
            });
        }
        
        if (totalChars > 6000) {
            errors.push(`Total embed too large: ${totalChars}/6000 chars`);
        }
        
        logger.debug(`  ✅ Total: ${totalChars}/6000 chars`, 'debug-module');
        
        // Report
        if (errors.length > 0) {
            logger.error('[EmbedValidator] ❌ VALIDATION FAILED:', 'debug-module');
            errors.forEach(e => logger.error(`  - ${e}`, 'debug-module'));
            return { valid: false, errors, warnings };
        }
        
        if (warnings.length > 0) {
            logger.warn('[EmbedValidator] ⚠️ Warnings:', 'debug-module');
            warnings.forEach(w => logger.warn(`  - ${w}`, 'debug-module'));
        }
        
        logger.success('[EmbedValidator] ✅ Validation passed!', 'debug-module');
        return { valid: true, errors: [], warnings };
    }
}

module.exports = { EmbedValidator };