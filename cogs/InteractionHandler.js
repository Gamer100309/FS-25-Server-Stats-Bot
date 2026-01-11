// ═══════════════════════════════════════════════════════════
//  INTERACTION HANDLER MODULE - FULLY MULTILINGUAL
//  Enhanced with Complete Text-System Support
//  All SetupMenus calls updated, all hardcoded texts replaced
// ═══════════════════════════════════════════════════════════

const { 
    EmbedBuilder, 
    ModalBuilder, 
    TextInputBuilder, 
    TextInputStyle, 
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ChannelType 
} = require('discord.js');
const { SetupMenus } = require('./SetupMenus');
const { VehicleMenus } = require('./VehicleMenus');
const { StatusChecker } = require('./StatusChecker');

class InteractionHandler {
    constructor(client, configManager, logger, monitoringManager, messageHandler) {
        this.client = client;
        this.configManager = configManager;
        this.logger = logger;
        this.monitoringManager = monitoringManager;
        this.messageHandler = messageHandler;
		this.vehicleMenus = new VehicleMenus(messageHandler);
		this.setupMenus = new SetupMenus(messageHandler);
		
		if (!client.tempServerData) {
            client.tempServerData = new Map();
        }
        
        // Vehicle Data Map für Session Management
        if (!client.vehicleData) {
            client.vehicleData = new Map();
        }
    }

    /**
     * Validate hex color code
     * @param {string} color - Color to validate (e.g. "#00FF00")
     * @returns {object} { valid: boolean, color: string, error: string }
     */
    validateHexColor(color) {
        // Remove whitespace
        const trimmed = (color || '').trim();
        
        // Check if empty
        if (!trimmed) {
            return { 
                valid: false, 
                color: null, 
                error: 'Color code cannot be empty' 
            };
        }
        
        // Check format: Must start with # and have 6 hex characters
        const hexRegex = /^#[0-9A-Fa-f]{6}$/;
        
        if (!hexRegex.test(trimmed)) {
            // Detailed error message
            let error = 'Invalid hex color code!';
            
            if (!trimmed.startsWith('#')) {
                error += '\n• Must start with #';
            }
            if (trimmed.length !== 7) {
                error += `\n• Must be 7 characters (is ${trimmed.length})`;
            }
            if (!/^[#0-9A-Fa-f]*$/.test(trimmed)) {
                error += '\n• Only 0-9 and A-F allowed';
            }
            
            error += '\n\nExample: #00FF00';
            
            return { 
                valid: false, 
                color: null, 
                error 
            };
        }
        
        // Valid!
        return { 
            valid: true, 
            color: trimmed.toUpperCase(), 
            error: null 
        };
    }

    async handle(interaction) {
        try {
            if (interaction.isStringSelectMenu()) {
                await this.handleSelectMenu(interaction);
            } else if (interaction.isModalSubmit()) {
                await this.handleModal(interaction);
            } else if (interaction.isButton()) {
                await this.handleButton(interaction);
            }
        } catch (e) {
            this.logger.error(`Interaction Error: ${e.message}`);
            if (!interaction.replied && !interaction.deferred) {
                const gcfg = this.configManager.loadGuild(interaction.guildId);
                await interaction.reply({ 
                    content: this.messageHandler
                        ? this.messageHandler.get('errors.interactionError', {}, null, gcfg)
                        : '❌ Ein Fehler ist aufgetreten', 
                    ephemeral: true 
                }).catch(() => {});
            }
        }
    }

    // ═══════════════════════════════════════════════════════════
	//  EMBED FIELDS HANDLER - FS FELDER (Map, Password, Players, Mods)
	// ═══════════════════════════════════════════════════════════

	async handleEmbedFields(interaction, idx, gcfg, page = 1) {
		const srv = gcfg.servers[idx];
		if (!srv.embedSettings) srv.embedSettings = {};
		const s = srv.embedSettings;

		// ═══════════════════════════════════════════════════════════
		// ALLE FELDER DEFINIEREN
		// ═══════════════════════════════════════════════════════════
		
		const allFields = [
			// BASIC FIELDS (16)
			{ key: 'showMap', name: 'map' },
			{ key: 'showVersion', name: 'version' },
			{ key: 'showPasswordField', name: 'passwordField' },
			{ key: 'showPlayers', name: 'players' },
			{ key: 'showPlayerList', name: 'playerList' },
			{ key: 'showMods', name: 'mods' },
			{ key: 'showModList', name: 'modList' },
			{ key: 'showVehicles', name: 'vehicles' },
			{ key: 'showMoney', name: 'money' },
			{ key: 'showDifficulty', name: 'difficulty' },
			{ key: 'showTimeScale', name: 'timeScale' },
			{ key: 'showGreatDemands', name: 'greatDemands' },
			{ key: 'showPlayTime', name: 'playTime' },
			{ key: 'showCurrentDate', name: 'currentDate' },
			{ key: 'showSaveDate', name: 'saveDate' },
			{ key: 'showCreationDate', name: 'creationDate' },
			{ key: 'showGrowthRate', name: 'growthRate' },
			{ key: 'showInitialLoan', name: 'initialLoan' },
			
			// ADVANCED FIELDS (16)
			{ key: 'showFieldJobs', name: 'fieldJobs' },
			{ key: 'showAutoSave', name: 'autoSave' },
			{ key: 'showResetVehicles', name: 'resetVehicles' },
			{ key: 'showTraffic', name: 'traffic' },
			{ key: 'showWeeds', name: 'weeds' },
			{ key: 'showFruitDestruction', name: 'fruitDestruction' },
			{ key: 'showSnow', name: 'snow' },
			{ key: 'showStones', name: 'stones' },
			{ key: 'showFuelUsage', name: 'fuelUsage' },
			{ key: 'showLoan', name: 'loan' },
			{ key: 'showInitialMoney', name: 'initialMoney' },
			{ key: 'showHelperFuel', name: 'helperFuel' },
			{ key: 'showHelperSeeds', name: 'helperSeeds' },
			{ key: 'showHelperFertilizer', name: 'helperFertilizer' },
			{ key: 'showSavegameName', name: 'savegameName' },
			{ key: 'showMapScreenshot', name: 'mapScreenshot' }
		];

		// ═══════════════════════════════════════════════════════════
		// PAGINATION
		// ═══════════════════════════════════════════════════════════
		
		const fieldsPerPage = 12;
		const startIdx = (page - 1) * fieldsPerPage;
		const endIdx = startIdx + fieldsPerPage;
		const fields = allFields.slice(startIdx, endIdx);
		const totalPages = Math.ceil(allFields.length / fieldsPerPage);

		// ═══════════════════════════════════════════════════════════
		// STATISTIK FÜR ALLE FELDER (nicht nur aktuelle Seite)
		// ═══════════════════════════════════════════════════════════
		
		let visibleCount = 0;
		let hiddenCount = 0;

		allFields.forEach(field => {
			if (s[field.key] !== false) {
				visibleCount++;
			} else {
				hiddenCount++;
			}
		});

		const allVisible = visibleCount === allFields.length;
		const allHidden = hiddenCount === allFields.length;

		// ═══════════════════════════════════════════════════════════
		// EMBED MIT STATISTIK
		// ═══════════════════════════════════════════════════════════
		
		const title = this.messageHandler
			? this.messageHandler.get('setup.embedDesign.fields.title', { serverName: srv.serverName }, srv, gcfg)
			: `🎨 ${srv.serverName} - Fields (Page ${page}/${totalPages})`;
		
		const description = this.messageHandler
			? this.messageHandler.get('setup.embedDesign.fields.selectDescription', {}, srv, gcfg)
			: 'Choose a field or toggle all at once:';
		
		const statsLabel = this.messageHandler
			? this.messageHandler.get('setup.embedDesign.fields.stats', {}, srv, gcfg)
			: '📊 Statistics';
		
		const statsValue = this.messageHandler
			? this.messageHandler.get('setup.embedDesign.fields.statsValue', {
				visible: visibleCount,
				hidden: hiddenCount,
				total: allFields.length
			  }, srv, gcfg)
			: `✅ Visible: ${visibleCount}\n❌ Hidden: ${hiddenCount}\n📋 Total: ${allFields.length}\n📄 Page: ${page}/${totalPages}`;

		const embed = new EmbedBuilder()
			.setColor('#FF69B4')
			.setTitle(title)
			.setDescription(description)
			.addFields({
				name: statsLabel,
				value: statsValue,
				inline: false
			});

		// ═══════════════════════════════════════════════════════════
		// DROPDOWN-MENÜ ERSTELLEN
		// ═══════════════════════════════════════════════════════════
		
		const options = [];

		// ALLE ANZEIGEN - nur wenn nicht alle schon sichtbar sind
		if (!allVisible) {
			options.push({
				label: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOn.label', {}, srv, gcfg)
					: 'Show All Fields',
				description: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOn.description', {}, srv, gcfg)
					: 'Make all fields visible',
				value: 'all_on',
				emoji: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOn.emoji', {}, srv, gcfg)
					: '✅'
			});
		}

		// ALLE VERSTECKEN - nur wenn nicht alle schon versteckt sind
		if (!allHidden) {
			options.push({
				label: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOff.label', {}, srv, gcfg)
					: 'Hide All Fields',
				description: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOff.description', {}, srv, gcfg)
					: 'Hide all fields',
				value: 'all_off',
				emoji: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOff.emoji', {}, srv, gcfg)
					: '❌'
			});
		}

		// Separator nur wenn "Alle"-Buttons da sind
		if (options.length > 0) {
			options.push({
				label: '─────────────',
				description: this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.separator', {}, srv, gcfg)
					: `Page ${page}/${totalPages}`,
				value: 'separator'
			});
		}

		// ═══════════════════════════════════════════════════════════
		// EINZELNE FELDER DER AKTUELLEN SEITE
		// ═══════════════════════════════════════════════════════════
		
		fields.forEach(field => {
			const isVisible = s[field.key] !== false;
			
			const statusText = isVisible
				? (this.messageHandler
					? this.messageHandler.get(`setup.embedDesign.fields.${field.name}.visible`, {}, srv, gcfg)
					: '✅ Visible')
				: (this.messageHandler
					? this.messageHandler.get(`setup.embedDesign.fields.${field.name}.hidden`, {}, srv, gcfg)
					: '❌ Hidden');
			
			const label = this.messageHandler
				? this.messageHandler.get(`setup.embedDesign.fields.${field.name}.label`, {}, srv, gcfg)
				: field.name;
			
			const emoji = this.messageHandler
				? this.messageHandler.get(`setup.embedDesign.fields.${field.name}.emoji`, {}, srv, gcfg) || '📋'
				: '📋';

			options.push({
				label: label,
				description: statusText,
				value: field.name,
				emoji: emoji
			});
		});

		// ═══════════════════════════════════════════════════════════
		// NAVIGATION: NEXT PAGE
		// ═══════════════════════════════════════════════════════════
		
		if (page < totalPages) {
			options.push({
				label: 'Next Page →',
				description: `Go to page ${page + 1}/${totalPages}`,
				value: `page_${page + 1}`,
				emoji: '▶️'
			});
		}

		// ═══════════════════════════════════════════════════════════
		// NAVIGATION: PREVIOUS PAGE
		// ═══════════════════════════════════════════════════════════
		
		if (page > 1) {
			options.push({
				label: '← Previous Page',
				description: `Back to page ${page - 1}/${totalPages}`,
				value: `page_${page - 1}`,
				emoji: '◀️'
			});
		}

		// ═══════════════════════════════════════════════════════════
		// ZURÜCK
		// ═══════════════════════════════════════════════════════════
		
		options.push({
			label: this.messageHandler
				? this.messageHandler.get('setup.common.back', {}, srv, gcfg)
				: '← Back',
			value: 'back',
			emoji: '↩️',
			description: 'Return to previous menu'
		});

		const fieldOptions = new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`setup_embed_fields_${idx}`)
					.setPlaceholder(this.messageHandler
						? this.messageHandler.get('setup.embedDesign.fields.placeholder', {}, srv, gcfg)
						: `👁️ Toggle field... (Page ${page}/${totalPages})`)
					.addOptions(options)
			);

