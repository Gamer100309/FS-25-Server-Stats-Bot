// ═══════════════════════════════════════════════════════════
//  SETUP MENUS MODULE - FULLY MULTILINGUAL
//  Enhanced with Complete Text-System Support
//  All methods converted from static to instance methods
// ═══════════════════════════════════════════════════════════

const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

class SetupMenus {
    constructor(messageHandler = null) {
        this.msg = messageHandler;
    }

    // ═══════════════════════════════════════════════════════════
    // HELPER METHOD
    // ═══════════════════════════════════════════════════════════

    getText(key, variables = {}, guildConfig = null) {
        if (this.msg) {
            return this.msg.get(key, variables, null, guildConfig);
        }
        // Fallback: Return key name if no MessageHandler
        return key.split('.').pop();
    }

    // ═══════════════════════════════════════════════════════════
    // MAIN MENU
    // ═══════════════════════════════════════════════════════════

    createMainMenu(gcfg = null) {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(this.getText('setup.mainMenu.title', {}, gcfg))
            .setDescription(this.getText('setup.mainMenu.description', {}, gcfg))
            .addFields(
                { 
                    name: this.getText('setup.mainMenu.categories.servers.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.servers.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.intervals.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.intervals.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.embed.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.embed.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.buttons.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.buttons.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.permissions.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.permissions.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.global.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.global.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.mainMenu.categories.texts.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.mainMenu.categories.texts.description', {}, gcfg), 
                    inline: false 
                }
            )
            .setFooter({ text: this.getText('setup.mainMenu.footer', {}, gcfg) });
    }

