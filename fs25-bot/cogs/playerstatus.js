const { EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { parseStringPromise } = require('xml2js');
const config = require('../config.json');
const logger = require('../logger');
const fs = require('fs');
const path = require('path');
const { promises: fsPromises } = require('fs');

let previousPlayers = [];
let playerSessions = {};

const DATA_DIR = path.join(__dirname, '..', 'data');
const PLAYTIME_FILE = path.join(DATA_DIR, 'playerPlaytime.json');
const EMBED_TRACKER_PATH = path.join(__dirname, '..', 'embedTracker.json');
const PLAYER_PENDING_DELETES_PATH = path.join(__dirname, '..', 'playerPendingDeletes.json');

const PLAYER_MESSAGE_DELETE_AFTER = 1.5 * 60 * 60 * 1000; // 1,5 Stunden // Pfad zum Embed-Tracker

// Ensure the data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info(`Created data directory at ${DATA_DIR}`);
}

// Initialize playtime file if it doesn't exist
function initializePlaytimeFile() {
    if (!fs.existsSync(PLAYTIME_FILE)) {
        try {
            fs.writeFileSync(PLAYTIME_FILE, JSON.stringify({}, null, 2));
            logger.info('Initialized playerPlaytime.json with an empty object.');
        } catch (error) {
            logger.error(`Failed to initialize playtime file: ${error.message}`);
        }
    }
}

initializePlaytimeFile();

// Load previous playtime from file
function loadPlaytimeData() {
    if (fs.existsSync(PLAYTIME_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(PLAYTIME_FILE, 'utf8'));
        } catch (error) {
            logger.error(`Failed to parse playtime data: ${error.message}. Resetting playtime data.`);
            return {};
        }
    }
    return {};
}

// Save updated playtime data asynchronously
async function savePlaytimeData(data) {
    try {
        await fsPromises.writeFile(PLAYTIME_FILE, JSON.stringify(data, null, 2));
        logger.debug('Playtime data saved successfully.');
    } catch (error) {
        logger.error(`Failed to save playtime data: ${error.message}`);
    }
}

let playtimeData = loadPlaytimeData();

// Lädt ausstehende Löschungen für Player-Messages
function loadPlayerPendingDeletes() {
    try {
        if (fs.existsSync(PLAYER_PENDING_DELETES_PATH)) {
            return JSON.parse(fs.readFileSync(PLAYER_PENDING_DELETES_PATH, 'utf-8'));
        }
    } catch (error) {
        logger.error(`Failed to load player pending deletes: ${error.message}`);
    }
    return { messages: [] };
}

// Speichert ausstehende Löschungen für Player-Messages
function savePlayerPendingDeletes(data) {
    try {
        fs.writeFileSync(PLAYER_PENDING_DELETES_PATH, JSON.stringify(data, null, 2));
    } catch (error) {
        logger.error(`Failed to save player pending deletes: ${error.message}`);
    }
}

// Verarbeitet ausstehende Löschungen beim Bot-Start
async function processPlayerPendingDeletes(client) {
    const pending = loadPlayerPendingDeletes();
    const now = Date.now();
    const stillPending = [];

    for (const item of pending.messages) {
        const timeLeft = item.deleteAt - now;
        
        if (timeLeft <= 0) {
            // Sofort löschen
            try {
                const channel = await client.channels.fetch(item.channelId);
                const message = await channel.messages.fetch(item.messageId);
                await message.delete();
                logger.info(`Deleted pending player message: ${item.messageId}`);
            } catch (err) {
                logger.warn(`Failed to delete pending player message ${item.messageId}: ${err.message}`);
            }
        } else {
            // Timer neu setzen
            setTimeout(async () => {
                try {
                    const channel = await client.channels.fetch(item.channelId);
                    const message = await channel.messages.fetch(item.messageId);
                    await message.delete();
                    logger.info(`Deleted player message after restart: ${item.messageId}`);
                    
                    // Aus pending Liste entfernen
                    const current = loadPlayerPendingDeletes();
                    current.messages = current.messages.filter(m => m.messageId !== item.messageId);
                    savePlayerPendingDeletes(current);
                } catch (err) {
                    logger.warn(`Failed to delete player message ${item.messageId}: ${err.message}`);
                }
            }, timeLeft);
            
            stillPending.push(item);
            logger.info(`Re-scheduled deletion for player message ${item.messageId} in ${Math.round(timeLeft / 60000)} minutes`);
        }
    }

    // Aktualisiere die pending Liste
    savePlayerPendingDeletes({ messages: stillPending });
}