		await interaction.update({
			embeds: [embed],
			components: [fieldOptions]
		});
	}

    async refreshSingleServer(guildId, srv) {
        const { StateManager } = require('./StateManager');
        
        try {
            const guild = this.client.guilds.cache.get(guildId);
            if (!guild) return;

            const channel = guild.channels.cache.get(srv.channelID);
            if (!channel) return;

            const stateMgr = new StateManager(guildId);
            const state = stateMgr.get(srv.channelID);

            // Alte Message löschen
            if (state?.messageID) {
                try {
                    const msg = await channel.messages.fetch(state.messageID);
                    await msg.delete();
                    this.logger.info(`Alte Message gelöscht für ${srv.serverName}`);
                } catch (e) {
                    this.logger.verbose(`Message ${state.messageID} bereits gelöscht`);
                }

                // State löschen damit neue Message erstellt wird
                stateMgr.state.servers[srv.channelID] = null;
                stateMgr.save();
            }

            // Monitoring neu starten = erstellt sofort neue Message
            this.monitoringManager.startMonitoring(guildId);

        } catch (e) {
            this.logger.error(`Refresh Error für ${srv.serverName}: ${e.message}`);
        }
    }

    async handleEmbedColors(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];
        const s = srv.embedSettings || {};

        const modalTitle = this.messageHandler
            ? this.messageHandler.get('setup.embedDesign.colors.modalTitle', { serverName: srv.serverName }, srv, gcfg)
            : `🎨 ${srv.serverName} - Farben`;

        const modal = new ModalBuilder()
            .setCustomId(`modal_colors_${idx}`)
            .setTitle(modalTitle);

        const onlineLabel = this.messageHandler
            ? this.messageHandler.get('setup.embedDesign.colors.fields.online.label', {}, srv, gcfg)
            : 'Online Farbe (Hex)';
        
        const offlineLabel = this.messageHandler
            ? this.messageHandler.get('setup.embedDesign.colors.fields.offline.label', {}, srv, gcfg)
            : 'Offline Farbe (Hex)';

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color_online')
                    .setLabel(onlineLabel)
                    .setPlaceholder('#00FF00')
                    .setValue(s.colorOnline || '#00FF00')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color_offline')
                    .setLabel(offlineLabel)
                    .setPlaceholder('#FF0000')
                    .setValue(s.colorOffline || '#FF0000')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }

    async handlePermissionRoles(interaction, gcfg) {
        const roles = interaction.guild.roles.cache
            .filter(r => !r.managed && r.id !== interaction.guildId)
            .sort((a, b) => b.position - a.position)
            .first(25);

        if (roles.length === 0) {
            const title = this.messageHandler
                ? this.messageHandler.get('setup.permissions.roleManagement.noRolesFound.title', {}, null, gcfg)
                : '❌ Keine Rollen gefunden';
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.permissions.roleManagement.noRolesFound.description', {}, null, gcfg)
                : 'Erstelle erst Rollen auf deinem Server!';

            return interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#FF0000')
                    .setTitle(title)
                    .setDescription(description)],
                components: []
            });
        }

        const currentRoles = gcfg.setupPermissions.allowedRoles || [];

        const permittedText = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.permitted', {}, null, gcfg)
            : '✅ Berechtigt';
        
        const notPermittedText = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.notPermitted', {}, null, gcfg)
            : '❌ Nicht berechtigt';

        const roleOptions = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_permissions_role_toggle')
                    .setPlaceholder(this.messageHandler 
                        ? this.messageHandler.get('setup.permissions.roleManagement.placeholder', {}, null, gcfg)
                        : '🎭 Rolle hinzufügen/entfernen...')
                    .setMaxValues(1)
                    .addOptions(roles.map(r => ({
                        label: r.name,
                        description: currentRoles.includes(r.id) ? permittedText : notPermittedText,
                        value: r.id,
                        emoji: currentRoles.includes(r.id) ? '✅' : '❌'
                    })))
            );

        const title = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.title', {}, null, gcfg)
            : '🎭 Berechtigte Rollen';
        
        const description = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.description', {}, null, gcfg)
            : 'Klicke auf eine Rolle um sie hinzuzufügen/zu entfernen:';
        
        const currentRolesLabel = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.currentRoles', {}, null, gcfg)
            : '📋 Aktuell berechtigt';
        
        const noRolesText = this.messageHandler
            ? this.messageHandler.get('setup.permissions.roleManagement.noRoles', {}, null, gcfg)
            : 'Keine Rollen';

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(title)
                .setDescription(description)
                .addFields({
                    name: currentRolesLabel,
                    value: currentRoles.length > 0 ? currentRoles.map(r => `<@&${r}>`).join(', ') : noRolesText,
                    inline: false
                })],
            components: [roleOptions]
        });
    }

    async handleGlobalFooter(interaction, gcfg) {
        const modalTitle = this.messageHandler
            ? this.messageHandler.get('setup.global.footerModal.title', {}, null, gcfg)
            : '📝 Footer-Text ändern';

        const modal = new ModalBuilder()
            .setCustomId('modal_global_footer')
            .setTitle(modalTitle);

        const fieldLabel = this.messageHandler
            ? this.messageHandler.get('setup.global.footerModal.field.label', {}, null, gcfg)
            : 'Footer-Text';
        
        const fieldPlaceholder = this.messageHandler
            ? this.messageHandler.get('setup.global.footerModal.field.placeholder', {}, null, gcfg)
            : 'mcapi.us';

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('footer_text')
                    .setLabel(fieldLabel)
                    .setPlaceholder(fieldPlaceholder)
                    .setValue(gcfg.footerText || 'mcapi.us')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(100)
            )
        );

        await interaction.showModal(modal);
    }

    async handleGlobalColors(interaction, gcfg) {
        const modalTitle = this.messageHandler
            ? this.messageHandler.get('setup.global.colorsModal.title', {}, null, gcfg)
            : '🎨 Standard-Farben ändern';

        const modal = new ModalBuilder()
            .setCustomId('modal_global_colors')
            .setTitle(modalTitle);

        const onlineLabel = this.messageHandler
            ? this.messageHandler.get('setup.global.colorsModal.fields.online.label', {}, null, gcfg)
            : 'Online Farbe (Hex)';
        
        const offlineLabel = this.messageHandler
            ? this.messageHandler.get('setup.global.colorsModal.fields.offline.label', {}, null, gcfg)
            : 'Offline Farbe (Hex)';

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color_online')
                    .setLabel(onlineLabel)
                    .setPlaceholder('#00FF00')
                    .setValue(gcfg.embedColors?.online || '#00FF00')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('color_offline')
                    .setLabel(offlineLabel)
                    .setPlaceholder('#FF0000')
                    .setValue(gcfg.embedColors?.offline || '#FF0000')
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }

    async handleSelectMenu(interaction) {
        const gcfg = this.configManager.loadGuild(interaction.guildId);

        // Main Menu Navigation
        if (interaction.customId === 'setup_main_menu') {
            const category = interaction.values[0];
            
            if (category === 'servers') {
                await interaction.update({
                    embeds: [this.setupMenus.createServerManagementEmbed(gcfg)],
                    components: [this.setupMenus.createServerMenu(gcfg)]
                });
            } else if (category === 'intervals') {
                await interaction.update({
                    embeds: [this.setupMenus.createIntervalsEmbed(gcfg.servers, gcfg)],
                    components: [this.setupMenus.createIntervalsMenu(gcfg.servers, gcfg)]
                });
            } else if (category === 'embed') {
                await interaction.update({
                    embeds: [this.setupMenus.createEmbedDesignEmbed(gcfg.servers, gcfg)],
                    components: [this.setupMenus.createEmbedDesignMenu(gcfg.servers, gcfg)]
                });
            } else if (category === 'buttons') {
                await interaction.update({
                    embeds: [this.setupMenus.createButtonsEmbed(gcfg.servers, gcfg)],
                    components: [this.setupMenus.createButtonsMenu(gcfg.servers, gcfg)]
                });
            } else if (category === 'permissions') {
                await interaction.update({
                    embeds: [this.setupMenus.createPermissionsEmbed(gcfg, gcfg)],
                    components: [this.setupMenus.createPermissionsMenu(gcfg)]
                });
            } else if (category === 'global') {
                await interaction.update({
                    embeds: [this.setupMenus.createGlobalEmbed(gcfg, gcfg)],
                    components: [this.setupMenus.createGlobalMenu(gcfg)]
                });
            } else if (category === 'texts') {
                await this.handleTextsMenu(interaction, gcfg);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
		//  EMBED FIELDS TOGGLE - FS FELDER TOGGLE LOGIC
		//  SUCHE in InteractionHandler.js nach: setup_embed_fields_
		//  ERSETZE den kompletten if-Block
		// ═══════════════════════════════════════════════════════════

		if (interaction.customId.startsWith('setup_embed_fields_')) {
			const idx = parseInt(interaction.customId.split('_')[3]);
			const value = interaction.values[0];
			const srv = gcfg.servers[idx];
			if (!srv.embedSettings) srv.embedSettings = {};
			const s = srv.embedSettings;
			
			// PAGE NAVIGATION
		   if (value.startsWith('page_')) {
			   const newPage = parseInt(value.split('_')[1]);
			   await this.handleEmbedFields(interaction, idx, gcfg, newPage);
			   return;
		   }

		   // SEPARATOR
		   if (value === 'separator') {
			   return;
		   }

			// ═══════════════════════════════════════════════════════════
			// ZURÜCK
			// ═══════════════════════════════════════════════════════════
			if (value === 'back') {
				const title = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.designOptions.title', { serverName: srv.serverName }, srv, gcfg)
					: `🎨 ${srv.serverName} - Design`;
				
				const description = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.designOptions.description', {}, srv, gcfg)
					: 'Was möchtest du ändern?';

				await interaction.update({
					embeds: [new EmbedBuilder()
						.setColor('#FF69B4')
						.setTitle(title)
						.setDescription(description)],
					components: [this.setupMenus.createEmbedOptionsMenu(idx, gcfg)]
				});
				return;
			}

			// ═══════════════════════════════════════════════════════════
			// SEPARATOR AUSGEWÄHLT - FREUNDLICHE NACHRICHT
			// ═══════════════════════════════════════════════════════════
			if (value === 'separator') {
				const title = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.separatorSelected.title', {}, srv, gcfg)
					: 'ℹ️ Nur ein Trenner';
				
				const description = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.separatorSelected.description', {}, srv, gcfg)
					: 'Das ist nur ein optischer Trenner.\n\nBitte wähle ein Feld oder eine der Aktionen darüber.';

				await interaction.reply({
					embeds: [new EmbedBuilder()
						.setColor('#3498DB')
						.setTitle(title)
						.setDescription(description)],
					ephemeral: true
				});
				return;
			}

			// ═══════════════════════════════════════════════════════════
			// ALLE FELDER AKTIVIEREN
			// ═══════════════════════════════════════════════════════════
			if (value === 'all_on') {
                const fields = [
                    // BASIC FIELDS (11)
                    'showMap', 'showVersion', 'showPasswordField', 'showPlayers', 
                    'showPlayerList', 'showMods', 'showVehicles', 'showMoney', 
                    'showDifficulty', 'showTimeScale', 'showGreatDemands',
                    
                    // TIME & DATE FIELDS (4)
                    'showPlayTime', 'showCurrentDate', 'showSaveDate', 'showCreationDate',
                    
                    // GAMEPLAY SETTINGS (10)
                    'showGrowthRate', 'showFieldJobs', 'showAutoSave', 'showResetVehicles',
                    'showTraffic', 'showWeeds', 'showFruitDestruction', 'showSnow',
                    'showStones', 'showFuelUsage',
                    
                    // FINANCIAL FIELDS (2)
                    'showLoan', 'showInitialMoney',
                    
                    // HELPER SETTINGS (3)
                    'showHelperFuel', 'showHelperSeeds', 'showHelperFertilizer',
                    
                    // SAVEGAME INFO (2)
                    'showSavegameName', 'showMapScreenshot'
                ];

                fields.forEach(field => {
                    s[field] = true;
                });

				this.configManager.saveGuild(interaction.guildId, gcfg);
				this.monitoringManager.startMonitoring(interaction.guildId);

				const title = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOn.success.title', {}, srv, gcfg)
					: '✅ Alle Felder aktiviert';
				
				const description = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOn.success.description', { 
						serverName: srv.serverName,
						count: fields.length
					  }, srv, gcfg)
					: `**${srv.serverName}**\n\n**${fields.length} Felder** werden jetzt angezeigt!`;

				// UPDATE mit neuem Menü!
				await this.handleEmbedFields(interaction, idx, gcfg);

				// Zusätzliche Bestätigung als Ephemeral
				await interaction.followUp({
					embeds: [new EmbedBuilder()
						.setColor('#00FF00')
						.setTitle(title)
						.setDescription(description)],
					ephemeral: true
				});

				this.logger.success(`All embed fields enabled for "${srv.serverName}" by ${interaction.user.tag}`);
				return;
			}

			// ═══════════════════════════════════════════════════════════
			// ALLE FELDER DEAKTIVIEREN
			// ═══════════════════════════════════════════════════════════
			if (value === 'all_off') {
                const fields = [
                    // BASIC FIELDS (11)
                    'showMap', 'showVersion', 'showPasswordField', 'showPlayers', 
                    'showPlayerList', 'showMods', 'showVehicles', 'showMoney', 
                    'showDifficulty', 'showTimeScale', 'showGreatDemands',
                    
                    // TIME & DATE FIELDS (4)
                    'showPlayTime', 'showCurrentDate', 'showSaveDate', 'showCreationDate',
                    
                    // GAMEPLAY SETTINGS (10)
                    'showGrowthRate', 'showFieldJobs', 'showAutoSave', 'showResetVehicles',
                    'showTraffic', 'showWeeds', 'showFruitDestruction', 'showSnow',
                    'showStones', 'showFuelUsage',
                    
                    // FINANCIAL FIELDS (2)
                    'showLoan', 'showInitialMoney',
                    
                    // HELPER SETTINGS (3)
                    'showHelperFuel', 'showHelperSeeds', 'showHelperFertilizer',
                    
                    // SAVEGAME INFO (2)
                    'showSavegameName', 'showMapScreenshot'
                ];

                fields.forEach(field => {
                    s[field] = false;
                });

				this.configManager.saveGuild(interaction.guildId, gcfg);
				this.monitoringManager.startMonitoring(interaction.guildId);

				const title = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOff.success.title', {}, srv, gcfg)
					: '❌ Alle Felder deaktiviert';
				
				const description = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.allOff.success.description', { 
						serverName: srv.serverName,
						count: fields.length
					  }, srv, gcfg)
					: `**${srv.serverName}**\n\n**${fields.length} Felder** wurden ausgeblendet!`;

				// UPDATE mit neuem Menü!
				await this.handleEmbedFields(interaction, idx, gcfg);

				// Zusätzliche Bestätigung als Ephemeral
				await interaction.followUp({
					embeds: [new EmbedBuilder()
						.setColor('#FFA500')
						.setTitle(title)
						.setDescription(description)],
					ephemeral: true
				});

				this.logger.success(`All embed fields disabled for "${srv.serverName}" by ${interaction.user.tag}`);
				return;
			}

			// ═══════════════════════════════════════════════════════════
			// EINZELNES FELD TOGGLE
			// ═══════════════════════════════════════════════════════════
			const fieldMap = {
                // BASIC FIELDS (11)
                'map': 'showMap',
                'version': 'showVersion',
                'passwordField': 'showPasswordField',
                'players': 'showPlayers',
                'playerList': 'showPlayerList',
                'mods': 'showMods',
                'vehicles': 'showVehicles',
                'money': 'showMoney',
                'difficulty': 'showDifficulty',
                'timeScale': 'showTimeScale',
                'greatDemands': 'showGreatDemands',
                
                // TIME & DATE FIELDS (4)
                'playTime': 'showPlayTime',
                'currentDate': 'showCurrentDate',
                'saveDate': 'showSaveDate',
                'creationDate': 'showCreationDate',
                
                // GAMEPLAY SETTINGS (10)
                'growthRate': 'showGrowthRate',
                'fieldJobs': 'showFieldJobs',
                'autoSave': 'showAutoSave',
                'resetVehicles': 'showResetVehicles',
                'traffic': 'showTraffic',
                'weeds': 'showWeeds',
                'fruitDestruction': 'showFruitDestruction',
                'snow': 'showSnow',
                'stones': 'showStones',
                'fuelUsage': 'showFuelUsage',
                
                // FINANCIAL FIELDS (2)
                'loan': 'showLoan',
                'initialMoney': 'showInitialMoney',
                
                // HELPER SETTINGS (3)
                'helperFuel': 'showHelperFuel',
                'helperSeeds': 'showHelperSeeds',
                'helperFertilizer': 'showHelperFertilizer',
                
                // SAVEGAME INFO (2)
                'savegameName': 'showSavegameName',
                'mapScreenshot': 'showMapScreenshot'
            };


			const settingKey = fieldMap[value];
			if (settingKey) {
				// Toggle field
				const wasVisible = s[settingKey] !== false;
				s[settingKey] = !wasVisible;
				const nowVisible = !wasVisible;

				this.configManager.saveGuild(interaction.guildId, gcfg);
				this.monitoringManager.startMonitoring(interaction.guildId);

				// Get field name for display
				const fieldName = this.messageHandler
					? this.messageHandler.get(`setup.embedDesign.fields.${value}.label`, {}, srv, gcfg)
					: value;

				const title = this.messageHandler
					? this.messageHandler.get('setup.embedDesign.fields.toggled.title', {}, srv, gcfg)
					: '✅ Feld umgeschaltet';
				
				const description = nowVisible
					? (this.messageHandler
						? this.messageHandler.get('setup.embedDesign.fields.toggled.shown', { fieldName }, srv, gcfg)
						: `**${fieldName}** wird jetzt **angezeigt**`)
					: (this.messageHandler
						? this.messageHandler.get('setup.embedDesign.fields.toggled.hidden', { fieldName }, srv, gcfg)
						: `**${fieldName}** wird jetzt **ausgeblendet**`);

				// UPDATE mit neuem Menü!
				await this.handleEmbedFields(interaction, idx, gcfg);

				// Zusätzliche Bestätigung als Ephemeral
				await interaction.followUp({
					embeds: [new EmbedBuilder()
						.setColor(nowVisible ? '#00FF00' : '#FFA500')
						.setTitle(title)
						.setDescription(description)],
					ephemeral: true
				});

				this.logger.success(`Field "${value}" ${nowVisible ? 'enabled' : 'disabled'} for "${srv.serverName}" by ${interaction.user.tag}`);
				return;
			}
		}
		
		// ═══════════════════════════════════════════════════════════
		// PASSWORD SETTINGS TOGGLE HANDLER
		// FÜGE IN handleSelectMenu EIN (nach Field Toggle Handler):
		// ═══════════════════════════════════════════════════════════

				if (interaction.customId.startsWith('setup_password_settings_')) {
					const idx = parseInt(interaction.customId.split('_')[3]);
					const value = interaction.values[0];
					const srv = gcfg.servers[idx];
					if (!srv.embedSettings) srv.embedSettings = {};
					const s = srv.embedSettings;

					if (value === 'back') {
						await this.handleEmbedFields(interaction, idx, gcfg);
						return;
					}

					if (value === 'toggle_field') {
						s.showPasswordField = !(s.showPasswordField !== false);
					} else if (value === 'toggle_reveal') {
						s.revealPasswordText = !s.revealPasswordText;
					}

					this.configManager.saveGuild(interaction.guildId, gcfg);
					this.monitoringManager.startMonitoring(interaction.guildId);

					// Refresh menu with feedback
					const action = value === 'toggle_field' 
						? (s.showPasswordField ? 'Field shown' : 'Field hidden')
						: (s.revealPasswordText ? 'Password reveals as spoiler' : 'Password shows as Yes/No');
					
					await this.handlePasswordSettings(interaction, idx, gcfg, action);
					return;
				}


        // ═══════════════════════════════════════════════════════════
        // PERMISSION ROLE TOGGLE
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_permissions_role_toggle') {
            const roleId = interaction.values[0];

            if (!gcfg.setupPermissions.allowedRoles) {
                gcfg.setupPermissions.allowedRoles = [];
            }

            const idx = gcfg.setupPermissions.allowedRoles.indexOf(roleId);

            // Toggle durchführen
            const wasAdded = idx === -1;
            if (idx > -1) {
                gcfg.setupPermissions.allowedRoles.splice(idx, 1);
            } else {
                gcfg.setupPermissions.allowedRoles.push(roleId);
            }

            this.configManager.saveGuild(interaction.guildId, gcfg);

            const action = wasAdded ? 'hinzugefügt' : 'entfernt';
            const title = this.messageHandler
                ? this.messageHandler.get(wasAdded ? 'setup.permissions.roleToggled.titleAdded' : 'setup.permissions.roleToggled.titleRemoved', {}, null, gcfg)
                : `✅ Rolle ${action}`;
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.permissions.roleToggled.description', { roleId, action }, null, gcfg)
                : `<@&${roleId}> wurde ${action}!`;
            
            const accessLabel = this.messageHandler
                ? this.messageHandler.get('setup.permissions.roleToggled.accessList', {}, null, gcfg)
                : '📋 Setup-Zugriff haben:';
            
            const adminsText = this.messageHandler
                ? this.messageHandler.get('setup.permissions.roleToggled.admins', {}, null, gcfg)
                : '👑 **Alle Administratoren**';
            
            const additionalRoles = gcfg.setupPermissions.allowedRoles.length > 0
                ? (this.messageHandler
                    ? this.messageHandler.get('setup.permissions.roleToggled.additionalRoles', { 
                        roles: gcfg.setupPermissions.allowedRoles.map(r => `<@&${r}>`).join(', ')
                      }, null, gcfg)
                    : `\n🎭 **Zusätzliche Rollen:** ${gcfg.setupPermissions.allowedRoles.map(r => `<@&${r}>`).join(', ')}`)
                : '';

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor(wasAdded ? '#00FF00' : '#FF0000')
                    .setTitle(title)
                    .setDescription(description)
                    .addFields({
                        name: accessLabel,
                        value: `${adminsText}${additionalRoles}`,
                        inline: false
                    })],
                components: []
            });
            return;
        }

        // Server Management Actions
        if (interaction.customId === 'setup_servers_action') {
            await this.handleServerAction(interaction, gcfg);
            return;
        }

        // Server Selection for Edit
        if (interaction.customId === 'select_server_edit') {
            await this.handleServerEdit(interaction, gcfg);
            return;
        }

        // Server Selection for Delete
        if (interaction.customId === 'select_server_delete') {
            await this.handleServerDelete(interaction, gcfg);
            return;
        }
		
		// Server Edit Options
        if (interaction.customId.startsWith('setup_server_edit_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            const value = interaction.values[0];

            if (value === 'back') {
                // Back to server management
                await interaction.update({
                    embeds: [this.setupMenus.createServerManagementEmbed(gcfg)],
                    components: [this.setupMenus.createServerMenu(gcfg)]
                });
                return;
            }

            if (value === 'basis_info') {
                await this.handleBasisInfoModal(interaction, idx, gcfg);
                return;
            }

            if (value === 'weitere_links') {
                await this.handleWeitereLinksModal(interaction, idx, gcfg);
                return;
            }
			
			if (value === 'server_password') {
                await this.handleServerPasswordModal(interaction, idx, gcfg);
                return;
            }

            if (value === 'farm_names') {
                await this.handleFarmNamesMenu(interaction, idx, gcfg);
                return;
            }
        }

        // Farm Names Select
        if (interaction.customId.startsWith('setup_farm_rename_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            const value = interaction.values[0];

            if (value === 'back') {
                await this.handleServerEditMenu(interaction, idx, gcfg);
                return;
            }

            const farmId = value;
            await this.handleFarmRenameModal(interaction, idx, farmId, gcfg);
            return;
        }

        // Farm Names Back (when no farms)
        if (interaction.customId.startsWith('setup_farm_names_back_')) {
            const idx = parseInt(interaction.customId.split('_')[4]);
            await this.handleServerEditMenu(interaction, idx, gcfg);
            return;
        }

        // Channel Selection
        if (interaction.customId === 'select_channel') {
            await this.handleChannelSelect(interaction, gcfg);
            return;
        }
		
		// Monitoring Toggle
        if (interaction.customId === 'setup_monitoring_select' || interaction.customId === 'setup_monitoring_back') {
            const value = interaction.values[0];
            
            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createServerManagementEmbed(gcfg)],
                    components: [this.setupMenus.createServerMenu(gcfg)]
                });
                return;
            }

        // SEPARATOR AUSGEWÄHLT - FREUNDLICHE NACHRICHT
		if (value === 'separator') {
			const title = this.messageHandler
				? this.messageHandler.get('setup.serverManagement.toggle.separatorSelected.title', {}, null, gcfg)
				: 'ℹ️ Nur ein Trenner';
			
			const description = this.messageHandler
				? this.messageHandler.get('setup.serverManagement.toggle.separatorSelected.description', {}, null, gcfg)
				: 'Das ist nur ein optischer Trenner.\n\nBitte wähle einen Server oder eine der Aktionen darüber.';

			await interaction.reply({
				embeds: [new EmbedBuilder()
					.setColor('#3498DB')
					.setTitle(title)
					.setDescription(description)],
				ephemeral: true
			});
			return;
		}

            // ALLE AKTIVIEREN
            if (value === 'all_on') {
                let count = 0;
                gcfg.servers.forEach(srv => {
                    if (srv.monitoringEnabled === false) {
                        srv.monitoringEnabled = true;
                        count++;
                    }
                });

                this.configManager.saveGuild(interaction.guildId, gcfg);
                this.monitoringManager.startMonitoring(interaction.guildId);

                const title = this.messageHandler
                    ? this.messageHandler.get('setup.serverManagement.toggle.allOn.success.title', {}, null, gcfg)
                    : '✅ Alle Server aktiviert';
                
                const description = this.messageHandler
                    ? this.messageHandler.get('setup.serverManagement.toggle.allOn.success.description', { count }, null, gcfg)
                    : `**${count} Server** wurden aktiviert!\n\n✅ Monitoring läuft für alle Server.`;

                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#00FF00')
                        .setTitle(title)
                        .setDescription(description)],
                    components: []
                });

                this.logger.success(`All monitoring enabled (${count} servers) by ${interaction.user.tag}`);
                return;
            }

            // ALLE DEAKTIVIEREN
            if (value === 'all_off') {
                let count = 0;
                gcfg.servers.forEach(srv => {
                    if (srv.monitoringEnabled !== false) {
                        srv.monitoringEnabled = false;
                        count++;
                    }
                });

                this.configManager.saveGuild(interaction.guildId, gcfg);
                this.monitoringManager.startMonitoring(interaction.guildId);

                const title = this.messageHandler
                    ? this.messageHandler.get('setup.serverManagement.toggle.allOff.success.title', {}, null, gcfg)
                    : '⏸️ Alle Server deaktiviert';
                
                const description = this.messageHandler
                    ? this.messageHandler.get('setup.serverManagement.toggle.allOff.success.description', { count }, null, gcfg)
                    : `**${count} Server** wurden pausiert!\n\n⏸️ Monitoring ist für alle Server gestoppt.`;

                await interaction.update({
                    embeds: [new EmbedBuilder()
                        .setColor('#FFA500')
                        .setTitle(title)
                        .setDescription(description)],
                    components: []
                });

                this.logger.success(`All monitoring disabled (${count} servers) by ${interaction.user.tag}`);
                return;
            }

            // EINZELNER SERVER
            const idx = parseInt(value);
            const srv = gcfg.servers[idx];
            
            // Toggle monitoring
            srv.monitoringEnabled = !(srv.monitoringEnabled !== false);
            
            this.configManager.saveGuild(interaction.guildId, gcfg);
            this.monitoringManager.startMonitoring(interaction.guildId);
            
            const title = srv.monitoringEnabled
                ? this.messageHandler.get('setup.serverManagement.toggle.enabled.title', {}, srv, gcfg)
                : this.messageHandler.get('setup.serverManagement.toggle.disabled.title', {}, srv, gcfg);
            
            const description = srv.monitoringEnabled
                ? this.messageHandler.get('setup.serverManagement.toggle.enabled.description', { serverName: srv.serverName }, srv, gcfg)
                : this.messageHandler.get('setup.serverManagement.toggle.disabled.description', { serverName: srv.serverName }, srv, gcfg);
            
            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor(srv.monitoringEnabled ? '#00FF00' : '#FFA500')
                    .setTitle(title)
                    .setDescription(description)],
                components: []
            });
            
            this.logger.success(`Monitoring for "${srv.serverName}" ${srv.monitoringEnabled ? 'enabled' : 'disabled'} by ${interaction.user.tag}`);
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // UPDATE INTERVALS
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_intervals_select' || interaction.customId === 'setup_intervals_back') {
            const value = interaction.values[0];
            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createMainMenu(gcfg)],
                    components: [this.setupMenus.createMainMenuSelect(gcfg)]
                });
                return;
            }

            const idx = parseInt(value);
            const srv = gcfg.servers[idx];
            const currentInterval = (srv.updateInterval || 10000) / 1000;

            const title = this.messageHandler
                ? this.messageHandler.get('setup.intervals.changeTitle', { serverName: srv.serverName }, srv, gcfg)
                : `⏱️ ${srv.serverName} - Intervall ändern`;
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.intervals.changeDescription', { interval: currentInterval }, srv, gcfg)
                : `Aktuell: **${currentInterval}s**\n\nWähle ein neues Update-Intervall:`;
            
            const recommendationLabel = this.messageHandler
                ? this.messageHandler.get('setup.intervals.recommendation', {}, srv, gcfg)
                : '💡 Empfehlung';
            
            const recommendationText = this.messageHandler
                ? this.messageHandler.get('setup.intervals.recommendationText', {}, srv, gcfg)
                : '10 Sekunden ist optimal für die meisten Server.\nKürzere Intervalle erhöhen die Serverlast.';

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#FFA500')
                    .setTitle(title)
                    .setDescription(description)
                    .addFields({
                        name: recommendationLabel,
                        value: recommendationText,
                        inline: false
                    })],
                components: [this.setupMenus.createIntervalOptionsMenu(idx, gcfg)]
            });
            return;
        }

        if (interaction.customId.startsWith('setup_interval_set_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            const value = interaction.values[0];

            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createIntervalsEmbed(gcfg.servers, gcfg)],
                    components: [this.setupMenus.createIntervalsMenu(gcfg.servers, gcfg)]
                });
                return;
            }

            const newInterval = parseInt(value);
            gcfg.servers[idx].updateInterval = newInterval;
            this.configManager.saveGuild(interaction.guildId, gcfg);
            this.monitoringManager.startMonitoring(interaction.guildId);

            const title = this.messageHandler
                ? this.messageHandler.get('setup.intervals.success.title', {}, null, gcfg)
                : '✅ Intervall aktualisiert';
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.intervals.success.description', { 
                    serverName: gcfg.servers[idx].serverName,
                    interval: newInterval / 1000
                  }, null, gcfg)
                : `**${gcfg.servers[idx].serverName}**\nNeues Intervall: **${newInterval / 1000}s**`;
            
            const footer = this.messageHandler
                ? this.messageHandler.get('setup.intervals.success.footer', {}, null, gcfg)
                : 'Monitoring wurde neu gestartet!';

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(title)
                    .setDescription(description)
                    .setFooter({ text: footer })],
                components: []
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // EMBED DESIGN
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_embed_select' || interaction.customId === 'setup_embed_back') {
            const value = interaction.values[0];
            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createMainMenu(gcfg)],
                    components: [this.setupMenus.createMainMenuSelect(gcfg)]
                });
                return;
            }

            const idx = parseInt(value);
            const title = this.messageHandler
                ? this.messageHandler.get('setup.embedDesign.designOptions.title', { serverName: gcfg.servers[idx].serverName }, null, gcfg)
                : `🎨 ${gcfg.servers[idx].serverName} - Design`;
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.embedDesign.designOptions.description', {}, null, gcfg)
                : 'Was möchtest du ändern?';

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#FF69B4')
                    .setTitle(title)
                    .setDescription(description)],
                components: [this.setupMenus.createEmbedOptionsMenu(idx, gcfg)]
            });
            return;
        }

        if (interaction.customId.startsWith('setup_embed_option_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            const value = interaction.values[0];

            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createEmbedDesignEmbed(gcfg.servers, gcfg)],
                    components: [this.setupMenus.createEmbedDesignMenu(gcfg.servers, gcfg)]
                });
                return;
            }

            if (value === 'fields') {
                await this.handleEmbedFields(interaction, idx, gcfg);
            } else if (value === 'colors') {
                await this.handleEmbedColors(interaction, idx, gcfg);
            } else if (value === 'password') {
                // NEU: Password Settings
                await this.handlePasswordSettings(interaction, idx, gcfg);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // BUTTONS
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_buttons_select' || interaction.customId === 'setup_buttons_back') {
            const value = interaction.values[0];
            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createMainMenu(gcfg)],
                    components: [this.setupMenus.createMainMenuSelect(gcfg)]
                });
                return;
            }

            const idx = parseInt(value);
            const srv = gcfg.servers[idx];

            const title = this.messageHandler
                ? this.messageHandler.get('setup.buttons.options.title', { serverName: srv.serverName }, srv, gcfg)
                : `🔘 ${srv.serverName} - Buttons`;
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.buttons.options.description', {}, srv, gcfg)
                : 'Konfiguriere die interaktiven Buttons:';

            await interaction.update({
                embeds: [new EmbedBuilder()
                    .setColor('#5865F2')
                    .setTitle(title)
                    .setDescription(description)],
                components: [this.setupMenus.createButtonOptionsMenu(idx, srv, gcfg)]
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════
		//  BUTTON TOGGLE HANDLER - NUR PLAYERS BUTTON OPTION
		//  SUCHE in InteractionHandler.js nach: setup_button_toggle_
		//  ERSETZE den kompletten if-Block
		// ═══════════════════════════════════════════════════════════

		if (interaction.customId.startsWith('setup_button_toggle_')) {
			const idx = parseInt(interaction.customId.split('_')[3]);
			const value = interaction.values[0];
			const srv = gcfg.servers[idx];

			if (value === 'back') {
				await interaction.update({
					embeds: [this.setupMenus.createButtonsEmbed(gcfg.servers, gcfg)],
					components: [this.setupMenus.createButtonsMenu(gcfg.servers, gcfg)]
				});
				return;
			}

			if (!srv.buttonSettings) srv.buttonSettings = {};

			// ═══════════════════════════════════════════════════════════
			// NUR TOGGLE UND PLAYERS - IP/PORT ENTFERNT!
			// ═══════════════════════════════════════════════════════════

			if (value === 'toggle') {
				srv.buttonSettings.enabled = !(srv.buttonSettings.enabled !== false);
			} else if (value === 'players') {
				srv.buttonSettings.showPlayersButton = !(srv.buttonSettings.showPlayersButton !== false);
			}
			// IP und PORT Buttons wurden entfernt!

			this.configManager.saveGuild(interaction.guildId, gcfg);
			this.monitoringManager.startMonitoring(interaction.guildId);

			const title = this.messageHandler
				? this.messageHandler.get('setup.buttons.options.success.title', {}, srv, gcfg)
				: '✅ Button Settings Updated';
			
			const description = this.messageHandler
				? this.messageHandler.get('setup.buttons.options.success.description', { serverName: srv.serverName }, srv, gcfg)
				: `**${srv.serverName}**\nChanges have been saved!`;

			await interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#00FF00')
					.setTitle(title)
					.setDescription(description)],
				components: []
			});
			return;
		}

        // ═══════════════════════════════════════════════════════════
        // PERMISSIONS
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_permissions_action') {
            const value = interaction.values[0];

            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createMainMenu(gcfg)],
                    components: [this.setupMenus.createMainMenuSelect(gcfg)]
                });
                return;
            }

            if (value === 'roles') {
                await this.handlePermissionRoles(interaction, gcfg);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // GLOBAL SETTINGS
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_global_action') {
            const value = interaction.values[0];

            if (value === 'back') {
                await interaction.update({
                    embeds: [this.setupMenus.createMainMenu(gcfg)],
                    components: [this.setupMenus.createMainMenuSelect(gcfg)]
                });
                return;
            }

            if (value === 'footer') {
                await this.handleGlobalFooter(interaction, gcfg);
            } else if (value === 'colors') {
                await this.handleGlobalColors(interaction, gcfg);
            }
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // TEXT-SYSTEM HANDLER
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'setup_texts_action') {
            await this.handleTextsAction(interaction, gcfg);
            return;
        }

        if (interaction.customId === 'setup_global_language_select') {
            await this.handleGlobalLanguageSelect(interaction, gcfg);
            return;
        }

        if (interaction.customId === 'setup_server_language_select' || interaction.customId === 'setup_server_language_back') {
            await this.handleServerLanguageSelect(interaction, gcfg);
            return;
        }

        if (interaction.customId.startsWith('setup_server_language_change_')) {
            await this.handleServerLanguageChange(interaction, gcfg);
            return;
        }
		
		// ═══════════════════════════════════════════════════════════
        // Vehicle-SYSTEM HANDLER
        // ═══════════════════════════════════════════════════════════
		
		if (interaction.customId === 'vehicles_main_menu') {
			await this.handleVehicleMainMenu(interaction, gcfg);
			return;
		}

		if (interaction.customId === 'vehicles_farm_select') {
			await this.handleVehicleFarmSelect(interaction, gcfg);
			return;
		}

		if (interaction.customId.startsWith('vehicles_back_')) {
			await this.handleVehicleBack(interaction, gcfg);
			return;
		}
    }

    async handleServerAction(interaction, gcfg) {
		const action = interaction.values[0];

		if (action === 'back') {
			await interaction.update({
				embeds: [this.setupMenus.createMainMenu(gcfg)],
				components: [this.setupMenus.createMainMenuSelect(gcfg)]
			});
			return;
		}

		if (action === 'add') {
            const modal = new ModalBuilder()
                .setCustomId('modal_add_server')
                .setTitle('➕ FS Server hinzufügen');

            modal.addComponents(
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('server_name')
                        .setLabel('Server Name (Pflicht)')
                        .setPlaceholder('Mein FS25 Server')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('stats_url')
                        .setLabel('Stats XML URL (Pflicht)')
                        .setPlaceholder('http://ip:8080/feed/dedicated-server-stats.xml')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(true)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('career_url')
                        .setLabel('Career Savegame URL (Optional)')
                        .setPlaceholder('http://ip:8080/feed/careerSavegame.html?code=...')
                        .setStyle(TextInputStyle.Short)
                        .setRequired(false)
                ),
                new ActionRowBuilder().addComponents(
                    new TextInputBuilder()
                        .setCustomId('info_hint')
                        .setLabel('ℹ️ Weitere URLs hinzufügen')
                        .setValue('Nach dem Hinzufügen: /setup → Server bearbeiten → Weitere Links')
                        .setStyle(TextInputStyle.Paragraph)
                        .setRequired(false)
                )
            );

            await interaction.showModal(modal);
            return;
        }

		if (action === 'edit') {
			if (gcfg.servers.length === 0) {
				return interaction.reply({
					content: '❌ No servers available! Add a server first.',
					ephemeral: true
				});
			}

			const select = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('select_server_edit')
						.setPlaceholder('🖊️ Select server to edit...')
						.addOptions(gcfg.servers.map((s, i) => ({
							label: s.serverName,
							description: `Stats: ${s.stats_url.substring(0, 50)}...`,
							value: `${i}`,
							emoji: '🚜'
						})))
				);

			await interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#FFA500')
					.setTitle('✏️ Edit Server')
					.setDescription('Choose the server you want to edit:')],
				components: [select]
			});
			return;
		}

		if (action === 'delete') {
			if (gcfg.servers.length === 0) {
				return interaction.reply({
					content: '❌ No servers available!',
					ephemeral: true
				});
			}

			const select = new ActionRowBuilder()
				.addComponents(
					new StringSelectMenuBuilder()
						.setCustomId('select_server_delete')
						.setPlaceholder('🗑️ Select server to delete...')
						.addOptions(gcfg.servers.map((s, i) => ({
							label: s.serverName,
							description: `Stats: ${s.stats_url.substring(0, 50)}...`,
							value: `${i}`,
							emoji: '🚜'
						})))
				);

			await interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle('🗑️ Delete Server')
					.setDescription('⚠️ Choose the server you want to remove:')],
				components: [select]
			});
			return;
		}
		
		if (action === 'toggle') {
			await interaction.update({
				embeds: [this.setupMenus.createMonitoringToggleEmbed(gcfg.servers, gcfg)],
				components: [this.setupMenus.createMonitoringToggleMenu(gcfg.servers, gcfg)]
			});
			return;
		}
	}

    async handleServerEdit(interaction, gcfg) {
        const idx = parseInt(interaction.values[0]);
        const srv = gcfg.servers[idx];
        
        // Zeige Untermenü mit 3 Optionen
        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`✏️ ${srv.serverName}`)
                .setDescription(this.messageHandler 
                    ? this.messageHandler.get('setup.serverEdit.description', {}, srv, gcfg)
                    : 'Was möchtest du bearbeiten?')],
            components: [this.setupMenus.createServerEditOptionsMenu(idx, srv, gcfg)]
        });
    }

	async handleEditServerModal(interaction, gcfg) {
		const idx = parseInt(interaction.customId.split('_')[3]);
		const srv = gcfg.servers[idx];

		srv.serverName = interaction.fields.getTextInputValue('server_name');
		srv.stats_url = interaction.fields.getTextInputValue('stats_url');
		srv.career_savegame_url = interaction.fields.getTextInputValue('career_url') || '';
		srv.mod_list_url = interaction.fields.getTextInputValue('mod_list_url') || '';

		this.configManager.saveGuild(interaction.guildId, gcfg);
		this.monitoringManager.startMonitoring(interaction.guildId);

		const title = '✅ Server Updated';

		await interaction.reply({
			embeds: [new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle(title)
				.addFields(
					{ name: '🚜 Name', value: srv.serverName, inline: true },
					{ name: '🔗 Stats URL', value: `\`${srv.stats_url.substring(0, 50)}...\``, inline: false }
				)],
			ephemeral: true
		});
	}

    async handleServerDelete(interaction, gcfg) {
        const idx = parseInt(interaction.values[0]);
        const srv = gcfg.servers[idx];

        // Server aus Config entfernen
        gcfg.servers.splice(idx, 1);
        this.configManager.saveGuild(interaction.guildId, gcfg);
        
        // Alte Status-Message löschen falls vorhanden
        const { StateManager } = require('./StateManager');
        const stateMgr = new StateManager(interaction.guildId);
        const state = stateMgr.get(srv.channelID);
        
        if (state?.messageID) {
            try {
                const channel = interaction.guild.channels.cache.get(srv.channelID);
                if (channel) {
                    const msg = await channel.messages.fetch(state.messageID);
                    await msg.delete();
                    this.logger.info(`Status-Message gelöscht für ${srv.serverName}`);
                }
            } catch (e) {
                this.logger.verbose(`Message ${state.messageID} konnte nicht gelöscht werden: ${e.message}`);
            }
            
            // State entfernen
            delete stateMgr.state.servers[srv.channelID];
            stateMgr.save();
        }
        
        // Monitoring neu starten (ohne den gelöschten Server)
        this.monitoringManager.startMonitoring(interaction.guildId);

        const title = this.messageHandler
            ? this.messageHandler.get('setup.serverManagement.delete.success.title', {}, null, gcfg)
            : '✅ Server gelöscht';
        
        const description = this.messageHandler
            ? this.messageHandler.get('setup.serverManagement.delete.success.description', { serverName: srv.serverName }, null, gcfg)
            : `Server **${srv.serverName}** wurde entfernt.\n\n✅ Status-Message wurde gelöscht`;

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(title)
                .setDescription(description)],
            components: []
        });
    }

    async handleChannelSelect(interaction, gcfg) {
		const channelId = interaction.values[0];
		
		const userId = interaction.user.id;
		
		const tempData = this.client.tempServerData.get(userId);
		if (!tempData) {
			this.logger.error(`Temp data not found for user ${userId}`);
			
			const title = '❌ Session Expired';
			const description = 'Your session has expired. Please start again with `/setup`';

			return interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle(title)
					.setDescription(description)
					.addFields({
						name: '💡 Tip',
						value: 'Try to be faster or restart the process.',
						inline: false
					})],
				components: []
			});
		}

		// Channel permissions check
		const channel = interaction.guild.channels.cache.get(channelId);
		if (!channel) {
			const errorMsg = '❌ Channel not found';

			return interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle(errorMsg)],
				components: []
			});
		}

		const { PermissionManager } = require('./PermissionManager');
		const permCheck = await PermissionManager.checkChannelPerms(channel);

		if (!permCheck.hasAll) {
			const missingPerms = PermissionManager.formatMissingPerms(permCheck.missing, this.messageHandler, gcfg);
			
			const title = '❌ Missing Permissions';
			const description = `The bot does not have all required permissions in <#${channelId}>!`;

			return interaction.update({
				embeds: [new EmbedBuilder()
					.setColor('#FF0000')
					.setTitle(title)
					.setDescription(description)
					.addFields({
						name: '📋 Required Permissions',
						value: missingPerms,
						inline: false
					})
					.setFooter({ text: 'Please give the bot the missing permissions and try again.' })],
				components: []
			});
		}

		tempData.channelID = channelId;

		const newServer = {
			serverName: tempData.serverName,
			stats_url: tempData.stats_url,
			career_savegame_url: tempData.career_savegame_url || '',
			mod_list_url: tempData.mod_list_url || '',
			channelID: channelId,
			updateInterval: this.configManager.globalConfig.defaults.updateInterval,
			monitoringEnabled: true,
			embedSettings: {
				// Core Fields (DEFAULT: shown)
				showMap: true,
				showVersion: true,
				showPassword: true,
				showPlayers: true,
				showPlayerList: true,
				
				// Mod/Vehicle Fields
				showMods: true,
				showModList: false,
				showVehicles: true,
				
				// Career Fields
				showMoney: true,
				showDifficulty: true,
				showTimeScale: true,
				showCurrentDate: false,
				showCreationDate: false,
				showInitialLoan: false,
				
				// Economy Fields
				showGreatDemands: true
			},
			buttonSettings: { enabled: true }
		};

		gcfg.servers.push(newServer);
		this.configManager.saveGuild(interaction.guildId, gcfg);
		
		// Cleanup
		this.client.tempServerData.delete(userId);
		this.logger.success(`Server "${newServer.serverName}" added by ${interaction.user.tag}`);
		
		this.monitoringManager.startMonitoring(interaction.guildId);

		const title = '✅ FS Server Added!';

		await interaction.update({
			embeds: [new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle(title)
				.addFields(
					{ name: '🚜 Server', value: newServer.serverName, inline: true },
					{ name: '🔗 Stats URL', value: `\`${newServer.stats_url.substring(0, 40)}...\``, inline: false },
					{ name: '📺 Channel', value: channel.name, inline: true }
				)
				.setFooter({ text: 'Monitoring has been started!' })],
			components: []
		});
	}

    async handleModal(interaction) {
        const gcfg = this.configManager.loadGuild(interaction.guildId);

        if (interaction.customId === 'modal_add_server') {
            await this.handleAddServerModal(interaction, gcfg);
            return;
        }
		
		// Basis Info Modal
        if (interaction.customId.startsWith('modal_basis_info_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            await this.handleBasisInfoSubmit(interaction, idx, gcfg);
            return;
        }

        // Weitere Links Modal
        if (interaction.customId.startsWith('modal_weitere_links_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            await this.handleWeitereLinksSubmit(interaction, idx, gcfg);
            return;
        }
		
		// Server Password Modal
        if (interaction.customId.startsWith('modal_server_password_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            await this.handleServerPasswordSubmit(interaction, idx, gcfg);
            return;
        }

        if (interaction.customId.startsWith('modal_edit_server_')) {
            await this.handleEditServerModal(interaction, gcfg);
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // EMBED COLORS MODAL
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId.startsWith('modal_colors_')) {
            const idx = parseInt(interaction.customId.split('_')[2]);
            const srv = gcfg.servers[idx];

            const onlineColorInput = interaction.fields.getTextInputValue('color_online') || '#00FF00';
            const offlineColorInput = interaction.fields.getTextInputValue('color_offline') || '#FF0000';

            // ⭐ VALIDATE COLORS
            const onlineValidation = this.validateHexColor(onlineColorInput);
            const offlineValidation = this.validateHexColor(offlineColorInput);

            // ⭐ CHECK IF INVALID
            if (!onlineValidation.valid || !offlineValidation.valid) {
                const errors = [];
                if (!onlineValidation.valid) {
                    errors.push(`**Online Color:**\n${onlineValidation.error}`);
                }
                if (!offlineValidation.valid) {
                    errors.push(`**Offline Color:**\n${offlineValidation.error}`);
                }

                const title = this.messageHandler
                    ? this.messageHandler.get('errors.invalidHexColor.title', {}, srv, gcfg)
                    : '❌ Invalid Hex Color Code';
                
                const description = this.messageHandler
                    ? this.messageHandler.get('errors.invalidHexColor.description', {}, srv, gcfg)
                    : 'Please use valid hex color codes!';

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle(title)
                        .setDescription(description)
                        .addFields({
                            name: '❌ Errors',
                            value: errors.join('\n\n'),
                            inline: false
                        })
                        .addFields({
                            name: '✅ Valid Examples',
                            value: '`#00FF00` (Green)\n`#FF0000` (Red)\n`#0000FF` (Blue)',
                            inline: false
                        })],
                    ephemeral: true
                });
                return;
            }

            // ⭐ COLORS ARE VALID - SAVE
            if (!srv.embedSettings) srv.embedSettings = {};
            srv.embedSettings.colorOnline = onlineValidation.color;
            srv.embedSettings.colorOffline = offlineValidation.color;

            this.configManager.saveGuild(interaction.guildId, gcfg);
            this.monitoringManager.startMonitoring(interaction.guildId);

            const title = this.messageHandler
                ? this.messageHandler.get('setup.embedDesign.colors.success.title', {}, srv, gcfg)
                : '✅ Farben aktualisiert';
            
            const onlineLabel = this.messageHandler
                ? this.messageHandler.get('setup.embedDesign.colors.success.online', {}, srv, gcfg)
                : '🟢 Online';
            
            const offlineLabel = this.messageHandler
                ? this.messageHandler.get('setup.embedDesign.colors.success.offline', {}, srv, gcfg)
                : '🔴 Offline';

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(onlineValidation.color)
                    .setTitle(title)
                    .setDescription(`**${srv.serverName}**`)
                    .addFields(
                        { name: onlineLabel, value: onlineValidation.color, inline: true },
                        { name: offlineLabel, value: offlineValidation.color, inline: true }
                    )],
                ephemeral: true
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // GLOBAL FOOTER MODAL
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'modal_global_footer') {
            const footerText = interaction.fields.getTextInputValue('footer_text');
            gcfg.footerText = footerText;

            this.configManager.saveGuild(interaction.guildId, gcfg);
            this.monitoringManager.startMonitoring(interaction.guildId);

            const title = this.messageHandler
                ? this.messageHandler.get('setup.global.footerModal.success.title', {}, null, gcfg)
                : '✅ Footer-Text aktualisiert';
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.global.footerModal.success.description', { text: footerText }, null, gcfg)
                : `Neuer Footer: \`${footerText}\``;

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor('#00FF00')
                    .setTitle(title)
                    .setDescription(description)
                    .setFooter({ text: footerText })],
                ephemeral: true
            });
            return;
        }

        // ═══════════════════════════════════════════════════════════
        // GLOBAL COLORS MODAL
        // ═══════════════════════════════════════════════════════════

        if (interaction.customId === 'modal_global_colors') {
            const onlineColorInput = interaction.fields.getTextInputValue('color_online') || '#00FF00';
            const offlineColorInput = interaction.fields.getTextInputValue('color_offline') || '#FF0000';

            // ⭐ VALIDATE COLORS
            const onlineValidation = this.validateHexColor(onlineColorInput);
            const offlineValidation = this.validateHexColor(offlineColorInput);

            // ⭐ CHECK IF INVALID
            if (!onlineValidation.valid || !offlineValidation.valid) {
                const errors = [];
                if (!onlineValidation.valid) {
                    errors.push(`**Online Color:**\n${onlineValidation.error}`);
                }
                if (!offlineValidation.valid) {
                    errors.push(`**Offline Color:**\n${offlineValidation.error}`);
                }

                const title = this.messageHandler
                    ? this.messageHandler.get('errors.invalidHexColor.title', {}, null, gcfg)
                    : '❌ Invalid Hex Color Code';
                
                const description = this.messageHandler
                    ? this.messageHandler.get('errors.invalidHexColor.description', {}, null, gcfg)
                    : 'Please use valid hex color codes!';

                await interaction.reply({
                    embeds: [new EmbedBuilder()
                        .setColor('#FF0000')
                        .setTitle(title)
                        .setDescription(description)
                        .addFields({
                            name: '❌ Errors',
                            value: errors.join('\n\n'),
                            inline: false
                        })
                        .addFields({
                            name: '✅ Valid Examples',
                            value: '`#00FF00` (Green)\n`#FF0000` (Red)\n`#0000FF` (Blue)',
                            inline: false
                        })],
                    ephemeral: true
                });
                return;
            }

            // ⭐ COLORS ARE VALID - SAVE
            if (!gcfg.embedColors) gcfg.embedColors = {};
            gcfg.embedColors.online = onlineValidation.color;
            gcfg.embedColors.offline = offlineValidation.color;

            this.configManager.saveGuild(interaction.guildId, gcfg);

            const title = this.messageHandler
                ? this.messageHandler.get('setup.global.colorsModal.success.title', {}, null, gcfg)
                : '✅ Standard-Farben aktualisiert';
            
            const description = this.messageHandler
                ? this.messageHandler.get('setup.global.colorsModal.success.description', {}, null, gcfg)
                : 'Diese Farben werden für neue Server verwendet.';
            
            const onlineLabel = this.messageHandler
                ? this.messageHandler.get('setup.global.colorsModal.success.online', {}, null, gcfg)
                : '🟢 Online';
            
            const offlineLabel = this.messageHandler
                ? this.messageHandler.get('setup.global.colorsModal.success.offline', {}, null, gcfg)
                : '🔴 Offline';

            await interaction.reply({
                embeds: [new EmbedBuilder()
                    .setColor(onlineValidation.color)
                    .setTitle(title)
                    .setDescription(description)
                    .addFields(
                        { name: onlineLabel, value: onlineValidation.color, inline: true },
                        { name: offlineLabel, value: offlineValidation.color, inline: true }
                    )],
                ephemeral: true
            });
            return;
        }
		
		// Farm Rename Modal
        if (interaction.customId.startsWith('modal_farm_rename_')) {
            const parts = interaction.customId.split('_');
            const idx = parseInt(parts[3]);
            const farmId = parts[4];
            
            await this.handleFarmRenameSubmit(interaction, idx, farmId, gcfg);
            return;
        }
		
		// Basic Info Modal
        if (interaction.customId.startsWith('modal_basis_info_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            await this.handleBasisInfoSubmit(interaction, idx, gcfg);
            return;
        }

        // Advanced URLs Modal
        if (interaction.customId.startsWith('modal_weitere_links_')) {
            const idx = parseInt(interaction.customId.split('_')[3]);
            await this.handleWeitereLinksSubmit(interaction, idx, gcfg);
            return;
        }
    }

    async handleAddServerModal(interaction, gcfg) {
        const serverName = interaction.fields.getTextInputValue('server_name');
        const statsUrl = interaction.fields.getTextInputValue('stats_url');
        const careerUrl = interaction.fields.getTextInputValue('career_url') || '';
        // info_hint wird ignoriert (nur Anzeige)

        // Save to temp data - NUR Basis-URLs
        this.client.tempServerData.set(interaction.user.id, {
            serverName,
            stats_url: statsUrl,
            career_url: careerUrl,
            career_savegame_url: careerUrl, // Backward compatibility
            vehicles_url: '',
            economy_url: '',
            mod_list_url: '',
            map_screenshot_url: ''
        });

        const { PermissionManager } = require('./PermissionManager');
        
        // Channels with permissions check
        const channels = await Promise.all(
            interaction.guild.channels.cache
                .filter(c => c.type === ChannelType.GuildText)
                .map(async c => {
                    const permCheck = await PermissionManager.checkChannelPerms(c);
                    return {
                        channel: c,
                        hasPerms: permCheck.hasAll
                    };
                })
        );

        if (channels.length === 0) {
            return interaction.reply({
                content: '❌ Keine Text-Channels gefunden!',
                ephemeral: true
            });
        }

        // Sort: Channels with perms first
        channels.sort((a, b) => {
            if (a.hasPerms && !b.hasPerms) return -1;
            if (!a.hasPerms && b.hasPerms) return 1;
            return 0;
        });

        const options = channels.slice(0, 25).map(({ channel: c, hasPerms }) => ({
            label: `${hasPerms ? '✅' : '⚠️'} #${c.name}`,
            description: hasPerms 
                ? (c.topic ? c.topic.substring(0, 80) : 'Alle Berechtigungen vorhanden')
                : 'Bot hat fehlende Berechtigungen!',
            value: c.id,
            emoji: hasPerms ? '💬' : '⚠️'
        }));

        const select = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('select_channel')
                    .setPlaceholder('📺 Channel für Status-Updates wählen...')
                    .addOptions(options)
            );

        const warningChannels = channels.filter(c => !c.hasPerms);
        
        let description = `Server **${serverName}** wird hinzugefügt.\n\nWähle den Channel für Status-Updates:`;
        
        if (warningChannels.length > 0) {
            description += `\n\n⚠️ **Warnung:** ${warningChannels.length} Channel(s) haben fehlende Berechtigungen!`;
        }

        description += `\n\n💡 **Tipp:** Weitere URLs (Vehicles, Economy, etc.) kannst du nach dem Hinzufügen über \`/setup → Server bearbeiten → Weitere Links\` eintragen!`;

		await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setColor(warningChannels.length > 0 ? '#FFA500' : '#00FF00')
                    .setTitle('📺 Channel auswählen')
                    .setDescription(description)
                    .addFields(
                        [
                            { name: '✅ Stats XML', value: `\`${statsUrl.substring(0, 80)}...\``, inline: false },
                            careerUrl ? { name: '✅ Career Savegame', value: `\`${careerUrl.substring(0, 80)}...\``, inline: false } : null,
                            { 
                                name: '📋 Benötigte Berechtigungen', 
                                value: '👁️ Kanal ansehen\n💬 Nachrichten senden\n🔗 Embeds verwenden\n📁 Dateien anhängen\n📜 Nachrichtenverlauf', 
                                inline: true 
                            }
                        ].filter(f => f !== null)
                    )
            ],
            components: [select],
            ephemeral: true
        });
    }
	
	async handleEditServerModal(interaction, gcfg) {
		const idx = parseInt(interaction.customId.split('_')[3]);
		const srv = gcfg.servers[idx];

		srv.serverName = interaction.fields.getTextInputValue('server_name');
		srv.stats_url = interaction.fields.getTextInputValue('stats_url');
		srv.career_savegame_url = interaction.fields.getTextInputValue('career_url') || '';
		srv.mod_list_url = interaction.fields.getTextInputValue('mod_list_url') || '';

		this.configManager.saveGuild(interaction.guildId, gcfg);
		this.monitoringManager.startMonitoring(interaction.guildId);

		const title = '✅ Server Updated';

		await interaction.reply({
			embeds: [new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle(title)
				.addFields(
					{ name: '🚜 Name', value: srv.serverName, inline: true },
					{ name: '🔗 Stats URL', value: `\`${srv.stats_url.substring(0, 50)}...\``, inline: false }
				)],
			ephemeral: true
		});
	}

    // ═══════════════════════════════════════════════════════════
	//  BUTTON HANDLER - NUR PLAYERS BUTTON (FS BOT)
	//  ERSETZE die komplette handleButton Methode in InteractionHandler.js
	// ═══════════════════════════════════════════════════════════

	async handleButton(interaction) {
		const [action, channelID] = interaction.customId.split('_');
		const gcfg = this.configManager.loadGuild(interaction.guildId);
		const srv = gcfg.servers.find(s => s.channelID === channelID);

		if (!srv) {
			const errorMsg = this.messageHandler 
				? this.messageHandler.get('buttons.error.serverNotFound', {}, srv, gcfg)
				: '❌ Server not found!';
			
			return interaction.reply({
				content: errorMsg,
				ephemeral: true
			});
		}

		// ═══════════════════════════════════════════════════════════
		// NUR PLAYERS BUTTON - IP/PORT ENTFERNT!
		// ═══════════════════════════════════════════════════════════

		if (action === 'players') {
			try {
				const { StatusChecker } = require('./StatusChecker');
				const data = await StatusChecker.getStatus(srv, null, this.logger);
				
				if (!data.online) {
					const offlineMsg = this.messageHandler
						? this.messageHandler.get('buttons.players.offline', {}, srv, gcfg)
						: '❌ **Server is offline or unreachable!**';
					
					await interaction.reply({
						content: offlineMsg,
						ephemeral: true
					});
					return;
				}
				
				if (data.players.list && data.players.list.length > 0) {
					const playersList = data.players.list.join('\n');
					const msg = this.messageHandler
						? this.messageHandler.get('buttons.players.response', {
							count: data.players.online,
							max: data.players.max,
							players: playersList
						}, srv, gcfg)
						: `👥 **Online Players (${data.players.online}/${data.players.max}):**\n\`\`\`\n${playersList}\n\`\`\``;
					
					await interaction.reply({ content: msg, ephemeral: true });
				} else {
					const noPlayersMsg = this.messageHandler
						? this.messageHandler.get('buttons.players.noPlayers', { max: data.players.max }, srv, gcfg)
						: `👥 **Online Players (0/${data.players.max}):**\n➖ Nobody online`;
					
					await interaction.reply({
						content: noPlayersMsg,
						ephemeral: true
					});
				}
			} catch (e) {
				this.logger.error(`Button Error (players): ${e.message}`);
				
				const errorMsg = this.messageHandler
					? this.messageHandler.get('buttons.error.fetchFailed', {}, srv, gcfg)
					: '❌ Error fetching player list!';
				
				await interaction.reply({
					content: errorMsg,
					ephemeral: true
				});
			}
			return;
		}

		// Falls jemand versucht IP/Port Button zu benutzen (sollte nicht mehr existieren)
		const notAvailableMsg = this.messageHandler
			? this.messageHandler.get('buttons.error.notAvailable', {}, srv, gcfg)
			: '❌ This feature is not available for FS servers.';
		
		await interaction.reply({
			content: notAvailableMsg,
			ephemeral: true
		});
	}

    // ═══════════════════════════════════════════════════════════
    // TEXT-SYSTEM HANDLER METHODS
    // ═══════════════════════════════════════════════════════════

    async handleTextsMenu(interaction, gcfg) {
        await interaction.update({
            embeds: [this.setupMenus.createTextsMenu(gcfg)],
            components: [this.setupMenus.createTextsMenuSelect(gcfg)]
        });
    }

    async handleTextsAction(interaction, gcfg) {
        const action = interaction.values[0];

        if (action === 'back') {
            await interaction.update({
                embeds: [this.setupMenus.createMainMenu(gcfg)],
                components: [this.setupMenus.createMainMenuSelect(gcfg)]
            });
            return;
        }

        if (action === 'global_language') {
            await this.handleGlobalLanguageMenu(interaction, gcfg);
            return;
        }

        if (action === 'server_language') {
            await this.handleServerLanguageMenu(interaction, gcfg);
            return;
        }
    }

    async handleGlobalLanguageMenu(interaction, gcfg) {
        await interaction.update({
            embeds: [this.setupMenus.createGlobalLanguageMenu(gcfg)],
            components: [this.setupMenus.createGlobalLanguageSelect(gcfg)]
        });
    }

    async handleGlobalLanguageSelect(interaction, gcfg) {
        const languageCode = interaction.values[0];

        if (languageCode === 'back') {
            await interaction.update({
                embeds: [this.setupMenus.createTextsMenu(gcfg)],
                components: [this.setupMenus.createTextsMenuSelect(gcfg)]
            });
            return;
        }

        // Sprache ändern
        if (!gcfg.globalTextSettings) {
            gcfg.globalTextSettings = {};
        }
        gcfg.globalTextSettings.defaultLanguage = languageCode;
        
        this.configManager.saveGuild(interaction.guildId, gcfg);
        
        // MessageHandler neu laden
        if (this.messageHandler) {
            this.messageHandler.reloadAll();
        }
        
        // Monitoring neu starten damit neue Texte verwendet werden
        this.monitoringManager.startMonitoring(interaction.guildId);

        const langName = this.messageHandler ? this.messageHandler.getLanguageName(languageCode, gcfg) : languageCode;

        const title = this.messageHandler
            ? this.messageHandler.get('setup.texts.globalLanguage.success.title', {}, null, gcfg)
            : '✅ Globale Sprache geändert';
        
        const description = this.messageHandler
            ? this.messageHandler.get('setup.texts.globalLanguage.success.description', { language: langName }, null, gcfg)
            : `Neue Sprache: **${langName}**\n\n💡 Server mit eigener Sprache bleiben unverändert.`;

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(title)
                .setDescription(description)],
            components: []
        });

        this.logger.success(`Global language changed to ${languageCode} by ${interaction.user.tag}`);
    }

    async handleServerLanguageMenu(interaction, gcfg) {
        const { embed, select } = this.setupMenus.createServerLanguageServerSelect(gcfg.servers, gcfg);
        
        await interaction.update({
            embeds: [embed],
            components: [select]
        });
    }

    async handleServerLanguageSelect(interaction, gcfg) {
        const value = interaction.values[0];

        if (value === 'back') {
            await interaction.update({
                embeds: [this.setupMenus.createTextsMenu(gcfg)],
                components: [this.setupMenus.createTextsMenuSelect(gcfg)]
            });
            return;
        }

        const idx = parseInt(value);
        const srv = gcfg.servers[idx];
        const currentLang = srv.textSettings?.language || 'global';

        await interaction.update({
            embeds: [this.setupMenus.createServerLanguageMenu(srv.serverName, currentLang, gcfg)],
            components: [this.setupMenus.createServerLanguageSelect(idx, gcfg)]
        });
    }

    async handleServerLanguageChange(interaction, gcfg) {
        const idx = parseInt(interaction.customId.split('_').pop());
        const languageCode = interaction.values[0];

        if (languageCode === 'back') {
            const { embed, select } = this.setupMenus.createServerLanguageServerSelect(gcfg.servers, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [select]
            });
            return;
        }

        const srv = gcfg.servers[idx];

        // Sprache ändern
        if (!srv.textSettings) {
            srv.textSettings = {};
        }
        srv.textSettings.language = languageCode;

        this.configManager.saveGuild(interaction.guildId, gcfg);
        
        // MessageHandler neu laden
        if (this.messageHandler) {
            this.messageHandler.reloadAll();
        }
        
        // Monitoring neu starten
        this.monitoringManager.startMonitoring(interaction.guildId);

        const langName = this.messageHandler ? this.messageHandler.getLanguageName(languageCode, gcfg) : languageCode;

        const title = this.messageHandler
            ? this.messageHandler.get('setup.texts.serverLanguage.success.title', {}, srv, gcfg)
            : '✅ Server-Sprache geändert';
        
        const description = this.messageHandler
            ? this.messageHandler.get('setup.texts.serverLanguage.success.description', { 
                serverName: srv.serverName,
                language: langName
              }, srv, gcfg)
            : `**${srv.serverName}**\nNeue Sprache: **${langName}**`;

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(title)
                .setDescription(description)],
            components: []
        });

        this.logger.success(`Server language for "${srv.serverName}" changed to ${languageCode} by ${interaction.user.tag}`);
    }
	
	// ═══════════════════════════════════════════════════════════
    // VEHICLE MENU HANDLERS
    // ═══════════════════════════════════════════════════════════

    async handleVehicleMainMenu(interaction, gcfg) {
        const userId = interaction.user.id;
        const vehicleDataStore = this.client.vehicleData.get(userId);

        if (!vehicleDataStore) {
            await interaction.reply({
                content: '❌ Session expired! Please use `/vehicles` again.',
                ephemeral: true
            });
            return;
        }

        const { vehicles, farmNames } = vehicleDataStore;
        const action = interaction.values[0];

        let embed, components;

        switch (action) {
            case 'fleet_stats':
                embed = this.vehicleMenus.createFleetStats(vehicles, gcfg);
                components = [this.vehicleMenus.createBackButton('main')];
                break;

            case 'top5':
                embed = this.vehicleMenus.createTop5(vehicles, gcfg);
                components = [this.vehicleMenus.createBackButton('main')];
                break;

            case 'value_breakdown':
                embed = this.vehicleMenus.createValueBreakdown(vehicles, gcfg);
                components = [this.vehicleMenus.createBackButton('main')];
                break;

            case 'farm_overview':
                embed = this.vehicleMenus.createFarmOverview(vehicles, farmNames, gcfg);
                components = [this.vehicleMenus.createFarmSelect(vehicles, farmNames, gcfg)];
                break;

            default:
                await interaction.reply({
                    content: '❌ Unknown option!',
                    ephemeral: true
                });
                return;
        }

        await interaction.update({
            embeds: [embed],
            components: components
        });
    }

    async handleVehicleFarmSelect(interaction, gcfg) {
        const userId = interaction.user.id;
        const vehicleDataStore = this.client.vehicleData.get(userId);

        if (!vehicleDataStore) {
            await interaction.reply({
                content: '❌ Session expired! Please use `/vehicles` again.',
                ephemeral: true
            });
            return;
        }

        const { vehicles, farmNames } = vehicleDataStore;
        const farmId = interaction.values[0];

        if (farmId === 'back') {
            const embed = this.vehicleMenus.createMainMenu(vehicles, gcfg);
            const select = this.vehicleMenus.createMainMenuSelect(gcfg);

            await interaction.update({
                embeds: [embed],
                components: [select]
            });
            return;
        }

        const embed = this.vehicleMenus.createFarmDetails(farmId, vehicles, farmNames, gcfg);
        const backRow = this.vehicleMenus.createBackButton('main');

        await interaction.update({
            embeds: [embed],
            components: [backRow]
        });
    }

    async handleVehicleBack(interaction, gcfg) {
        const userId = interaction.user.id;
        const vehicleDataStore = this.client.vehicleData.get(userId);

        if (!vehicleDataStore) {
            await interaction.reply({
                content: '❌ Session expired! Please use `/vehicles` again.',
                ephemeral: true
            });
            return;
        }

        const { vehicles } = vehicleDataStore;

        const embed = this.vehicleMenus.createMainMenu(vehicles, gcfg);
        const select = this.vehicleMenus.createMainMenuSelect(gcfg);

        await interaction.update({
            embeds: [embed],
            components: [select]
        });
    }
	
	// ═══════════════════════════════════════════════════════════
    // FARM NAMES MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Handle Server Edit Menu
     */
    async handleServerEditMenu(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];

        await interaction.update({
            embeds: [new EmbedBuilder()
                .setColor('#FFA500')
                .setTitle(`✏️ ${srv.serverName}`)
                .setDescription(this.messageHandler 
                    ? this.messageHandler.get('setup.serverEdit.description', {}, srv, gcfg)
                    : 'Was möchtest du bearbeiten?')],
            components: [this.setupMenus.createServerEditOptionsMenu(idx, srv, gcfg)]
        });
    }

    /**
     * Handle Farm Names Menu
     */
    async handleFarmNamesMenu(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];

        await interaction.update({
            embeds: [this.setupMenus.createFarmNamesMenu(idx, srv, gcfg)],
            components: [this.setupMenus.createFarmNamesSelect(idx, srv, gcfg)]
        });
    }

    /**
     * Handle Farm Rename Modal
     */
    async handleFarmRenameModal(interaction, idx, farmId, gcfg) {
        const srv = gcfg.servers[idx];
        const currentName = srv.farmNames?.[farmId] || `Farm ${farmId}`;

        const modal = new ModalBuilder()
            .setCustomId(`modal_farm_rename_${idx}_${farmId}`)
            .setTitle(this.messageHandler
                ? this.messageHandler.get('setup.farmNames.modal.title', { farmId }, srv, gcfg)
                : `🏠 Farm ${farmId} umbenennen`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('farm_name')
                    .setLabel(this.messageHandler
                        ? this.messageHandler.get('setup.farmNames.modal.label', {}, srv, gcfg)
                        : 'Farm-Name')
                    .setPlaceholder(this.messageHandler
                        ? this.messageHandler.get('setup.farmNames.modal.placeholder', {}, srv, gcfg)
                        : 'z.B. Haupthof, Bergfarm, ...')
                    .setValue(currentName)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
                    .setMaxLength(50)
            )
        );

        await interaction.showModal(modal);
    }

    /**
     * Handle Farm Rename Submit
     */
    async handleFarmRenameSubmit(interaction, idx, farmId, gcfg) {
        const srv = gcfg.servers[idx];
        const newName = interaction.fields.getTextInputValue('farm_name');

        // Initialize farmNames if not exists
        if (!srv.farmNames) {
            srv.farmNames = {};
        }

        // Set new name
        srv.farmNames[farmId] = newName;

        // Save config
        this.configManager.saveGuild(interaction.guildId, gcfg);

        this.logger.success(`Farm ${farmId} renamed to "${newName}" on ${srv.serverName} by ${interaction.user.tag}`);

        const title = this.messageHandler
            ? this.messageHandler.get('setup.farmNames.success.title', {}, srv, gcfg)
            : '✅ Farm umbenannt';

        const description = this.messageHandler
            ? this.messageHandler.get('setup.farmNames.success.description', { 
                farmId, 
                farmName: newName 
              }, srv, gcfg)
            : `**Farm ${farmId}** heißt jetzt:\n🏠 **${newName}**`;

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle(title)
                .setDescription(description)],
            ephemeral: true
        });
    }
	
	// ═══════════════════════════════════════════════════════════
    // URL MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    /**
     * Show Basic Info Modal
     */
    async handleBasisInfoModal(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];
        
        const serverName = (srv.serverName || '').substring(0, 45);
        const statsUrl = (srv.stats_url || '').substring(0, 2000);
        const careerUrl = (srv.career_url || srv.career_savegame_url || '').substring(0, 2000);

        const modal = new ModalBuilder()
            .setCustomId(`modal_basis_info_${idx}`)
            .setTitle(`📝 ${serverName} - Basic Info`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('server_name')
                    .setLabel('Server Name')
                    .setPlaceholder('Mein FS25 Server')
                    .setValue(serverName)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('stats_url')
                    .setLabel('Stats URL (erforderlich)')
                    .setPlaceholder('http://ip:8080/feed/dedicated-server-stats.xml')
                    .setValue(statsUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(true)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('career_url')
                    .setLabel('Career Savegame URL (optional)')
                    .setPlaceholder('http://ip:8080/feed/...-savegame.html?code=...')
                    .setValue(careerUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }

    /**
     * Show Advanced URLs Modal
     */
    async handleWeitereLinksModal(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];
        
        const modListUrl = (srv.mod_list_url || '').substring(0, 2000);
        const vehiclesUrl = (srv.vehicles_url || '').substring(0, 2000);
        const economyUrl = (srv.economy_url || '').substring(0, 2000);
        const mapScreenshotUrl = (srv.map_screenshot_url || '').substring(0, 2000);

        const modal = new ModalBuilder()
            .setCustomId(`modal_weitere_links_${idx}`)
            .setTitle(`🔗 ${srv.serverName.substring(0, 30)} - URLs`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('mod_list_url')
                    .setLabel('Mod List URL (optional)')
                    .setPlaceholder('http://ip:8080/mods.html')
                    .setValue(modListUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('vehicles_url')
                    .setLabel('Vehicles XML URL (optional)')
                    .setPlaceholder('http://ip:8080/feed/vehicles.xml?code=...')
                    .setValue(vehiclesUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('economy_url')
                    .setLabel('Economy XML URL (optional)')
                    .setPlaceholder('http://ip:8080/feed/economy.xml?code=...')
                    .setValue(economyUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('map_screenshot_url')
                    .setLabel('Map Screenshot URL (optional)')
                    .setPlaceholder('https://i.imgur.com/xyz.png')
                    .setValue(mapScreenshotUrl)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }
	
	/**
     * Show Server Password Modal
     */
    async handleServerPasswordModal(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];
        
        const currentPassword = (srv.serverPassword || '').substring(0, 100);

        const modal = new ModalBuilder()
            .setCustomId(`modal_server_password_${idx}`)
            .setTitle(`🔐 ${srv.serverName.substring(0, 30)} - Password`);

        modal.addComponents(
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('server_password')
                    .setLabel('Server Password')
                    .setPlaceholder('Enter the server password (leave empty to remove)')
                    .setValue(currentPassword)
                    .setStyle(TextInputStyle.Short)
                    .setRequired(false)
                    .setMaxLength(100)
            ),
            new ActionRowBuilder().addComponents(
                new TextInputBuilder()
                    .setCustomId('password_info')
                    .setLabel('ℹ️ Info')
                    .setValue('This password will be displayed in the embed when "Show Password" is enabled.')
                    .setStyle(TextInputStyle.Paragraph)
                    .setRequired(false)
            )
        );

        await interaction.showModal(modal);
    }

    /**
     * Handle Basic Info Modal Submit
     */
    async handleBasisInfoSubmit(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];

        srv.serverName = interaction.fields.getTextInputValue('server_name');
        srv.stats_url = interaction.fields.getTextInputValue('stats_url');
        srv.career_url = interaction.fields.getTextInputValue('career_url') || '';
        
        // Backward compatibility
        srv.career_savegame_url = srv.career_url;

        this.configManager.saveGuild(interaction.guildId, gcfg);
        this.monitoringManager.startMonitoring(interaction.guildId);

        this.logger.success(`Basic info updated for ${srv.serverName} by ${interaction.user.tag}`);

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Server-Infos aktualisiert')
                .setDescription(`**${srv.serverName}**`)
                .addFields(
                    { name: '🔗 Stats URL', value: `\`${srv.stats_url.substring(0, 80)}...\``, inline: false },
                    { name: '💼 Career URL', value: srv.career_url ? `\`${srv.career_url.substring(0, 80)}...\`` : '➖ Nicht gesetzt', inline: false }
                )],
            ephemeral: true
        });
    }

    /**
     * Handle Advanced URLs Modal Submit
     */
    async handleWeitereLinksSubmit(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];

        srv.mod_list_url = interaction.fields.getTextInputValue('mod_list_url') || '';
        srv.vehicles_url = interaction.fields.getTextInputValue('vehicles_url') || '';
        srv.economy_url = interaction.fields.getTextInputValue('economy_url') || '';
        srv.map_screenshot_url = interaction.fields.getTextInputValue('map_screenshot_url') || '';

        this.configManager.saveGuild(interaction.guildId, gcfg);
        this.monitoringManager.startMonitoring(interaction.guildId);

        this.logger.success(`Advanced URLs updated for ${srv.serverName} by ${interaction.user.tag}`);

        const fields = [];
        if (srv.mod_list_url) fields.push({ name: '🔧 Mod List', value: `\`${srv.mod_list_url.substring(0, 80)}...\``, inline: false });
        if (srv.vehicles_url) fields.push({ name: '🚜 Vehicles', value: `\`${srv.vehicles_url.substring(0, 80)}...\``, inline: false });
        if (srv.economy_url) fields.push({ name: '💰 Economy', value: `\`${srv.economy_url.substring(0, 80)}...\``, inline: false });
        if (srv.map_screenshot_url) fields.push({ name: '🗺️ Map Screenshot', value: `\`${srv.map_screenshot_url.substring(0, 80)}...\``, inline: false });

        if (fields.length === 0) {
            fields.push({ name: 'ℹ️ Info', value: 'Alle URLs entfernt', inline: false });
        }

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Erweiterte URLs aktualisiert')
                .setDescription(`**${srv.serverName}**`)
                .addFields(fields)],
            ephemeral: true
        });
    }
	
	/**
     * Handle Server Password Modal Submit
     */
    async handleServerPasswordSubmit(interaction, idx, gcfg) {
        const srv = gcfg.servers[idx];

        const password = interaction.fields.getTextInputValue('server_password') || '';
        
        // Save password (or remove if empty)
        if (password.trim() === '') {
            delete srv.serverPassword;
            this.logger.info(`Server password removed for ${srv.serverName} by ${interaction.user.tag}`);
        } else {
            srv.serverPassword = password.trim();
            this.logger.info(`Server password set for ${srv.serverName} by ${interaction.user.tag}`);
        }

        this.configManager.saveGuild(interaction.guildId, gcfg);
        this.monitoringManager.startMonitoring(interaction.guildId);

        const hasPassword = srv.serverPassword && srv.serverPassword.length > 0;

        await interaction.reply({
            embeds: [new EmbedBuilder()
                .setColor(hasPassword ? '#00FF00' : '#FFA500')
                .setTitle('🔐 Server Password Updated')
                .setDescription(`**${srv.serverName}**`)
                .addFields({
                    name: 'Password',
                    value: hasPassword 
                        ? `\`${srv.serverPassword}\` (${srv.serverPassword.length} characters)` 
                        : '❌ No password set',
                    inline: false
                })
                .setFooter({ text: 'Password will be shown in embed when "Show Password" is enabled' })
            ],
            ephemeral: true
        });
    }

    // ═══════════════════════════════════════════════════════════
    // VEHICLE MENU HANDLERS
    // ═══════════════════════════════════════════════════════════

    async handleVehicleMainMenu(interaction, gcfg) {
        const value = interaction.values[0];
        const userId = interaction.user.id;
        const data = this.client.vehicleData.get(userId);

        if (!data) {
            return interaction.reply({
                content: '❌ Session abgelaufen! Bitte `/vehicles` erneut ausführen.',
                ephemeral: true
            });
        }

        if (value === 'fleet_stats') {
            const embed = this.vehicleMenus.createFleetStats(data.vehicles, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [this.vehicleMenus.createBackButton('main')]
            });
        } else if (value === 'top5') {
            const embed = this.vehicleMenus.createTop5(data.vehicles, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [this.vehicleMenus.createBackButton('main')]
            });
        } else if (value === 'value_breakdown') {
            const embed = this.vehicleMenus.createValueBreakdown(data.vehicles, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [this.vehicleMenus.createBackButton('main')]
            });
        } else if (value === 'farm_overview') {
            const embed = this.vehicleMenus.createFarmDetails('0', data.vehicles, data.farmNames, gcfg);
            const select = this.vehicleMenus.createFarmSelect(data.vehicles, data.farmNames, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [select]
            });
        }
    }

    async handleVehicleFarmSelect(interaction, gcfg) {
        const value = interaction.values[0];
        const userId = interaction.user.id;
        const data = this.client.vehicleData.get(userId);

        if (!data) {
            return interaction.reply({
                content: '❌ Session abgelaufen!',
                ephemeral: true
            });
        }

        if (value === 'back') {
            const embed = this.vehicleMenus.createMainMenu(data.vehicles, gcfg);
            const select = this.vehicleMenus.createMainMenuSelect(gcfg);
            await interaction.update({
                embeds: [embed],
                components: [select]
            });
        } else {
            const embed = this.vehicleMenus.createFarmDetails(value, data.vehicles, data.farmNames, gcfg);
            const select = this.vehicleMenus.createFarmSelect(data.vehicles, data.farmNames, gcfg);
            await interaction.update({
                embeds: [embed],
                components: [select]
            });
        }
    }

    async handleVehicleBack(interaction, gcfg) {
        const userId = interaction.user.id;
        const data = this.client.vehicleData.get(userId);

        if (!data) {
            return interaction.reply({
                content: '❌ Session abgelaufen!',
                ephemeral: true
            });
        }

        const embed = this.vehicleMenus.createMainMenu(data.vehicles, gcfg);
        const select = this.vehicleMenus.createMainMenuSelect(gcfg);
        await interaction.update({
            embeds: [embed],
            components: [select]
        });
    }
	
	// ═══════════════════════════════════════════════════════════
	// PASSWORD SETTINGS MENU
	// ═══════════════════════════════════════════════════════════

    async handlePasswordSettings(interaction, idx, gcfg, feedback = null) {
		const srv = gcfg.servers[idx];
		if (!srv.embedSettings) srv.embedSettings = {};
		const s = srv.embedSettings;

		const showField = s.showPasswordField !== false;
		const revealText = s.revealPasswordText === true;

		// Feedback-Nachricht wenn vorhanden
		let description = 'Configure how the password field is displayed:';
		if (feedback) {
			description = `✅ **${feedback}**\n\n${description}`;
		}

		const embed = new EmbedBuilder()
			.setColor(feedback ? '#00FF00' : '#FF0000')  // Grün bei Erfolg
			.setTitle(`🔒 ${srv.serverName} - Password Settings`)
			.setDescription(description)
            .addFields(
                {
                    name: '1️⃣ Show Password Field',
                    value: showField ? '✅ Visible' : '❌ Hidden',
                    inline: true
                },
                {
                    name: '2️⃣ Reveal Password',
                    value: revealText ? '✅ As Spoiler ||text||' : '❌ Only "Yes/No"',
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: false
                },
                {
                    name: '💡 How it works:',
                    value: 
                        '• **No Password:** Shows "🔓 No"\n' +
                        '• **Password + Reveal Off:** Shows "🔒 Yes"\n' +
                        '• **Password + Reveal On:** Shows ||password|| as spoiler',
                    inline: false
                }
            );

        const select = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`setup_password_settings_${idx}`)
                    .setPlaceholder('🔒 Configure password...')
                    .addOptions([
                        {
                            label: 'Toggle Field Visibility',
                            description: showField ? 'Currently: Visible' : 'Currently: Hidden',
                            value: 'toggle_field',
                            emoji: '1️⃣'
                        },
                        {
                            label: 'Toggle Password Reveal',
                            description: revealText ? 'Currently: As Spoiler' : 'Currently: Yes/No only',
                            value: 'toggle_reveal',
                            emoji: '2️⃣'
                        },
                        {
                            label: '← Back',
                            value: 'back',
                            emoji: '↩️'
                        }
                    ])
            );

        await interaction.update({
            embeds: [embed],
            components: [select]
        });
    }
}

module.exports = { InteractionHandler };