    createMainMenuSelect(gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_main_menu')
                    .setPlaceholder(this.getText('setup.mainMenu.placeholder', {}, gcfg))
                    .addOptions([
                        {
                            label: this.getText('setup.mainMenu.categories.servers.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.servers.description', {}, gcfg),
                            value: 'servers',
                            emoji: this.getText('setup.mainMenu.categories.servers.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.intervals.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.intervals.description', {}, gcfg),
                            value: 'intervals',
                            emoji: this.getText('setup.mainMenu.categories.intervals.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.embed.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.embed.description', {}, gcfg),
                            value: 'embed',
                            emoji: this.getText('setup.mainMenu.categories.embed.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.buttons.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.buttons.description', {}, gcfg),
                            value: 'buttons',
                            emoji: this.getText('setup.mainMenu.categories.buttons.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.permissions.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.permissions.description', {}, gcfg),
                            value: 'permissions',
                            emoji: this.getText('setup.mainMenu.categories.permissions.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.global.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.global.description', {}, gcfg),
                            value: 'global',
                            emoji: this.getText('setup.mainMenu.categories.global.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.mainMenu.categories.texts.label', {}, gcfg),
                            description: this.getText('setup.mainMenu.categories.texts.description', {}, gcfg),
                            value: 'texts',
                            emoji: this.getText('setup.mainMenu.categories.texts.emoji', {}, gcfg)
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
    // SERVER MANAGEMENT
    // ═══════════════════════════════════════════════════════════

    createServerManagementEmbed(gcfg = null) {
        return new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle(this.getText('setup.serverManagement.title', {}, gcfg))
            .setDescription(this.getText('setup.serverManagement.description', {}, gcfg))
            .addFields(
                { 
                    name: this.getText('setup.serverManagement.actions.add.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.serverManagement.actions.add.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.serverManagement.actions.edit.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.serverManagement.actions.edit.description', {}, gcfg), 
                    inline: false 
                },
                { 
                    name: this.getText('setup.serverManagement.actions.delete.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.serverManagement.actions.delete.description', {}, gcfg), 
                    inline: false 
                },
				{ 
                    name: this.getText('setup.serverManagement.actions.toggle.labelWithEmoji', {}, gcfg), 
                    value: this.getText('setup.serverManagement.actions.toggle.description', {}, gcfg), 
                    inline: false 
                }
            );
    }

    createServerMenu(gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_servers_action')
                    .setPlaceholder(this.getText('setup.serverManagement.placeholder', {}, gcfg))
                    .addOptions([
                        {
                            label: this.getText('setup.serverManagement.actions.add.label', {}, gcfg),
                            description: this.getText('setup.serverManagement.actions.add.description', {}, gcfg),
                            value: 'add',
                            emoji: this.getText('setup.serverManagement.actions.add.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.serverManagement.actions.edit.label', {}, gcfg),
                            description: this.getText('setup.serverManagement.actions.edit.description', {}, gcfg),
                            value: 'edit',
                            emoji: this.getText('setup.serverManagement.actions.edit.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.serverManagement.actions.delete.label', {}, gcfg),
                            description: this.getText('setup.serverManagement.actions.delete.description', {}, gcfg),
                            value: 'delete',
                            emoji: this.getText('setup.serverManagement.actions.delete.emoji', {}, gcfg)
                        },
						{
                            label: this.getText('setup.serverManagement.actions.toggle.label', {}, gcfg),
                            description: this.getText('setup.serverManagement.actions.toggle.description', {}, gcfg),
                            value: 'toggle',
                            emoji: this.getText('setup.serverManagement.actions.toggle.emoji', {}, gcfg)
                        },
                        {
                            label: this.getText('setup.serverManagement.actions.back.label', {}, gcfg),
                            description: this.getText('setup.serverManagement.actions.back.description', {}, gcfg),
                            value: 'back',
                            emoji: this.getText('setup.serverManagement.actions.back.emoji', {}, gcfg)
                        }
                    ])
            );
    }
	
	// ═══════════════════════════════════════════════════════════
    // MONITORING TOGGLE
    // ═══════════════════════════════════════════════════════════

    createMonitoringToggleEmbed(servers, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(this.getText('setup.serverManagement.toggle.selectPrompt', {}, gcfg))
            .setDescription(this.getText('setup.serverManagement.toggle.selectDescription', {}, gcfg));

        if (servers.length === 0) {
            embed.setDescription(this.getText('setup.serverManagement.toggle.noServers', {}, gcfg));
            return embed;
        }

        // Zähle aktive/pausierte Server
        let activeCount = 0;
        let inactiveCount = 0;

        servers.forEach(srv => {
            if (srv.monitoringEnabled !== false) {
                activeCount++;
            } else {
                inactiveCount++;
            }
        });

        // Statistik anzeigen
        const statsValue = this.getText('setup.serverManagement.toggle.statsValue', {
            active: activeCount,
            inactive: inactiveCount,
            total: servers.length
        }, gcfg);

        embed.addFields({
            name: this.getText('setup.serverManagement.toggle.stats', {}, gcfg),
            value: statsValue,
            inline: false
        });

        return embed;
    }

    createMonitoringToggleMenu(servers, gcfg = null) {
        if (servers.length === 0) {
            return new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_monitoring_back')
                        .setPlaceholder(this.getText('setup.common.back', {}, gcfg))
                        .addOptions([{
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }])
                );
        }

        // ═══════════════════════════════════════════════════════════
        // ZÄHLE AKTIVE/INAKTIVE SERVER
        // ═══════════════════════════════════════════════════════════
        let activeCount = 0;
        let inactiveCount = 0;

        servers.forEach(srv => {
            if (srv.monitoringEnabled !== false) {
                activeCount++;
            } else {
                inactiveCount++;
            }
        });

        const allActive = activeCount === servers.length;
        const allInactive = inactiveCount === servers.length;

        // ═══════════════════════════════════════════════════════════
        // BAUE OPTIONS DYNAMISCH
        // ═══════════════════════════════════════════════════════════
        const options = [];

        // ALLE AKTIVIEREN - nur wenn nicht alle schon an sind
        if (!allActive) {
            options.push({
                label: this.getText('setup.serverManagement.toggle.allOn.label', {}, gcfg),
                description: this.getText('setup.serverManagement.toggle.allOn.description', {}, gcfg),
                value: 'all_on',
                emoji: this.getText('setup.serverManagement.toggle.allOn.emoji', {}, gcfg) || '✅'
            });
        }

        // ALLE DEAKTIVIEREN - nur wenn nicht alle schon aus sind
        if (!allInactive) {
            options.push({
                label: this.getText('setup.serverManagement.toggle.allOff.label', {}, gcfg),
                description: this.getText('setup.serverManagement.toggle.allOff.description', {}, gcfg),
                value: 'all_off',
                emoji: this.getText('setup.serverManagement.toggle.allOff.emoji', {}, gcfg) || '⏸️'
            });
        }

        // Separator nur wenn "Alle"-Buttons da sind - OHNE EMOJI!
        if (options.length > 0) {
            options.push({
                label: '─────────────',
                description: this.getText('setup.serverManagement.toggle.separator', {}, gcfg),
                value: 'separator'
                // KEIN emoji!
            });
        }

        // ═══════════════════════════════════════════════════════════
        // EINZELNE SERVER
        // ═══════════════════════════════════════════════════════════
        servers.forEach((srv, i) => {
            const status = srv.monitoringEnabled !== false ? '✅' : '⏸️';
            const statusText = srv.monitoringEnabled !== false 
                ? this.getText('setup.serverManagement.toggle.active', {}, gcfg)
                : this.getText('setup.serverManagement.toggle.paused', {}, gcfg);
            
            options.push({
                label: `${status} ${srv.serverName}`,
                description: statusText,
                value: `${i}`,
                emoji: '🎮'
            });
        });

        // ═══════════════════════════════════════════════════════════
        // ZURÜCK
        // ═══════════════════════════════════════════════════════════
        options.push({
            label: this.getText('setup.common.backToMain', {}, gcfg),
            value: 'back',
            emoji: '↩️'
        });

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_monitoring_select')
                    .setPlaceholder(this.getText('setup.serverManagement.toggle.selectPlaceholder', {}, gcfg))
                    .addOptions(options)
            );
    }

    // ═══════════════════════════════════════════════════════════
    // UPDATE INTERVALS
    // ═══════════════════════════════════════════════════════════

    createIntervalsEmbed(servers, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(this.getText('setup.intervals.title', {}, gcfg))
            .setDescription(this.getText('setup.intervals.description', {}, gcfg));

        if (servers.length === 0) {
            embed.setDescription(this.getText('setup.intervals.noServers', {}, gcfg));
        } else {
            servers.forEach((srv, i) => {
                const interval = srv.updateInterval || 10000;
                const seconds = interval / 1000;
                embed.addFields({
                    name: `${i + 1}. ${srv.serverName}`,
                    value: this.getText('setup.intervals.serverDescription', { interval: seconds }, gcfg),
                    inline: true
                });
            });
        }

        return embed;
    }

    createIntervalsMenu(servers, gcfg = null) {
        if (servers.length === 0) {
            return new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_intervals_back')
                        .setPlaceholder(this.getText('setup.common.back', {}, gcfg))
                        .addOptions([{
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }])
                );
        }

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_intervals_select')
                    .setPlaceholder(this.getText('setup.intervals.selectPlaceholder', {}, gcfg))
                    .addOptions([
                        ...servers.map((srv, i) => ({
                            label: srv.serverName,
                            description: this.getText('setup.intervals.serverDescription', { 
                                interval: (srv.updateInterval || 10000) / 1000 
                            }, gcfg),
                            value: `${i}`,
                            emoji: '🎮'
                        })),
                        {
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }
                    ])
            );
    }

    createIntervalOptionsMenu(serverIdx, gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`setup_interval_set_${serverIdx}`)
                    .setPlaceholder(this.getText('setup.intervals.optionsPlaceholder', {}, gcfg))
                    .addOptions([
                        { 
                            label: this.getText('setup.intervals.options.5s.label', {}, gcfg), 
                            description: this.getText('setup.intervals.options.5s.description', {}, gcfg), 
                            value: '5000', 
                            emoji: this.getText('setup.intervals.options.5s.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.intervals.options.10s.label', {}, gcfg), 
                            description: this.getText('setup.intervals.options.10s.description', {}, gcfg), 
                            value: '10000', 
                            emoji: this.getText('setup.intervals.options.10s.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.intervals.options.30s.label', {}, gcfg), 
                            description: this.getText('setup.intervals.options.30s.description', {}, gcfg), 
                            value: '30000', 
                            emoji: this.getText('setup.intervals.options.30s.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.intervals.options.1m.label', {}, gcfg), 
                            description: this.getText('setup.intervals.options.1m.description', {}, gcfg), 
                            value: '60000', 
                            emoji: this.getText('setup.intervals.options.1m.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.intervals.options.5m.label', {}, gcfg), 
                            description: this.getText('setup.intervals.options.5m.description', {}, gcfg), 
                            value: '300000', 
                            emoji: this.getText('setup.intervals.options.5m.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.common.back', {}, gcfg), 
                            value: 'back', 
                            emoji: '↩️' 
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
    // EMBED DESIGN
    // ═══════════════════════════════════════════════════════════

    createEmbedDesignEmbed(servers, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(this.getText('setup.embedDesign.title', {}, gcfg))
            .setDescription(this.getText('setup.embedDesign.description', {}, gcfg));

        if (servers.length === 0) {
            embed.setDescription(this.getText('setup.embedDesign.noServers', {}, gcfg));
        } else {
            embed.addFields(
                { 
                    name: this.getText('setup.embedDesign.options', {}, gcfg), 
                    value: this.getText('setup.embedDesign.optionsText', {}, gcfg), 
                    inline: false 
                }
            );
        }

        return embed;
    }

    createEmbedDesignMenu(servers, gcfg = null) {
        if (servers.length === 0) {
            return new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_embed_back')
                        .setPlaceholder(this.getText('setup.common.back', {}, gcfg))
                        .addOptions([{
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }])
                );
        }

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_embed_select')
                    .setPlaceholder(this.getText('setup.embedDesign.selectPlaceholder', {}, gcfg))
                    .addOptions([
                        ...servers.map((srv, i) => ({
                            label: srv.serverName,
                            description: this.getText('setup.embedDesign.serverDescription', {}, gcfg),
                            value: `${i}`,
                            emoji: '🎮'
                        })),
                        {
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
	//  SETUP MENUS - EMBED DESIGN OPTIONS (OHNE ICON)
	//  SUCHE in SetupMenus.js nach: createEmbedOptionsMenu
	//  ERSETZE die komplette Methode
	// ═══════════════════════════════════════════════════════════

	createEmbedOptionsMenu(serverIdx, gcfg = null) {
		return new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`setup_embed_option_${serverIdx}`)
					.setPlaceholder(this.getText('setup.embedDesign.designOptions.placeholder', {}, gcfg))
					.addOptions([
						{ 
							label: this.getText('setup.embedDesign.designOptions.colors.label', {}, gcfg), 
							description: this.getText('setup.embedDesign.designOptions.colors.description', {}, gcfg), 
							value: 'colors', 
							emoji: this.getText('setup.embedDesign.designOptions.colors.emoji', {}, gcfg)
						},
						{ 
							label: this.getText('setup.embedDesign.designOptions.fields.label', {}, gcfg), 
							description: this.getText('setup.embedDesign.designOptions.fields.description', {}, gcfg), 
							value: 'fields', 
							emoji: this.getText('setup.embedDesign.designOptions.fields.emoji', {}, gcfg)
						},
						// ⭐ ICON OPTION ENTFERNT - FS Server haben keine Icons!
						{ 
							label: this.getText('setup.common.back', {}, gcfg), 
							value: 'back', 
							emoji: '↩️' 
						}
					])
			);
	}

    // ═══════════════════════════════════════════════════════════
    // BUTTONS
    // ═══════════════════════════════════════════════════════════

    createButtonsEmbed(servers, gcfg = null) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(this.getText('setup.buttons.title', {}, gcfg))
            .setDescription(this.getText('setup.buttons.description', {}, gcfg));

        if (servers.length === 0) {
            embed.setDescription(this.getText('setup.buttons.noServers', {}, gcfg));
        }

        return embed;
    }

    createButtonsMenu(servers, gcfg = null) {
        if (servers.length === 0) {
            return new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_buttons_back')
                        .setPlaceholder(this.getText('setup.common.back', {}, gcfg))
                        .addOptions([{
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }])
                );
        }

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_buttons_select')
                    .setPlaceholder(this.getText('setup.buttons.selectPlaceholder', {}, gcfg))
                    .addOptions([
                        ...servers.map((srv, i) => ({
                            label: srv.serverName,
                            description: this.getText('setup.buttons.serverDescription', {}, gcfg),
                            value: `${i}`,
                            emoji: '🎮'
                        })),
                        {
                            label: this.getText('setup.common.backToMain', {}, gcfg),
                            value: 'back',
                            emoji: '↩️'
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
	//  SETUP MENUS - BUTTON OPTIONS (NUR PLAYERS)
	//  SUCHE in SetupMenus.js nach: createButtonOptionsMenu
	//  ERSETZE die komplette Methode
	// ═══════════════════════════════════════════════════════════

	createButtonOptionsMenu(serverIdx, srv, gcfg = null) {
		const bs = srv.buttonSettings || {};
		const enabled = bs.enabled !== false;

		const toggleLabel = enabled 
			? this.getText('setup.buttons.options.toggle.disable', {}, gcfg)
			: this.getText('setup.buttons.options.toggle.enable', {}, gcfg);
		
		const toggleDesc = enabled
			? this.getText('setup.buttons.options.toggle.descriptionDisable', {}, gcfg)
			: this.getText('setup.buttons.options.toggle.descriptionEnable', {}, gcfg);
		
		const toggleEmoji = enabled
			? this.getText('setup.buttons.options.toggle.emojiDisable', {}, gcfg)
			: this.getText('setup.buttons.options.toggle.emojiEnable', {}, gcfg);

		// ═══════════════════════════════════════════════════════════
		// NUR PLAYERS BUTTON - IP/PORT ENTFERNT!
		// ═══════════════════════════════════════════════════════════

		const playersStatus = bs.showPlayersButton !== false
			? this.getText('setup.buttons.options.players.active', {}, gcfg)
			: this.getText('setup.buttons.options.players.inactive', {}, gcfg);

		return new ActionRowBuilder()
			.addComponents(
				new StringSelectMenuBuilder()
					.setCustomId(`setup_button_toggle_${serverIdx}`)
					.setPlaceholder(this.getText('setup.buttons.options.placeholder', {}, gcfg))
					.addOptions([
						{ 
							label: toggleLabel,
							description: toggleDesc,
							value: 'toggle',
							emoji: toggleEmoji
						},
						{ 
							label: this.getText('setup.buttons.options.players.label', {}, gcfg),
							description: playersStatus,
							value: 'players',
							emoji: this.getText('setup.buttons.options.players.emoji', {}, gcfg)
						},
						{ 
							label: this.getText('setup.common.back', {}, gcfg), 
							value: 'back', 
							emoji: '↩️' 
						}
					])
			);
	}

    // ═══════════════════════════════════════════════════════════
    // PERMISSIONS
    // ═══════════════════════════════════════════════════════════

    createPermissionsEmbed(config, gcfg = null) {
        const perms = config.setupPermissions || {};
        const roles = perms.allowedRoles || [];

        const noRolesText = this.getText('setup.permissions.noRoles', {}, gcfg);
        const rolesValue = roles.length > 0 ? roles.map(r => `<@&${r}>`).join('\n') : noRolesText;

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle(this.getText('setup.permissions.title', {}, gcfg))
            .setDescription(this.getText('setup.permissions.description', {}, gcfg))
            .addFields(
                { 
                    name: this.getText('setup.permissions.allowedRoles', {}, gcfg), 
                    value: rolesValue,
                    inline: false
                }
            )
            .setFooter({ text: this.getText('setup.permissions.footer', {}, gcfg) });

        return embed;
    }

    createPermissionsMenu(gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_permissions_action')
                    .setPlaceholder(this.getText('setup.permissions.placeholder', {}, gcfg))
                    .addOptions([
                        { 
                            label: this.getText('setup.permissions.actions.roles.label', {}, gcfg),
                            description: this.getText('setup.permissions.actions.roles.description', {}, gcfg),
                            value: 'roles',
                            emoji: this.getText('setup.permissions.actions.roles.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.common.backToMain', {}, gcfg), 
                            value: 'back', 
                            emoji: '↩️' 
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
    // GLOBAL SETTINGS
    // ═══════════════════════════════════════════════════════════

    createGlobalEmbed(config, gcfg = null) {
        return new EmbedBuilder()
            .setColor('#9B59B6')
            .setTitle(this.getText('setup.global.title', {}, gcfg))
            .setDescription(this.getText('setup.global.description', {}, gcfg))
            .addFields(
                { 
                    name: this.getText('setup.global.footer.label', {}, gcfg), 
                    value: this.getText('setup.global.footer.value', { text: config.footerText || 'mcapi.us' }, gcfg),
                    inline: true
                },
                { 
                    name: this.getText('setup.global.colors.label', {}, gcfg), 
                    value: this.getText('setup.global.colors.value', { 
                        online: config.embedColors?.online || '#00FF00',
                        offline: config.embedColors?.offline || '#FF0000'
                    }, gcfg),
                    inline: true
                }
            );
    }

    createGlobalMenu(gcfg = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_global_action')
                    .setPlaceholder(this.getText('setup.global.placeholder', {}, gcfg))
                    .addOptions([
                        { 
                            label: this.getText('setup.global.actions.footer.label', {}, gcfg),
                            description: this.getText('setup.global.actions.footer.description', {}, gcfg),
                            value: 'footer',
                            emoji: this.getText('setup.global.actions.footer.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.global.actions.colors.label', {}, gcfg),
                            description: this.getText('setup.global.actions.colors.description', {}, gcfg),
                            value: 'colors',
                            emoji: this.getText('setup.global.actions.colors.emoji', {}, gcfg)
                        },
                        { 
                            label: this.getText('setup.common.backToMain', {}, gcfg), 
                            value: 'back', 
                            emoji: '↩️' 
                        }
                    ])
            );
    }

    // ═══════════════════════════════════════════════════════════
    // TEXT-SYSTEM
    // ═══════════════════════════════════════════════════════════

    createTextsMenu(guildConfig = null) {
        const currentLang = guildConfig?.globalTextSettings?.defaultLanguage || 'de';
        const langName = this.msg ? this.msg.getLanguageName(currentLang, guildConfig) : currentLang;

        // Get available languages for display
        const availableLanguages = this.msg ? this.msg.getAvailableLanguages() : [];
        const langList = availableLanguages.length > 0 
            ? availableLanguages.map(l => `${l.emoji} ${l.name}`).join(', ')
            : this.getText('setup.texts.noLanguages', {}, guildConfig);

        const embed = new EmbedBuilder()
            .setColor('#FF69B4')
            .setTitle(this.getText('setup.texts.title', {}, guildConfig))
            .setDescription(this.getText('setup.texts.description', {}, guildConfig))
            .addFields(
                {
                    name: this.getText('setup.texts.currentLanguage', {}, guildConfig),
                    value: langName,
                    inline: true
                },
                {
                    name: this.getText('setup.texts.availableLanguages', {}, guildConfig),
                    value: langList,
                    inline: true
                },
                {
                    name: '\u200b',
                    value: '\u200b',
                    inline: false
                },
                // ⭐ Custom Language Info Field
                {
                    name: this.getText('setup.texts.customLanguageInfo.title', {}, guildConfig),
                    value: this.getText('setup.texts.customLanguageInfo.description', {}, guildConfig),
                    inline: false
                }
            );

        return embed;
    }

    createTextsMenuSelect(guildConfig = null) {
        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_texts_action')
                    .setPlaceholder(this.getText('setup.texts.placeholder', {}, guildConfig))
                    .addOptions([
                        {
                            label: this.getText('setup.texts.actions.globalLanguage.label', {}, guildConfig),
                            description: this.getText('setup.texts.actions.globalLanguage.description', {}, guildConfig),
                            value: 'global_language',
                            emoji: this.getText('setup.texts.actions.globalLanguage.emoji', {}, guildConfig)
                        },
                        {
                            label: this.getText('setup.texts.actions.serverLanguage.label', {}, guildConfig),
                            description: this.getText('setup.texts.actions.serverLanguage.description', {}, guildConfig),
                            value: 'server_language',
                            emoji: this.getText('setup.texts.actions.serverLanguage.emoji', {}, guildConfig)
                        },
                        {
                            label: this.getText('setup.common.backToMain', {}, guildConfig),
                            value: 'back',
                            emoji: '↩️'
                        }
                    ])
            );
    }

    createGlobalLanguageMenu(guildConfig = null) {
        const currentLang = guildConfig?.globalTextSettings?.defaultLanguage || 'de';
        const langName = this.msg ? this.msg.getLanguageName(currentLang, guildConfig) : currentLang;

        const embed = new EmbedBuilder()
            .setColor('#00FFFF')
            .setTitle(this.getText('setup.texts.globalLanguage.title', {}, guildConfig))
            .setDescription(this.getText('setup.texts.globalLanguage.description', {}, guildConfig))
            .addFields({
                name: this.getText('setup.texts.globalLanguage.currentLanguage', {}, guildConfig),
                value: langName,
                inline: false
            });

        return embed;
    }

    createGlobalLanguageSelect(guildConfig = null) {
        const availableLanguages = this.msg ? this.msg.getAvailableLanguages() : [
            { code: 'de', name: 'Deutsch', emoji: '🇩🇪', isCustom: false },
            { code: 'en', name: 'English', emoji: '🇬🇧', isCustom: false }
        ];

        const options = availableLanguages.map(lang => ({
            label: lang.name,
            // ⭐ Dynamische Beschreibung für Language Type
            description: lang.isCustom 
                ? this.getText('setup.texts.languageType.custom', {}, guildConfig) 
                : this.getText('setup.texts.languageType.standard', {}, guildConfig),
            value: lang.code,
            emoji: lang.emoji
        }));

        options.push({
            label: this.getText('setup.common.back', {}, guildConfig),
            value: 'back',
            emoji: '↩️'
        });

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_global_language_select')
                    .setPlaceholder(this.getText('setup.texts.globalLanguage.placeholder', {}, guildConfig))
                    .addOptions(options)
            );
    }

    createServerLanguageServerSelect(servers, guildConfig = null) {
        if (servers.length === 0) {
            const embed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle(this.getText('setup.texts.serverLanguage.noServers', {}, guildConfig))
                .setDescription(this.getText('setup.serverManagement.actions.add.description', {}, guildConfig));

            const select = new ActionRowBuilder()
                .addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId('setup_server_language_back')
                        .setPlaceholder(this.getText('setup.common.back', {}, guildConfig))
                        .addOptions([{
                            label: this.getText('setup.common.back', {}, guildConfig),
                            value: 'back',
                            emoji: '↩️'
                        }])
                );

            return { embed, select };
        }

        const embed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle(this.getText('setup.texts.serverLanguage.selectServer', {}, guildConfig))
            .setDescription(this.getText('setup.texts.serverLanguage.selectDescription', {}, guildConfig));

        const options = servers.map((srv, i) => {
            const langCode = srv.textSettings?.language || 'global';
            const langDisplay = this.msg ? this.msg.getLanguageName(langCode, guildConfig) : langCode;
            
            return {
                label: srv.serverName,
                description: langDisplay,
                value: `${i}`,
                emoji: '🎮'
            };
        });

        options.push({
            label: this.getText('setup.common.back', {}, guildConfig),
            value: 'back',
            emoji: '↩️'
        });

        const select = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('setup_server_language_select')
                    .setPlaceholder(this.getText('setup.texts.serverLanguage.selectPlaceholder', {}, guildConfig))
                    .addOptions(options)
            );

        return { embed, select };
    }

    createServerLanguageMenu(serverName, currentLanguage, guildConfig = null) {
        const langDisplay = this.msg ? this.msg.getLanguageName(currentLanguage, guildConfig) : currentLanguage;

        const embed = new EmbedBuilder()
            .setColor('#00FFFF')
            .setTitle(this.getText('setup.texts.serverLanguage.title', { serverName }, guildConfig))
            .setDescription(this.getText('setup.texts.serverLanguage.description', {}, guildConfig))
            .addFields({
                name: this.getText('setup.texts.serverLanguage.currentLanguage', {}, guildConfig),
                value: langDisplay,
                inline: false
            });

        return embed;
    }

    createServerLanguageSelect(serverIdx, guildConfig = null) {
        const availableLanguages = this.msg ? this.msg.getAvailableLanguages() : [
            { code: 'de', name: 'Deutsch', emoji: '🇩🇪', isCustom: false },
            { code: 'en', name: 'English', emoji: '🇬🇧', isCustom: false }
        ];

        const globalLang = guildConfig?.globalTextSettings?.defaultLanguage || 'de';
        const globalLangData = availableLanguages.find(l => l.code === globalLang);
        
        const options = [
            {
                label: this.getText('setup.texts.serverLanguage.useGlobal', { 
                    language: globalLangData?.name || globalLang 
                }, guildConfig),
                // ⭐ Dynamische Beschreibung für Global Use
                description: this.getText('setup.texts.serverLanguage.useGlobalDescription', {}, guildConfig),
                value: 'global',
                emoji: '🌍'
            }
        ];

        options.push(...availableLanguages.map(lang => ({
            label: lang.name,
            description: lang.isCustom 
                ? this.getText('setup.texts.languageType.custom', {}, guildConfig) 
                : this.getText('setup.texts.languageType.standard', {}, guildConfig),
            value: lang.code,
            emoji: lang.emoji
        })));

        options.push({
            label: this.getText('setup.common.back', {}, guildConfig),
            value: 'back',
            emoji: '↩️'
        });

        return new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`setup_server_language_change_${serverIdx}`)
                    .setPlaceholder(this.getText('setup.texts.serverLanguage.placeholder', {}, guildConfig))
                    .addOptions(options)
            );
    }
}

module.exports = { SetupMenus };