module.exports = (client) => {
    client.once('ready', async () => {
        logger.info('Player status monitor with playtime tracking started.');
        
        // Verarbeite ausstehende Löschungen vom letzten Lauf
        await processPlayerPendingDeletes(client);
        
        await checkPlayerStatus(client);
        setInterval(() => checkPlayerStatus(client), 60_000);
    });
};

async function checkPlayerStatus(client) {
    try {
        const statsUrl = config.server.stats_url;
        logger.debug(`Fetching FS server stats from: ${statsUrl}`);

        const response = await axios.get(statsUrl, { timeout: 10_000 });
        if (!response.data.trim()) throw new Error('Empty response from the FS server stats.');

        const data = await parseStringPromise(response.data, { explicitArray: false });
        const serverNameStringToRemove = config.server.server_name_string_to_remove || '';
        let serverName = data?.Server?.$?.name || 'the farm server';
        
        // HTML-Entities dekodieren (z.B. &#93; -> ])
        serverName = serverName
            .replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'");
        
        serverName = serverName.replace(serverNameStringToRemove, '');
        const slots = data?.Server?.Slots;
        if (!slots || !slots.Player) throw new Error('No <Player> elements found in <Slots>.');

        const playerNodes = Array.isArray(slots.Player) ? slots.Player : [slots.Player];
        const currentPlayers = [];

        playerNodes.forEach((playerNode) => {
            if (playerNode?.$?.isUsed === 'true') {
                let name = playerNode._ || 'Unknown';
                const isAdmin = playerNode.$.isAdmin === 'true';
                currentPlayers.push({ name, isAdmin });

                if (!playerSessions[name]) {
                    playerSessions[name] = Date.now();
                    logger.info(`Started tracking playtime for ${name} at ${new Date(playerSessions[name]).toISOString()}`);
                }
            }
        });

        const joined = currentPlayers.filter(cp => !previousPlayers.some(pp => pp.name === cp.name));
        const left = previousPlayers.filter(pp => !currentPlayers.some(cp => cp.name === pp.name));

        const channelId = config.channels.player_status_channel_id;
        const channel = client.channels.cache.get(channelId);

        if (channel) {
            // FIXED: Lade die Server-Info Embed Message-ID, um sie zu schützen
            let protectedMessageId = null;
            if (fs.existsSync(EMBED_TRACKER_PATH)) {
                try {
                    const tracker = JSON.parse(fs.readFileSync(EMBED_TRACKER_PATH, 'utf8'));
                    protectedMessageId = tracker.serverinfo_message_id;
                    logger.debug(`Protected Server-Info Embed ID: ${protectedMessageId}`);
                } catch (err) {
                    logger.warn(`Could not read embedTracker: ${err.message}`);
                }
            }

            // Alte Bot-Nachrichten löschen, die älter als 1,5h sind
            const messages = await channel.messages.fetch({ limit: 100 });
            const cutoff = Date.now() - PLAYER_MESSAGE_DELETE_AFTER;
            let deletedCount = 0;
            
            const pending = loadPlayerPendingDeletes();

            messages.forEach(msg => {
                // WICHTIG: Lösche NICHT das Server-Info Embed!
                if (msg.author.id === client.user.id && 
                    msg.createdTimestamp < cutoff && 
                    msg.id !== protectedMessageId) {
                    msg.delete().catch(err => 
                        logger.warn(`Failed to delete message: ${err.message}`)
                    );
                    deletedCount++;
                    
                    // Aus pending deletes entfernen falls vorhanden
                    pending.messages = pending.messages.filter(m => m.messageId !== msg.id);
                }
            });
            
            savePlayerPendingDeletes(pending);

            if (deletedCount > 0) {
                logger.info(`Cleaned up ${deletedCount} old player status messages.`);
            }

            // Join-Nachrichten senden
            for (const player of joined) {
                const adminNote = player.isAdmin ? ' (Admin)' : '';
                const embed = new EmbedBuilder()
                    .setColor(0x57f287)
                    .setTitle(config.messages.player_joined_title)
                    .setDescription(config.messages.player_joined_description
                        .replace('{player_name}', player.name)
                        .replace('{admin_note}', adminNote)
                        .replace('{server_name}', serverName))
                    .setTimestamp(new Date());

                const joinMsg = await channel.send({ embeds: [embed] });
                
                // Zur Löschliste hinzufügen
                const pending = loadPlayerPendingDeletes();
                pending.messages.push({
                    messageId: joinMsg.id,
                    channelId: channel.id,
                    deleteAt: Date.now() + PLAYER_MESSAGE_DELETE_AFTER
                });
                savePlayerPendingDeletes(pending);
                
                // Timer setzen
                setTimeout(async () => {
                    try {
                        await joinMsg.delete();
                        logger.info(`Deleted join message for ${player.name} after 1.5 hours.`);
                        
                        const current = loadPlayerPendingDeletes();
                        current.messages = current.messages.filter(m => m.messageId !== joinMsg.id);
                        savePlayerPendingDeletes(current);
                    } catch (err) {
                        logger.warn(`Failed to delete join message: ${err.message}`);
                    }
                }, PLAYER_MESSAGE_DELETE_AFTER);
            }

            // Leave-Nachrichten senden
            for (const player of left) {
                const adminNote = player.isAdmin ? ' (Admin)' : '';
                const totalPlaytimeSeconds = calculatePlaytime(player.name);
                const totalPlaytime = formatPlaytime(totalPlaytimeSeconds);

                const embed = new EmbedBuilder()
                    .setColor(0xed4245)
                    .setTitle(config.messages.player_left_title)
                    .setDescription(config.messages.player_left_description
                        .replace('{player_name}', player.name)
                        .replace('{admin_note}', adminNote)
                        .replace('{server_name}', serverName)
                        .replace('{total_playtime}', totalPlaytime))
                    .setTimestamp(new Date());

                const leaveMsg = await channel.send({ embeds: [embed] });
                
                // Zur Löschliste hinzufügen
                const pending = loadPlayerPendingDeletes();
                pending.messages.push({
                    messageId: leaveMsg.id,
                    channelId: channel.id,
                    deleteAt: Date.now() + PLAYER_MESSAGE_DELETE_AFTER
                });
                savePlayerPendingDeletes(pending);
                
                // Timer setzen
                setTimeout(async () => {
                    try {
                        await leaveMsg.delete();
                        logger.info(`Deleted leave message for ${player.name} after 1.5 hours.`);
                        
                        const current = loadPlayerPendingDeletes();
                        current.messages = current.messages.filter(m => m.messageId !== leaveMsg.id);
                        savePlayerPendingDeletes(current);
                    } catch (err) {
                        logger.warn(`Failed to delete leave message: ${err.message}`);
                    }
                }, PLAYER_MESSAGE_DELETE_AFTER);
            }
        }

        previousPlayers = currentPlayers;

    } catch (error) {
        logger.warn(`Failed to fetch or parse FS server stats: ${error.message}`);
    }
}

function calculatePlaytime(playerName) {
    const sessionStart = playerSessions[playerName];
    if (!sessionStart) return playtimeData[playerName] || 0;

    const sessionDurationSeconds = Math.floor((Date.now() - sessionStart) / 1000);
    delete playerSessions[playerName];

    if (!playtimeData[playerName]) playtimeData[playerName] = 0;
    playtimeData[playerName] += sessionDurationSeconds;

    savePlaytimeData(playtimeData);

    logger.info(`Updated playtime for ${playerName}: ${playtimeData[playerName]} seconds total.`);
    return playtimeData[playerName];
}

function formatPlaytime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours}h ${minutes}m ${seconds}s`;
}