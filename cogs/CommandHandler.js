// ═══════════════════════════════════════════════════════════
//  COMMAND HANDLER MODULE - FS VERSION
//  With admin-only permissions for setup commands
// ═══════════════════════════════════════════════════════════

const { SlashCommandBuilder, REST, Routes, EmbedBuilder, PermissionsBitField } = require('discord.js');
const { PermissionManager } = require('./PermissionManager');
const { SetupMenus } = require('./SetupMenus');
const { VehicleMenus } = require('./VehicleMenus');
const { StatusChecker } = require('./StatusChecker');
const { IconManager } = require('./IconManager');

class CommandHandler {
    constructor(client, configManager, logger, monitoringManager, messageHandler) {
        this.client = client;
        this.configManager = configManager;
        this.logger = logger;
        this.monitoringManager = monitoringManager;
        this.messageHandler = messageHandler;
        
        // SetupMenus with MessageHandler
        this.setupMenus = new SetupMenus(messageHandler);
        
        // VehicleMenus with MessageHandler
        this.vehicleMenus = new VehicleMenus(messageHandler);
        
        this.commands = [
            // ADMIN-ONLY COMMANDS (hidden from non-admins)
            new SlashCommandBuilder()
                .setName('setup')
                .setDescription('🔧 Interactive setup menu for the bot')
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            
            new SlashCommandBuilder()
                .setName('reload')
                .setDescription('🔄 Reload config and restart monitoring')
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            
            new SlashCommandBuilder()
                .setName('refresh')
                .setDescription('🔄 Delete and recreate status messages')
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            
            new SlashCommandBuilder()
                .setName('checkperms')
                .setDescription('🔐 Check bot permissions in a channel')
                .addChannelOption(option =>
                    option.setName('channel')
                        .setDescription('Channel to check (empty = current channel)')
                        .setRequired(false)
                )
                .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),
            
            // PUBLIC COMMANDS (visible to everyone)
            new SlashCommandBuilder()
                .setName('botinfo')
                .setDescription('📊 Show bot information'),
            
            new SlashCommandBuilder()
                .setName('vehicles')
                .setDescription('🚜 View detailed vehicle information and statistics')
        ];
    }

    async registerCommands() {
        try {
            this.logger.info('Registering slash commands...');
            
            const rest = new REST({ version: '10' }).setToken(this.configManager.globalConfig.token);
            
            const commandData = this.commands.map(cmd => cmd.toJSON());
            
            await rest.put(
                Routes.applicationCommands(this.client.user.id), 
                { body: commandData }
            );
            
            this.logger.success(`✅ ${commandData.length} slash commands registered`);
            this.logger.info(`Commands: ${this.commands.map(c => '/' + c.name).join(', ')}`);
            
            // Wait for Discord to cache commands
            await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (e) {
            this.logger.error(`❌ Command Registration Error: ${e.message}`);
            this.logger.error(e.stack);
        }
    }

    async handle(interaction) {
        try {
            this.logger.info(`Command: /${interaction.commandName} by ${interaction.user.tag}`);
            
            const gcfg = this.configManager.loadGuild(interaction.guildId, interaction.guild.name);
            
            // Check permissions (except for botinfo which is public)
            if (!PermissionManager.hasSetupPerm(interaction.member, gcfg) && interaction.commandName !== 'botinfo') {
                const errorMsg = this.messageHandler
                    ? this.messageHandler.get('commands.errors.noPermission', {}, null, gcfg)
                    : '❌ No permission! You need admin rights or an authorized role.';
                
                return interaction.reply({
                    content: errorMsg,
                    ephemeral: true
                });
            }

            switch (interaction.commandName) {
                case 'setup':
                    await interaction.reply({
                        embeds: [this.setupMenus.createMainMenu(gcfg)],
                        components: [this.setupMenus.createMainMenuSelect(gcfg)],
                        ephemeral: true
                    });
                    this.logger.success(`Setup menu sent to ${interaction.user.tag}`);
                    break;

                case 'reload':
                    this.monitoringManager.startMonitoring(interaction.guildId);
                    
                    const reloadMsg = this.messageHandler
                        ? this.messageHandler.get('commands.reload.success', {}, null, gcfg)
                        : '✅ Config reloaded and monitoring restarted!';
                    
                    await interaction.reply({
                        content: reloadMsg,
                        ephemeral: true
                    });
                    this.logger.success(`Reload executed by ${interaction.user.tag}`);
                    break;

                case 'refresh':
                    await this.handleRefresh(interaction, gcfg);
                    break;

                case 'botinfo':
                    const infoTitle = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.title', {}, null, gcfg)
                        : '🚜 Bot Information';
                    
                    const serversLabel = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.fields.servers', {}, null, gcfg)
                        : '📊 Servers';
                    
                    const guildsLabel = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.fields.guilds', {}, null, gcfg)
                        : '🌐 Guilds';
                    
                    const pingLabel = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.fields.ping', {}, null, gcfg)
                        : '📡 Ping';
                    
                    const versionLabel = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.fields.version', {}, null, gcfg)
                        : '⚡ Version';
                    
                    const footerText = this.messageHandler
                        ? this.messageHandler.get('commands.botinfo.footer', {}, null, gcfg)
                        : 'FS Server Status Bot';
                    
                    const info = new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(infoTitle)
                        .addFields(
                            { name: serversLabel, value: `${gcfg.servers.length}`, inline: true },
                            { name: guildsLabel, value: `${this.client.guilds.cache.size}`, inline: true },
                            { name: pingLabel, value: `${this.client.ws.ping}ms`, inline: true },
                            { name: versionLabel, value: 'v1.0.0 FS', inline: true }
                        )
                        .setFooter({ text: footerText });
                    
                    await interaction.reply({ embeds: [info], ephemeral: true });
                    this.logger.success(`Botinfo sent to ${interaction.user.tag}`);
                    break;

                case 'vehicles':
                    await this.handleVehiclesCommand(interaction, gcfg);
                    break;

                case 'checkperms':
                    const targetChannel = interaction.options.getChannel('channel') || interaction.channel;
                    
                    if (targetChannel.type !== 0) { // 0 = GuildText
                        const errorMsg = this.messageHandler
                            ? this.messageHandler.get('commands.checkperms.errors.notTextChannel', {}, null, gcfg)
                            : '❌ Not a text channel!';
                        
                        return interaction.reply({
                            content: errorMsg,
                            ephemeral: true
                        });
                    }

                    const permCheck = await PermissionManager.checkChannelPerms(targetChannel);
                    const permList = PermissionManager.getPermissionsList(this.messageHandler, gcfg);
                    
                    const permStatus = permList.map(({ flag, name }) => {
                        const bot = targetChannel.guild.members.me;
                        const hasIt = targetChannel.permissionsFor(bot).has(flag);
                        return `${hasIt ? '✅' : '❌'} ${name}`;
                    }).join('\n');

                    const permTitle = permCheck.hasAll
                        ? (this.messageHandler 
                            ? this.messageHandler.get('commands.checkperms.title.allPermissions', {}, null, gcfg)
                            : '✅ All permissions available')
                        : (this.messageHandler
                            ? this.messageHandler.get('commands.checkperms.title.missingPermissions', {}, null, gcfg)
                            : '⚠️ Missing permissions');
                    
                    const permLabel = this.messageHandler
                        ? this.messageHandler.get('commands.checkperms.fields.permissions', {}, null, gcfg)
                        : '📋 Permissions';
                    
                    const permEmbed = new EmbedBuilder()
                        .setColor(permCheck.hasAll ? '#00FF00' : '#FF0000')
                        .setTitle(permTitle)
                        .setDescription(`**Channel:** <#${targetChannel.id}>`)
                        .addFields({
                            name: permLabel,
                            value: permStatus,
                            inline: false
                        });

                    if (!permCheck.hasAll) {
                        const solutionLabel = this.messageHandler
                            ? this.messageHandler.get('commands.checkperms.fields.solution.label', {}, null, gcfg)
                            : '💡 Solution';
                        
                        const solutionText = this.messageHandler
                            ? this.messageHandler.get('commands.checkperms.fields.solution.text', {}, null, gcfg)
                            : 'Go to **Server Settings → Roles** and give the bot the missing permissions.';
                        
                        permEmbed.addFields({
                            name: solutionLabel,
                            value: solutionText,
                            inline: false
                        });
                    }

                    await interaction.reply({ embeds: [permEmbed], ephemeral: true });
                    this.logger.success(`Permissions check in #${targetChannel.name} by ${interaction.user.tag}`);
                    break;
                    
                default:
                    const unknownMsg = this.messageHandler
                        ? this.messageHandler.get('commands.errors.unknownCommand', {}, null, gcfg)
                        : '❌ Unknown command!';
                    
                    await interaction.reply({
                        content: unknownMsg,
                        ephemeral: true
                    });
            }
        } catch (error) {
            this.logger.error(`Command Handler Error: ${error.message}`);
            this.logger.error(error.stack);
            
            let gcfg;
            try {
                gcfg = this.configManager.loadGuild(interaction.guildId, interaction.guild?.name || 'Unknown');
            } catch (e) {
                gcfg = null;
            }
            
            if (!interaction.replied && !interaction.deferred) {
                const errorMsg = this.messageHandler
                    ? this.messageHandler.get('commands.errors.generalError', {}, null, gcfg)
                    : '❌ An error occurred while executing the command!';
                
                await interaction.reply({
                    content: errorMsg,
                    ephemeral: true
                }).catch(() => {});
            }
        }
    }

    async handleRefresh(interaction, gcfg) {
        const { StateManager } = require('./StateManager');
        
        await interaction.deferReply({ ephemeral: true });

        try {
            let deleted = 0;
            let errors = 0;

            for (const srv of gcfg.servers) {
                try {
                    const channel = interaction.guild.channels.cache.get(srv.channelID);
                    if (!channel) {
                        this.logger.warning(`Channel ${srv.channelID} not found for ${srv.serverName}`);
                        errors++;
                        continue;
                    }

                    const stateMgr = new StateManager(interaction.guildId);
                    const state = stateMgr.get(srv.channelID);

                    if (state?.messageID) {
                        try {
                            const msg = await channel.messages.fetch(state.messageID);
                            await msg.delete();
                            deleted++;
                            this.logger.info(`Message deleted for ${srv.serverName}`);
                        } catch (e) {
                            this.logger.verbose(`Message ${state.messageID} already deleted or not found`);
                        }

                        // Clear state so new message will be created
                        stateMgr.state.servers[srv.channelID] = null;
                        stateMgr.save();
                    }
                } catch (e) {
                    this.logger.error(`Refresh error for ${srv.serverName}: ${e.message}`);
                    errors++;
                }
            }

            // Restart monitoring to create new messages
            this.monitoringManager.startMonitoring(interaction.guildId);

            const successMsg = this.messageHandler
                ? this.messageHandler.get('commands.refresh.success', { 
                    deleted, 
                    errors: errors > 0 ? `⚠️ ${errors} errors` : '' 
                  }, null, gcfg)
                : `✅ Refresh completed!\n\n📋 ${deleted} message(s) deleted\n${errors > 0 ? `⚠️ ${errors} errors` : ''}\n\n💡 New messages will be created in a few seconds.`;

            await interaction.editReply({
                content: successMsg
            });

            this.logger.success(`Refresh executed by ${interaction.user.tag}: ${deleted} deleted, ${errors} errors`);
        } catch (e) {
            this.logger.error(`Refresh Error: ${e.message}`);
            
            const errorMsg = this.messageHandler
                ? this.messageHandler.get('commands.refresh.error', {}, null, gcfg)
                : '❌ Error during refresh! See logs for details.';
            
            await interaction.editReply({
                content: errorMsg
            });
        }
    }

    async handleVehiclesCommand(interaction, gcfg) {
        try {
            // Defer reply since fetching data might take a moment
            await interaction.deferReply({ ephemeral: false });

            // Find the server config for this guild
            if (gcfg.servers.length === 0) {
                await interaction.editReply({
                    content: '❌ No servers configured! Use `/setup` to add a server first.'
                });
                return;
            }

            // Use first server (or could add server selection later)
            const srv = gcfg.servers[0];

            // Fetch vehicle data
            const iconMgr = new IconManager(interaction.guildId, this.configManager);
            const data = await StatusChecker.getStatus(srv, iconMgr);

            if (!data.online || !data.vehicles) {
                await interaction.editReply({
                    content: '❌ Server is offline or vehicle data unavailable!'
                });
                return;
            }

            // Get farm names from config
            const farmNames = srv.farmNames || {};

            // Create main menu
            const embed = this.vehicleMenus.createMainMenu(data.vehicles, gcfg);
            const select = this.vehicleMenus.createMainMenuSelect(gcfg);

            // Store vehicle data in client for interaction handler
            if (!this.client.vehicleData) {
                this.client.vehicleData = new Map();
            }
            this.client.vehicleData.set(interaction.user.id, {
                vehicles: data.vehicles,
                farmNames: farmNames,
                guildConfig: gcfg
            });

            await interaction.editReply({
                embeds: [embed],
                components: [select]
            });

            this.logger.success(`/vehicles command used by ${interaction.user.tag}`);

        } catch (error) {
            this.logger.error(`Vehicles Command Error: ${error.message}`);
            this.logger.error(error.stack);

            if (interaction.deferred) {
                await interaction.editReply({
                    content: '❌ An error occurred while fetching vehicle data!'
                });
            } else {
                await interaction.reply({
                    content: '❌ An error occurred while fetching vehicle data!',
                    ephemeral: true
                });
            }
        }
    }
}

module.exports = { CommandHandler };