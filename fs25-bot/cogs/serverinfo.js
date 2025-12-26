const { EmbedBuilder, TextChannel } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const { fetchCareerSavegame } = require('../utils');
const config = require('../config.json');
const fs = require('fs');
const logger = require('../logger');
let lastServerOnline = null; // merkt sich den letzten bekannten Status

const EMBED_TRACKER_PATH = './embedTracker.json';
const PENDING_DELETES_PATH = './pendingDeletes.json';
const STATUS_MESSAGE_DELETE_AFTER = 30 * 60 * 1000; // 30 Minuten (in Millisekunden)

// Speichert die Offline-Warnung, um sie später zu löschen
let offlineWarningMessage = null;

// Lädt ausstehende Löschungen
function loadPendingDeletes() {
    try {
        if (fs.existsSync(PENDING_DELETES_PATH)) {
            return JSON.parse(fs.readFileSync(PENDING_DELETES_PATH, 'utf-8'));
        }
    } catch (error) {
        logger.error(`Failed to load pending deletes: ${error.message}`);
    }
    return { statusMessages: [] };
}

// Speichert ausstehende Löschungen
function savePendingDeletes(data) {
    try {
        fs.writeFileSync(PENDING_DELETES_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        logger.error(`Failed to save pending deletes: ${error.message}`);
    }
}

// Verarbeitet ausstehende Löschungen beim Bot-Start
async function processPendingDeletes(client) {
    const pending = loadPendingDeletes();
    const now = Date.now();
    const stillPending = [];

    for (const item of pending.statusMessages) {
        const timeLeft = item.deleteAt - now;
        
        if (timeLeft <= 0) {
            // Sofort löschen
            try {
                const channel = await client.channels.fetch(item.channelId);
                const message = await channel.messages.fetch(item.messageId);
                await message.delete();
                logger.info(`Deleted pending status message: ${item.messageId}`);
            } catch (err) {
                logger.warn(`Failed to delete pending message ${item.messageId}: ${err.message}`);
            }
        } else {
            // Timer neu setzen
            setTimeout(async () => {
                try {
                    const channel = await client.channels.fetch(item.channelId);
                    const message = await channel.messages.fetch(item.messageId);
                    await message.delete();
                    logger.info(`Deleted status message after restart: ${item.messageId}`);
                    
                    // Aus pending Liste entfernen
                    const current = loadPendingDeletes();
                    current.statusMessages = current.statusMessages.filter(m => m.messageId !== item.messageId);
                    savePendingDeletes(current);
                } catch (err) {
                    logger.warn(`Failed to delete message ${item.messageId}: ${err.message}`);
                }
            }, timeLeft);
            
            stillPending.push(item);
            logger.info(`Re-scheduled deletion for message ${item.messageId} in ${Math.round(timeLeft / 60000)} minutes`);
        }
    }

    // Aktualisiere die pending Liste
    savePendingDeletes({ statusMessages: stillPending });
}

// Safe field addition to avoid empty/undefined values
function addFieldSafe(embed, name, value, inline = true) {
    logger.debug(`Attempting to add field: ${name} - ${value}`);
    if (value && value !== 'undefined' && value !== '') {
        if (name.length > 256) name = name.substring(0, 253) + '...';
        if (value.length > 1024) value = value.substring(0, 1021) + '...';
        embed.addFields({ 
            name: String(name).trim(), 
            value: String(value).trim(), 
            inline: inline 
        });
    } else {
        logger.warn(`Skipping empty or invalid field: ${name} - ${value}`);
    }
}

// Improved server status check using XML parsing
async function isServerOnline() {
    try {
        logger.info(`Fetching server stats from: ${config.server.stats_url}`);
        const response = await axios.get(config.server.stats_url, { timeout: 10_000 });

        if (!response.data.trim()) {
            throw new Error('Empty response from server stats URL.');
        }

        const data = await parseStringPromise(response.data, { explicitArray: false });

        if (!data?.Server?.Slots?.$) {
            throw new Error('Missing <Server> or <Slots> in the XML.');
        }

        logger.info('Server status check: Online');
        return true;

    } catch (error) {
        logger.warn(`Server offline or failed to fetch stats: ${error.message}`);
        return false;
    }
}

// Load embed tracker from file
function loadEmbedTracker() {
    try {
        if (fs.existsSync(EMBED_TRACKER_PATH)) {
            return JSON.parse(fs.readFileSync(EMBED_TRACKER_PATH, 'utf-8'));
        }
    } catch (error) {
        logger.error(`Failed to load embedTracker.json: ${error.message}`);
    }
    return {};
}

// Save embed tracker to file
function saveEmbedTracker(embedTracker) {
    try {
        fs.writeFileSync(EMBED_TRACKER_PATH, JSON.stringify(embedTracker, null, 2));
    } catch (error) {
        logger.error(`Failed to save embedTracker.json: ${error.message}`);
    }
}

// Main embed updater
async function postOrUpdateEmbed(client) {
    logger.info('Checking for existing embed to update...');

    const channelId = config.channels.serverinfo_channel_id;
    try {
        const channel = await client.channels.fetch(channelId);
        if (!channel || !(channel instanceof TextChannel)) {
            logger.error(`Invalid channel: ${channelId}`);
            return;
        }
        logger.info(`Channel found: ${channel.name}`);

        const serverOnline = await isServerOnline();
        let statusText = serverOnline ? '🟢 Online' : '🔴 Offline';
        let embedColor = serverOnline ? 0x2ecc71 : 0xe74c3c;
        
        // Beim Statuswechsel eine Nachricht in den Channel posten
        if (lastServerOnline === null) {
            // Erste Ausführung: nur initial setzen, keine Meldung spammen
            lastServerOnline = serverOnline;
        } else {
            if (!serverOnline && lastServerOnline === true) {
                // Server war online und ist jetzt offline -> Warnung schicken
                offlineWarningMessage = await channel.send('⚠️ Der LS25-Server ist aktuell **nicht erreichbar**. Der Bot konnte keine Serverdaten abrufen.');
                logger.info('Posted offline warning message.');
                // Offline-Nachricht bleibt stehen bis Online-Nachricht kommt
                
            } else if (serverOnline && lastServerOnline === false) {
                // Server war offline und ist jetzt wieder online -> Entwarnung
                const successMsg = await channel.send('✅ Der LS25-Server ist wieder **online** und erreichbar.');
                logger.info('Posted online success message.');
                
                const deleteAt = Date.now() + STATUS_MESSAGE_DELETE_AFTER;
                
                // In pending deletes speichern
                const pending = loadPendingDeletes();
                
                // Offline-Nachricht zur Löschung hinzufügen
                if (offlineWarningMessage) {
                    pending.statusMessages.push({
                        messageId: offlineWarningMessage.id,
                        channelId: channel.id,
                        deleteAt: deleteAt
                    });
                }
                
                // Online-Nachricht zur Löschung hinzufügen
                pending.statusMessages.push({
                    messageId: successMsg.id,
                    channelId: channel.id,
                    deleteAt: deleteAt
                });
                
                savePendingDeletes(pending);
                logger.info(`Scheduled deletion of status messages in 30 minutes (saved to disk)`);
                
                // Countdown starten: Nach 30 Minuten BEIDE Nachrichten löschen
                setTimeout(async () => {
                    try {
                        // Lösche die Offline-Warnung (falls sie noch existiert)
                        if (offlineWarningMessage) {
                            await offlineWarningMessage.delete();
                            logger.info('Deleted offline warning message after 30 minutes.');
                            offlineWarningMessage = null;
                        }
                        
                        // Lösche die Online-Erfolgsmeldung
                        await successMsg.delete();
                        logger.info('Deleted online success message after 30 minutes.');
                        
                        // Aus pending Liste entfernen
                        const current = loadPendingDeletes();
                        current.statusMessages = current.statusMessages.filter(
                            m => m.messageId !== successMsg.id && 
                                 (!offlineWarningMessage || m.messageId !== offlineWarningMessage.id)
                        );
                        savePendingDeletes(current);
                        
                    } catch (err) {
                        logger.warn(`Failed to delete status messages: ${err.message}`);
                    }
                }, STATUS_MESSAGE_DELETE_AFTER);
            }

            // Status für das nächste Mal merken
            lastServerOnline = serverOnline;
        }

        // Fetch savegame data only if server is online
        let savegameData = null;

        if (serverOnline) {
            savegameData = await fetchCareerSavegame();
            if (!savegameData || !savegameData.careerSavegame) {
                logger.warn('Savegame data missing, but server remains marked online.');
            }
        } else {
            logger.warn('Server offline. Skipping savegame fetch.');
            savegameData = null;
        }

        const savegame = savegameData ? savegameData.careerSavegame : {};
        const settings = savegame.settings ? savegame.settings[0] : {};
        const statistics = savegame.statistics ? savegame.statistics[0] : {};

        const data = {
            mapTitle: settings.mapTitle || 'Unknown',
            savegameName: settings.savegameName || 'Unknown',
            saveDate: settings.saveDate || 'Unknown',
            creationDate: settings.creationDate || 'Unknown',
            economicDifficulty: settings.economicDifficulty || 'Normal',
            initialMoney: settings.initialMoney || '0',
            initialLoan: settings.initialLoan || '0',
            timeScale: settings.timeScale || '1.0',
            trafficEnabled: String(settings.trafficEnabled).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            fruitDestruction: String(settings.fruitDestruction).trim().toLowerCase() === 'true' ? 'Enabled' : 'Disabled',
            weedsEnabled: String(settings.weedsEnabled).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            stonesEnabled: String(settings.stonesEnabled).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            isSnowEnabled: String(settings.isSnowEnabled).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            helperBuyFuel: String(settings.helperBuyFuel).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            helperBuySeeds: String(settings.helperBuySeeds).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            helperBuyFertilizer: String(settings.helperBuyFertilizer).trim().toLowerCase() === 'true' ? 'Yes' : 'No',
            fuelUsage: settings.fuelUsage || '0',
            money: statistics.money || '0',
            playTime: statistics.playTime ? (statistics.playTime / 60).toFixed(1) : '0.0'
        };        

        const embed = new EmbedBuilder()
            .setColor(embedColor)
            .setTitle('🌾 Farming Simulator - Server Info')
            .setDescription(`Server Status: **${statusText}**`)
            .setFooter({ text: 'Last Updated:' })
            .setTimestamp();

        addFieldSafe(embed, '🗺️ Map Name', data.mapTitle);
        addFieldSafe(embed, '💾 Savegame Name', data.savegameName);
        addFieldSafe(embed, '💾 Save Date', data.saveDate);
        addFieldSafe(embed, '🛠️ Creation Date', data.creationDate);
        addFieldSafe(embed, '⚙️ Difficulty', data.economicDifficulty);
        addFieldSafe(embed, '💰 Current Money', `$${parseInt(data.money || '0').toLocaleString()}`);
        addFieldSafe(embed, '⏳ Time Scale', `${data.timeScale}x`);
        addFieldSafe(embed, '🚦 Traffic Enabled', data.trafficEnabled);
        addFieldSafe(embed, '🌱 Weeds Enabled', data.weedsEnabled);
        addFieldSafe(embed, '🪨 Stones Enabled', data.stonesEnabled);
        addFieldSafe(embed, '❄️ Snow Enabled', data.isSnowEnabled);
        addFieldSafe(embed, '🌾 Fruit Destruction', data.fruitDestruction);
        addFieldSafe(embed, '⛽ Fuel Usage', data.fuelUsage);
        addFieldSafe(embed, '🕒 Playtime', `${data.playTime} hours`);
        addFieldSafe(embed, '🏦 Initial Loan', `$${parseInt(data.initialLoan || '0').toLocaleString()}`);
        addFieldSafe(embed, '💼 Initial Money', `$${parseInt(data.initialMoney || '0').toLocaleString()}`);
        addFieldSafe(embed, '👨‍🌾 Helper Buys Fuel', data.helperBuyFuel);
        addFieldSafe(embed, '🌾 Helper Buys Seeds', data.helperBuySeeds);
        addFieldSafe(embed, '💧 Helper Buys Fertilizer', data.helperBuyFertilizer);

        if (config.server.enable_mod_list) {
            const modListUrl = config.server.mod_list_url || 'N/A';
            addFieldSafe(embed, '🗂️ Mod List', `[View Mods](${modListUrl})`, false);
        }

        if (config.server.enable_server_password) {
            const serverPassword = config.server.server_password || 'N/A';
            addFieldSafe(embed, '🔒 Server Password', `||${serverPassword}|| *(Click to show)*`, false);
        }

        // FIXED: Besseres Handling der Message-ID
        let embedTracker = loadEmbedTracker();
        let messageUpdated = false;

        if (embedTracker.serverinfo_message_id) {
            try {
                // Versuche die Message direkt vom Channel zu fetchen (nicht aus Cache!)
                const message = await channel.messages.fetch(embedTracker.serverinfo_message_id);
                await message.edit({ embeds: [embed] });
                logger.info(`Embed updated successfully: ${message.id}`);
                messageUpdated = true;
            } catch (fetchError) {
                logger.warn(`Failed to fetch/update message ${embedTracker.serverinfo_message_id}: ${fetchError.message}`);
                // Message existiert nicht mehr - ID löschen
                delete embedTracker.serverinfo_message_id;
                saveEmbedTracker(embedTracker);
            }
        }

        // Wenn Update fehlgeschlagen ist oder keine ID vorhanden war
        if (!messageUpdated) {
            logger.info('Sending new embed message...');
            const sentMessage = await channel.send({ embeds: [embed] });
            embedTracker.serverinfo_message_id = sentMessage.id;
            saveEmbedTracker(embedTracker);
            logger.info(`New embed posted with ID: ${sentMessage.id}`);
        }

    } catch (error) {
        logger.error(`Failed to post or update embed: ${error.stack}`);
    }
}

module.exports = (client) => {
    client.once('ready', async () => {
        // Verarbeite ausstehende Löschungen vom letzten Lauf
        await processPendingDeletes(client);
        
        await postOrUpdateEmbed(client);
    });

    const updateInterval = config.intervals.serverinfo_update_minutes * 60 * 1000;
    setInterval(async () => {
        await postOrUpdateEmbed(client);
    }, updateInterval);
};