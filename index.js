// ═══════════════════════════════════════════════════════════
//  FARMING SIMULATOR SERVER STATUS BOT v1.0 COMPLETE
//  Multi-Guild Support with complete isolation
//  Modular Structure - Main Entry Point
//  Enhanced with FS-specific features
// ═══════════════════════════════════════════════════════════

const { Client, GatewayIntentBits } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { Logger } = require('./cogs/Logger');
const { ConfigManager } = require('./cogs/ConfigManager');
const { MessageHandler } = require('./cogs/MessageHandler');
const { CommandHandler } = require('./cogs/CommandHandler');
const { InteractionHandler } = require('./cogs/InteractionHandler');
const { MonitoringManager } = require('./cogs/MonitoringManager');
const { AlertManager } = require('./cogs/AlertManager');
const { VehicleMenus } = require('./cogs/VehicleMenus');

// ═══════════════════════════════════════════════════════════
// DEBUG Modules
// ═══════════════════════════════════════════════════════════
const debugModules = [];

function loadDebugModules(logger) {
    const config = require('./global-config.json');
    
    if (!config.debugModules || !config.debugModules.enabled) {
        logger.debug('Debug modules: DISABLED', 'general');
        return;
    }
    
    const modulesDir = './cogs/debug-modules';
    
    // Check if directory exists
    if (!fs.existsSync(modulesDir)) {
        logger.warn('Debug modules folder not found - creating...', 'general');
        fs.mkdirSync(modulesDir, { recursive: true });
        logger.info('📁 Created: /cogs/debug-modules/', 'general');
        logger.info('ℹ️  Place debug modules here and enable in config', 'general');
        return;
    }
    
    // Check if empty
    const files = fs.readdirSync(modulesDir).filter(f => f.endsWith('.js'));
    
    if (files.length === 0) {
        logger.info('[DEBUG:MODULES] No debug modules found', 'general');
        return;
    }
    
    // Load modules
    logger.info(`[DEBUG:MODULES] Loading ${files.length} modules...`, 'general');
    
    const requestedModules = config.debugModules.modules || [];
    
    files.forEach(file => {
        const moduleName = file.replace('.js', '');
        
        // Skip if not requested
        if (requestedModules.length > 0 && !requestedModules.includes(moduleName)) {
            logger.debug(`[DEBUG:MODULES] SKIP: ${moduleName} (not in config)`, 'general');
            return;
        }
        
        try {
			const modulePath = path.resolve(__dirname, modulesDir, file);
			const module = require(modulePath);
            debugModules.push({ name: moduleName, module });
            logger.success(`[DEBUG:MODULES] ✅ Loaded: ${moduleName}`, 'general');
        } catch (e) {
            logger.error(`[DEBUG:MODULES] ❌ SKIP: ${moduleName} (${e.message})`, 'general');
            
            if (config.debugModules.stopOnError) {
                throw e;
            }
        }
    });
    
    logger.success(`[DEBUG:MODULES] ${debugModules.length} modules ready!`, 'general');
}

// ═══════════════════════════════════════════════════════════
//  INIT
// ═══════════════════════════════════════════════════════════

const configManager = new ConfigManager();
const gcfg = configManager.globalConfig;
const debugFilters = gcfg.debugFilters || {};
const verboseMode = gcfg.globalSettings?.verboseMode || false;
const debugMode = gcfg.globalSettings?.debugMode || false;
const logger = new Logger('./logs', verboseMode, debugMode, debugFilters);
const messageHandler = new MessageHandler();

loadDebugModules(logger);
global.debugModules = debugModules;

logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.info('   🚜 FS STATUS BOT v1.0 - MULTI-GUILD');
logger.info('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
logger.logConfig();

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