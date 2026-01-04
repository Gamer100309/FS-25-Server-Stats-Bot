// ═══════════════════════════════════════════════════════════
//  FARMING SIMULATOR SERVER STATUS BOT v1.0 COMPLETE
//  Multi-Guild Support with complete isolation
//  Modular Structure - Main Entry Point
//  Enhanced with FS-specific features
// ═══════════════════════════════════════════════════════════

const { Client, GatewayIntentBits } = require('discord.js');
const { Logger } = require('./cogs/Logger');
const { ConfigManager } = require('./cogs/ConfigManager');
const { MessageHandler } = require('./cogs/MessageHandler');
const { CommandHandler } = require('./cogs/CommandHandler');
const { InteractionHandler } = require('./cogs/InteractionHandler');
const { MonitoringManager } = require('./cogs/MonitoringManager');
const { AlertManager } = require('./cogs/AlertManager');
const { VehicleMenus } = require('./cogs/VehicleMenus');

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

const configManager = new ConfigManager();
const logger = new Logger('./logs', configManager.globalConfig.verboseLogging);
const messageHandler = new MessageHandler();

logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.info('   🚜 FS STATUS BOT v1.0 - MULTI-GUILD');
logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

// Init handlers
const monitoringManager = new MonitoringManager(client, configManager, logger, messageHandler);
const alertManager = new AlertManager(client, configManager, logger, messageHandler);
const commandHandler = new CommandHandler(client, configManager, logger, monitoringManager, messageHandler);
const interactionHandler = new InteractionHandler(client, configManager, logger, monitoringManager, messageHandler);

// ═══════════════════════════════════════════════════════════
//  EVENT HANDLERS
// ═══════════════════════════════════════════════════════════

client.once('ready', async () => {
    logger.success(`✅ Bot online as: ${client.user.tag}`);
    logger.info(`🌐 In ${client.guilds.cache.size} guilds`);
    
    await commandHandler.registerCommands();
    
    // Start monitoring for all guilds
    client.guilds.cache.forEach(guild => {
        const gcfg = configManager.loadGuild(guild.id, guild.name);
        if (gcfg.servers.length > 0) {
            monitoringManager.startMonitoring(guild.id);
        }
    });
    
    // Start alert monitoring
    alertManager.startMonitoring();
    
    logger.success('🚀 All monitoring tasks started!');
});

client.on('interactionCreate', async interaction => {
    try {
        logger.info(`Interaction received: ${interaction.type} - ${interaction.commandName || interaction.customId}`);
        
        if (interaction.isChatInputCommand()) {
            await commandHandler.handle(interaction);
        } else {
            await interactionHandler.handle(interaction);
        }
    } catch (error) {
        logger.error(`Interaction Error: ${error.message}`);
        logger.error(error.stack);
        
        if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({
                content: '❌ An error occurred!',
                ephemeral: true
            }).catch(() => {});
        }
    }
});

client.on('guildCreate', guild => {
    logger.info(`➕ Bot added to new server: ${guild.name}`);
    configManager.loadGuild(guild.id, guild.name);
});

client.on('guildDelete', guild => {
    logger.info(`➖ Bot removed from server: ${guild.name}`);
    monitoringManager.stopMonitoring(guild.id);
});

// ═══════════════════════════════════════════════════════════
//  ERROR HANDLING
// ═══════════════════════════════════════════════════════════

process.on('unhandledRejection', error => {
    logger.error(`Unhandled Rejection: ${error.message}`);
});

process.on('uncaughtException', error => {
    logger.error(`Uncaught Exception: ${error.message}`);
});

client.on('error', error => {
    logger.error(`Client Error: ${error.message}`);
});

// ═══════════════════════════════════════════════════════════
//  LOGIN
// ═══════════════════════════════════════════════════════════

if (configManager.globalConfig.token === "DEIN_BOT_TOKEN") {
    logger.error('❌ ERROR: Bot token not set!');
    logger.error('Please enter your token in global-config.json.');
    process.exit(1);
}

client.login(configManager.globalConfig.token).catch(e => {
    logger.error(`Login error: ${e.message}`);
    logger.error('Check your bot token in global-config.json');
    process.exit(1);
});