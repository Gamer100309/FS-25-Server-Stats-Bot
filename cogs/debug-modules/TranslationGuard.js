class TranslationGuard {
    constructor() {
        this.name = "TranslationGuard";
    }

    /**
     * Überprüft das generierte Embed auf fehlende Übersetzungen
     * @param {Object} context - Enthält { data, srv, embed }
     * @param {string} serverName - Name des Servers
     * @param {Object} logger - Der Bot-Logger
     */
    log(context, serverName, logger) {
        const { embed } = context;
        const missingKeys = [];

        // Prüfe Titel und Beschreibung
        if (this.isMissing(embed.title)) missingKeys.push("Title");
        if (this.isMissing(embed.description)) missingKeys.push("Description");

        // Prüfe alle Felder
        if (embed.fields) {
            embed.fields.forEach((field, index) => {
                if (this.isMissing(field.name)) missingKeys.push(`Field[${index}].name`);
                if (this.isMissing(field.value)) missingKeys.push(`Field[${index}].value`);
            });
        }

        // Wenn Fehler gefunden wurden, gib eine deutliche Warnung aus
        if (missingKeys.length > 0) {
            logger.error(`[TranslationGuard] ⚠️ Kritischer Fehler in Embed für "${serverName}":`, 'setup');
            logger.error(`[TranslationGuard] Fehlende oder leere Texte in: ${missingKeys.join(', ')}`, 'setup');
            logger.debug(`[TranslationGuard] Embed-Data: ${JSON.stringify(embed, null, 2)}`);
        } else {
            logger.debug(`[TranslationGuard] ✅ Alle Texte für "${serverName}" scheinen valide zu sein.`, 'setup');
        }
    }

    isMissing(text) {
        // Prüft auf null, undefined, leere Strings oder TODO-Platzhalter
        return !text || text === "" || (typeof text === 'string' && text.includes("TODO:"));
    }
}

module.exports = TranslationGuard;